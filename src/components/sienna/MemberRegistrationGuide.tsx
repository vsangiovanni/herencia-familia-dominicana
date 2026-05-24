import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GitBranch,
  GitMerge,
  Heart,
  HelpCircle,
  ListOrdered,
  UserPlus,
  Users,
} from 'lucide-react';

type Props = {
  variant?: 'icon' | 'default';
  className?: string;
};

const ProseBox = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-legal-gold/30 bg-gradient-to-br from-legal-beige/40 to-white p-3 text-sm leading-relaxed text-gray-800 sm:p-4">
    {children}
  </div>
);

const PersonNode = ({
  name,
  subtitle,
  tone = 'neutral',
  size = 'md',
  className = '',
}: {
  name: string;
  subtitle?: string;
  tone?: 'blue' | 'gold' | 'neutral' | 'child';
  size?: 'sm' | 'md';
  className?: string;
}) => {
  const tones = {
    blue: 'border-legal-blue/40 bg-legal-blue/10 text-legal-blue shadow-sm shadow-legal-blue/10',
    gold: 'border-legal-gold/50 bg-legal-gold/15 text-legal-blue shadow-sm shadow-legal-gold/20',
    neutral: 'border-gray-300 bg-white text-legal-blue shadow-sm',
    child:
      'border-legal-gold/60 bg-gradient-to-br from-legal-gold/20 to-white text-legal-blue shadow-md shadow-legal-gold/15',
  };
  return (
    <div
      className={`w-full max-w-[10.5rem] rounded-xl border-2 text-center sm:w-auto sm:max-w-none ${tones[tone]} ${
        size === 'sm' ? 'px-2.5 py-2 sm:min-w-[6.5rem] sm:px-3' : 'px-3 py-2.5 sm:min-w-[7.5rem] sm:px-4 sm:py-3'
      } ${className}`}
    >
      <p className={`break-words font-semibold leading-tight ${size === 'sm' ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'}`}>
        {name}
      </p>
      {subtitle && (
        <p className="mt-0.5 break-words text-[9px] font-medium uppercase tracking-wide text-legal-gray sm:text-[10px]">
          {subtitle}
        </p>
      )}
    </div>
  );
};

const VerticalConnector = ({
  height = 28,
  label,
  compact = false,
}: {
  height?: number;
  label?: string;
  compact?: boolean;
}) => (
  <div className="flex w-full max-w-[12rem] flex-col items-center px-2">
    <div className="w-0.5 rounded-full bg-legal-blue/35" style={{ height: compact ? height - 6 : height }} />
    {label && (
      <span className="mt-1 max-w-full break-words text-center text-[9px] font-medium leading-snug text-legal-gray sm:text-[10px]">
        {label}
      </span>
    )}
    <ArrowDown className="h-3.5 w-3.5 shrink-0 text-legal-blue/50 sm:h-4 sm:w-4" />
  </div>
);

