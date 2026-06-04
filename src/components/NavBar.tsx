import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Bot,
  FileText,
  FlaskConical,
  GitMerge,
  History,
  Landmark,
  LogOut,
  Network,
  User,
  Search,
  Settings,
  Shield,
  Sparkles,
  ScrollText,
  TreePine,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import MobileNavigationMenu from './MobileNavigationMenu';
import ThemeToggle from './ThemeToggle';

type SidebarLink = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

const siennaLinks: SidebarLink[] = [
  { label: 'Caso Alessandro', path: '/sienna', icon: Sparkles },
  { label: 'Árbol Genealógico', path: '/sienna/arbol', icon: TreePine },
  { label: 'Hallazgos', path: '/sienna/hallazgos', icon: Search },
  { label: 'Linajes', path: '/sienna/linajes', icon: GitMerge },
  { label: 'Documentos', path: '/sienna/documentos', icon: FileText },
  { label: 'Miembros', path: '/sienna/miembros', icon: Users },
  { label: 'Explicación', path: '/sienna/explicacion', icon: BookOpen },
  { label: 'Filiación', path: '/sienna/filiacion', icon: Network },
  { label: 'Laboratorio', path: '/sienna/laboratorio-compensacion', icon: FlaskConical },
  { label: 'Sienna', path: '/sienna/asistente', icon: Bot },
  { label: 'Recuento Legado', path: '/sienna/legado-game', icon: ScrollText },
];

const caseLinks: SidebarLink[] = [
  { label: 'Determinación', path: '/caso/determinacion-herederos', icon: Landmark },
];

const legacyLinks: SidebarLink[] = [
  { label: 'Árbol completo', path: '/legacy/arbol-genealogico', icon: TreePine },
  { label: 'Árbol clásico', path: '/legacy/arbol-clasico', icon: History },
  { label: 'Líneas familiares', path: '/legacy/lineas-familiares', icon: GitMerge },
];

const adminLinks: SidebarLink[] = [
  { label: 'Usuarios', path: '/admin/usuarios', icon: Users },
  { label: 'Configuración', path: '/admin/settings', icon: Settings },
  { label: 'Cálculo técnico', path: '/admin/calculo-herencias', icon: Shield },
];

