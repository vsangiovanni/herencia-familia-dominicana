import React from 'react';
import { SiennaFamilyMember } from '@/lib/api';
import { MemberTreeContext } from '@/lib/siennaFamilyTree';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, GitBranch, Link2, Route, Scale } from 'lucide-react';

type Props = {
  member?: SiennaFamilyMember | null;
  context: MemberTreeContext;
  compact?: boolean;
};

const MemberTreeContextPanel = ({ member, context, compact = false }: Props) => {
  if (!member?.name?.trim() && !context.ancestryPath.length) {
    return (
      <p className="text-sm text-legal-gray">
        Complete el nombre y el nodo superior para ver la línea parental y la posición en el árbol.
      </p>
    );
  }

  return (
    <div className={`space-y-3 ${compact ? 'text-sm' : ''}`}>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="border-legal-blue/30 text-legal-blue">
          <GitBranch className="mr-1 h-3 w-3" />
          Nivel {context.treeLevel}
        </Badge>
        <Badge
          variant={context.inherits ? 'default' : 'secondary'}
          className={context.inherits ? 'bg-legal-gold text-white hover:bg-legal-gold/90' : ''}
        >
          <Scale className="mr-1 h-3 w-3" />
          {context.inheritanceLabel}
        </Badge>
        <Badge variant="secondary">{context.treeRoleLabel}</Badge>
      </div>

      <div className="rounded-md border border-legal-blue/15 bg-white/80 p-3">
        <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-legal-gray">
          <Route className="h-3.5 w-3.5" />
          Línea parental
        </p>
        <p className="leading-relaxed text-legal-blue">{context.parentalLine}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-legal-gray">Rama sucesoral</p>
          <p className="mt-1 text-legal-blue">{context.collateralLine}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-legal-gray">Conexión al árbol</p>
          <p className="mt-1 flex items-start gap-1 text-legal-blue">
            <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {context.connectionLabel}
          </p>
        </div>
      </div>

      {!compact && context.routeLabel && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-legal-gray">Ruta en el reparto</p>
          <p className="mt-1 text-sm text-gray-700">{context.routeLabel}</p>
        </div>
      )}

      {context.childFiliationGroups.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-legal-gray">Hijos por filiación</p>
          {context.childFiliationGroups.map((group) => (
            <div key={group.key} className="rounded-md border border-legal-blue/15 bg-white/70 p-2">
              <p className="text-sm font-medium text-legal-blue">{group.label}</p>
              <p className="text-xs text-legal-gray">
                {group.children.length} hijo(s) — confianza {group.confidence}
              </p>
              {group.hasInconsistency && (
                <p className="mt-1 flex items-start gap-1 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Revisar: posible inconsistencia en esta filiación.
                </p>
              )}
              <ul className="mt-1 list-inside list-disc text-sm text-gray-700">
                {group.children.map((child) => (
                  <li key={child.id}>{child.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-legal-gray">
          {context.directChildrenCount > 0
            ? `${context.directChildrenCount} hijo(s)/descendiente(s) directo(s) registrado(s)${
                context.hasLivingDescendants ? ', con descendencia viva' : ''
              }.`
            : 'Sin descendientes directos registrados bajo este nodo.'}
        </p>
      )}
    </div>
  );
};

export default MemberTreeContextPanel;