const MarriageLink = ({ label = 'Matrimonio', vertical = false }: { label?: string; vertical?: boolean }) => {
  if (vertical) {
    return (
      <div className="flex w-full max-w-[10rem] flex-col items-center gap-1 py-1">
        <div className="h-3 w-0.5 rounded-full bg-legal-blue/40" />
        <div className="flex items-center gap-1 rounded-full border border-legal-blue/30 bg-legal-blue/10 px-2 py-0.5">
          <GitMerge className="h-3 w-3 shrink-0 text-legal-blue" />
          <span className="text-[9px] font-semibold uppercase tracking-wide text-legal-blue sm:text-[10px]">
            {label}
          </span>
        </div>
        <div className="h-3 w-0.5 rounded-full bg-legal-blue/40" />
        <span className="text-[9px] font-medium text-legal-blue/70 sm:text-[10px]">Bloque azul</span>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1 px-0.5 sm:px-2">
      <div className="flex w-full min-w-0 items-center gap-0.5 sm:gap-1">
        <div className="h-0.5 min-w-[0.35rem] flex-1 rounded-full bg-legal-blue/40" />
        <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-legal-blue/30 bg-legal-blue/10 px-1.5 py-0.5 sm:gap-1 sm:px-2">
          <GitMerge className="h-2.5 w-2.5 shrink-0 text-legal-blue sm:h-3 sm:w-3" />
          <span className="text-[8px] font-semibold uppercase tracking-wide text-legal-blue sm:text-[10px]">
            {label}
          </span>
        </div>
        <div className="h-0.5 min-w-[0.35rem] flex-1 rounded-full bg-legal-blue/40" />
      </div>
      <span className="text-[9px] font-medium text-legal-blue/70 sm:text-[10px]">Bloque azul</span>
    </div>
  );
};

const CoupleRow = ({
  left,
  right,
  linkLabel = 'Matrimonio',
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  linkLabel?: string;
}) => (
  <>
    <div className="hidden w-full items-center justify-center gap-1 pt-2 sm:flex sm:gap-2">
      {left}
      <MarriageLink label={linkLabel} />
      {right}
    </div>
    <div className="flex w-full flex-col items-center gap-1 pt-2 sm:hidden">
      {left}
      <MarriageLink label={linkLabel} vertical />
      {right}
    </div>
  </>
);

const ExampleRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5 border-b border-legal-blue/10 py-2 last:border-0 sm:flex-row sm:gap-3">
    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-legal-gray sm:min-w-[8rem] sm:text-xs">
      {label}
    </span>
    <span className="text-xs leading-relaxed text-legal-blue sm:text-sm">{value}</span>
  </div>
);

const WorkflowPipeline = () => {
  const steps = [
    {
      num: 1,
      title: 'Adultos',
      sub: 'Raíces y padres',
      detail: 'Crea primero a quienes serán padres, abuelos o raíces.',
      color: 'bg-gray-500',
    },
    {
      num: 2,
      title: 'Matrimonios',
      sub: 'Bloque azul',
      detail: 'Edita cada adulto casado y enlaza su cónyuge. Guarda.',
      color: 'bg-legal-blue',
    },
    {
      num: 3,
      title: 'Hijos',
      sub: 'Bloque dorado',
      detail: 'Superior + Hijo/Hija + unión de filiación + segundo progenitor.',
      color: 'bg-legal-gold',
    },
    {
      num: 4,
      title: 'Validar',
      sub: 'Árbol y tabla',
      detail: 'Revisa posición, filiación y línea «Matrimonio…» en el árbol.',
      color: 'bg-emerald-600',
    },
  ];

  return (
    <div className="rounded-xl border border-legal-gold/25 bg-gradient-to-br from-legal-beige/50 via-white to-legal-blue/[0.03] p-3 sm:p-4">
      <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-widest text-legal-blue sm:mb-4 sm:text-xs">
        Flujo de captura
      </p>

      <div className="hidden items-start justify-between gap-1 sm:flex sm:gap-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.num}>
            <div className="flex min-w-0 flex-1 flex-col items-center text-center">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${step.color} text-sm font-bold text-white shadow-md sm:h-10 sm:w-10`}
              >
                {step.num}
              </div>
              <p className="mt-2 text-xs font-bold text-legal-blue">{step.title}</p>
              <p className="text-[10px] leading-tight text-legal-gray">{step.sub}</p>
            </div>
            {index < steps.length - 1 && (
              <div className="mt-4 flex shrink-0 items-center">
                <ArrowRight className="h-4 w-4 text-legal-gold" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <ol className="space-y-0 sm:hidden">
        {steps.map((step, index) => (
          <li key={step.num}>
            <div className="flex gap-3 rounded-lg border border-legal-blue/10 bg-white/80 p-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${step.color} text-xs font-bold text-white`}
              >
                {step.num}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-legal-blue">
                  {step.title}{' '}
                  <span className="font-normal text-legal-gray">· {step.sub}</span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-700">{step.detail}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="h-4 w-4 text-legal-gold/80" />
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};

