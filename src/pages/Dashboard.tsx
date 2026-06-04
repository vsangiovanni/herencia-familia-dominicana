import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import PageHelp from '@/components/PageHelp';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { siennaQueryKeys, useConfirmedHeirs, useSiennaAiCuriosities, useSiennaAnalysisSummary, useSiennaCalculation, useSiennaFamily } from '@/hooks/useSiennaData';
import { useSiennaPersonalization } from '@/hooks/useSiennaPersonalization';
import type { FamilyUnion, MemberParentLink, SiennaFamilyMember } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  BadgeDollarSign,
  Bot,
  Calculator,
  CheckCircle2,
  FileText,
  FlaskConical,
  GitMerge,
  Landmark,
  ScrollText,
  Settings,
  Sparkles,
  Star,
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

type SiennaPersona = {
  label: string;
  headline: string;
  curiosity: string;
  message: string;
  focus: string;
  priorityPath: string;
  priorityCta: string;
};

type StatCard = {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'purple' | 'green' | 'gold' | 'blue';
};

type BranchDistribution = {
  source: string;
  share: number;
  amount: number;
  heirs: number;
};

type DashboardGraphRow = {
  label: string;
  value: number;
  detail?: string;
};

type DashboardGraph = {
  label: string;
  title: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: StatCard['tone'];
  rows: DashboardGraphRow[];
  empty: string;
};

type CuriositySource = 'ai' | 'default' | 'pending';
type CuriosityRevealEffect =
  | 'fade'
  | 'type'
  | 'glow'
  | 'rise'
  | 'slide'
  | 'softPop'
  | 'wipe'
  | 'flip'
  | 'float'
  | 'blurIn'
  | 'spotlight'
  | 'stagger'
  | 'pulse'
  | 'confetti'
  | 'morph'
  | 'burst'
  | 'expand'
  | 'spark';

const curiosityRevealEffects: CuriosityRevealEffect[] = [
  'fade',
  'glow',
  'rise',
  'slide',
  'softPop',
  'wipe',
  'flip',
  'float',
  'blurIn',
  'spotlight',
  'stagger',
  'pulse',
  'confetti',
  'morph',
  'burst',
  'expand',
  'spark',
  'type',
];

const formatCompactNumber = (value: number | null | undefined) =>
  new Intl.NumberFormat('es-DO', { maximumFractionDigits: 0 }).format(Number(value || 0));

const formatMoney = (value: number | null | undefined) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const statToneClasses: Record<StatCard['tone'], string> = {
  purple: 'border-[#7B61FF]/35 bg-[#7B61FF]/14 text-[#7B61FF]',
  green: 'border-[#3FA37C]/35 bg-[#3FA37C]/14 text-[#3FA37C]',
  gold: 'border-[#D4AF37]/45 bg-[#D4AF37]/15 text-[#9B7418] dark:text-[#E6C768]',
  blue: 'border-[#355C9A]/35 bg-[#355C9A]/14 text-[#355C9A] dark:text-[#B8C0CC]',
};

const curiositySourceClasses: Record<CuriositySource, string> = {
  ai: 'border-[#2E8B57]/40 bg-[#EAF8F0] text-[#1F7A4F] dark:border-[#3FA37C]/45 dark:bg-[#163324] dark:text-[#7ED7A6]',
  default: 'border-[#D4AF37]/45 bg-[#FFF6D8] text-[#9B7418] dark:border-[#D4AF37]/45 dark:bg-[#2B2412] dark:text-[#E6C768]',
  pending: 'border-[#7B61FF]/35 bg-[#F3F0FF] text-[#5D47C8] dark:border-[#7B61FF]/45 dark:bg-[#1D1833] dark:text-[#B8AAFF]',
};

