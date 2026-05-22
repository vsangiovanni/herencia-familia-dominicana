import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, EvidenceDocument, SiennaCalculationSnapshot } from '@/lib/api';

export const SIENNA_STALE_MS = 90_000;

export const siennaQueryKeys = {
  family: ['sienna-family'] as const,
  heirs: (includeMedia = false) => ['confirmed-heirs', { includeMedia }] as const,
  documents: (includeMedia = false) => ['evidence-documents', { includeMedia }] as const,
  document: (id: string) => ['evidence-document', id] as const,
  settings: ['app-settings'] as const,
  snapshot: ['sienna-calculation-snapshot-latest'] as const,
  workspace: (includeMedia = false) => ['sienna-workspace', { includeMedia }] as const,
  calculation: (estateAmount?: number | string, lawyerFeePercentage?: number | string) =>
    ['sienna-calculation', { estateAmount, lawyerFeePercentage }] as const,
};

export const useSiennaFamily = () =>
  useQuery({
    queryKey: siennaQueryKeys.family,
    queryFn: () => api.listSiennaFamilyMembers(),
    staleTime: SIENNA_STALE_MS,
  });

export const useConfirmedHeirs = (includeMedia = false) =>
  useQuery({
    queryKey: siennaQueryKeys.heirs(includeMedia),
    queryFn: () => api.listConfirmedHeirs({ includeMedia }),
    staleTime: SIENNA_STALE_MS,
  });

export const useEvidenceDocuments = (includeMedia = false) =>
  useQuery({
    queryKey: siennaQueryKeys.documents(includeMedia),
    queryFn: () => api.listEvidenceDocuments({ includeMedia }),
    staleTime: SIENNA_STALE_MS,
  });

export const useEvidenceDocument = (id: string | null, enabled = true) =>
  useQuery({
    queryKey: siennaQueryKeys.document(id || ''),
    queryFn: () => api.getEvidenceDocument(id!),
    enabled: Boolean(id) && enabled,
    staleTime: SIENNA_STALE_MS,
  });

export const useSiennaWorkspace = (includeMedia = false) =>
  useQuery({
    queryKey: siennaQueryKeys.workspace(includeMedia),
    queryFn: () => api.getSiennaWorkspace({ includeMedia }),
    staleTime: SIENNA_STALE_MS,
  });

export const useSiennaCalculation = (estateAmount?: number | string, lawyerFeePercentage?: number | string) =>
  useQuery({
    queryKey: siennaQueryKeys.calculation(estateAmount, lawyerFeePercentage),
    queryFn: () => api.getSiennaCalculation({ estateAmount, lawyerFeePercentage }),
    staleTime: 0,
  });

export const invalidateSiennaData = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['sienna-family'] });
  queryClient.invalidateQueries({ queryKey: ['confirmed-heirs'] });
  queryClient.invalidateQueries({ queryKey: ['evidence-documents'] });
  queryClient.invalidateQueries({ queryKey: ['evidence-document'] });
  queryClient.invalidateQueries({ queryKey: ['app-settings'] });
  queryClient.invalidateQueries({ queryKey: ['sienna-calculation-snapshot-latest'] });
  queryClient.invalidateQueries({ queryKey: ['sienna-workspace'] });
  queryClient.invalidateQueries({ queryKey: ['sienna-calculation'] });
};

export type SiennaWorkspaceData = {
  members: Awaited<ReturnType<typeof api.getSiennaWorkspace>>['members'];
  unions: Awaited<ReturnType<typeof api.getSiennaWorkspace>>['unions'];
  parent_links: Awaited<ReturnType<typeof api.getSiennaWorkspace>>['parent_links'];
  heirs: Awaited<ReturnType<typeof api.getSiennaWorkspace>>['heirs'];
  documents: EvidenceDocument[];
  settings: Awaited<ReturnType<typeof api.getSiennaWorkspace>>['settings'];
  snapshot: SiennaCalculationSnapshot | null;
};