const LayerTextBlock = ({
  title,
  icon,
  tone,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone: 'blue' | 'gold' | 'gray';
  children: React.ReactNode;
}) => {
  const tones = {
    blue: 'border-legal-blue/25 bg-legal-blue/[0.04]',
    gold: 'border-legal-gold/35 bg-legal-gold/[0.06]',
    gray: 'border-gray-200 bg-gray-50/80',
  };
  return (
    <div className={`rounded-lg border p-3 text-sm leading-relaxed text-gray-700 sm:p-4 ${tones[tone]}`}>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-legal-blue">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
};

const ThreeLayersDiagram = () => (
  <div className="space-y-0">
    <LayerTextBlock title="1. Árbol visual" icon={<GitBranch className="h-4 w-4" />} tone="gray">
      <p>
        Si vas a registrar a alguien, <strong>Conectar debajo de</strong> y <strong>Parentesco</strong> definen dónde
        cuelga en el dibujo del árbol. Ejemplo: si registras a Víctor y lo cuelgas bajo María Rosa, en el árbol se verá
        como hijo de María Rosa — aunque su padre biológico también sea Pedro Pablo.
      </p>
    </LayerTextBlock>

    <div className="relative rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/90 p-3 sm:p-4">
      <Badge
        variant="outline"
        className="absolute -top-2.5 left-2 max-w-[calc(100%-1rem)] truncate border-gray-300 bg-white text-[9px] font-bold uppercase text-gray-600 sm:left-3 sm:text-[10px]"
      >
        Capa 1 · Árbol
      </Badge>
      <div className="flex flex-col items-center pt-3">
        <PersonNode name="María Rosa" subtitle="Superior" tone="neutral" />
        <VerticalConnector height={22} label="Conectar debajo de" compact />
        <PersonNode name="Víctor Manuel" subtitle="Hijo en el dibujo" tone="neutral" size="sm" />
      </div>
    </div>

    <div className="flex justify-center py-1">
      <VerticalConnector height={14} compact />
    </div>

    <LayerTextBlock title="2. Unión matrimonial (bloque azul)" icon={<GitMerge className="h-4 w-4" />} tone="blue">
      <p>
        Si vas a editar a un <strong>adulto casado</strong>, el bloque azul es para enlazar <strong>su cónyuge</strong>{' '}
        — el de la persona de la ficha, no el del nodo superior. Al guardar a María Rosa con Pedro Pablo como cónyuge,
        se crea la pareja formal «Matrimonio: María Rosa y Pedro Pablo».
      </p>
    </LayerTextBlock>

    <div className="relative rounded-xl border-2 border-legal-blue/35 bg-legal-blue/[0.06] p-3 sm:p-4">
      <Badge className="absolute -top-2.5 left-2 bg-legal-blue text-[9px] font-bold uppercase sm:left-3 sm:text-[10px]">
        Capa 2 · Bloque azul
      </Badge>
      <CoupleRow
        linkLabel="Matrimonio"
        left={<PersonNode name="María Rosa" subtitle="Editando ella" tone="blue" size="sm" />}
        right={<PersonNode name="Pedro Pablo" subtitle="Su cónyuge" tone="blue" size="sm" />}
      />
    </div>

    <div className="flex justify-center py-1">
      <VerticalConnector height={14} compact />
    </div>

    <LayerTextBlock title="3. Filiación del hijo (bloque dorado)" icon={<Heart className="h-4 w-4" />} tone="gold">
      <p>
        Si vas a registrar a un <strong>hijo o hija</strong>, el bloque dorado indica de qué matrimonio proviene — o si
        es de otra relación. Las uniones disponibles salen del <strong>progenitor superior</strong> que elegiste para
        ese hijo, no del cónyuge que pongas en el bloque azul del hijo.
      </p>
    </LayerTextBlock>

    <div className="relative rounded-xl border-2 border-legal-gold/45 bg-legal-gold/[0.1] p-3 sm:p-4">
      <Badge className="absolute -top-2.5 left-2 border-legal-gold/50 bg-legal-gold/30 text-[9px] font-bold uppercase text-legal-blue sm:left-3 sm:text-[10px]">
        Capa 3 · Bloque dorado
      </Badge>
      <div className="flex flex-col items-center pt-3">
        <div className="flex w-full max-w-xs flex-wrap items-end justify-center gap-2 sm:max-w-none sm:gap-4">
          <PersonNode name="María Rosa" subtitle="Progenitor" tone="blue" size="sm" />
          <PersonNode name="Pedro Pablo" subtitle="2.º progenitor" tone="blue" size="sm" />
        </div>
        <VerticalConnector height={18} label="Filiación del hijo" compact />
        <PersonNode name="Víctor Manuel" subtitle="Hijo del matrimonio" tone="child" size="sm" />
      </div>
    </div>
  </div>
);

const OrderedStepsText = () => {
  const items = [
    {
      step: '1',
      title: 'Ancestros y adultos sin padre en el árbol',
      detail:
        'Crea primero a quienes serán padres, abuelos o raíces. Nombre, fechas y «Conectar debajo de» solo si aplica.',
    },
    {
      step: '2',
      title: 'Enlazar matrimonios (bloque azul)',
      detail:
        'Edita a cada adulto casado → elige su cónyuge en el árbol → Guardar. Hazlo en ambos sentidos si hace falta (María Rosa ↔ Pedro Pablo).',
    },
    {
      step: '3',
      title: 'Registrar hijos (bloque dorado)',
      detail:
        'Superior = uno de los progenitores. Parentesco Hijo/Hija. Unión de filiación = matrimonio correcto. Segundo progenitor = el otro de la pareja.',
    },
    {
      step: '4',
      title: 'Revisar y validar',
      detail:
        'Panel «Posición en el árbol», tabla de miembros, y Árbol del caso (línea «Filiación: Matrimonio…» en hijos).',
    },
  ];

  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.step} className="flex gap-3 rounded-md border border-legal-blue/15 bg-white p-3">
          <Badge className="h-7 w-7 shrink-0 justify-center rounded-full bg-legal-blue p-0 text-white">
            {item.step}
          </Badge>
          <div className="min-w-0">
            <p className="font-medium text-legal-blue">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-700">{item.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
};

