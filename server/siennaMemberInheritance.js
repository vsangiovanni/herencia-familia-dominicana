const DEFAULT_KNOWN_INTERMEDIATES = [
  { name: 'Domenico (Domingo) Sangiovanni', reason: 'Tronco familiar común; sirve para ubicar ramas, no como heredero final.' },
  { name: 'María Magdalena Sangiovanni', reason: 'Madre del causante Alessandro; rama del causante, no heredera final en este análisis.' },
  { name: 'Vincenzo (Vicente) Sangiovanni', reason: 'Hermano de la madre del causante; abre una rama sucesoral activa por sus descendientes.' },
  { name: 'Paolo (Paulino) Sangiovanni', reason: 'Hermano de la madre del causante; abre una rama sucesoral activa por sus descendientes.' },
  { name: 'María Rosa Sangiovanni Pérez', reason: 'Intermedia fallecida en rama Vincenzo/Vicente y vínculo hacia la doble filiación.' },
  { name: 'Pedro Pablo Sangiovanni Simo', reason: 'Intermedio fallecido en rama Paolo/Paulino y vínculo hacia la doble filiación.' },
  { name: 'Domingo Ramón Sangiovanni Pérez', reason: 'Intermedio fallecido en rama Vincenzo/Vicente; transmite representación a sus descendientes.' },
  { name: 'Víctor Manuel Sangiovanni Sangiovanni', reason: 'Intermedio fallecido; conecta a Víctor Manuel Martín y a Rosa Julia/Perla.' },
  { name: 'Rosa Julia Sangiovanni Rodríguez', reason: 'Intermedia fallecida; Perla Rosa entra por representación en su rama.' },
  { name: 'María Amparo Sangiovanni Gesualdo', reason: 'Intermedia fallecida; Bernardo Martín entra por representación en su rama.' },
  { name: 'José Vicente Sangiovanni Gesualdo', reason: 'Intermedio fallecido; Jocelyn y Mayra entran por representación a sus descendientes.' },
];

const buildKnownIntermediatesMap = (settings, normalizeSiennaName) => {
  const configured = settings?.sienna_case_config?.known_intermediates;
  const list = Array.isArray(configured) && configured.length ? configured : DEFAULT_KNOWN_INTERMEDIATES;
  return new Map(
    list
      .filter((item) => item?.name && item?.reason)
      .map((item) => [normalizeSiennaName(item.name), item.reason])
  );
};

const buildSharesById = (plan) => {
  const sharesById = new Map();
  (plan?.activeHeirs || []).forEach((share) => {
    if (share?.member?.id) sharesById.set(share.member.id, share);
  });
  return sharesById;
};

const classifyMemberByDominicanLaw = (
  member,
  members,
  genealogy,
  settings,
  plan,
  deps
) => {
  const { normalizeSiennaName, getDescendantsForRepresentation, isDeceasedMember } = deps;
  const caseConfig = settings?.sienna_case_config || {};
  const causanteName = caseConfig.causante_name || 'Alessandro de Paola Sangiovanni';
  const knownIntermediates = buildKnownIntermediatesMap(settings, normalizeSiennaName);
  const sharesById = buildSharesById(plan);
  const share = sharesById.get(member.id);
  const name = normalizeSiennaName(member.name);

  if (name === normalizeSiennaName(causanteName)) {
    return {
      inheritance_status: 'no_hereda',
      inheritance_reason: 'Es el causante del expediente; no se clasifica como heredero.',
    };
  }

  if (share) {
    return {
      inheritance_status: member.inheritance_status === 'confirmado' ? 'confirmado' : 'posible_heredero',
      inheritance_reason: share.reason,
    };
  }

  if (knownIntermediates.has(name)) {
    return {
      inheritance_status: 'no_hereda',
      inheritance_reason: knownIntermediates.get(name),
    };
  }

  if (isDeceasedMember(member) && getDescendantsForRepresentation(member, members, genealogy).length) {
    return {
      inheritance_status: 'no_hereda',
      inheritance_reason:
        'Nodo intermedio fallecido; su cuota se transmite por representación a sus descendientes vivos documentados.',
    };
  }

  if (isDeceasedMember(member)) {
    return {
      inheritance_status: 'no_hereda',
      inheritance_reason:
        'Persona fallecida sin descendientes documentados en el árbol; no recibe cuota en el reparto activo (la transmisión sigue por los parientes vivos de su rama).',
    };
  }

  return {
    inheritance_status: member.inheritance_status || 'requiere_revision',
    inheritance_reason:
      member.inheritance_reason || 'No hay suficiente información del expediente para clasificarlo automáticamente.',
  };
};

const resolveEffectiveInheritance = (member, classified) => {
  const storedStatus = member.inheritance_status || 'requiere_revision';
  if (storedStatus && storedStatus !== 'requiere_revision') {
    return {
      inheritance_status: storedStatus,
      inheritance_reason:
        member.inheritance_reason || 'Estado definido manualmente en la administración del árbol.',
    };
  }
  return classified;
};

const enrichSiennaMembersWithEffectiveInheritance = (members, genealogy, settings, deps) => {
  const plan = deps.buildApiInheritancePlan(members, genealogy, settings);
  return members.map((member) => {
    const classified = classifyMemberByDominicanLaw(member, members, genealogy, settings, plan, deps);
    const effective = resolveEffectiveInheritance(member, classified);
    return {
      ...member,
      inheritance_status_stored: member.inheritance_status || 'requiere_revision',
      inheritance_reason_stored: member.inheritance_reason || null,
      effective_inheritance_status: effective.inheritance_status,
      effective_inheritance_reason: effective.inheritance_reason,
    };
  });
};

export { enrichSiennaMembersWithEffectiveInheritance };
