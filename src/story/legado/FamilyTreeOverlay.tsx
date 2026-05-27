import { motion } from 'framer-motion';
import type { EvidenceDocument, SiennaFamilyMember } from '@/lib/api';
import type { LegadoStoryVisual } from './storyScenes';

type Props = {
  visual: LegadoStoryVisual;
  members: SiennaFamilyMember[];
  documents: EvidenceDocument[];
  documentsWithPlaces: EvidenceDocument[];
  preview: SiennaFamilyMember[];
  documentsWithPlacesForMember: (member: SiennaFamilyMember, documents: EvidenceDocument[]) => EvidenceDocument[];
};

const FamilyTreeOverlay = ({
  visual,
  members,
  documents,
  documentsWithPlaces,
  preview,
  documentsWithPlacesForMember,
}: Props) => {
  if (visual !== 'familyTree' && visual !== 'legacy') return null;

  return (
    <motion.div
      className="absolute bottom-[16vh] left-[5vw] z-20 max-w-[88vw] rounded-md border-2 border-[#111827] bg-[#f7f3ea]/90 p-4 shadow-[8px_8px_0_rgba(17,24,39,0.16)] backdrop-blur md:max-w-lg"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.1 }}
    >
      <p className="text-sm font-black uppercase tracking-[0.16em] text-[#991b1b]">Memoria familiar</p>
      <p className="mt-2 text-lg font-black text-[#111827]">
        {members.length} miembros · {documents.length} documentos · {documentsWithPlaces.length} lugares documentales
      </p>
      <div className="mt-3 space-y-1.5">
        {preview.map((member) => {
          const placeDocument = documentsWithPlacesForMember(member, documents)[0];
          return (
            <p key={member.id} className="truncate text-sm font-bold text-[#111827]/72">
              {member.name} · {member.birth || member.death}
              {placeDocument?.event_place ? ` · ${placeDocument.event_place}` : ''}
            </p>
          );
        })}
      </div>
    </motion.div>
  );
};

export default FamilyTreeOverlay;