const VictorExampleDiagram = () => (
  <div className="overflow-hidden rounded-xl border border-legal-gold/30 bg-gradient-to-b from-legal-gold/[0.08] to-white">
    <div className="border-b border-legal-gold/20 bg-legal-blue/5 px-3 py-3 sm:px-4">
      <p className="text-sm font-semibold text-legal-blue">Ejemplo A — Hijo del matrimonio (Víctor Manuel)</p>
      <p className="mt-2 text-sm leading-relaxed text-gray-700">
        Caso: vas a registrar a <strong>Víctor Manuel Sangiovanni Sangiovanni</strong>, hijo de{' '}
        <strong>María Rosa</strong> y <strong>Pedro Pablo</strong>. Sigue este orden:
      </p>
    </div>

    <div className="space-y-0 p-3 sm:p-4">
      <div className="relative rounded-lg border border-legal-blue/20 bg-white p-3 pl-9 sm:pl-10">
        <span className="absolute left-2.5 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-legal-blue text-xs font-bold text-white sm:left-3">
          1
        </span>
        <p className="text-xs font-bold uppercase tracking-wide text-legal-blue">Editar María Rosa (adulta)</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          En su ficha, bloque azul: elige a Pedro Pablo como cónyuge de María Rosa → Guardar.
        </p>
        <div className="mt-3">
          <CoupleRow
            linkLabel="Cónyuge"
            left={<PersonNode name="María Rosa" tone="blue" size="sm" />}
            right={<PersonNode name="Pedro Pablo" tone="blue" size="sm" />}
          />
        </div>
        <p className="mt-2 flex items-start gap-1 text-xs text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Guardar crea la unión matrimonial en el sistema.
        </p>
      </div>

      <div className="flex justify-center py-0.5">
        <VerticalConnector height={10} compact />
      </div>

      <div className="relative rounded-lg border border-legal-blue/20 bg-white p-3 pl-9 sm:pl-10">
        <span className="absolute left-2.5 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-legal-blue text-xs font-bold text-white sm:left-3">
          2
        </span>
        <p className="text-xs font-bold uppercase tracking-wide text-legal-blue">Editar Pedro Pablo (adulto)</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Opcional pero recomendable: en su ficha, bloque azul → cónyuge María Rosa → Guardar (refuerza la pareja).
        </p>
        <div className="mt-3">
          <CoupleRow
            linkLabel="Cónyuge"
            left={<PersonNode name="Pedro Pablo" tone="blue" size="sm" />}
            right={<PersonNode name="María Rosa" tone="blue" size="sm" />}
          />
        </div>
      </div>

      <div className="flex justify-center py-0.5">
        <VerticalConnector height={10} compact />
      </div>

      <div className="relative rounded-lg border-2 border-legal-gold/40 bg-legal-gold/[0.06] p-3 pl-9 sm:p-4 sm:pl-10">
        <span className="absolute left-2.5 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-legal-gold text-xs font-bold text-white sm:left-3">
          3
        </span>
        <p className="text-xs font-bold uppercase tracking-wide text-legal-blue">Editar Víctor Manuel (hijo)</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Ahora sí registras al hijo. El bloque dorado usa al superior como progenitor de referencia:
        </p>

        <div className="mt-3 flex flex-col items-center">
          <PersonNode name="María Rosa" subtitle="Superior" tone="neutral" size="sm" />
          <VerticalConnector height={18} label="Conectar debajo de" compact />
          <PersonNode name="Víctor Manuel" subtitle="Parentesco: Hijo" tone="child" size="sm" />
        </div>

        <div className="mt-3 space-y-1.5 rounded-lg border border-legal-gold/30 bg-white/80 p-3 font-mono text-[10px] leading-relaxed text-legal-blue sm:text-xs">
          <p>├ Conectar debajo de → María Rosa</p>
          <p>├ Parentesco → Hijo</p>
          <p>├ Unión de filiación → Matrimonio: María Rosa y Pedro Pablo</p>
          <p>└ Segundo progenitor → Pedro Pablo → Guardar</p>
        </div>
      </div>
    </div>

    <div className="mx-3 mb-3 space-y-2 rounded-lg border border-legal-blue/15 bg-white p-3 sm:mx-4 sm:mb-4">
      <ExampleRow label="Bloque azul" value="Se usa en María Rosa y Pedro Pablo (sus cónyuges)." />
      <ExampleRow label="Bloque dorado" value="Se usa al guardar a Víctor (filiación del hijo)." />
      <ExampleRow label="Superior de Víctor" value="María Rosa — solo dónde cuelga en el árbol visual." />
    </div>

    <div className="mx-3 mb-3 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 sm:mx-4 sm:mb-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-emerald-800">Resultado en el árbol</p>
      <div className="flex flex-col items-center">
        <div className="flex w-full max-w-xs flex-col items-center gap-2 sm:max-w-none sm:flex-row sm:justify-center">
          <PersonNode name="María Rosa" size="sm" tone="neutral" />
          <div className="hidden h-0.5 w-6 bg-legal-blue/30 sm:block" />
          <PersonNode name="Pedro Pablo" size="sm" tone="neutral" />
        </div>
        <VerticalConnector height={16} compact />
        <PersonNode name="Víctor Manuel" subtitle="Filiación: matrimonio" tone="child" size="sm" />
      </div>
    </div>
  </div>
);

