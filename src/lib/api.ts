export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  sienna_member_id?: string | null;
  role?: "admin" | "regular";
  is_approved?: boolean;
  can_edit?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface UserPage {
  id: string;
  name: string;
  path: string;
  description: string | null;
}

export interface PageVisit {
  id: string;
  user_id: string;
  page_path: string;
  page_name: string | null;
  visited_at: string;
  user_agent: string | null;
  ip_address?: string | null;
  user_email?: string | null;
  user_full_name?: string | null;
}

export interface ConfirmedHeir {
  id: string;
  sienna_member_id?: string | null;
  heir_name: string;
  relationship_summary?: string | null;
  line_vincenzo: boolean;
  line_paolo: boolean;
  status: "mencionado" | "confirmado" | "pendiente";
  notes?: string | null;
  photo_file_name?: string | null;
  photo_file_type?: string | null;
  photo_data?: string | null;
  has_photo?: boolean;
  evidence_count?: number;
}

export type HeirDeclarationStatus = "pendiente" | "generado" | "entregado" | "firmado" | "recibido" | "anulado";

export interface HeirDeclarationDocument {
  id: string;
  heir_id: string;
  member_id?: string | null;
  document_code: string;
  document_type: string;
  status: HeirDeclarationStatus;
  template_version: string;
  heir_name_snapshot: string;
  identity_document_snapshot?: string | null;
  relationship_snapshot?: string | null;
  generated_at?: string | null;
  delivered_at?: string | null;
  signed_at?: string | null;
  received_at?: string | null;
  annulled_at?: string | null;
  notes?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface HeirDeclarationRow {
  heir_id: string;
  member_id?: string | null;
  heir_name: string;
  member_phone?: string | null;
  member_email?: string | null;
  relationship_summary?: string | null;
  compact_relationship?: string | null;
  compact_relationship_desktop?: string | null;
  share_percent?: number | null;
  amount?: number | null;
  heir_status: ConfirmedHeir["status"] | "calculado_api";
  document_id?: string | null;
  document_code?: string | null;
  document_status: HeirDeclarationStatus;
  document_type?: string | null;
  template_version?: string | null;
  heir_name_snapshot?: string | null;
  identity_document_snapshot?: string | null;
  relationship_snapshot?: string | null;
  generated_at?: string | null;
  delivered_at?: string | null;
  signed_at?: string | null;
  received_at?: string | null;
  annulled_at?: string | null;
  notes?: string | null;
  document_created_at?: string | null;
  document_updated_at?: string | null;
}

export interface EvidenceDocument {
  id?: string;
  title: string;
  document_type: string;
  primary_member_id?: string | null;
  primary_person?: string | null;
  event_date?: string | null;
  event_place?: string | null;
  father_member_id?: string | null;
  father_name?: string | null;
  mother_member_id?: string | null;
  mother_name?: string | null;
  spouse_member_id?: string | null;
  spouse_name?: string | null;
  related_heir_name?: string | null;
  related_member_id?: string | null;
  confirms_heir?: boolean;
  people_involved?: string[];
  extracted_text?: string | null;
  notes?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  file_data?: string | null;
  has_file?: boolean;
  has_extracted_text?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SiennaCalculationSnapshot {
  id: string;
  estate_amount: number;
  management_fee_percentage?: number;
  lawyer_fee_percentage: number;
  distributable_amount: number;
  members_hash?: string | null;
  payload_json?: string | null;
  created_by?: string | null;
  created_at?: string | null;
}

export interface SiennaRealtimeCalculationRow {
  member_id: string;
  heir_name: string;
  share_percent: number;
  amount: number;
  route: string;
  payment_basis: string;
  reason: string;
  sources: string[];
  source_breakdown?: Array<{ source: string; share: number; routes: string[] }>;
}

export interface SiennaRealtimeCalculation {
  estate: {
    grossAmount: number;
    managementFeePercentage: number;
    managementFeeAmount: number;
    amountAfterManagement: number;
    lawyerFeePercentage: number;
    lawyerFeeAmount: number;
    distributableAmount: number;
  };
  causante_name: string;
  total_share: number;
  active_heirs: SiennaRealtimeCalculationRow[];
  active_heir_count: number;
  generated_at: string;
}

export type SiennaFindingKind = "sync_parent_link" | "complete_filiation" | "dead_branch";

export interface SiennaFindingRow {
  id: string;
  memberId: string;
  memberName: string;
  kind: SiennaFindingKind;
  severity: "Alta prioridad" | "Media prioridad" | "Baja prioridad";
  problem: string;
  solution: string;
  context?: string;
  defaults: {
    spouseMemberId: string;
    filiationUnionId: string;
    secondParentId: string;
  };
  spouseOptions: Array<{ id: string; name: string; suggested?: boolean }>;
  unionOptions: Array<{ id: string; label: string }>;
  secondParentOptions: Array<{ id: string; name: string }>;
}

export interface SiennaFindingsResponse {
  rows: SiennaFindingRow[];
  summary: {
    undistributedPercent: number;
    distributedPercent: number;
    totalIssues: number;
    membersAffected: number;
    byKind: Record<SiennaFindingKind, number>;
  };
  generated_at: string;
  source: "api";
}

export interface SiennaAnalysisSummary {
  generated_at: string;
  members_total: number;
  active_heir_count: number;
  total_share: number;
  estate: SiennaRealtimeCalculation["estate"];
  dual_lineage_total: number;
  pending_findings_total: number;
  pending_validation_total: number;
  backend_contract: { source: string; message: string };
}

export interface SiennaAiAssistantResponse {
  answer: string;
  model: string;
  mode: "openai" | "fallback" | "deterministic";
  guardrails: string[];
  suggested_paths: Array<{ label: string; path: string; reason: string; purpose?: string }>;
}

export interface SiennaAiCuriositiesResponse {
  curiosities: string[];
  model: string;
  mode: "openai" | "fallback";
}

export interface EvidenceDocumentAiInterpretation {
  summary: string;
  confidence: "alta" | "media" | "baja";
  warnings: string[];
  model: string;
  mode: "openai" | "fallback";
  warning?: string | null;
  suggestions: Partial<EvidenceDocument>;
}

export type SiennaConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type DualLineageSeverity = "info" | "warning" | "critical";

export interface DualLineageRouteNode {
  id: string;
  name: string;
  birth?: string | null;
  death?: string | null;
  is_deceased: boolean;
}

export interface DualLineageRoute {
  source: string;
  root_id: string;
  path: DualLineageRouteNode[];
  label: string;
  depth: number;
}

export interface DualLineageIssue {
  id: string;
  type: string;
  severity: DualLineageSeverity;
  title: string;
  detail: string;
  member_id?: string | null;
  action_href?: string | null;
}

export interface DualLineageCase {
  member: {
    id: string;
    name: string;
    birth?: string | null;
    death?: string | null;
    is_deceased: boolean;
    inheritance_status?: SiennaFamilyMember["inheritance_status"];
  };
  inherits: boolean;
  inheritance_share?: number | null;
  sources: string[];
  route_count: number;
  generation_depth: number;
  complexity_score: number;
  complexity_level: "baja" | "media" | "alta";
  convergence_point?: { id: string; name: string } | null;
  shared_ancestors: Array<DualLineageRouteNode & { route_count: number }>;
  routes: DualLineageRoute[];
  calculation_routes: Array<{ source: string; share: number; routes: string[] }>;
  source_amounts?: Array<{
    source: string;
    share_percent: number;
    amount: number;
    routes: string[];
  }>;
  inheritance_amount?: number | null;
  issues: DualLineageIssue[];
  explanation: string;
  tree_href: string;
  edit_href: string;
}

export interface DualLineageAnalysis {
  generated_at: string;
  summary: {
    members_total: number;
    dual_lineage_total: number;
    convergence_total: number;
    suspicious_total: number;
    critical_total: number;
    pending_validation_total: number;
  };
  root_labels: string[];
  dual_cases: DualLineageCase[];
  top_ancestors: Array<{ id: string; name: string; count: number }>;
  inconsistencies: DualLineageIssue[];
  audit_policy: { mode: string; message: string };
}

export interface SiennaFamilyMember {
  id: string;
  parent_id?: string | null;
  relationship_to_parent?: "hijo" | "hija" | "conyuge" | "padre" | "madre" | "otro" | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  birth?: string | null;
  death?: string | null;
  spouse_member_id?: string | null;
  spouse?: string | null;
  spouse_birth?: string | null;
  inheritance_status?: "posible_heredero" | "no_hereda" | "requiere_revision" | "confirmado" | null;
  inheritance_reason?: string | null;
  inheritance_status_stored?: "posible_heredero" | "no_hereda" | "requiere_revision" | "confirmado" | null;
  inheritance_reason_stored?: string | null;
  effective_inheritance_status?: "posible_heredero" | "no_hereda" | "requiere_revision" | "confirmado" | null;
  effective_inheritance_reason?: string | null;
  is_highlighted_ancestor?: boolean;
  sort_order?: number;
  created_by?: string | null;
  updated_by?: string | null;
  created_by_email?: string | null;
  created_by_name?: string | null;
  updated_by_email?: string | null;
  updated_by_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type SiennaStorybookTone = 'origin' | 'migration' | 'arrival' | 'lineage' | 'memory';
export type SiennaStorybookVisual = 'calabria' | 'migration' | 'samana' | 'familyTree' | 'legacy';

export interface SiennaStorybookSlide {
  id: string;
  title: string;
  text: string;
  location: string;
  visual: SiennaStorybookVisual;
  durationMs: number;
  backgroundImage: string;
  archiveImage?: string | null;
  archiveCaption?: string | null;
  memberPhotos?: Array<{
    id?: string;
    memberId: string;
    name: string;
    photoData: string;
    deceased: boolean;
    birth?: string | null;
    death?: string | null;
  }>;
  creditMembers?: Array<{
    memberId: string;
    name: string;
    birth?: string | null;
    death?: string | null;
    generation?: number | null;
    treePosition?: string | null;
    photoData?: string | null;
  }>;
  documentThumbnails?: Array<{
    id: string;
    title: string;
    documentType?: string | null;
    personName?: string | null;
    imageData?: string | null;
    fileType?: string | null;
    fileUrl?: string | null;
  }>;
  tone: SiennaStorybookTone;
  members?: string[];
  year?: number | string;
  eventKind?: string;
  assetPrompt?: string;
  narrativeMode?: string;
}

export interface SiennaStorybookResponse {
  slides: SiennaStorybookSlide[];
  summary: {
    member_count: number;
    heir_count: number;
    document_count: number;
    union_count: number;
    parent_link_count: number;
    covered_member_count: number;
    missing_member_ids: string[];
    generated_at: string;
    source: string;
    ai_narrative?: {
      enabled: boolean;
      model: string;
      prompt_version: string;
      generated_at: string;
      slides: Array<{ slideId: string; mode: string; hash?: string; error?: string }>;
    };
  };
}

export interface SiennaStorybookDedicationResponse {
  text: string;
  mode: string;
  model: string;
  generated_at: string;
}

export type FamilyUnionType = "matrimonio" | "union_libre" | "otra";
export type GenealogyConfidence = "alta" | "media" | "baja";
export type ParentRole = "padre" | "madre" | "progenitor";

export interface FamilyUnion {
  id: string;
  partner_a_member_id: string;
  partner_b_member_id?: string | null;
  union_type: FamilyUnionType;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  migration_source?: string | null;
  confidence: GenealogyConfidence;
  is_inconsistent: boolean;
  inconsistency_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface MemberParentLink {
  id: string;
  child_member_id: string;
  parent_member_id: string;
  parent_role: ParentRole;
  union_id?: string | null;
  link_type: "biologico" | "adoptivo" | "legal";
  is_primary_line: boolean;
  migration_source?: string | null;
  confidence: GenealogyConfidence;
  is_inconsistent: boolean;
  inconsistency_reason?: string | null;
  source_document_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type MemberFiliationPayload = {
  union_id?: string | null;
  second_parent_id?: string | null;
  second_parent_role?: ParentRole;
};

export interface SiennaCaseConfig {
  causante_name: string;
  family_trunk_name: string;
  legal_criterion_text: string;
  active_collateral_roots: Array<{ name: string; label: string }>;
  known_intermediates: Array<{ name: string; reason: string }>;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Error de comunicación con el servidor local");
  }
  return payload as T;
}

async function streamSiennaAssistant(
  question: string,
  currentPath: string | undefined,
  onDelta: (delta: string) => void,
  conversationHistory: SiennaConversationMessage[] = []
): Promise<SiennaAiAssistantResponse> {
  const response = await fetch("/api/sienna-ai-assistant-stream", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, current_path: currentPath || null, conversation_history: conversationHistory }),
  });

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "No pude comunicarme con el expediente en este momento");
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";
  let eventName = "message";
  let answer = "";
  let meta: Partial<SiennaAiAssistantResponse> = {};

