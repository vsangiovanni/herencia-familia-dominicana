import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSiennaFamily } from '@/hooks/useSiennaData';

const firstToken = (value?: string | null) => {
  const clean = String(value || '').trim();
  return clean ? clean.split(/\s+/)[0] : '';
};

export const useSiennaPersonalization = (enabled = true) => {
  const { user, userProfile } = useAuth();
  const memberId = userProfile?.sienna_member_id || null;
  const { data } = useSiennaFamily(Boolean(enabled && memberId));

  const member = useMemo(
    () => (memberId ? data?.members?.find((item) => item.id === memberId) || null : null),
    [data?.members, memberId]
  );

  const firstName = useMemo(
    () => firstToken(userProfile?.full_name) || firstToken(user?.email?.split('@')[0]) || 'Bienvenido',
    [user?.email, userProfile?.full_name]
  );

  const memberFirstName = firstToken(member?.name);

  return {
    firstName,
    member,
    memberFirstName,
    isLinkedMember: Boolean(member),
    memberLabel: member?.name || null,
  };
};
