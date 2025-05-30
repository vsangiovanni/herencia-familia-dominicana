
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DocumentHeader from '@/components/DocumentHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Calculator, Users, Trash2, DollarSign, Home } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'regular';
  is_approved: boolean;
  created_at: string;
}

interface HerederoCalculado {
  nombre: string;
  porcentaje: number;
  montoEfectivo: number;
  montoPropiedades: number;
  total: number;
}

const CalculoHerencias = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Estados para el cálculo de herencias
  const [montoEfectivo, setMontoEfectivo] = useState<number>(0);
  const [montoPropiedades, setMontoPropiedades] = useState<number>(0);
  const [herederos, setHerederos] = useState<{ nombre: string; porcentaje: number }[]>([
    { nombre: '', porcentaje: 0 }
  ]);
  const [resultados, setResultados] = useState<HerederoCalculado[]>([]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
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

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const agregarHeredero = () => {
    setHerederos([...herederos, { nombre: '', porcentaje: 0 }]);
  };

  const actualizarHeredero = (index: number, campo: 'nombre' | 'porcentaje', valor: string | number) => {
    const nuevosHerederos = [...herederos];
    if (campo === 'nombre') {
      nuevosHerederos[index].nombre = valor as string;
    } else {
      nuevosHerederos[index].porcentaje = Number(valor);
    }
    setHerederos(nuevosHerederos);
  };

  const eliminarHeredero = (index: number) => {
    if (herederos.length > 1) {
      setHerederos(herederos.filter((_, i) => i !== index));
    }
  };

  const calcularHerencias = () => {
    const totalPorcentaje = herederos.reduce((sum, h) => sum + h.porcentaje, 0);
    
    if (totalPorcentaje !== 100) {
      toast({
        variant: 'destructive',
        title: 'Error en porcentajes',
        description: 'Los porcentajes deben sumar exactamente 100%',
      });
      return;
    }

    const herederosSinNombre = herederos.filter(h => !h.nombre.trim());
    if (herederosSinNombre.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Nombres requeridos',
        description: 'Todos los herederos deben tener un nombre',
      });
      return;
    }

    const totalHerencia = montoEfectivo + montoPropiedades;
    
    const resultadosCalculados: HerederoCalculado[] = herederos.map(heredero => {
      const factorPorcentaje = heredero.porcentaje / 100;
      return {
        nombre: heredero.nombre,
        porcentaje: heredero.porcentaje,
        montoEfectivo: montoEfectivo * factorPorcentaje,
        montoPropiedades: montoPropiedades * factorPorcentaje,
        total: totalHerencia * factorPorcentaje,
      };
    });

    setResultados(resultadosCalculados);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const openDeleteDialog = (user: UserData) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      
      // Eliminar permisos del usuario
      await supabase
        .from('user_page_permissions')
        .delete()
        .eq('user_id', userToDelete.id);

      // Eliminar visitas del usuario
      await supabase
        .from('page_visits')
        .delete()
        .eq('user_id', userToDelete.id);

      // Eliminar perfil del usuario
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;

      toast({
        title: 'Usuario eliminado',
        description: `El usuario ${userToDelete.email} ha sido eliminado exitosamente`,
      });

      fetchUsers();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el usuario',
      });
    } finally {
      setDeleting(false);
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
        title="Cálculo de Herencias" 
        subtitle="Herramientas administrativas para el cálculo de herencias y gestión de usuarios" 
      />

      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="calculator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculadora de Herencias
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gestión de Usuarios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Formulario de entrada */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Bienes de la Herencia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="efectivo">Monto en Efectivo</Label>
                    <Input
                      id="efectivo"
                      type="number"
                      placeholder="0.00"
                      value={montoEfectivo || ''}
                      onChange={(e) => setMontoEfectivo(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="propiedades">Monto en Propiedades</Label>
                    <Input
                      id="propiedades"
                      type="number"
                      placeholder="0.00"
                      value={montoPropiedades || ''}
                      onChange={(e) => setMontoPropiedades(Number(e.target.value))}
                    />
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">Total de la herencia:</p>
                    <p className="text-xl font-bold text-legal-blue">
                      {formatMoney(montoEfectivo + montoPropiedades)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Herederos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Herederos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {herederos.map((heredero, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Nombre del heredero"
                        value={heredero.nombre}
                        onChange={(e) => actualizarHeredero(index, 'nombre', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="%"
                        value={heredero.porcentaje || ''}
                        onChange={(e) => actualizarHeredero(index, 'porcentaje', e.target.value)}
                        className="w-20"
                      />
                      {herederos.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => eliminarHeredero(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={agregarHeredero} className="flex-1">
                      Agregar Heredero
                    </Button>
                    <Button onClick={calcularHerencias}>
                      Calcular
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resultados */}
            {resultados.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de la Herencia</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Heredero</TableHead>
                        <TableHead>Porcentaje</TableHead>
                        <TableHead>Efectivo</TableHead>
                        <TableHead>Propiedades</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultados.map((resultado, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {resultado.nombre}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {resultado.porcentaje}%
                            </Badge>
                          </TableCell>
                          <TableCell>{formatMoney(resultado.montoEfectivo)}</TableCell>
                          <TableCell>{formatMoney(resultado.montoPropiedades)}</TableCell>
                          <TableCell className="font-bold">
                            {formatMoney(resultado.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-legal-blue"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.full_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>
                              {user.role === 'admin' ? 'Administrador' : 'Usuario Regular'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_approved ? 'default' : 'secondary'}>
                              {user.is_approved ? 'Aprobado' : 'Pendiente'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteDialog(user)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de confirmación para eliminar usuario */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar al usuario {userToDelete?.email}? 
              Esta acción no se puede deshacer y eliminará todos los datos asociados al usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteUser} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar Usuario'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalculoHerencias;
