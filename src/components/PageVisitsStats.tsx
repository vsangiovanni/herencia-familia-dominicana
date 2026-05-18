
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface PageStats {
  page_path: string;
  page_name: string;
  visit_count: number;
  unique_users: number;
  last_visit: string;
}

const PageVisitsStats = () => {
  const [visits, setVisits] = useState<PageVisit[]>([]);
  const [stats, setStats] = useState<PageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailedView, setShowDetailedView] = useState(false);

  const fetchVisits = async () => {
    try {
      setLoading(true);

      const { visits } = await api.listPageVisits();
      const visitsWithProfiles = visits.map(visit => ({
        ...visit,
        user_email: visit.user_email || 'Sin email',
        user_full_name: visit.user_full_name || 'Sin nombre'
      }));

      console.log('Datos de visitas obtenidos:', visitsWithProfiles);
      setVisits(visitsWithProfiles);

      // Calcular estadísticas por página
      if (visitsWithProfiles.length > 0) {
        const statsMap = new Map<string, {
          page_name: string;
          visits: PageVisit[];
          unique_users: Set<string>;
        }>();

        visitsWithProfiles.forEach(visit => {
          const key = visit.page_path;
          if (!statsMap.has(key)) {
            statsMap.set(key, {
              page_name: visit.page_name || visit.page_path,
              visits: [],
              unique_users: new Set()
            });
          }
          
          const stat = statsMap.get(key)!;
          stat.visits.push(visit);
          stat.unique_users.add(visit.user_id);
        });

        const calculatedStats: PageStats[] = Array.from(statsMap.entries()).map(([path, data]) => ({
          page_path: path,
          page_name: data.page_name,
          visit_count: data.visits.length,
          unique_users: data.unique_users.size,
          last_visit: data.visits[0]?.visited_at || ''
        }));

        // Ordenar por número de visitas (descendente)
        calculatedStats.sort((a, b) => b.visit_count - a.visit_count);
        setStats(calculatedStats);
      }
    } catch (error) {
      console.error('Error al obtener visitas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-legal-blue"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Estadísticas de Visitas de Páginas
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailedView(!showDetailedView)}
              >
                {showDetailedView ? 'Ver Resumen' : 'Ver Detalle'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchVisits}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!showDetailedView ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Página</TableHead>
                    <TableHead>Total Visitas</TableHead>
                    <TableHead>Usuarios Únicos</TableHead>
                    <TableHead>Última Visita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((stat) => (
                    <TableRow key={stat.page_path}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{stat.page_name}</p>
                          <p className="text-sm text-gray-500">{stat.page_path}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{stat.visit_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{stat.unique_users}</Badge>
                      </TableCell>
                      <TableCell>
                        {stat.last_visit && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {format(new Date(stat.last_visit), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Página</TableHead>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Navegador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {visit.user_full_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {visit.user_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{visit.page_name}</p>
                          <p className="text-sm text-gray-500">{visit.page_path}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {format(new Date(visit.visited_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {visit.user_agent || 'Desconocido'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PageVisitsStats;