const OtherRelationDiagram = () => (
  <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 sm:p-4">
    <p className="text-sm font-semibold text-legal-blue">Ejemplo B — Hijo de otra relación</p>
    <p className="mt-2 text-sm leading-relaxed text-gray-700">
      Si Pedro Pablo tuviera un hijo con otra persona (no con María Rosa), al editar ese hijo:
    </p>
    <div className="my-3 flex flex-col items-center">
      <PersonNode name="Pedro Pablo" subtitle="Superior" tone="blue" size="sm" />
      <VerticalConnector height={18} label="Conectar debajo de" compact />
      <PersonNode name="Hijo externo" subtitle="Sin unión matrimonial" tone="gold" size="sm" />
    </div>
    <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-gray-700">
      <li>Conectar debajo de → Pedro Pablo (o la madre, según cómo quieras ver el árbol).</li>
      <li>
        Unión de filiación → <strong>Sin unión (hijo de otra relación)</strong>.
      </li>
      <li>No asignes el matrimonio María Rosa–Pedro Pablo a ese hijo.</li>
    </ul>
    <p className="mt-3 text-sm text-legal-gray">
      Así el sistema separa «hijos de este matrimonio» vs «hijos de otra pareja».
    </p>
  </div>
);

const FaqItem = ({ question, answer }: { question: string; answer: React.ReactNode }) => (
  <div className="rounded-lg border border-legal-blue/10 bg-white p-3 shadow-sm">
    <p className="flex items-start gap-2 text-sm font-semibold text-legal-blue">
      <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-legal-gold" />
      <span className="min-w-0 break-words">{question}</span>
    </p>
    <p className="mt-2 pl-6 text-sm leading-relaxed text-gray-700">{answer}</p>
  </div>
);