const SidebarNavLink = ({ item }: { item: SidebarLink }) => {
  const location = useLocation();
  const active =
    item.path === '/sienna'
      ? location.pathname === item.path
      : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-[#D4AF37] text-[#0A1020] shadow-[0_0_26px_rgb(212_175_55_/_0.22)]'
          : 'text-[#1B2430]/78 hover:bg-[#D4AF37]/12 hover:text-[#1B2430] dark:text-white/78 dark:hover:bg-white/10 dark:hover:text-white'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
};

const CollapsedGroup = ({ title, links }: { title: string; links: SidebarLink[] }) => {
  if (links.length === 0) return null;

  return (
    <details className="group rounded-md">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#5F6B7A] transition-colors hover:bg-[#D4AF37]/12 hover:text-[#1B2430] dark:text-white/48 dark:hover:bg-white/10 dark:hover:text-white/80">
        {title}
        <span className="text-[#5F6B7A] transition-transform group-open:rotate-90 dark:text-white/35">›</span>
      </summary>
      <div className="mt-1 space-y-1">
        {links.map((item) => (
          <SidebarNavLink key={item.path} item={item} />
        ))}
      </div>
    </details>
  );
};

const DesktopSidebar = () => {
  const { isAdmin, hasAccess, userProfile, signOut } = useAuth();
  const can = (path: string) => isAdmin || hasAccess(path);
  const visibleSienna = siennaLinks.filter((item) => can(item.path));
  const visibleCase = caseLinks.filter((item) => can(item.path));
  const visibleLegacy = legacyLinks.filter((item) => can(item.path));
  const visibleAdmin = isAdmin ? adminLinks : [];
  const displayName = userProfile?.full_name || userProfile?.email || 'Usuario';
  const roleLabel = isAdmin ? 'Administrador' : 'Usuario autorizado';

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-hidden border-r border-[#D9CDB8] bg-[var(--gradient-surface)] text-[#1B2430] shadow-xl dark:border-white/10 dark:text-white md:flex">
      <div className="flex h-full min-h-0 flex-col p-4">
        <div className="mb-5 flex shrink-0 items-center gap-2">
          <Link
            to="/sienna"
            aria-label="Caso Alessandro de Paola Sangiovanni"
            className="flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-md border border-[#C89B2D]/30 bg-white/70 p-1 gold-glow transition-colors hover:bg-[#FFF6D8] dark:border-[#D4AF37]/20 dark:bg-white/[0.05] dark:hover:bg-white/[0.08]"
            style={{ aspectRatio: '1280 / 853' }}
          >
            <img
              src="/legado-sangiovanni-logo-transparent.png"
              alt="Caso Alessandro de Paola Sangiovanni"
              className="h-full w-full object-contain"
            />
          </Link>
          <ThemeToggle className="h-10 w-10 shrink-0 border border-[#D9CDB8] bg-white/70 text-[#1B2430] hover:bg-[#FFF6D8] hover:text-[#1B2430] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#C89B2D]/35 scrollbar-track-transparent">
          <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wide text-[#5F6B7A] dark:text-white/45">
            Navegación principal
          </div>
          <nav className="space-y-1">
            {visibleSienna.map((item) => (
              <SidebarNavLink key={item.path} item={item} />
            ))}
          </nav>

          <div className="my-4 border-t border-[#D9CDB8] dark:border-white/10" />
          <div className="space-y-2 pb-3">
            <CollapsedGroup title="Caso" links={visibleCase} />
            <CollapsedGroup title="Legacy" links={visibleLegacy} />
            <CollapsedGroup title="Admin" links={visibleAdmin} />
          </div>
        </div>

        <div className="shrink-0 space-y-3 border-t border-[#D9CDB8] pt-4 dark:border-white/10">
          <div className="rounded-md border border-[#D9CDB8] bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="truncate text-sm font-semibold text-[#1B2430] dark:text-white">{displayName}</p>
            <p className="mt-1 text-xs text-[#5F6B7A] dark:text-white/55">{roleLabel}</p>
          </div>
          <Link
            to="/perfil"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-[#D9CDB8] bg-white/70 px-3 py-2 text-sm font-semibold text-[#1B2430] transition-colors hover:border-[#C89B2D] hover:bg-[#FFF6D8] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80 dark:hover:bg-white/10"
          >
            <User className="h-4 w-4" />
            Mi perfil
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-[#D9CDB8] bg-white/70 px-3 py-2 text-sm font-semibold text-[#1B2430] transition-colors hover:border-[#C89B2D] hover:bg-[#FFF6D8] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80 dark:hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
};

const MobileTopBar = () => (
  <nav className="legacy-topbar border-b border-legal-blue/10 bg-white/80 shadow-sm backdrop-blur-md md:hidden">
    <div className="app-shell">
      <div className="flex h-16 justify-between">
        <div className="flex items-center">
          <Link to="/sienna" className="flex items-center gap-2 text-legal-blue">
            <span className="inline-flex h-9 w-9 overflow-hidden rounded-lg border border-[#D4AF37]/40 bg-[#223A5E] text-white shadow-sm dark:bg-[#162033]">
              <img src="/legado-sangiovanni-icon.jpg" alt="Caso Alessandro de Paola Sangiovanni" className="h-full w-full object-cover" />
            </span>
            <span className="leading-tight">
              <span className="block font-serif text-xl font-bold">Alessandro</span>
              <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-legal-gray sm:block">
                Legado Sangiovanni
              </span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle className="text-legal-blue hover:text-legal-blue" />
          <MobileNavigationMenu />
        </div>
      </div>
    </div>
  </nav>
);

const GuestTopBar = () => (
  <nav className="legacy-topbar border-b border-legal-blue/10 bg-white/80 shadow-sm backdrop-blur-md">
    <div className="app-shell">
      <div className="flex h-16 justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2 text-legal-blue">
            <span className="inline-flex h-9 w-9 overflow-hidden rounded-lg border border-[#D4AF37]/40 bg-[#223A5E] text-white shadow-sm dark:bg-[#162033]">
              <img src="/legado-sangiovanni-icon.jpg" alt="Caso Alessandro de Paola Sangiovanni" className="h-full w-full object-cover" />
            </span>
            <span className="block font-serif text-xl font-bold">Legado Sangiovanni</span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle className="text-legal-blue hover:text-legal-blue" />
          <MobileNavigationMenu />
        </div>
      </div>
    </div>
  </nav>
);

const NavBar = () => {
  const { user } = useAuth();

  if (!user) return <GuestTopBar />;

  return (
    <>
      <DesktopSidebar />
      <MobileTopBar />
    </>
  );
};

export default NavBar;