const CuriositySourceMark = ({ source }: { source: CuriositySource }) => {
  const Icon = source === 'ai' ? Bot : source === 'pending' ? Sparkles : Star;
  const label = source === 'ai' ? 'Curiosidad generada por IA' : source === 'pending' ? 'Sienna buscando una curiosidad' : 'Curiosidad destacada';

  return (
    <span
      className={cn(
        'absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border shadow-sm',
        curiositySourceClasses[source]
      )}
      title={label}
      aria-label={label}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
};

const curiosityLoadingMessages = [
  'Sienna está buscando cositas que quizás no sabías...',
  'Sienna está hilando detalles familiares poco obvios...',
  'Sienna está encontrando una perlita escondida del legado...',
  'Sienna está preparando una curiosidad fina para ti...',
];

const curiosityRevealClasses: Record<CuriosityRevealEffect, string> = {
  fade: 'animate-in fade-in duration-700',
  type: 'sienna-curiosity-type',
  glow: 'sienna-curiosity-glow',
  rise: 'sienna-curiosity-rise',
  slide: 'sienna-curiosity-slide',
  softPop: 'sienna-curiosity-soft-pop',
  wipe: 'sienna-curiosity-wipe',
  flip: 'sienna-curiosity-flip',
  float: 'sienna-curiosity-float',
  blurIn: 'sienna-curiosity-blur-in',
  spotlight: 'sienna-curiosity-spotlight',
  stagger: 'sienna-curiosity-stagger',
  pulse: 'sienna-curiosity-pulse',
  confetti: 'sienna-curiosity-confetti',
  morph: 'sienna-curiosity-morph',
  burst: 'sienna-curiosity-burst',
  expand: 'sienna-curiosity-expand',
  spark: 'sienna-curiosity-spark',
};

const CuriosityRevealText = ({
  text,
  effect,
  className,
}: {
  text: string;
  effect: CuriosityRevealEffect;
  className?: string;
}) => {
  const [typedText, setTypedText] = useState(effect === 'type' ? '' : text);
  const [typingDone, setTypingDone] = useState(effect !== 'type');

  useEffect(() => {
    if (effect !== 'type') {
      setTypedText(text);
      setTypingDone(true);
      return undefined;
    }

    setTypedText('');
    setTypingDone(false);
    let index = 0;
    const stepMs = text.length > 110 ? 12 : 18;
    const interval = window.setInterval(() => {
      index += 1;
      setTypedText(text.slice(0, index));
      if (index >= text.length) {
        setTypingDone(true);
        window.clearInterval(interval);
      }
    }, stepMs);

    return () => window.clearInterval(interval);
  }, [effect, text]);

  return (
    <span
      key={effect + '-' + text}
      className={cn('block', curiosityRevealClasses[effect], effect === 'type' && typingDone && 'sienna-curiosity-type-done', className)}
    >
      {effect === 'type' ? typedText : text}
    </span>
  );
};

const HEIR_LINKS: DashboardLink[] = [
  {
    title: 'Árbol vivo',
    description: 'Explora la familia, los enlaces, fallecidos, herederos activos y montos del reparto.',
    path: '/sienna/arbol',
    icon: TreePine,
    cta: 'Entrar al árbol',
    primary: true,
  },
  {
    title: 'Reparto claro',
    description: 'Porcentaje, monto, ruta familiar y explicación lista para conversar con herederos.',
    path: '/sienna/explicacion',
    icon: Landmark,
    cta: 'Ver reparto',
    primary: true,
  },
  {
    title: 'Dobles linajes',
    description: 'Detecta convergencias, rutas cruzadas y vocaciones acumuladas por rama familiar.',
    path: '/sienna/linajes',
    icon: GitMerge,
    cta: 'Analizar linajes',
    primary: true,
  },
  {
    title: 'Expediente probatorio',
    description: 'Actas, certificados y evidencias conectadas directamente con cada miembro.',
    path: '/sienna/documentos',
    icon: ScrollText,
    cta: 'Ver documentos',
    primary: true,
  },
  {
    title: 'Sienna contigo',
    description: 'Pregúntame qué revisar y te guío paso a paso sin modificar datos.',
    path: '/sienna/asistente',
    icon: Bot,
    cta: 'Preguntar',
    primary: true,
  },
  {
    title: 'Laboratorio familiar',
    description: 'Simula compensaciones familiares sin tocar el reparto oficial.',
    path: '/sienna/laboratorio-compensacion',
    icon: FlaskConical,
    cta: 'Simular',
    primary: true,
  },
  {
    title: 'No participación',
    description: 'Genera y da seguimiento a declaraciones individuales sin montos ni cambios al reparto.',
    path: '/sienna/declaraciones-no-participacion',
    icon: FileText,
    cta: 'Gestionar',
    primary: true,
  },
  {
    title: 'Determinación formal',
    description: 'Salida legal del caso, separada de la experiencia principal del legado.',
    path: '/caso/determinacion-herederos',
    icon: FileText,
    cta: 'Abrir documento',
  },
  {
    title: 'Hallazgos',
    description: 'Pendientes, inconsistencias y alertas accionables del expediente familiar.',
    path: '/sienna/hallazgos',
    icon: CheckCircle2,
    cta: 'Revisar hallazgos',
  },
];

const ADMIN_LINKS: DashboardLink[] = [
  {
    title: 'Miembros del árbol',
    description: 'Editar personas y relaciones familiares.',
    path: '/sienna/miembros',
    icon: Users,
    cta: 'Gestionar',
    adminOnly: true,
  },
  {
    title: 'Cálculo de herencias',
    description: 'Montos y reparto interno.',
    path: '/admin/calculo-herencias',
    icon: Calculator,
    cta: 'Abrir',
    adminOnly: true,
  },
  {
    title: 'Usuarios',
    description: 'Cuentas y permisos de acceso.',
    path: '/admin/usuarios',
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

const LEGACY_LINKS: DashboardLink[] = [
  {
    title: 'Caso formal',
    description: 'Documento de determinación sucesoral y lectura legal del expediente.',
    path: '/caso/determinacion-herederos',
    icon: FileText,
    cta: 'Abrir caso',
  },
  {
    title: 'Árbol legacy',
    description: 'Vista anterior conservada para comparación y continuidad operativa.',
    path: '/legacy/arbol-genealogico',
    icon: TreePine,
    cta: 'Abrir legacy',
  },
  {
    title: 'Líneas familiares',
    description: 'Consulta tradicional por ramas y generaciones.',
    path: '/legacy/lineas-familiares',
    icon: GitMerge,
    cta: 'Consultar',
  },
];

const HeirActionCard = ({ item }: { item: DashboardLink }) => {
  const Icon = item.icon;

  return (
    <Card
      className={cn(
        'legacy-surface group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md',
        item.primary ? 'border-legal-gold/35' : 'border-legal-blue/10'
      )}
    >
      <CardContent className="flex h-full flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-legal-blue transition-colors',
            item.primary ? 'border-legal-gold/35 bg-[#D4AF37]/10 group-hover:bg-[#E6C768]/20' : 'border-legal-blue/15 bg-[#3FA37C]/10'
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-bold text-legal-blue dark:text-[#F5F7FA]">{item.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-muted-foreground">{item.description}</p>
          </div>
        </div>
        <Button asChild className="btn-primary mt-auto w-full sm:w-auto sm:self-start">
          <Link to={item.path}>
            {item.cta}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const SiennaStatCard = ({ item }: { item: StatCard }) => {
  const Icon = item.icon;

  return (
    <Card className="legacy-surface border border-legal-blue/10">
      <CardContent className="flex items-center justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-legal-gray dark:text-[#8C97A8]">{item.label}</p>
          <p className="mt-3 max-w-full break-words font-serif text-[clamp(1.35rem,1.75vw,1.8rem)] font-bold leading-tight text-legal-blue dark:text-[#D4AF37]">
            {item.value}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-[#B8C0CC]">{item.detail}</p>
        </div>
        <div className={cn('inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border shadow-[0_0_24px_rgb(212_175_55_/_0.10)]', statToneClasses[item.tone])}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
};

const DonutChart = ({
  value,
  label,
  sublabel,
}: {
  value: number;
  label: string;
  sublabel: string;
}) => {
  const normalized = Math.max(0, Math.min(100, Number(value || 0)));
  const degrees = normalized * 3.6;
  const background = 'conic-gradient(#D4AF37 0deg ' + degrees + 'deg, #3FA37C22 ' + degrees + 'deg 360deg)';

  return (
    <div className="flex items-center gap-4">
      <div
        className="grid h-28 w-28 shrink-0 place-items-center rounded-full border border-legal-gold/30"
        style={{ background }}
        aria-label={label + ': ' + formatCompactNumber(normalized) + '%'}
      >
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center shadow-inner dark:bg-[#162033]">
          <span className="font-serif text-2xl font-bold text-legal-blue dark:text-[#F5F7FA]">{formatCompactNumber(normalized)}%</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-legal-gray">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-muted-foreground">{sublabel}</p>
      </div>
    </div>
  );
};

const MiniBars = ({
  rows,
}: {
  rows: Array<{ label: string; value: number; color: string }>;
}) => {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-gray-700 dark:text-muted-foreground">{row.label}</span>
            <span className="font-semibold text-legal-blue dark:text-[#F5F7FA]">{formatCompactNumber(row.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: Math.max(8, (row.value / max) * 100) + '%', background: row.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const BranchDistributionChart = ({ rows }: { rows: BranchDistribution[] }) => {
  const colors = ['#D4AF37', '#3FA37C', '#355C9A', '#7B61FF', '#C05656'];
  const displayRows = rows.length
    ? rows
    : [{ source: 'Sin ramas calculadas', share: 0, amount: 0, heirs: 0 }];
  const total = Math.max(1, displayRows.reduce((sum, row) => sum + row.share, 0));
  let cursor = 0;
  const segments = displayRows.map((row, index) => {
    const start = (cursor / total) * 360;
    cursor += row.share;
    const end = (cursor / total) * 360;
    return colors[index % colors.length] + ' ' + start + 'deg ' + end + 'deg';
  });
  const background = 'conic-gradient(' + segments.join(', ') + ')';

  return (
    <div className="grid gap-4 md:grid-cols-[150px_1fr]">
      <div className="mx-auto grid h-36 w-36 place-items-center rounded-full border border-legal-gold/30" style={{ background }}>
        <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center shadow-inner dark:bg-[#162033]">
          <div>
            <p className="font-serif text-xl font-bold text-legal-blue dark:text-[#F5F7FA]">{formatCompactNumber(displayRows.length)}</p>
            <p className="text-[11px] uppercase tracking-wide text-legal-gray">ramas</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {displayRows.map((row, index) => (
          <div key={row.source} className="legacy-surface rounded-md p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colors[index % colors.length] }} />
                  <p className="truncate text-sm font-semibold text-legal-blue dark:text-[#F5F7FA]">{row.source}</p>
                </div>
                <p className="mt-1 text-xs text-gray-600 dark:text-muted-foreground">{formatCompactNumber(row.heirs)} participación(es) de herederos</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-legal-blue dark:text-[#F5F7FA]">{formatCompactNumber(row.share)}%</p>
                <p className="text-xs text-gray-600 dark:text-muted-foreground">{formatMoney(row.amount)}</p>
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: Math.max(6, (row.share / total) * 100) + '%', background: colors[index % colors.length] }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-legal-gray">
        Nota: una misma persona puede participar en más de una rama cuando tiene doble linaje; por eso estas
        participaciones no se suman como personas únicas.
      </p>
    </div>
  );
};

const ChartPanel = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="legacy-surface flex h-full min-h-[190px] flex-col rounded-lg p-4">
    <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-legal-gray">{title}</p>
    <div className="flex flex-1 flex-col justify-center">{children}</div>
  </div>
);

const InsightGraphCard = ({ graph }: { graph: DashboardGraph }) => {
  const Icon = graph.icon;
  const max = Math.max(1, ...graph.rows.map((row) => row.value));
  const totalGroups = graph.rows.length;
  const totalPeople = graph.rows.reduce((sum, row) => sum + row.value, 0);
  const topRow = graph.rows[0];

  return (
    <div className="flex h-full min-h-[360px] flex-col rounded-md border border-legal-blue/10 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-[#101827]/85">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-legal-gray dark:text-[#8C97A8]">
            {graph.label}
          </p>
          <h3 className="mt-1 font-serif text-xl font-bold leading-tight text-legal-blue dark:text-[#F5F7FA]">
            {graph.title}
          </h3>
        </div>
        <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border', statToneClasses[graph.tone])}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-muted-foreground">
        {graph.detail}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-legal-gold/20 bg-[#FFF9E7] px-3 py-2 dark:border-[#D4AF37]/20 dark:bg-[#241F12]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-legal-gray dark:text-[#8C97A8]">Grupos</p>
          <p className="mt-1 font-serif text-xl font-bold text-legal-blue dark:text-[#F5F7FA]">{formatCompactNumber(totalGroups)}</p>
        </div>
        <div className="rounded-md border border-[#3FA37C]/20 bg-[#ECF8F1] px-3 py-2 dark:border-[#3FA37C]/20 dark:bg-[#10251D]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-legal-gray dark:text-[#8C97A8]">Conectados</p>
          <p className="mt-1 font-serif text-xl font-bold text-legal-blue dark:text-[#F5F7FA]">{formatCompactNumber(totalPeople)}</p>
        </div>
      </div>
      {topRow && (
        <div className="mt-2 rounded-md border border-legal-blue/10 bg-[#F8F5EC] px-3 py-2 dark:border-white/10 dark:bg-[#0D1424]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-legal-gray dark:text-[#8C97A8]">Dato dominante</p>
          <p className="mt-1 truncate text-sm font-semibold text-legal-blue dark:text-[#F5F7FA]">{topRow.label}</p>
          {topRow.detail && <p className="mt-0.5 truncate text-xs text-legal-gray dark:text-[#8C97A8]">{topRow.detail}</p>}
        </div>
      )}
      <div className="mt-4 flex-1 space-y-3">
        {graph.rows.length > 0 ? (
          graph.rows.map((row, index) => (
            <div key={row.label + index}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate font-medium text-gray-700 dark:text-muted-foreground">
                  {row.label}
                </span>
                <span className="shrink-0 font-semibold text-legal-blue dark:text-[#F5F7FA]">
                  {formatCompactNumber(row.value)}
                </span>
              </div>
              <div className="h-3.5 overflow-hidden rounded-full bg-gray-100 dark:bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] via-[#3FA37C] to-[#355C9A]"
                  style={{ width: Math.max(10, (row.value / max) * 100) + '%' }}
                />
              </div>
              {row.detail && (
                <p className="mt-1 truncate text-[11px] text-legal-gray dark:text-[#8C97A8]">{row.detail}</p>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-md border border-dashed border-legal-blue/15 bg-[#F8F5EC] p-3 text-sm text-legal-gray dark:border-white/10 dark:bg-[#0D1424] dark:text-[#8C97A8]">
            {graph.empty}
          </div>
        )}
      </div>
    </div>
  );
};

type DashboardPriority = {
  label: string;
  headline: string;
  message: string;
  focus: string;
  path: string;
  cta: string;
};

const chooseVariant = <T,>(seed: string, variants: T[]) => {
  const index = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0) % variants.length;
  return variants[index];
};

const shortName = (name: string) => name.split(' ').slice(0, 2).join(' ');

const hashString = (value: string) =>
  Array.from(value).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);

const uniqueFacts = (facts: string[]) => Array.from(new Set(facts.filter(Boolean)));

const joinNames = (members: SiennaFamilyMember[], limit = 3) => {
  const names = members.slice(0, limit).map((member) => shortName(member.name));
  if (members.length > limit) names.push(String(members.length - limit) + ' más');
  return names.length <= 1 ? names[0] || '' : names.slice(0, -1).join(', ') + ' y ' + names.at(-1);
};

const parseYear = (value?: string | null) => {
  const match = value?.match(/(\d{4})/);
  return match ? Number(match[1]) : null;
};

const buildMemberIndex = (members: SiennaFamilyMember[]) =>
  new Map(members.map((member) => [member.id, member]));

const getParentIds = (member: SiennaFamilyMember, parentLinks: MemberParentLink[]) => {
  const ids = new Set<string>();
  if (member.parent_id) ids.add(member.parent_id);
  parentLinks
    .filter((link) => link.child_member_id === member.id && !link.is_inconsistent)
    .forEach((link) => ids.add(link.parent_member_id));
  return Array.from(ids);
};

const getGrandparentIds = (
  member: SiennaFamilyMember,
  membersById: Map<string, SiennaFamilyMember>,
  parentLinks: MemberParentLink[]
) => {
  const ids = new Set<string>();
  getParentIds(member, parentLinks).forEach((parentId) => {
    const parent = membersById.get(parentId);
    if (!parent) return;
    getParentIds(parent, parentLinks).forEach((grandparentId) => ids.add(grandparentId));
  });
  return Array.from(ids).sort();
};

const relationLabel = (member: SiennaFamilyMember) => {
  const status = member.effective_inheritance_status || member.inheritance_status;
  if (status === 'confirmado') return 'heredero';
  if (member.death) return 'memoria';
  return 'miembro';
};

const buildDashboardGraphs = ({
  members,
  parentLinks,
}: {
  members: SiennaFamilyMember[];
  parentLinks: MemberParentLink[];
}): DashboardGraph[] => {
  const membersById = buildMemberIndex(members);
  const parentPairs = new Map<string, SiennaFamilyMember[]>();
  const grandparentClusters = new Map<string, SiennaFamilyMember[]>();
  const decadeGroups = new Map<string, SiennaFamilyMember[]>();

  members.forEach((member) => {
    const parents = getParentIds(member, parentLinks).sort();
    if (parents.length >= 2) {
      const key = parents.join('|');
      parentPairs.set(key, [...(parentPairs.get(key) || []), member]);
    }

    const grandparents = getGrandparentIds(member, membersById, parentLinks);
    if (grandparents.length >= 2) {
      const key = grandparents.join('|');
      grandparentClusters.set(key, [...(grandparentClusters.get(key) || []), member]);
    }

    const year = parseYear(member.birth);
    if (year) {
      const decade = Math.floor(year / 10) * 10;
      const label = decade + 's';
      decadeGroups.set(label, [...(decadeGroups.get(label) || []), member]);
    }
  });

  const formatAncestorPair = (ids: string) => {
    const names = ids
      .split('|')
      .map((id) => membersById.get(id))
      .filter(Boolean)
      .map((member) => shortName(member!.name));
    return names.slice(0, 2).join(' + ') || 'Raíz familiar';
  };

  const siblingRows = Array.from(parentPairs.entries())
    .filter(([, group]) => group.length >= 2)
    .map(([ids, group]) => ({
      label: formatAncestorPair(ids),
      value: group.length,
      detail: joinNames(group, 2),
    }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label, 'es'))
    .slice(0, 4);

  const grandparentRows = Array.from(grandparentClusters.entries())
    .filter(([, group]) => group.length >= 2)
    .map(([ids, group]) => ({
      label: formatAncestorPair(ids),
      value: group.length,
      detail: joinNames(group, 2),
    }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label, 'es'))
    .slice(0, 4);

  const cousinRows = Array.from(grandparentClusters.entries())
    .map(([ids, group]) => {
      const familyKeys = new Set(group.map((member) => getParentIds(member, parentLinks).sort().join('|')).filter(Boolean));
      return {
        label: formatAncestorPair(ids),
        value: Math.max(0, group.length - Math.max(1, familyKeys.size)),
        detail: familyKeys.size > 1 ? String(familyKeys.size) + ' hogares conectados' : joinNames(group, 2),
      };
    })
    .filter((row) => row.value > 0)
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label, 'es'))
    .slice(0, 4);

  const decadeRows = Array.from(decadeGroups.entries())
    .map(([label, group]) => ({
      label,
      value: group.length,
      detail: joinNames([...group].sort((left, right) => left.name.localeCompare(right.name, 'es')), 2),
    }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label, 'es'))
    .slice(0, 4);

  const heirStatusRows = Object.entries(
    members.reduce<Record<string, SiennaFamilyMember[]>>((acc, member) => {
      const label = relationLabel(member);
      acc[label] = [...(acc[label] || []), member];
      return acc;
    }, {})
  )
    .map(([label, group]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value: group.length,
      detail: joinNames(group, 2),
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 4);

  return [
    {
      label: 'Por abuelos',
      title: 'Raíces que más se repiten',
      detail: 'Agrupa personas que comparten el mismo par de abuelos registrados.',
      icon: TreePine,
      tone: 'green',
      rows: grandparentRows,
      empty: 'Cuando haya más pares de abuelos conectados, este gráfico mostrará las raíces más repetidas.',
    },
    {
      label: 'Por hermanos',
      title: 'Núcleos con más hijos',
      detail: 'Muestra grupos de hermanos completos según los padres vinculados.',
      icon: Users,
      tone: 'purple',
      rows: siblingRows,
      empty: 'No hay suficientes grupos de hermanos completos para graficar todavía.',
    },
    {
      label: 'Por primos',
      title: 'Primos por raíz común',
      detail: 'Detecta ramas que comparten abuelos, pero vienen de hogares distintos.',
      icon: GitMerge,
      tone: 'blue',
      rows: cousinRows,
      empty: 'Aún no hay grupos de primos claros con la información parental actual.',
    },
    {
      label: 'Generaciones',
      title: 'Décadas con más vida',
      detail: 'Concentra nacimientos por década para ver dónde pesa más la memoria familiar.',
      icon: Sparkles,
      tone: 'gold',
      rows: decadeRows.length ? decadeRows : heirStatusRows,
      empty: 'Faltan fechas de nacimiento suficientes para levantar este gráfico.',
    },
  ];
};

const getChildrenByParent = (members: SiennaFamilyMember[], parentLinks: MemberParentLink[]) => {
  const childrenByParent = new Map<string, SiennaFamilyMember[]>();

  members.forEach((member) => {
    if (!member.parent_id) return;
    childrenByParent.set(member.parent_id, [...(childrenByParent.get(member.parent_id) || []), member]);
  });

  parentLinks
    .filter((link) => !link.is_inconsistent)
    .forEach((link) => {
      const child = members.find((member) => member.id === link.child_member_id);
      if (!child) return;
      const current = childrenByParent.get(link.parent_member_id) || [];
      if (!current.some((item) => item.id === child.id)) {
        childrenByParent.set(link.parent_member_id, [...current, child]);
      }
    });

  return childrenByParent;
};

const hasFormalUnion = (member: SiennaFamilyMember, unions: FamilyUnion[]) =>
  unions.some(
    (union) =>
      union.partner_a_member_id === member.id ||
      union.partner_b_member_id === member.id
  );

const buildLegacyCuriosities = ({
  members,
  unions,
  parentLinks,
  seed,
}: {
  members: SiennaFamilyMember[];
  unions: FamilyUnion[];
  parentLinks: MemberParentLink[];
  seed: string;
}) => {
  if (!members.length) return ['Estoy preparando las curiosidades del árbol familiar; en cuanto carguen los datos, esta sección empieza a hablar con más vida.'];

  const membersById = buildMemberIndex(members);
  const facts: string[] = [];
  const childrenByParent = getChildrenByParent(members, parentLinks);
  const alessandro = members.find((member) => member.name.toLowerCase().includes('alessandro'));
  const inconsistentLinks = parentLinks.filter((link) => link.is_inconsistent);

  inconsistentLinks.slice(0, 3).forEach((link) => {
    const child = membersById.get(link.child_member_id);
    const parent = membersById.get(link.parent_member_id);
    if (!child || !parent) return;
    facts.push(
      'Hay una filiación que merece lupa: ' + shortName(child.name) + ' aparece ligado a ' + shortName(parent.name) + ', pero el expediente pide validación.'
    );
  });

  if (alessandro && !alessandro.spouse && !alessandro.spouse_member_id && !hasFormalUnion(alessandro, unions)) {
    facts.push('¿Sabías que Alessandro figura en el árbol sin matrimonio registrado? Es un detalle pequeño, pero cambia mucho cómo se lee su historia familiar.');
  }

  const sharedGrandparents = new Map<string, SiennaFamilyMember[]>();
  members.forEach((member) => {
    const grandparents = getGrandparentIds(member, membersById, parentLinks);
    if (grandparents.length < 2) return;
    const key = grandparents.join('|');
    sharedGrandparents.set(key, [...(sharedGrandparents.get(key) || []), member]);
  });

  Array.from(sharedGrandparents.values())
    .map((group) => group.filter((member) => !member.death))
    .filter((group) => group.length >= 2)
    .forEach((group) => {
      const [first, second] = group;
      facts.push(
        'Es curioso: ' + shortName(first.name) + ' y ' + shortName(second.name) + ' comparten el mismo grupo de abuelos en el árbol. Ese tipo de cruce explica por qué algunas ramas se sienten tan cercanas.'
      );
      if (group.length > 2) {
        facts.push('Hay un pequeño grupo familiar alrededor de los mismos abuelos: ' + joinNames(group) + ' aparecen conectados por esa raíz común.');
      }
    });

  const parentPairs = new Map<string, SiennaFamilyMember[]>();
  members.forEach((member) => {
    const parents = getParentIds(member, parentLinks).sort();
    if (parents.length < 2) return;
    const key = parents.slice(0, 2).join('|');
    parentPairs.set(key, [...(parentPairs.get(key) || []), member]);
  });

  Array.from(parentPairs.entries())
    .filter(([, group]) => group.length >= 2)
    .forEach(([key, group]) => {
      const parentNames = key
        .split('|')
        .map((id) => membersById.get(id))
        .filter(Boolean) as SiennaFamilyMember[];
      if (parentNames.length < 2) return;
      facts.push(
        joinNames(group) + ' comparten ambos padres en el archivo: ' + shortName(parentNames[0].name) + ' y ' + shortName(parentNames[1].name) + '. Esa lectura ayuda a ver hermanos completos, no solo ramas sueltas.'
      );
    });

  members
    .map((member) => ({ member, children: childrenByParent.get(member.id) || [] }))
    .filter(({ children }) => children.length >= 2)
    .sort((left, right) => right.children.length - left.children.length)
    .slice(0, 14)
    .forEach(({ member, children }) => {
      facts.push(
        shortName(member.name) + ' conecta directamente con ' + children.length + ' descendiente' + (children.length === 1 ? '' : 's') + ' en el árbol: ' + joinNames(children) + '.'
      );
    });

  unions
    .filter((union) => !union.is_inconsistent)
    .map((union) => ({
      union,
      first: membersById.get(union.partner_a_member_id),
      second: union.partner_b_member_id ? membersById.get(union.partner_b_member_id) : null,
    }))
    .filter(({ first, second }) => first && second)
    .slice(0, 14)
    .forEach(({ union, first, second }) => {
      const label = union.union_type === 'matrimonio' ? 'matrimonio' : union.union_type === 'union_libre' ? 'unión familiar' : 'relación familiar';
      facts.push(
        'El archivo reconoce la ' + label + ' entre ' + shortName(first!.name) + ' y ' + shortName(second!.name) + '. Es una de esas uniones que explican cómo se amarran las ramas.'
      );
    });

  const livingByYear = new Map<number, SiennaFamilyMember[]>();
  const bornByDecade = new Map<number, SiennaFamilyMember[]>();
  members.forEach((member) => {
    const year = parseYear(member.birth);
    if (!year) return;
    if (!member.death) livingByYear.set(year, [...(livingByYear.get(year) || []), member]);
    const decade = Math.floor(year / 10) * 10;
    bornByDecade.set(decade, [...(bornByDecade.get(decade) || []), member]);
  });

  Array.from(livingByYear.entries())
    .filter(([, group]) => group.length >= 2)
    .sort(([leftYear], [rightYear]) => leftYear - rightYear)
    .slice(0, 10)
    .forEach(([year, group]) => {
      facts.push('Hay una coincidencia bonita en la generación de ' + year + ': ' + shortName(group[0].name) + ' y ' + shortName(group[1].name) + ' nacieron ese mismo año.');
    });

  Array.from(bornByDecade.entries())
    .filter(([, group]) => group.length >= 3)
    .sort(([, left], [, right]) => right.length - left.length)
    .slice(0, 8)
    .forEach(([decade, group]) => {
      facts.push('La década de ' + decade + ' concentra ' + group.length + ' nacimiento' + (group.length === 1 ? '' : 's') + ' en el archivo. Ahí se siente una de las generaciones fuertes del legado.');
    });

  const highlighted = members.filter((member) => member.is_highlighted_ancestor);
  highlighted.forEach((member) => {
    facts.push(
      shortName(member.name) + ' no está ahí como un nombre más: el árbol lo trata como una figura central para entender el legado Sangiovanni.'
    );
  });

  const deceasedCount = members.filter((member) => member.death).length;
  if (deceasedCount > 0) {
    facts.push(
      `El archivo ya conserva la memoria de ${formatCompactNumber(deceasedCount)} miembro${deceasedCount === 1 ? '' : 's'} fallecido${deceasedCount === 1 ? '' : 's'} con fecha registrada. Es parte de lo que hace que el árbol se sienta vivo, no solo calculado.`
    );
  }

  members
    .filter((member) => member.birth && member.death)
    .slice(0, 14)
    .forEach((member) => {
      const birthYear = parseYear(member.birth);
      const deathYear = parseYear(member.death);
      if (birthYear && deathYear && deathYear >= birthYear) {
        facts.push(shortName(member.name) + ' tiene una vida completa trazada en el archivo: nace en ' + birthYear + ' y fallece en ' + deathYear + '. Ese dato convierte una ficha en memoria familiar.');
      }
    });

  const statusGroups = new Map<string, SiennaFamilyMember[]>();
  members.forEach((member) => {
    const status = member.effective_inheritance_status || member.inheritance_status;
    if (!status) return;
    statusGroups.set(status, [...(statusGroups.get(status) || []), member]);
  });

  const confirmed = statusGroups.get('confirmado') || [];
  if (confirmed.length >= 2) {
    facts.push('Entre los herederos confirmados aparecen ' + joinNames(confirmed) + '. No es solo una lista: son personas ya reconocidas por el expediente.');
  }

  const review = statusGroups.get('requiere_revision') || [];
  if (review.length > 0) {
    facts.push('Hay ' + review.length + ' persona' + (review.length === 1 ? '' : 's') + ' que todavía pide' + (review.length === 1 ? '' : 'n') + ' revisión en la lectura sucesoral. El árbol también sirve para no perder esos matices.');
  }

  const finalFacts = uniqueFacts(facts);
  return finalFacts.length ? finalFacts : ['Todavía no veo una curiosidad fuerte en los datos actuales, pero el árbol ya tiene suficiente estructura para empezar a contar mejor la historia familiar.'];
};

const buildPersonalCuriosities = ({
  firstName,
  member,
  parentLinks,
}: {
  firstName: string;
  member: SiennaFamilyMember | null;
  parentLinks: MemberParentLink[];
}) => {
  if (!member) return [];
  const facts: string[] = [];
  const directParents = parentLinks.filter((link) => link.child_member_id === member.id);
  const directChildren = parentLinks.filter((link) => link.parent_member_id === member.id);
  const status = member.effective_inheritance_status || member.inheritance_status;
  const reason = member.effective_inheritance_reason || member.inheritance_reason;

  if (directParents.length >= 2) {
    facts.push(`${firstName}, tu ficha familiar tiene dos enlaces parentales registrados; eso ayuda a leer tu línea con más precisión.`);
  }
  if (status && reason) {
    facts.push(`${firstName}, tu conexión familiar está clasificada como ${String(status).replace(/_/g, ' ')}: ${reason}`);
  }
  if (directChildren.length > 0) {
    facts.push(`${firstName}, desde tu ficha también se proyectan ${directChildren.length} enlace(s) descendiente(s) dentro del árbol.`);
  }
  if (!facts.length) {
    facts.push(`${firstName}, ya puedo leer esta sección tomando como referencia tu ficha familiar: ${member.name}.`);
  }

  return facts.slice(0, 2);
};

const selectCuriosityCards = (facts: string[], seed: string, count = 3) => {
  if (facts.length <= count) return facts;

  const storageKey = 'sienna.dashboard.curiosityHistory.v2';
  let recent: string[] = [];
  try {
    recent = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
  } catch {
    recent = [];
  }

  const recentSet = new Set(recent);
  const pool = facts.filter((fact) => !recentSet.has(fact));
  const fallbackPool = facts.filter((fact) => !recent.slice(-count).includes(fact));
  const usable = pool.length >= count ? pool : fallbackPool.length >= count ? fallbackPool : facts;
  const shuffleSeed = seed + '-' + Date.now() + '-' + Math.random();
  const selected = [...usable]
    .sort((left, right) => hashString(shuffleSeed + left) - hashString(shuffleSeed + right))
    .slice(0, count);

  try {
    const historyLimit = Math.min(Math.max(18, count * 6), Math.max(count, facts.length - count));
    window.localStorage.setItem(storageKey, JSON.stringify([...recent, ...selected].slice(-historyLimit)));
  } catch {
    // La rotación sigue funcionando aunque el navegador bloquee localStorage.
  }

  return selected;
};

const selectCuriosityRevealEffects = (seed: string, count: number) => {
  const storageKey = 'sienna.dashboard.revealEffectCursor.v1';
  let cursor = Math.abs(hashString(seed)) % curiosityRevealEffects.length;

  try {
    const stored = Number(window.localStorage.getItem(storageKey));
    if (Number.isFinite(stored)) cursor = stored % curiosityRevealEffects.length;
  } catch {
    // Si localStorage no está disponible, el hash mantiene una rotación estable.
  }

  const selected = Array.from(
    { length: count },
    (_, index) => curiosityRevealEffects[(cursor + index) % curiosityRevealEffects.length]
  );

  try {
    window.localStorage.setItem(storageKey, String((cursor + count) % curiosityRevealEffects.length));
  } catch {
    // Sin almacenamiento, no hay bloqueo funcional.
  }

  return selected;
};

const buildDashboardPriority = ({
  hasFindingsAccess,
  hasDocumentAccess,
  hasMemberAccess,
  isAdmin,
  pendingFindings,
  pendingValidation,
  dualLineageTotal,
  totalShare,
  heirsTotal,
  estateAmount,
}: {
  hasFindingsAccess: boolean;
  hasDocumentAccess: boolean;
  hasMemberAccess: boolean;
  isAdmin: boolean;
  pendingFindings: number;
  pendingValidation: number;
  dualLineageTotal: number;
  totalShare: number;
  heirsTotal: number;
  estateAmount: number;
}): DashboardPriority => {
  const roundedShare = Math.round(totalShare);

  if (pendingFindings > 0 && hasFindingsAccess) {
    return {
      label: 'Hallazgos pendientes',
      headline: `${formatCompactNumber(pendingFindings)} hallazgo${pendingFindings === 1 ? '' : 's'} necesita${pendingFindings === 1 ? '' : 'n'} revisión`,
      message: 'El siguiente paso útil es limpiar las alertas abiertas antes de presentar o discutir el reparto.',
      focus: 'Prioridad real: resolver hallazgos activos del expediente.',
      path: '/sienna/hallazgos',
      cta: 'Revisar hallazgos',
    };
  }

  if (pendingValidation > 0 && hasFindingsAccess) {
    return {
      label: 'Validación genealógica',
      headline: `${formatCompactNumber(pendingValidation)} validación${pendingValidation === 1 ? '' : 'es'} pendiente${pendingValidation === 1 ? '' : 's'}`,
      message: 'Conviene confirmar vínculos y rutas familiares antes de usar el reparto como explicación final.',
      focus: 'Prioridad real: validar relaciones que pueden afectar la lectura del árbol.',
      path: '/sienna/linajes',
      cta: 'Validar linajes',
    };
  }

  if (roundedShare !== 100 && hasDocumentAccess) {
    return {
      label: 'Reparto por revisar',
      headline: `Distribución calculada en ${formatCompactNumber(totalShare)}%`,
      message: 'La suma del reparto no está cerrando exactamente en 100%; hay que revisar la explicación antes de presentarla.',
      focus: 'Prioridad real: revisar porcentajes, rutas y base de cálculo.',
      path: '/sienna/explicacion',
      cta: 'Ver reparto',
    };
  }

  if (estateAmount <= 0 && isAdmin) {
    return {
      label: 'Monto del caso',
      headline: 'El expediente todavía no tiene monto neto activo',
      message: 'Sin monto del caso, el archivo puede explicar porcentajes, pero no montos reales de reparto.',
      focus: 'Prioridad real: configurar el monto antes de validar montos finales.',
      path: '/admin/settings',
      cta: 'Configurar monto',
    };
  }

  if (heirsTotal <= 0 && hasMemberAccess) {
    return {
      label: 'Herederos',
      headline: 'No hay herederos activos confirmados para mostrar',
      message: 'Primero hay que revisar miembros, filiación y estado sucesoral para que el tablero tenga una base útil.',
      focus: 'Prioridad real: confirmar herederos reconocidos.',
      path: '/sienna/miembros',
      cta: 'Revisar miembros',
    };
  }

  if (dualLineageTotal > 0 && hasFindingsAccess) {
    return {
      label: 'Dobles linajes',
      headline: `${formatCompactNumber(dualLineageTotal)} caso${dualLineageTotal === 1 ? '' : 's'} con doble linaje detectado${dualLineageTotal === 1 ? '' : 's'}`,
      message: 'El archivo ya tiene estructura, pero los dobles linajes merecen una lectura aparte para evitar confusiones.',
      focus: 'Prioridad real: explicar convergencias familiares con claridad.',
      path: '/sienna/linajes',
      cta: 'Analizar linajes',
    };
  }

  if (hasDocumentAccess) {
    return {
      label: 'Expediente estable',
      headline: 'El archivo está listo para una lectura clara del reparto',
      message: 'No hay alertas críticas visibles en el resumen; el siguiente valor está en revisar evidencia y explicación.',
      focus: 'Prioridad real: revisar documentos y dejar trazabilidad lista.',
      path: '/sienna/documentos',
      cta: 'Ver documentos',
    };
  }

  return {
    label: 'Acceso disponible',
    headline: 'Tu vista está limitada a las áreas autorizadas',
    message: 'El archivo adapta la navegación según permisos; cuando se habiliten más áreas, esta guía cambiará automáticamente.',
    focus: 'Prioridad real: entrar por la primera sección disponible.',
    path: '/',
    cta: 'Ver inicio',
  };
};

const buildSiennaPersona = ({
  firstName,
  isAdmin,
  hasPrimaryLinks,
  hasDocumentAccess,
  hasMemberAccess,
  hasFindingsAccess,
  hasLegacyAccess,
  priority,
  curiosity,
}: {
  firstName: string;
  isAdmin: boolean;
  hasPrimaryLinks: boolean;
  hasDocumentAccess: boolean;
  hasMemberAccess: boolean;
  hasFindingsAccess: boolean;
  hasLegacyAccess: boolean;
  priority: DashboardPriority;
  curiosity: string;
}): SiennaPersona => {
  const seed = `${firstName}-${priority.label}-${new Date().toISOString().slice(0, 10)}`;

  if (isAdmin) {
    return {
      label: priority.label,
      headline: chooseVariant(seed, [
        `Hola, ${firstName}. ${priority.headline}.`,
        `${firstName}, hoy el caso Alessandro pide atención aquí: ${priority.headline.toLowerCase()}.`,
        `Vista directiva: ${priority.headline}.`,
      ]),
      curiosity,
      message: `${priority.message} Tienes acceso completo, pero esta portada coloca primero lo que afecta la lectura del legado familiar de Alessandro.`,
      focus: priority.focus,
      priorityPath: priority.path,
      priorityCta: priority.cta,
    };
  }

  if (hasDocumentAccess && !hasMemberAccess) {
    return {
      label: priority.label,
      headline: chooseVariant(seed, [
        `Hola, ${firstName}. ${priority.headline}.`,
        `${firstName}, tu lectura del legado empieza por esto: ${priority.headline.toLowerCase()}.`,
      ]),
      curiosity,
      message: `${priority.message} Mantengo fuera lo administrativo para que la lectura sea limpia.`,
      focus: priority.focus,
      priorityPath: priority.path,
      priorityCta: priority.cta,
    };
  }

  if (hasMemberAccess || hasFindingsAccess) {
    return {
      label: priority.label,
      headline: `Hola, ${firstName}. ${priority.headline}.`,
      curiosity,
      message: priority.message,
      focus: priority.focus,
      priorityPath: priority.path,
      priorityCta: priority.cta,
    };
  }

  if (hasPrimaryLinks) {
    return {
      label: priority.label,
      headline: `Hola, ${firstName}. ${priority.headline}.`,
      curiosity,
      message: priority.message,
      focus: priority.focus,
      priorityPath: priority.path,
      priorityCta: priority.cta,
    };
  }

  return {
    label: hasLegacyAccess ? 'Consulta legacy' : 'Acceso pendiente',
    headline: `Hola, ${firstName}. Tu acceso todavía está limitado.`,
    curiosity,
    message:
      'Te muestro solo las áreas disponibles para tu cuenta. Cuando se asignen más permisos, el archivo reorganizará esta pantalla automáticamente.',
    focus: 'Prioridad real: pedir al administrador las pantallas que necesitas para tu rol.',
    priorityPath: priority.path,
    priorityCta: priority.cta,
  };
};

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { isAdmin, hasAccess } = useAuth();
  const siennaPersonalization = useSiennaPersonalization();
  const { data: analysisSummary } = useSiennaAnalysisSummary();
  const { data: realtimeCalculationData } = useSiennaCalculation();
  const { data: confirmedHeirsData } = useConfirmedHeirs(false);
  const { data: familyData } = useSiennaFamily();
  const { data: aiCuriositiesData, isFetching: aiCuriositiesFetching, isLoading: aiCuriositiesLoading, refetch: refetchAiCuriosities } = useSiennaAiCuriosities();
  const summary = analysisSummary?.summary;
  const realtimeCalculation = realtimeCalculationData?.calculation;
  const calculatedFinalHeirsTotal = Number(summary?.active_heir_count ?? 0);
  const recognizedRegistryTotal = confirmedHeirsData?.heirs?.length ?? 0;
  const [shuffleNonce, setShuffleNonce] = useState(0);

  const firstName = siennaPersonalization.firstName;
  const dashboardVisitSeed = useMemo(
    () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    []
  );
  const dashboardShuffleSeed = `${dashboardVisitSeed}-${shuffleNonce}`;

  useEffect(() => {
    const onPullRefresh = (event: Event) => {
      if (!window.location.pathname.startsWith('/sienna') && window.location.pathname !== '/dashboard') return;
      event.preventDefault();
      window.localStorage.removeItem('sienna.dashboard.curiosityHistory.v2');
      queryClient.invalidateQueries({ queryKey: siennaQueryKeys.aiCuriosities });
      refetchAiCuriosities();
      setShuffleNonce((current) => current + 1);
    };

    window.addEventListener('sienna:pull-refresh', onPullRefresh);
    return () => window.removeEventListener('sienna:pull-refresh', onPullRefresh);
  }, [queryClient, refetchAiCuriosities]);

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

  const legacyLinks = useMemo(
    () => LEGACY_LINKS.filter((item) => hasAccess(item.path)),
    [hasAccess]
  );

  const stats = useMemo<StatCard[]>(
    () => [
      {
        label: 'Personas registradas',
        value: formatCompactNumber(summary?.members_total),
        detail: 'Base genealógica activa',
        icon: Users,
        tone: 'purple',
      },
      {
        label: 'Herederos finales',
        value: formatCompactNumber(calculatedFinalHeirsTotal),
        detail: `${formatCompactNumber(recognizedRegistryTotal)} registros documentales`,
        icon: Landmark,
        tone: 'green',
      },
      {
        label: 'Neto a repartir',
        value: formatMoney(summary?.estate?.distributableAmount),
        detail: 'Monto usado por el archivo',
        icon: BadgeDollarSign,
        tone: 'gold',
      },
      {
        label: 'Hallazgos',
        value: formatCompactNumber(summary?.pending_findings_total),
        detail: 'Pendientes por revisar',
        icon: CheckCircle2,
        tone: 'green',
      },
    ],
    [calculatedFinalHeirsTotal, recognizedRegistryTotal, summary]
  );

  const priority = useMemo(
    () =>
      buildDashboardPriority({
        hasFindingsAccess: hasAccess('/sienna/hallazgos'),
        hasDocumentAccess: hasAccess('/sienna/documentos'),
        hasMemberAccess: hasAccess('/sienna/miembros'),
        isAdmin,
        pendingFindings: Number(summary?.pending_findings_total || 0),
        pendingValidation: Number(summary?.pending_validation_total || 0),
        dualLineageTotal: Number(summary?.dual_lineage_total || 0),
        totalShare: Number(summary?.total_share || 0),
        heirsTotal: calculatedFinalHeirsTotal,
        estateAmount: Number(summary?.estate?.distributableAmount || 0),
      }),
    [calculatedFinalHeirsTotal, hasAccess, isAdmin, summary]
  );

  const curiosityFacts = useMemo(
    () =>
      [
        ...buildPersonalCuriosities({
          firstName,
          member: siennaPersonalization.member,
          parentLinks: familyData?.parent_links ?? [],
        }),
        ...buildLegacyCuriosities({
          members: familyData?.members ?? [],
          unions: familyData?.unions ?? [],
          parentLinks: familyData?.parent_links ?? [],
          seed: dashboardShuffleSeed,
        }),
      ],
    [dashboardShuffleSeed, familyData?.members, familyData?.parent_links, familyData?.unions, firstName, siennaPersonalization.member]
  );

  const [curiosityCards, setCuriosityCards] = useState<string[]>(() => curiosityFacts.slice(0, 3));

  useEffect(() => {
    setCuriosityCards(selectCuriosityCards(curiosityFacts, dashboardShuffleSeed, 3));
  }, [curiosityFacts, dashboardShuffleSeed]);

  const curiosity = useMemo(() => {
    if (curiosityCards.length) return curiosityCards[0];
    return chooseVariant(`${firstName}-${priority.label}-curiosity-${dashboardShuffleSeed}`, curiosityFacts);
  }, [curiosityCards, curiosityFacts, dashboardShuffleSeed, firstName, priority.label]);

  const aiCuriosityCards = aiCuriositiesData?.curiosities?.filter(Boolean) ?? [];
  const curiosityPending = !aiCuriositiesData && (aiCuriositiesLoading || aiCuriositiesFetching);
  const loadingCuriosityCards = useMemo(
    () => selectCuriosityCards(curiosityLoadingMessages, dashboardShuffleSeed + '-sienna-search', 3),
    [dashboardShuffleSeed]
  );
  const displayCuriosityCards = useMemo(() => {
    if (curiosityPending) return loadingCuriosityCards;
    const mixedPool = uniqueFacts([...aiCuriosityCards, ...curiosityCards, ...curiosityFacts]);
    return selectCuriosityCards(mixedPool.length ? mixedPool : [curiosity], dashboardShuffleSeed + '-display', 3);
  }, [aiCuriosityCards, curiosity, curiosityCards, curiosityFacts, curiosityPending, dashboardShuffleSeed, loadingCuriosityCards]);
  const visibleCuriosityCards = displayCuriosityCards.length > 1 ? displayCuriosityCards.slice(1) : [curiosity].filter(Boolean);
  const curiosityOrigin = aiCuriositiesData?.mode === 'openai' ? 'nano' : 'backend';
  const curiositySource: CuriositySource = curiosityPending ? 'pending' : curiosityOrigin === 'nano' && displayCuriosityCards.length > 0 ? 'ai' : 'default';
  const curiosityRevealEffectsForCards = useMemo(
    () => {
      const effects = selectCuriosityRevealEffects(
        dashboardShuffleSeed + '-' + (displayCuriosityCards.join('|') || curiosity || 'fallback'),
        1 + Math.max(1, visibleCuriosityCards.length)
      );
      return shuffleNonce > 0 ? ['confetti' as CuriosityRevealEffect, ...effects.slice(1)] : effects;
    },
    [curiosity, dashboardShuffleSeed, displayCuriosityCards, shuffleNonce, visibleCuriosityCards.length]
  );
  const curiosityCardClassName = curiosityPending
    ? 'border-[#7B61FF]/35 bg-[#F8F6FF] dark:border-[#7B61FF]/35 dark:bg-[#171329]'
    : curiosityOrigin === 'nano'
    ? 'border-[#2E8B57]/55 bg-[#F3FBF6] dark:border-[#3FA37C]/45 dark:bg-[#10251D]'
    : 'border-[#355C9A]/45 bg-[#F3F7FD] dark:border-[#5F8BD4]/40 dark:bg-[#101B2E]';
  const curiosityEyebrowClassName = curiosityPending
    ? 'text-[#5D47C8] dark:text-[#B8AAFF]'
    : curiosityOrigin === 'nano'
    ? 'text-[#1F7A4F] dark:text-[#7ED7A6]'
    : 'text-[#355C9A] dark:text-[#9BB8E8]';
  const primaryCuriosityEffect = curiosityPending ? 'fade' : curiosityRevealEffectsForCards[0] || 'fade';
  const curiosityContainerEffect = (effect: CuriosityRevealEffect) => (effect === 'type' ? 'fade' : effect);
  const curiosityTextEffect = (effect: CuriosityRevealEffect) => (effect === 'type' ? 'type' : 'fade');

  const persona = useMemo(
    () =>
      buildSiennaPersona({
        firstName,
        isAdmin,
        hasPrimaryLinks: primaryLinks.length > 0,
        hasDocumentAccess: hasAccess('/sienna/documentos'),
        hasMemberAccess: hasAccess('/sienna/miembros'),
        hasFindingsAccess: hasAccess('/sienna/hallazgos'),
        hasLegacyAccess: legacyLinks.length > 0,
        priority,
        curiosity,
      }),
    [firstName, hasAccess, isAdmin, legacyLinks.length, primaryLinks.length, priority, curiosity]
  );

  const branchDistribution = useMemo<BranchDistribution[]>(() => {
    const distributableAmount = Number(realtimeCalculation?.estate?.distributableAmount || summary?.estate?.distributableAmount || 0);
    const bySource = new Map<string, { source: string; share: number; heirs: Set<string> }>();

    (realtimeCalculation?.active_heirs ?? []).forEach((row) => {
      const breakdown = row.source_breakdown?.length
        ? row.source_breakdown
        : [{ source: row.sources.join(' + ') || 'Sin rama', share: row.share_percent }];

      breakdown.forEach((segment) => {
        const key = segment.source || 'Sin rama';
        const current = bySource.get(key) || { source: key, share: 0, heirs: new Set<string>() };
        current.share += Number(segment.share || 0);
        current.heirs.add(row.member_id || row.heir_name);
        bySource.set(key, current);
      });
    });

    return Array.from(bySource.values())
      .map((row) => ({
        source: row.source,
        share: row.share,
        amount: distributableAmount * (row.share / 100),
        heirs: row.heirs.size,
      }))
      .sort((left, right) => right.share - left.share || left.source.localeCompare(right.source, 'es'));
  }, [realtimeCalculation?.active_heirs, realtimeCalculation?.estate?.distributableAmount, summary?.estate?.distributableAmount]);

  const chartRows = useMemo(
    () => [
      {
        label: 'Hallazgos',
        value: Number(summary?.pending_findings_total || 0),
        color: '#2E8B57',
      },
      {
        label: 'Validaciones',
        value: Number(summary?.pending_validation_total || 0),
        color: '#D4AF37',
      },
      {
        label: 'Dobles linajes',
        value: Number(summary?.dual_lineage_total || 0),
        color: '#3767A6',
      },
    ],
    [summary]
  );

  const dashboardGraphs = useMemo(
    () =>
      buildDashboardGraphs({
        members: familyData?.members ?? [],
        parentLinks: familyData?.parent_links ?? [],
      }),
    [familyData?.members, familyData?.parent_links]
  );

  return (
    <div className="min-h-screen bg-[#F6F2E8] dark:bg-background">
      <section className="legacy-gradient border-b border-legal-blue/10 dark:border-[#243047]">
        <div className="app-shell py-8 sm:py-10">
          <div className="legacy-surface relative overflow-hidden rounded-lg p-4 sm:p-7">
            <div className="relative sm:pr-12">
              <div className="absolute right-0 top-0 hidden sm:block">
                <PageHelp helpKey="dashboard" />
              </div>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)] 2xl:grid-cols-[minmax(0,1.7fr)_minmax(380px,0.9fr)]">
                <div>
                  <Link
                    to="/sienna/legado-game"
                    className="mb-4 inline-flex items-center gap-2 rounded-full border border-legal-gold/35 bg-[#FFF6D8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0A1020] transition hover:border-legal-gold hover:bg-[#FFECA8] focus:outline-none focus:ring-2 focus:ring-legal-gold/50"
                    aria-label="Ver narrativa del legado Sangiovanni"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-legal-gold" />
                    Ver narrativa del legado Sangiovanni
                  </Link>
                  <h1 className="max-w-5xl font-serif text-3xl font-bold text-legal-blue dark:text-[#F5F7FA] sm:text-5xl">
                    {siennaPersonalization.isLinkedMember
                      ? `${firstName}, el legado de Alessandro visto desde tu familia.`
                      : 'El legado de Alessandro, claro para tu familia.'}
                  </h1>
                  <p className="mt-3 max-w-4xl text-sm leading-relaxed text-gray-700 dark:text-muted-foreground sm:text-base">
                    {siennaPersonalization.isLinkedMember
                      ? `Estoy leyendo genealogía, evidencia, reparto y hallazgos tomando como referencia tu ficha familiar: ${siennaPersonalization.memberLabel}.`
                      : 'Reúno genealogía, evidencia, reparto, hallazgos y rutas de herencia para que cada miembro pueda comprender su conexión familiar con calma y precisión.'}
                  </p>
                </div>
                <div className="rounded-md border border-legal-blue/10 bg-white/75 p-4 shadow-sm dark:border-[#D4AF37]/20 dark:bg-[#101827]/85">
                  <p className="text-xs font-semibold uppercase tracking-wide text-legal-gray dark:text-[#8C97A8]">
                    Punto de control
                  </p>
                  <p className="mt-2 font-serif text-2xl font-bold text-legal-blue dark:text-[#F5F7FA]">
                    {formatCompactNumber(summary?.active_heir_count || 0)} herederos finales
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-muted-foreground">
                    {formatMoney(summary?.estate?.distributableAmount)} netos calculados sobre el expediente vivo.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] 2xl:grid-cols-[minmax(0,1.55fr)_minmax(380px,0.9fr)]">
                <div
                  key={`primary-curiosity-${dashboardShuffleSeed}-${displayCuriosityCards[0] || persona.curiosity}`}
                  className={cn(
                    'relative rounded-md border p-4 pr-10 shadow-sm sm:p-5 sm:pr-12',
                    curiosityCardClassName,
                    curiosityRevealClasses[curiosityContainerEffect(primaryCuriosityEffect)]
                  )}
                >
                  <CuriositySourceMark source={curiositySource} />
                  <p className={cn('text-xs font-semibold uppercase tracking-wide', curiosityEyebrowClassName)}>
                    Sabías que...
                  </p>
                  <p className="mt-2 text-xl font-semibold leading-relaxed text-legal-blue dark:text-[#F5F7FA] sm:text-2xl">
                    <CuriosityRevealText
                      text={displayCuriosityCards[0] || persona.curiosity}
                      effect={curiosityTextEffect(primaryCuriosityEffect)}
                    />
                  </p>
                </div>
                <div className="grid gap-3">
                  {visibleCuriosityCards.map((fact, index) => {
                    const revealEffect = curiosityPending ? 'fade' : curiosityRevealEffectsForCards[index + 1] || 'fade';
                    return (
                      <div
                        key={`legacy-curiosity-${dashboardShuffleSeed}-${index}-${fact}`}
                        className={cn(
                          'relative rounded-md border p-4 pr-10 text-sm font-medium leading-relaxed text-[#1B2430] shadow-sm dark:text-[#F5F7FA] sm:pr-12',
                          curiosityCardClassName,
                          curiosityRevealClasses[curiosityContainerEffect(revealEffect)]
                        )}
                      >
                        <CuriositySourceMark source={curiositySource} />
                        <CuriosityRevealText text={fact} effect={curiosityTextEffect(revealEffect)} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="relative mt-6 grid gap-3 lg:grid-cols-[1.1fr_1fr_0.9fr]">
              <ChartPanel title="Estado del reparto">
                <DonutChart
                  value={Number(summary?.total_share || 0)}
                  label="Distribución calculada"
                  sublabel={formatMoney(summary?.estate?.distributableAmount) + ' netos vinculados al legado.'}
                />
              </ChartPanel>
              <ChartPanel title="Distribución por rama">
                <BranchDistributionChart rows={branchDistribution} />
              </ChartPanel>
              <ChartPanel title="Salud del expediente">
                <MiniBars rows={chartRows} />
              </ChartPanel>
            </div>
          </div>
        </div>
      </section>

      <div className="app-shell py-10 sm:py-12">
        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <SiennaStatCard key={item.label} item={item} />
          ))}
        </div>

        <section className="legacy-surface rounded-lg p-5 sm:p-6">
          <div className="mb-5 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-legal-gray dark:text-[#8C97A8]">
              Genialidades del árbol
            </p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-legal-blue dark:text-[#F5F7FA]">
              Patrones familiares que se entienden mejor cuando se ven.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-muted-foreground">
              Gráficos ligeros sobre abuelos, hermanos, primos y generaciones. La portada muestra hallazgos visuales; las acciones siguen viviendo en el menú.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardGraphs.map((graph) => (
              <InsightGraphCard key={graph.label} graph={graph} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
