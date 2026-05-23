import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MemberPhotoLookup,
  memberInitials,
  resolveMemberPhotoData,
} from '@/lib/memberPhotos';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

const sizeClasses = {
  xs: 'h-8 w-8 text-[10px]',
  sm: 'h-10 w-10 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
  xl: 'h-20 w-20 text-lg',
} as const;

type MemberPhotoProps = {
  name: string;
  memberId?: string | null;
  photoData?: string | null;
  lookup?: MemberPhotoLookup;
  size?: keyof typeof sizeClasses;
  className?: string;
  rounded?: 'full' | 'xl';
  /** Resalta miembros con clasificación sucesoral pendiente (requiere_revision). */
  pendingInheritance?: boolean;
};

const MemberPhoto = ({
  name,
  memberId,
  photoData,
  lookup,
  size = 'md',
  className,
  rounded = 'full',
  pendingInheritance = false,
}: MemberPhotoProps) => {
  const resolvedPhoto =
    photoData || (lookup ? resolveMemberPhotoData(lookup, memberId, name) : null);

  return (
    <Avatar
      title={pendingInheritance ? `${name}: pendiente de clasificación sucesoral` : undefined}
      className={cn(
        sizeClasses[size],
        'shrink-0 border bg-legal-blue/[0.04]',
        pendingInheritance
          ? 'border-2 border-red-500 ring-2 ring-red-300/70'
          : 'border border-legal-blue/15',
        rounded === 'xl' ? 'rounded-xl' : 'rounded-full',
        className
      )}
    >
      {resolvedPhoto ? (
        <AvatarImage src={resolvedPhoto} alt={name} className="object-cover" />
      ) : null}
      <AvatarFallback
        className={cn(
          'bg-legal-blue/5 font-semibold text-legal-blue',
          rounded === 'xl' ? 'rounded-xl' : 'rounded-full'
        )}
      >
        {memberInitials(name) !== '?' ? (
          memberInitials(name)
        ) : (
          <User className={cn(size === 'xs' || size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        )}
      </AvatarFallback>
    </Avatar>
  );
};

export default MemberPhoto;
