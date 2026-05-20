import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import DocumentHeader from '@/components/DocumentHeader';
import SoftLoadingIndicator from '@/components/SoftLoadingIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import {
  Activity,
  CheckCheck,
  Clock3,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserPlus,
  UserX,
  Users,
  Trash2,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'regular';
  is_approved: boolean;
  created_at: string;
  permissions?: {
    page_id: string;
  }[];
}

interface PageData {
  id: string;
  name: string;
  path: string;
  description: string | null;
  selected?: boolean;
}

interface PageVisit {
  id: string;
  user_id: string;
  page_path: string;
  page_name: string;
  visited_at: string;
  user_agent: string;
  user_email?: string;
  user_full_name?: string;
}

type RoleFilter = 'all' | 'admin' | 'regular';
type StatusFilter = 'all' | 'approved' | 'pending';

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Sin actividad';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha inválida';
  return date.toLocaleString('es-DO');
};

const toDayKey = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const subtractDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const AdminUsers = () => {
  const { isAdmin, userProfile } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [visits, setVisits] = useState<PageVisit[]>([]);
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Cargando usuarios, permisos y auditoría...');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [auditUserId, setAuditUserId] = useState<string>('all');
  const [auditPathFilter, setAuditPathFilter] = useState('');
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: '',
    is_approved: true,
  });

  const fetchUsers = async () => {
    const { users } = await api.listUsers();
    setUsers(users as UserData[]);
  };

  const fetchPages = async () => {
    const { pages } = await api.listPages();
    setPages(pages || []);
  };

  const fetchVisits = async () => {
    const { visits } = await api.listPageVisits();
    setVisits((visits as PageVisit[]) || []);
  };

  const refreshAll = async () => {
    try {
      setLoading(true);
      setLoadingMessage('Consultando usuarios, páginas y visitas...');
      await Promise.all([fetchUsers(), fetchPages(), fetchVisits()]);
      setLoadingMessage('Procesando indicadores del panel...');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error cargando panel',
        description: error instanceof Error ? error.message : 'No se pudo cargar administración y auditoría.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      refreshAll();
    }
  }, [isAdmin]);

  const toggleApproval = async (user: UserData) => {
    try {
      const nextStatus = !user.is_approved;
      await api.updateUser(user.id, { is_approved: nextStatus });
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, is_approved: nextStatus } : item))
      );
      toast({
        title: 'Acceso actualizado',
        description: nextStatus
          ? `${user.email} ahora tiene acceso a la app.`
          : `Se revocó el acceso de ${user.email}.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error de actualización',
        description: error instanceof Error ? error.message : 'No se pudo cambiar el estado de acceso.',
      });
    }
  };

  const toggleRole = async (user: UserData) => {
    if (user.id === userProfile?.id) {
      toast({
        variant: 'destructive',
        title: 'Acción no permitida',
        description: 'No puedes cambiar tu propio rol desde esta pantalla.',
      });
      return;
    }

    try {
      const nextRole = user.role === 'admin' ? 'regular' : 'admin';
      await api.updateUser(user.id, { role: nextRole });
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, role: nextRole } : item))
      );
      toast({
        title: 'Rol actualizado',
        description: `${user.email} ahora es ${nextRole === 'admin' ? 'administrador' : 'usuario regular'}.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error de rol',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el rol.',
      });
    }
  };

  const deleteUser = async (user: UserData) => {
    if (user.id === userProfile?.id) {
      toast({
        variant: 'destructive',
        title: 'Acción no permitida',
        description: 'No puedes eliminar tu propia cuenta.',
      });
      return;
    }

    const ok = window.confirm(`Se eliminará ${user.email}. Esta acción no se puede deshacer. ¿Continuar?`);
    if (!ok) return;

    try {
      await api.deleteUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      toast({
        title: 'Usuario eliminado',
        description: `${user.email} fue eliminado del sistema.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error eliminando usuario',
        description: error instanceof Error ? error.message : 'No se pudo eliminar el usuario.',
      });
    }
  };

  const openPermissionsDialog = (user: UserData) => {
    const pagesWithSelection = pages.map((page) => ({
      ...page,
      selected: user.permissions?.some((permission) => permission.page_id === page.id) || false,
    }));
    setPages(pagesWithSelection);
    setSelectedUser(user);
    setPermissionsDialogOpen(true);
  };

  const togglePagePermission = (pageId: string) => {
    setPages((current) =>
      current.map((page) => (page.id === pageId ? { ...page, selected: !page.selected } : page))
    );
  };

  const savePermissions = async () => {
    if (!selectedUser) return;
    try {
      setSavingPermissions(true);
      const selectedPages = pages.filter((page) => page.selected).map((page) => page.id);
      await api.saveUserPermissions(selectedUser.id, selectedPages);
      await fetchUsers();
      setPermissionsDialogOpen(false);
      toast({
        title: 'Permisos guardados',
        description: `Permisos de ${selectedUser.email} actualizados correctamente.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error guardando permisos',
        description: error instanceof Error ? error.message : 'No se pudieron guardar los permisos.',
      });
    } finally {
      setSavingPermissions(false);
    }
  };

  const createUser = async () => {
    if (!newUser.email.trim() || !newUser.password.trim()) {
      toast({
        variant: 'destructive',
        title: 'Faltan datos',
        description: 'Correo y contraseña son obligatorios.',
      });
      return;
    }

    try {
      setCreatingUser(true);
      await api.createUser({
        email: newUser.email.trim(),
        full_name: newUser.full_name.trim() || null,
        password: newUser.password,
        role: 'regular',
        is_approved: newUser.is_approved,
      });
      setNewUser({ email: '', full_name: '', password: '', is_approved: true });
      setCreateDialogOpen(false);
      await fetchUsers();
      toast({
        title: 'Usuario creado',
        description: 'Usuario creado correctamente con perfil regular.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo crear el usuario',
        description: error instanceof Error ? error.message : 'Error desconocido.',
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  const visitsByUserId = useMemo(() => {
    const map = new Map<string, PageVisit[]>();
    visits.forEach((visit) => {
      const current = map.get(visit.user_id) || [];
      current.push(visit);
      map.set(visit.user_id, current);
    });
    return map;
  }, [visits]);

  const usersWithAudit = useMemo(() => {
    return users
      .map((user) => {
        const userVisits = visitsByUserId.get(user.id) || [];
        const uniquePages = new Set(userVisits.map((visit) => visit.page_path));
        const visits7d = userVisits.filter((visit) => {
          const date = new Date(visit.visited_at);
          return !Number.isNaN(date.getTime()) && date >= subtractDays(7);
        }).length;
        const lastVisit = userVisits[0]?.visited_at || null;
        return {
          user,
          totalVisits: userVisits.length,
          uniquePages: uniquePages.size,
          visits7d,
          lastVisit,
          lastPath: userVisits[0]?.page_path || null,
        };
      })
      .sort((left, right) => {
        if (right.totalVisits !== left.totalVisits) return right.totalVisits - left.totalVisits;
        return left.user.email.localeCompare(right.user.email, 'es');
      });
  }, [users, visitsByUserId]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return usersWithAudit.filter(({ user }) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (statusFilter === 'approved' && !user.is_approved) return false;
      if (statusFilter === 'pending' && user.is_approved) return false;
      if (!query) return true;
      const fields = [user.email, user.full_name || '', user.id].join(' ').toLowerCase();
      return fields.includes(query);
    });
  }, [roleFilter, search, statusFilter, usersWithAudit]);

  const auditRows = useMemo(() => {
    const normalizedPathFilter = auditPathFilter.trim().toLowerCase();
    return visits.filter((visit) => {
      if (auditUserId !== 'all' && visit.user_id !== auditUserId) return false;
      if (!normalizedPathFilter) return true;
      return (
        (visit.page_path || '').toLowerCase().includes(normalizedPathFilter) ||
        (visit.page_name || '').toLowerCase().includes(normalizedPathFilter)
      );
    });
  }, [auditPathFilter, auditUserId, visits]);

  const dashboardStats = useMemo(() => {
    const approved = users.filter((user) => user.is_approved).length;
    const pending = users.length - approved;
    const admins = users.filter((user) => user.role === 'admin').length;
    const activeUsers7d = usersWithAudit.filter((item) => item.visits7d > 0).length;
    const visits24h = visits.filter((visit) => {
      const date = new Date(visit.visited_at);
      return !Number.isNaN(date.getTime()) && date >= subtractDays(1);
    }).length;
    return {
      totalUsers: users.length,
      approved,
      pending,
      admins,
      activeUsers7d,
      visits24h,
    };
  }, [users, usersWithAudit, visits]);

  const topVisitedPages = useMemo(() => {
    const counter = new Map<string, { path: string; name: string; count: number }>();
    visits.forEach((visit) => {
      const key = visit.page_path || 'sin-ruta';
      const current = counter.get(key) || {
        path: visit.page_path || '-',
        name: visit.page_name || visit.page_path || 'Sin nombre',
        count: 0,
      };
      current.count += 1;
      counter.set(key, current);
    });
    return Array.from(counter.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [visits]);

  const loginHeatmap = useMemo(() => {
    const dayCount = new Map<string, number>();
    visits.forEach((visit) => {
      const key = toDayKey(visit.visited_at);
      if (!key) return;
      dayCount.set(key, (dayCount.get(key) || 0) + 1);
    });
    return Array.from(dayCount.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.day.localeCompare(a.day))
      .slice(0, 10);
  }, [visits]);

  if (!isAdmin) {
    return (
      <div className="app-shell py-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-serif font-bold text-legal-blue mb-4">Acceso no autorizado</h2>
            <p>No tienes permisos para acceder a este panel administrativo.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="app-shell py-8">
      <DocumentHeader
        title="Panel Administrativo y Auditoría"
        subtitle="Control de cuentas, permisos, actividad por usuario y uso operativo de la aplicación"
        helpKey="admin-users"
      />
      <SoftLoadingIndicator active={loading} message={loadingMessage} />

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Card><CardContent className="p-4"><p className="text-xs text-legal-gray">Usuarios</p><p className="text-2xl font-bold text-legal-blue">{dashboardStats.totalUsers}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-legal-gray">Aprobados</p><p className="text-2xl font-bold text-emerald-700">{dashboardStats.approved}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-legal-gray">Pendientes</p><p className="text-2xl font-bold text-amber-700">{dashboardStats.pending}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-legal-gray">Admins</p><p className="text-2xl font-bold text-red-700">{dashboardStats.admins}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-legal-gray">Activos (7 días)</p><p className="text-2xl font-bold text-legal-blue">{dashboardStats.activeUsers7d}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-legal-gray">Visitas (24h)</p><p className="text-2xl font-bold text-legal-blue">{dashboardStats.visits24h}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="admin-tabs-scroll h-auto justify-start">
            <TabsTrigger value="users" className="shrink-0 text-xs sm:text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="sm:hidden">Usuarios</span>
              <span className="hidden sm:inline">Control de usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="shrink-0 text-xs sm:text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="sm:hidden">Auditoría</span>
              <span className="hidden sm:inline">Auditoría de usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="usage" className="shrink-0 text-xs sm:text-sm flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              <span className="sm:hidden">Uso app</span>
              <span className="hidden sm:inline">Auditoría de uso app</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="border-b">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-legal-blue">Control de cuentas y permisos</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={() => setCreateDialogOpen(true)} size="sm">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Crear usuario
                    </Button>
                    <Button onClick={refreshAll} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Actualizar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-3 md:grid-cols-4">
                  <Input
                    placeholder="Buscar por correo/nombre"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <select
                    className="h-10 rounded-md border px-3 text-sm"
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
                  >
                    <option value="all">Todos los roles</option>
                    <option value="admin">Solo admins</option>
                    <option value="regular">Solo regulares</option>
                  </select>
                  <select
                    className="h-10 rounded-md border px-3 text-sm"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  >
                    <option value="all">Todos los estados</option>
                    <option value="approved">Aprobados</option>
                    <option value="pending">Pendientes</option>
                  </select>
                  <div className="rounded-md border bg-legal-blue/5 px-3 py-2 text-sm text-legal-blue">
                    Mostrando {filteredUsers.length} de {users.length} usuarios
                  </div>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-legal-gray">Cargando...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-8 text-center text-legal-gray">No hay usuarios para los filtros aplicados.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1150px] border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border px-3 py-2 text-left">Usuario</th>
                          <th className="border px-3 py-2 text-left">Estado</th>
                          <th className="border px-3 py-2 text-left">Rol</th>
                          <th className="border px-3 py-2 text-left">Permisos</th>
                          <th className="border px-3 py-2 text-left">Última actividad</th>
                          <th className="border px-3 py-2 text-left">Uso</th>
                          <th className="border px-3 py-2 text-left">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((item) => (
                          <tr key={item.user.id} className="hover:bg-gray-50">
                            <td className="border px-3 py-2">
                              <p className="font-medium text-legal-blue">{item.user.full_name || 'Sin nombre'}</p>
                              <p className="text-sm text-gray-600">{item.user.email}</p>
                              <p className="text-xs text-gray-500">Creado: {formatDateTime(item.user.created_at)}</p>
                            </td>
                            <td className="border px-3 py-2">
                              <Badge variant={item.user.is_approved ? 'default' : 'secondary'}>
                                {item.user.is_approved ? 'Aprobado' : 'Pendiente'}
                              </Badge>
                            </td>
                            <td className="border px-3 py-2">
                              <Badge variant={item.user.role === 'admin' ? 'destructive' : 'outline'}>
                                {item.user.role === 'admin' ? 'Administrador' : 'Regular'}
                              </Badge>
                            </td>
                            <td className="border px-3 py-2">
                              <p className="text-sm">{item.user.permissions?.length || 0} página(s)</p>
                            </td>
                            <td className="border px-3 py-2 text-sm">
                              <p>{formatDateTime(item.lastVisit)}</p>
                              <p className="text-xs text-gray-500">{item.lastPath || 'Sin navegación registrada'}</p>
                            </td>
                            <td className="border px-3 py-2 text-sm">
                              <p>{item.totalVisits} visita(s)</p>
                              <p className="text-xs text-gray-500">{item.uniquePages} página(s) únicas</p>
                            </td>
                            <td className="border px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                <Button size="sm" variant={item.user.is_approved ? 'outline' : 'default'} onClick={() => toggleApproval(item.user)}>
                                  {item.user.is_approved ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => toggleRole(item.user)}>
                                  <UserCog className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="default" onClick={() => openPermissionsDialog(item.user)}>
                                  <CheckCheck className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteUser(item.user)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-legal-blue">
                  <ShieldCheck className="h-5 w-5" />
                  Auditoría por usuario
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-3 py-2 text-left">Usuario</th>
                      <th className="border px-3 py-2 text-left">Rol/Estado</th>
                      <th className="border px-3 py-2 text-left">Visitas totales</th>
                      <th className="border px-3 py-2 text-left">Visitas 7 días</th>
                      <th className="border px-3 py-2 text-left">Páginas únicas</th>
                      <th className="border px-3 py-2 text-left">Última actividad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersWithAudit.map((item) => (
                      <tr key={item.user.id}>
                        <td className="border px-3 py-2">
                          <p className="font-medium">{item.user.full_name || 'Sin nombre'}</p>
                          <p className="text-sm text-gray-600">{item.user.email}</p>
                        </td>
                        <td className="border px-3 py-2">
                          <div className="flex flex-col gap-1">
                            <Badge variant={item.user.role === 'admin' ? 'destructive' : 'outline'}>
                              {item.user.role}
                            </Badge>
                            <Badge variant={item.user.is_approved ? 'default' : 'secondary'}>
                              {item.user.is_approved ? 'Aprobado' : 'Pendiente'}
                            </Badge>
                          </div>
                        </td>
                        <td className="border px-3 py-2">{item.totalVisits}</td>
                        <td className="border px-3 py-2">{item.visits7d}</td>
                        <td className="border px-3 py-2">{item.uniquePages}</td>
                        <td className="border px-3 py-2">
                          <p>{formatDateTime(item.lastVisit)}</p>
                          <p className="text-xs text-gray-500">{item.lastPath || 'Sin ruta'}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-legal-blue">Auditoría de uso operativo de la app</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <Label>Filtrar por usuario</Label>
                    <select
                      className="mt-1 h-10 w-full rounded-md border px-3 text-sm"
                      value={auditUserId}
                      onChange={(event) => setAuditUserId(event.target.value)}
                    >
                      <option value="all">Todos</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Filtrar por ruta</Label>
                    <Input
                      value={auditPathFilter}
                      onChange={(event) => setAuditPathFilter(event.target.value)}
                      placeholder="/sienna, /dashboard, /admin-users..."
                    />
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" onClick={fetchVisits}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Actualizar auditoría
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="border">
                    <CardHeader><CardTitle className="text-sm text-legal-blue">Top páginas más usadas</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {topVisitedPages.length === 0 ? (
                        <p className="text-sm text-legal-gray">Sin datos de uso.</p>
                      ) : (
                        topVisitedPages.map((item) => (
                          <div key={item.path} className="flex items-center justify-between rounded border px-3 py-2">
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.path}</p>
                            </div>
                            <Badge variant="secondary">{item.count}</Badge>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border">
                    <CardHeader><CardTitle className="text-sm text-legal-blue">Actividad diaria reciente</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {loginHeatmap.length === 0 ? (
                        <p className="text-sm text-legal-gray">Sin actividad registrada.</p>
                      ) : (
                        loginHeatmap.map((item) => (
                          <div key={item.day} className="flex items-center justify-between rounded border px-3 py-2">
                            <span className="text-sm">{item.day}</span>
                            <Badge variant="outline">{item.count} visita(s)</Badge>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border px-3 py-2 text-left">Fecha</th>
                        <th className="border px-3 py-2 text-left">Usuario</th>
                        <th className="border px-3 py-2 text-left">Página</th>
                        <th className="border px-3 py-2 text-left">Ruta</th>
                        <th className="border px-3 py-2 text-left">Navegador / agente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditRows.map((visit) => {
                        const profile = usersById.get(visit.user_id);
                        return (
                          <tr key={visit.id}>
                            <td className="border px-3 py-2 text-sm">{formatDateTime(visit.visited_at)}</td>
                            <td className="border px-3 py-2">
                              <p className="text-sm font-medium">{profile?.full_name || visit.user_full_name || 'Sin nombre'}</p>
                              <p className="text-xs text-gray-500">{profile?.email || visit.user_email || 'Sin email'}</p>
                            </td>
                            <td className="border px-3 py-2 text-sm">{visit.page_name || 'Sin nombre'}</td>
                            <td className="border px-3 py-2 text-sm font-mono">{visit.page_path}</td>
                            <td className="border px-3 py-2 text-xs text-gray-600 max-w-[280px] truncate">{visit.user_agent || 'No disponible'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Permisos de usuario</DialogTitle>
            <DialogDescription>
              {selectedUser && `Configurar acceso por páginas para ${selectedUser.email}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3 max-h-[45vh] overflow-y-auto">
            {pages.map((page) => (
              <div key={page.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <p className="font-medium">{page.name}</p>
                  <p className="text-xs text-gray-500">{page.path}</p>
                </div>
                <Switch checked={page.selected || false} onCheckedChange={() => togglePagePermission(page.id)} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={savePermissions} disabled={savingPermissions}>
              {savingPermissions ? 'Guardando...' : 'Guardar permisos'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear usuario</DialogTitle>
            <DialogDescription>Se crea con rol regular. Luego puedes elevar a admin desde Control de usuarios.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Correo</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div>
              <Label>Nombre</Label>
              <Input
                value={newUser.full_name}
                onChange={(event) => setNewUser({ ...newUser, full_name: event.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <Label>Contraseña temporal</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(event) => setNewUser({ ...newUser, password: event.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Aprobar acceso inmediato</p>
                <p className="text-sm text-gray-500">Si está activo, entra a la app inmediatamente.</p>
              </div>
              <Switch
                checked={newUser.is_approved}
                onCheckedChange={(checked) => setNewUser({ ...newUser, is_approved: checked })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createUser} disabled={creatingUser}>
              {creatingUser ? 'Creando...' : 'Crear usuario'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
