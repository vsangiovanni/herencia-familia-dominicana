import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import PageHelp from '@/components/PageHelp';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Calculator,
  FileText,
  GitMerge,
  Landmark,
  ScrollText,
  Settings,
  TreePine,
  Users,
} from 'lucide-react';

type DashboardLink = {
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  cta: string;
  primary?: boolean;
  adminOnly?: boolean;
};

const HEIR_LINKS: DashboardLink[] = [
  {
    title: 'Árbol de la familia',
    description: 'Vea cómo están relacionados los miembros de la familia y quiénes heredan.',
    path: '/sienna/arbol-genealogico',
    icon: TreePine,
    cta: 'Ver árbol',
    primary: true,
  },
  {
    title: 'Mi herencia',
    description: 'Consulte cuánto le corresponde y el detalle de su parte en la sucesión.',
    path: '/sienna/explicacion-herederos',
    icon: Landmark,
    cta: 'Ver mi parte',
    primary: true,
  },
  {
    title: 'Líneas de parentesco',
    description: 'Si está vinculado por más de una rama familiar, aquí puede verlo con claridad.',
    path: '/sienna/dobles-linajes',
    icon: GitMerge,
    cta: 'Ver conexiones',
    primary: true,
  },
  {
    title: 'Documentos',
    description: 'Actas, certificados y papeles que respaldan el expediente.',
    path: '/documentos-probatorios',
    icon: ScrollText,
    cta: 'Ver documentos',
    primary: true,
  },
  {
    title: 'Determinación de herederos',
    description: 'Documento formal del caso sucesorio.',
    path: '/determinacion-herederos',
    icon: FileText,
    cta: 'Abrir documento',
  },
];

const ADMIN_LINKS: DashboardLink[] = [
  {
    title: 'Miembros del árbol',
    description: 'Editar personas y relaciones familiares.',
    path: '/sienna/miembros-arbol',
    icon: Users,
    cta: 'Gestionar',
    adminOnly: true,
  },
  {
    title: 'Cálculo de herencias',
    description: 'Montos y reparto interno.',
    path: '/calculo-herencias',
    icon: Calculator,
    cta: 'Abrir',
    adminOnly: true,
  },
  {
    title: 'Usuarios',
    description: 'Cuentas y permisos de acceso.',
    path: '/admin-users',
    icon: Users,
    cta: 'Administrar',
    adminOnly: true,
  },
  {
    title: 'Configuración',
    description: 'Montos y parámetros del caso.',
    path: '/admin/settings',
    icon: Settings,
    cta: 'Configurar',
    adminOnly: true,
  },
];

const HeirActionCard = ({ item }: { item: DashboardLink }) => {
  const Icon = item.icon;

  return (
    <Card
      className={cn(
        'border shadow-sm transition-shadow hover:shadow-md',
        item.primary ? 'border-legal-gold/35 bg-legal-gold/[0.05]' : 'border-legal-blue/10 bg-white'
      )}
    >
      <CardContent className="flex h-full flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-legal-gold/30 bg-white text-legal-blue">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-bold text-legal-blue">{item.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.description}</p>
          </div>
        </div>
        <Button asChild className="mt-auto w-full bg-legal-blue hover:bg-legal-blue/90 sm:w-auto sm:self-start">
          <Link to={item.path}>
            {item.cta}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user, userProfile, isAdmin, hasAccess } = useAuth();

  const firstName = useMemo(() => {
    const fullName = userProfile?.full_name?.trim();
    if (fullName) return fullName.split(/\s+/)[0];
    return user?.email?.split('@')[0] || 'Bienvenido';
  }, [user?.email, userProfile?.full_name]);

  const primaryLinks = useMemo(
    () => HEIR_LINKS.filter((item) => item.primary && hasAccess(item.path)),
    [hasAccess]
  );

  const secondaryLinks = useMemo(
    () => HEIR_LINKS.filter((item) => !item.primary && hasAccess(item.path)),
    [hasAccess]
  );

  const adminLinks = useMemo(
    () => (isAdmin ? ADMIN_LINKS.filter((item) => hasAccess(item.path)) : []),
    [hasAccess, isAdmin]
  );

  const hasAnyLink = primaryLinks.length > 0 || secondaryLinks.length > 0 || adminLinks.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-legal-beige/60 via-white to-white">
      <div className="app-shell py-8 sm:py-10">
        <div className="relative mb-8 max-w-3xl pr-12">
          <div className="absolute right-0 top-0">
            <PageHelp helpKey="dashboard" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-legal-blue sm:text-4xl">
            Hola, {firstName}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-gray-700 sm:text-lg">
            Aquí puede consultar el árbol familiar, su parte en la herencia y los documentos del
            expediente Sangiovanni.
          </p>
        </div>

        {primaryLinks.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {primaryLinks.map((item) => (
              <HeirActionCard key={item.path} item={item} />
            ))}
          </div>
        )}

        {secondaryLinks.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-legal-gray">
              También disponible
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {secondaryLinks.map((item) => (
                <HeirActionCard key={item.path} item={item} />
              ))}
            </div>
          </div>
        )}

        {adminLinks.length > 0 && (
          <div className="mt-10 rounded-xl border border-legal-blue/10 bg-legal-blue/[0.03] p-4 sm:p-5">
            <h2 className="mb-3 font-serif text-lg font-bold text-legal-blue">Administración</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {adminLinks.map((item) => (
                <Button key={item.path} asChild variant="outline" className="justify-start bg-white">
                  <Link to={item.path}>{item.title}</Link>
                </Button>
              ))}
            </div>
          </div>
        )}

        {!hasAnyLink && (
          <Card className="border border-dashed border-legal-blue/20">
            <CardContent className="p-8 text-center text-legal-gray">
              Su cuenta aún no tiene pantallas asignadas. Escríbale al administrador del expediente.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
