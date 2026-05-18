import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import DocumentHeader from '@/components/DocumentHeader';
import PageVisitsStats from '@/components/PageVisitsStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { CheckCheck, UserCheck, UserX, Users, BarChart3 } from 'lucide-react';

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

const AdminUsers = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { users } = await api.listUsers();
      setUsers(users as UserData[]);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async () => {
    try {
      const { pages } = await api.listPages();
      setPages(pages || []);
    } catch (error) {
      console.error('Error al obtener páginas:', error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchPages();
    }
  }, [isAdmin]);

  const toggleApproval = async (user: UserData) => {
    try {
      const newStatus = !user.is_approved;
      
      await api.updateUser(user.id, { is_approved: newStatus });
      
      // Actualizar estado local
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, is_approved: newStatus } : u
      ));
      
      toast({
        title: 'Usuario actualizado',
        description: newStatus 
          ? `${user.email} ahora tiene acceso a la aplicación` 
          : `Se ha revocado el acceso a ${user.email}`,
      });
    } catch (error) {
      console.error('Error al cambiar estado de aprobación:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el estado del usuario',
      });
    }
  };

  const openPermissionsDialog = (user: UserData) => {
    // Marcar las páginas a las que el usuario ya tiene acceso
    const pagesWithSelection = pages.map(page => ({
      ...page,
      selected: user.permissions?.some(p => p.page_id === page.id) || false
    }));
    
    setPages(pagesWithSelection);
    setSelectedUser(user);
    setPermissionsDialogOpen(true);
  };

  const togglePagePermission = (pageId: string) => {
    setPages(pages.map(page => 
      page.id === pageId ? { ...page, selected: !page.selected } : page
    ));
  };

  const savePermissions = async () => {
    if (!selectedUser) return;
    
    try {
      setSavingPermissions(true);
      
      const selectedPages = pages.filter(page => page.selected);
      await api.saveUserPermissions(selectedUser.id, selectedPages.map(page => page.id));
      
      toast({
        title: 'Permisos actualizados',
        description: `Los permisos para ${selectedUser.email} han sido actualizados exitosamente`,
      });
      
      // Refrescar lista de usuarios
      fetchUsers();
      setPermissionsDialogOpen(false);
    } catch (error) {
      console.error('Error al guardar permisos:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron guardar los permisos',
      });
    } finally {
      setSavingPermissions(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-serif font-bold text-legal-blue mb-4">
              Acceso no autorizado
            </h2>
            <p>No tienes permisos para acceder a esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DocumentHeader 
        title="Panel de Administración" 
        subtitle="Gestión de usuarios y estadísticas del sistema" 
      />

      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gestión de Usuarios
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Estadísticas de Visitas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-serif font-bold text-legal-blue">
                    Usuarios del Sistema
                  </h2>
                  <Button onClick={fetchUsers} variant="outline" size="sm">
                    Actualizar lista
                  </Button>
                </div>

                {loading ? (
                  <div className="flex justify-center p-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-legal-blue"></div>
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-center text-gray-500 p-6">No se encontraron usuarios</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border px-4 py-2 text-left">Correo</th>
                          <th className="border px-4 py-2 text-left">Nombre</th>
                          <th className="border px-4 py-2 text-left">Rol</th>
                          <th className="border px-4 py-2 text-left">Estado</th>
                          <th className="border px-4 py-2 text-left">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="border px-4 py-2">{user.email}</td>
                            <td className="border px-4 py-2">{user.full_name || '-'}</td>
                            <td className="border px-4 py-2">
                              <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>
                                {user.role === 'admin' ? 'Administrador' : 'Usuario Regular'}
                              </Badge>
                            </td>
                            <td className="border px-4 py-2">
                              <Badge variant={user.is_approved ? 'success' : 'secondary'}>
                                {user.is_approved ? 'Aprobado' : 'Pendiente'}
                              </Badge>
                            </td>
                            <td className="border px-4 py-2">
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant={user.is_approved ? "outline" : "default"}
                                  onClick={() => toggleApproval(user)}
                                >
                                  {user.is_approved ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                  <span className="ml-1">
                                    {user.is_approved ? 'Revocar' : 'Aprobar'}
                                  </span>
                                </Button>
                                
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => openPermissionsDialog(user)}
                                >
                                  <CheckCheck className="h-4 w-4 mr-1" />
                                  Permisos
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

          <TabsContent value="analytics" className="space-y-6">
            <PageVisitsStats />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Permisos de Usuario</DialogTitle>
            <DialogDescription>
              {selectedUser && `Configurar acceso para ${selectedUser.email}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {pages.map(page => (
              <div key={page.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{page.name}</p>
                  <p className="text-sm text-gray-500">{page.path}</p>
                </div>
                <Switch 
                  checked={page.selected || false} 
                  onCheckedChange={() => togglePagePermission(page.id)} 
                />
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
    </div>
  );
};

export default AdminUsers;
