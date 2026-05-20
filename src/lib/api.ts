export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  role?: "admin" | "regular";
  is_approved?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface UserPage {
  id: string;
  name: string;
  path: string;
  description: string | null;
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
  inheritance_amount?: number | string | null;
  evidence_count?: number;
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
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SiennaCalculationSnapshot {
  id: string;
  estate_amount: number;
  lawyer_fee_percentage: number;
  distributable_amount: number;
  members_hash?: string | null;
  payload_json?: string | null;
  created_by?: string | null;
  created_at?: string | null;
}

export interface SiennaFamilyMember {
  id: string;
  parent_id?: string | null;
  relationship_to_parent?: "hijo" | "hija" | "conyuge" | "padre" | "madre" | "otro" | null;
  name: string;
  birth?: string | null;
  death?: string | null;
  spouse_member_id?: string | null;
  spouse?: string | null;
  spouse_birth?: string | null;
  inheritance_status?: "posible_heredero" | "no_hereda" | "requiere_revision" | "confirmado" | null;
  inheritance_reason?: string | null;
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
  listUsers: () => request<{ users: Array<UserProfile & { permissions?: { page_id: string }[] }> }>("/api/users"),
  createUser: (data: { email: string; password: string; full_name?: string | null; role?: "admin" | "regular"; is_approved?: boolean }) =>
    request<{ profile: UserProfile }>("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: Partial<Pick<UserProfile, "is_approved" | "role">>) =>
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
    request<{ visits: any[] }>("/api/page-visits"),
  getSettings: () =>
    request<{ settings: Record<string, string | number | boolean | SiennaCaseConfig | null> }>("/api/settings"),
  updateSettings: (data: { lawyer_fee_percentage?: number; sienna_case_config?: SiennaCaseConfig }) =>
    request<{ ok: boolean; settings: Record<string, string | number | boolean | SiennaCaseConfig | null> }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  listConfirmedHeirs: () =>
    request<{ heirs: ConfirmedHeir[] }>("/api/confirmed-heirs"),
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
  listEvidenceDocuments: () =>
    request<{ documents: EvidenceDocument[] }>("/api/evidence-documents"),
  saveEvidenceDocument: (data: EvidenceDocument) =>
    request<{ ok: boolean }>("/api/evidence-documents", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteEvidenceDocument: (id: string) =>
    request<{ ok: boolean }>(`/api/evidence-documents/${id}`, { method: "DELETE" }),
  listSiennaFamilyMembers: () =>
    request<{
      members: SiennaFamilyMember[];
      unions: FamilyUnion[];
      parent_links: MemberParentLink[];
    }>("/api/sienna-family-members"),
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