export const MemberRegistrationGuideContent = () => (
  <div className="space-y-6 pb-6 sm:space-y-8 sm:pb-8">
    <ProseBox>
      Al registrar un miembro trabajas con <strong>tres capas distintas</strong>. Confundirlas es lo más habitual: el
      cónyuge del formulario <strong>no</strong> es el del nodo superior, salvo que estés editando precisamente a esa
      persona superior. Usa el diagrama para orientarte y el texto para entender cada campo.
    </ProseBox>

    <WorkflowPipeline />

    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-legal-blue sm:text-sm">
        <GitBranch className="h-4 w-4 shrink-0" />
        Las 3 capas — no las mezcles
      </h3>
      <ThreeLayersDiagram />
    </section>

    <Separator className="bg-legal-gold/25" />

    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-legal-blue sm:text-sm">
        <ListOrdered className="h-4 w-4 shrink-0" />
        Orden recomendado (quién entrar primero)
      </h3>
      <OrderedStepsText />
    </section>

    <Separator className="bg-legal-gold/25" />

    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-legal-blue sm:text-sm">
        <Users className="h-4 w-4 shrink-0" />
        Caso real paso a paso
      </h3>
      <VictorExampleDiagram />
    </section>

    <section className="space-y-3">
      <OtherRelationDiagram />
    </section>

    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-legal-blue sm:text-sm">
        <HelpCircle className="h-4 w-4 shrink-0" />
        Preguntas frecuentes
      </h3>
      <div className="space-y-2">
        <FaqItem
          question="¿El cónyuge es de la persona que edito o del superior?"
          answer={
            <>
              <strong>De la persona que editas</strong> (bloque azul). El superior solo importa en el bloque dorado
              cuando registras un hijo.
            </>
          }
        />
        <FaqItem
          question="¿Por qué no veo uniones en el bloque dorado?"
          answer="Primero enlaza cónyuges en los adultos (bloque azul) y guarda. Luego edita al hijo: las uniones del superior aparecerán en la lista."
        />
        <FaqItem
          question="¿Debo poner cónyuge al hijo?"
          answer="Solo si ese hijo ya es adulto casado. El bloque azul siempre describe al miembro de la ficha, no a sus padres."
        />
      </div>
    </section>
  </div>
);

const MemberRegistrationGuide = ({ variant = 'default', className = '' }: Props) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button
        type="button"
        variant={variant === 'icon' ? 'ghost' : 'outline'}
        size={variant === 'icon' ? 'icon' : 'sm'}
        className={
          variant === 'icon'
            ? `h-9 w-9 shrink-0 rounded-full text-legal-blue hover:bg-legal-blue/10 ${className}`
            : `gap-2 border-legal-gold/40 text-legal-blue hover:bg-legal-gold/10 ${className}`
        }
        aria-label="Guía para registrar miembros"
      >
        <BookOpen className="h-5 w-5" />
        {variant === 'default' && <span className="hidden sm:inline">Guía de registro</span>}
      </Button>
    </SheetTrigger>
    <SheetContent
      side="right"
      className="w-[100vw] max-w-[100vw] overflow-x-hidden overflow-y-auto p-4 sm:max-w-xl sm:p-6 lg:max-w-2xl"
    >
      <SheetHeader className="space-y-2 pr-8 text-left">
        <SheetTitle className="flex items-center gap-2 text-base text-legal-blue sm:text-lg">
          <BookOpen className="h-5 w-5 shrink-0" />
          Cómo crear o editar un miembro
        </SheetTitle>
        <SheetDescription className="text-left text-sm leading-relaxed">
          Uniones matrimoniales, filiación de hijos y orden de captura. Léela junto al formulario mientras trabajas.
        </SheetDescription>
      </SheetHeader>
      <div className="mt-4 min-w-0">
        <MemberRegistrationGuideContent />
      </div>
    </SheetContent>
  </Sheet>
);

export default MemberRegistrationGuide;