  const handleEvent = (event: string, data: string) => {
    const payload = data ? JSON.parse(data) : {};
    if (event === "meta") {
      meta = payload;
      return;
    }
    if (event === "delta") {
      const delta = String(payload.delta || "");
      answer += delta;
      onDelta(delta);
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const rawEvent of events) {
      const lines = rawEvent.split(/\r?\n/);
      let data = "";
      eventName = "message";
      for (const line of lines) {
        if (line.startsWith("event:")) eventName = line.slice(6).trim();
        if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      handleEvent(eventName, data);
    }
  }

  return {
    answer,
    model: meta.model || "gpt-5-nano",
    mode: meta.mode || "openai",
    guardrails: meta.guardrails || [],
    suggested_paths: meta.suggested_paths || [],
  } as SiennaAiAssistantResponse;
}

export const api = {
  signUp: (email: string, password: string) =>
    request<{ ok: boolean }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  signIn: (email: string, password: string) =>
    request<{ user: UserProfile; profile: UserProfile }>("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  signOut: () =>
    request<{ ok: boolean }>("/api/auth/signout", { method: "POST" }),
  getSession: () =>
    request<{ user: UserProfile; profile: UserProfile }>("/api/auth/session"),
  updatePassword: (password: string) =>
    request<{ ok: boolean }>("/api/auth/password", {
      method: "PATCH",
      body: JSON.stringify({ password }),
    }),
  updateProfile: (data: { full_name?: string | null; phone?: string | null }) =>
    request<{ profile: UserProfile }>("/api/profiles/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  listPages: () => request<{ pages: UserPage[] }>("/api/pages"),
  listMyPages: () => request<{ pages: UserPage[] }>("/api/me/pages"),
  listUsers: () => request<{ users: Array<UserProfile & { permissions?: { page_id: string }[] }> }>("/api/users"),
  createUser: (data: { email: string; password: string; full_name?: string | null; role?: "admin" | "regular"; is_approved?: boolean; can_edit?: boolean }) =>
    request<{ profile: UserProfile }>("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: Partial<Pick<UserProfile, "is_approved" | "role" | "full_name" | "can_edit" | "sienna_member_id">>) =>
    request<{ profile: UserProfile }>(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) =>
    request<{ ok: boolean }>(`/api/users/${id}`, { method: "DELETE" }),
  saveUserPermissions: (id: string, pageIds: string[]) =>
    request<{ ok: boolean }>(`/api/users/${id}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ page_ids: pageIds }),
    }),
  recordPageVisit: (data: { page_path: string; page_name?: string; user_agent?: string }) =>
    request<{ ok: boolean }>("/api/page-visits", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  listPageVisits: () =>
    request<{ visits: PageVisit[] }>("/api/page-visits"),
  getSettings: () =>
    request<{ settings: Record<string, string | number | boolean | SiennaCaseConfig | null> }>("/api/settings"),
  updateSettings: (data: { estate_amount?: number; management_fee_percentage?: number; lawyer_fee_percentage?: number; sienna_case_config?: SiennaCaseConfig }) =>
    request<{ ok: boolean; settings: Record<string, string | number | boolean | SiennaCaseConfig | null> }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  listConfirmedHeirs: (options?: { includeMedia?: boolean }) =>
    request<{ heirs: ConfirmedHeir[] }>(
      `/api/confirmed-heirs${options?.includeMedia ? "?includeMedia=1" : ""}`
    ),
  getConfirmedHeir: (id: string, options?: { includeMedia?: boolean }) =>
    request<{ heir: ConfirmedHeir }>(
      `/api/confirmed-heirs/${id}${options?.includeMedia ? "?includeMedia=1" : ""}`
    ),
  saveConfirmedHeir: (data: Omit<ConfirmedHeir, "id" | "evidence_count">) =>
    request<{ ok: boolean }>("/api/confirmed-heirs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateConfirmedHeir: (id: string, data: Partial<ConfirmedHeir>) =>
    request<{ ok: boolean }>(`/api/confirmed-heirs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  listHeirDeclarationDocuments: () =>
    request<{ rows: HeirDeclarationRow[] }>("/api/sienna-declaration-documents"),
  generateHeirDeclarationDocument: (heirId: string, data?: { notes?: string | null; identity_document?: string | null }) =>
    request<{ ok: boolean; document: HeirDeclarationDocument }>(`/api/sienna-declaration-documents/${heirId}/generate`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),
  updateHeirDeclarationStatus: (documentId: string, data: { status: HeirDeclarationStatus; notes?: string | null }) =>
    request<{ ok: boolean; document: HeirDeclarationDocument }>(`/api/sienna-declaration-documents/${documentId}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  listEvidenceDocuments: (options?: { includeMedia?: boolean }) =>
    request<{ documents: EvidenceDocument[] }>(
      `/api/evidence-documents${options?.includeMedia ? "?includeMedia=1" : ""}`
    ),
  getEvidenceDocument: (id: string) =>
    request<{ document: EvidenceDocument }>(`/api/evidence-documents/${id}`),
  saveEvidenceDocument: (data: EvidenceDocument) =>
    request<{ ok: boolean }>("/api/evidence-documents", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  interpretEvidenceDocumentAi: (document: Partial<EvidenceDocument>) =>
    request<EvidenceDocumentAiInterpretation>("/api/evidence-documents/interpret-ai", {
      method: "POST",
      body: JSON.stringify({ document }),
    }),
  deleteEvidenceDocument: (id: string) =>
    request<{ ok: boolean }>(`/api/evidence-documents/${id}`, { method: "DELETE" }),
  listSiennaFamilyMembers: () =>
    request<{
      members: SiennaFamilyMember[];
      unions: FamilyUnion[];
      parent_links: MemberParentLink[];
    }>("/api/sienna-family-members"),
  getSiennaWorkspace: (options?: { includeMedia?: boolean }) =>
    request<{
      members: SiennaFamilyMember[];
      unions: FamilyUnion[];
      parent_links: MemberParentLink[];
      heirs: ConfirmedHeir[];
      documents: EvidenceDocument[];
      settings: Record<string, string | number | boolean | SiennaCaseConfig | null>;
      snapshot: SiennaCalculationSnapshot | null;
    }>(`/api/sienna-workspace${options?.includeMedia ? "?includeMedia=1" : ""}`),
  getSiennaStorybook: (options?: { includeMedia?: boolean; aiNarrative?: boolean }) => {
    const params = new URLSearchParams();
    if (options?.includeMedia) params.set("includeMedia", "1");
    if (options?.aiNarrative) params.set("aiNarrative", "1");
    const query = params.toString();
    return request<SiennaStorybookResponse>("/api/sienna-storybook" + (query ? "?" + query : ""));
  },
  getSiennaStorybookDedication: (options?: { nonce?: string | number }) => {
    const params = new URLSearchParams();
    if (options?.nonce !== undefined) params.set("nonce", String(options.nonce));
    const query = params.toString();
    return request<SiennaStorybookDedicationResponse>("/api/sienna-storybook-dedication" + (query ? "?" + query : ""));
  },
  getSiennaCalculation: (options?: { estateAmount?: number | string; managementFeePercentage?: number | string; lawyerFeePercentage?: number | string }) => {
    const params = new URLSearchParams();
    if (options?.estateAmount !== undefined) params.set("estate_amount", String(options.estateAmount));
    if (options?.managementFeePercentage !== undefined) params.set("management_fee_percentage", String(options.managementFeePercentage));
    if (options?.lawyerFeePercentage !== undefined) params.set("lawyer_fee_percentage", String(options.lawyerFeePercentage));
    const query = params.toString();
    return request<{ calculation: SiennaRealtimeCalculation }>("/api/sienna-calculation" + (query ? "?" + query : ""));
  },
  getSiennaDualLineageAnalysis: () =>
    request<{ analysis: DualLineageAnalysis }>("/api/sienna-dual-lineage-analysis"),
  getSiennaAnalysisSummary: () =>
    request<{ summary: SiennaAnalysisSummary }>("/api/sienna-analysis-summary"),
  getSiennaFindings: () =>
    request<{ findings: SiennaFindingsResponse }>("/api/sienna-findings"),
  askSiennaAssistant: (question: string, currentPath?: string, conversationHistory: SiennaConversationMessage[] = []) =>
    request<SiennaAiAssistantResponse>("/api/sienna-ai-assistant", {
      method: "POST",
      body: JSON.stringify({ question, current_path: currentPath || null, conversation_history: conversationHistory }),
    }),
  streamSiennaAssistant,
  getSiennaAiCuriosities: () =>
    request<SiennaAiCuriositiesResponse>("/api/sienna-ai-curiosities"),
  saveSiennaFamilyMember: (
    data: Omit<SiennaFamilyMember, "created_at" | "updated_at"> & { filiation?: MemberFiliationPayload }
  ) =>
    request<{
      ok: boolean;
      member?: SiennaFamilyMember;
      unions?: FamilyUnion[];
      parent_links?: MemberParentLink[];
    }>("/api/sienna-family-members", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteSiennaFamilyMember: (id: string) =>
    request<{ ok: boolean }>(`/api/sienna-family-members/${id}`, { method: "DELETE" }),
  listSiennaCalculationSnapshots: () =>
    request<{ snapshots: SiennaCalculationSnapshot[] }>("/api/sienna-calculation-snapshots"),
  getLatestSiennaCalculationSnapshot: () =>
    request<{ snapshot: SiennaCalculationSnapshot | null }>("/api/sienna-calculation-snapshots/latest"),
  saveSiennaCalculationSnapshot: (data: {
    estate_amount: number;
    lawyer_fee_percentage: number;
    distributable_amount: number;
    members_hash?: string;
    payload_json?: string;
  }) =>
    request<{ ok: boolean; snapshot_id: string }>("/api/sienna-calculation-snapshots", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
