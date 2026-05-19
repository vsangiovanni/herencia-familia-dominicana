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
  primary_person?: string | null;
  event_date?: string | null;
  event_place?: string | null;
  father_name?: string | null;
  mother_name?: string | null;
  spouse_name?: string | null;
  related_heir_name?: string | null;
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

export interface SiennaFamilyMember {
  id: string;
  parent_id?: string | null;
  relationship_to_parent?: "hijo" | "hija" | "conyuge" | "padre" | "madre" | "otro" | null;
  name: string;
  birth?: string | null;
  death?: string | null;
  spouse?: string | null;
  spouse_birth?: string | null;
  inheritance_status?: "posible_heredero" | "no_hereda" | "requiere_revision" | "confirmado" | null;
  inheritance_reason?: string | null;
  is_highlighted_ancestor?: boolean;
  sort_order?: number;
  created_at?: string | null;
  updated_at?: string | null;
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
    request<{ members: SiennaFamilyMember[] }>("/api/sienna-family-members"),
  saveSiennaFamilyMember: (data: Omit<SiennaFamilyMember, "created_at" | "updated_at">) =>
    request<{ ok: boolean; member?: SiennaFamilyMember }>("/api/sienna-family-members", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteSiennaFamilyMember: (id: string) =>
    request<{ ok: boolean }>(`/api/sienna-family-members/${id}`, { method: "DELETE" }),
};
