import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Home, Map, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSiennaStorybook, useSiennaStorybookDedication } from '@/hooks/useSiennaData';
import NarrativeText from '@/story/legado/NarrativeText';
import type { LegadoStoryScene } from '@/story/legado/storyScenes';
import { legadoStoryScenes } from '@/story/legado/storyScenes';

const TYPEWRITER_INITIAL_DELAY_MS = 720;
const getTypewriterCharMs = (length: number) => {
  if (length > 900) return 34;
  if (length > 650) return 38;
  if (length > 420) return 43;
  if (length > 240) return 48;
  return 55;
};
const getAfterTypewriterHoldMs = (length: number) => {
  if (length > 900) return 6500;
  if (length > 650) return 6000;
  if (length > 420) return 5400;
  if (length > 240) return 5000;
  return 4500;
};

const STORYTELLER_MUSIC_TRACKS = [
  '/game/legado/audio/across-two-shores.mp3',
  '/game/legado/audio/across-the-atlantic.mp3',
] as const;
const STORYTELLER_MUSIC_VOLUME = 0.72;
const STORYTELLER_CROSSFADE_SECONDS = 8;

type WakeLockSentinelLike = {
  release: () => Promise<void>;
  addEventListener?: (type: 'release', listener: () => void) => void;
};

const resolveAiNarrativeMode = () => {
  const aiParam = new URLSearchParams(window.location.search).get('ai');
  if (aiParam === '0') return false;
  if (aiParam === '1') return true;
  return Math.random() >= 0.5;
};

const splitNarrativeLines = (text: string) =>
  text
    .split(/(?<=\.)\s+/)
    .map((line) => line.trim())
    .filter(Boolean);

const getTypedNarrativeMs = (scene: LegadoStoryScene) => {
  const typedLength = splitNarrativeLines(scene.text).join('\n').length;
  return (
    TYPEWRITER_INITIAL_DELAY_MS +
    typedLength * getTypewriterCharMs(typedLength)
  );
};

const getScenePlaybackMs = (scene: LegadoStoryScene) => {
  const typedLength = splitNarrativeLines(scene.text).join('\n').length;
  const calculated = getTypedNarrativeMs(scene) + getAfterTypewriterHoldMs(typedLength);
  const minimum = scene.tone === 'origin' || scene.tone === 'migration' ? 12000 : 10000;
  return Math.max(minimum, calculated + 2200);
};

const MemberPhotoCollage = ({ photos }: { photos: NonNullable<LegadoStoryScene['memberPhotos']> }) => {
  if (!photos.length) return null;

  const isDense = photos.length > 6;
  const visiblePhotos = photos.slice(0, isDense ? 16 : 12);
  const mobileLayoutClass = isDense
    ? 'right-[3vw] top-[18vh] grid max-h-[70vh] max-w-[9.4rem] grid-cols-2 items-start gap-x-1.5 gap-y-1.5 overflow-visible'
    : 'right-[5vw] top-[38vh] flex max-h-[48vh] max-w-[5.6rem] flex-col flex-nowrap items-center gap-1.5 overflow-hidden';
  const photoSizeClass = isDense
    ? 'h-11 w-11 md:h-20 md:w-20 xl:h-24 xl:w-24'
    : 'h-12 w-12 md:h-20 md:w-20 xl:h-24 xl:w-24';
  const labelClass = isDense
    ? 'mt-0.5 max-w-[4.1rem] truncate rounded-full bg-[#080706]/58 px-1 py-0.5 text-center text-[0.48rem] font-bold uppercase tracking-normal text-[#fff7e6]/90 backdrop-blur md:mt-1 md:max-w-[6rem] md:px-2 md:text-[0.65rem]'
    : 'mt-0.5 max-w-[4.6rem] truncate rounded-full bg-[#080706]/58 px-1.5 py-0.5 text-center text-[0.52rem] font-bold uppercase tracking-normal text-[#fff7e6]/90 backdrop-blur md:mt-1 md:max-w-[6rem] md:px-2 md:text-[0.65rem]';

  return (
    <motion.div
      className={`pointer-events-none absolute z-30 md:bottom-[8vh] md:left-auto md:right-[7vw] md:top-auto md:flex md:max-h-none md:max-w-[38vw] md:flex-row md:flex-wrap md:items-end md:justify-end md:gap-2.5 md:overflow-visible ${mobileLayoutClass}`}
      initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 1.05, delay: 0.55, ease: 'easeOut' }}
    >
      {visiblePhotos.map((photo, index) => {
        const memberId = photo.memberId || photo.id;
        const isImportant = memberId === 'alessandro' || memberId === 'jocelyn';
        return (
        <div
          key={`${memberId || photo.name}-${index}`}
          className="group relative grid place-items-center"
        >
          <div className={`relative overflow-hidden rounded-full border-2 bg-[#f7ead0] shadow-[0_12px_32px_rgba(0,0,0,0.42)] ring-2 ${photoSizeClass} ${isImportant ? 'border-[#fff7e6] ring-[#f8e5bd]/80 shadow-[0_0_30px_rgba(248,229,189,0.38)]' : 'border-[#f8e5bd]/80 ring-[#080706]/50'}`}>
            <img
              src={photo.photoData}
              alt={photo.name}
              className="h-full w-full object-cover sepia-[0.22] contrast-[1.04] saturate-[0.86]"
              draggable={false}
            />
          </div>
          {photo.deceased && (
            <div className="absolute -right-1 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#f7ead0] shadow-[0_4px_12px_rgba(0,0,0,0.35)] md:h-6 md:w-6" aria-hidden="true">
              <span className="relative block h-3.5 w-3.5 md:h-4 md:w-4">
                <span className="absolute left-[6px] top-0 h-4 w-1.5 -rotate-45 rounded-full bg-[#050505] md:left-[7px]" />
                <span className="absolute left-[6px] top-0 h-4 w-1.5 rotate-45 rounded-full bg-[#050505] md:left-[7px]" />
              </span>
            </div>
          )}
          <div className={`${labelClass} ${isImportant ? 'bg-[#f8e5bd]/88 text-[#1b1208] ring-1 ring-[#fff7e6]/80' : ''}`}>
            {photo.name}
          </div>
        </div>
        );
      })}
    </motion.div>
  );
};

const DocumentCardFallback = () => (
  <div className="flex h-full w-full flex-col justify-between bg-[#efe4ce] p-2 text-[#1e1710]">
    <div className="space-y-1">
      <div className="h-1.5 w-8 rounded-full bg-[#8b5e34]/45" />
      <div className="h-1.5 w-10 rounded-full bg-[#8b5e34]/30" />
    </div>
    <div className="space-y-1">
      <div className="h-px w-full bg-[#8b5e34]/28" />
      <div className="h-px w-4/5 bg-[#8b5e34]/24" />
      <div className="h-px w-3/5 bg-[#8b5e34]/20" />
    </div>
    <div className="text-center font-serif text-[0.72rem] font-black uppercase tracking-[0.08em] text-[#8b5e34]/80">
      Acta
    </div>
  </div>
);

const DocumentThumbnailCarousel = ({ documents }: { documents: NonNullable<LegadoStoryScene['documentThumbnails']> }) => {
  const visibleDocuments = documents.slice(0, 18);
  if (!visibleDocuments.length) return null;

  const trackClassName = 'legacy-document-carousel flex gap-3';
  const formatDocumentType = (value?: string | null) => {
    const normalized = (value || '').toLowerCase();
    if (normalized.includes('nacimiento') || normalized.includes('nascita')) return 'Nacimiento';
    if (normalized.includes('defunc') || normalized.includes('deceso') || normalized.includes('decesso')) return 'Defuncion';
    if (normalized.includes('matrimonio')) return 'Matrimonio';
    return value || 'Documento';
  };

  return (
    <motion.div
      className="pointer-events-none absolute bottom-[3.8rem] left-0 right-0 z-40 h-[8.6rem] overflow-hidden md:bottom-[4rem] md:h-[10.5rem]"
      initial={{ opacity: 0, filter: 'blur(5px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.9, delay: 0.65, ease: 'easeOut' }}
    >
      <div className="absolute inset-y-0 left-0 right-0 overflow-hidden [mask-image:linear-gradient(90deg,transparent_0%,black_12%,black_88%,transparent_100%)]">
        <div className={trackClassName}>
          {visibleDocuments.map((document, index) => (
            <div
              key={document.id + '-' + index}
              className="w-[4.8rem] shrink-0 overflow-hidden rounded-sm bg-[#f7ead0]/92 shadow-[0_14px_34px_rgba(0,0,0,0.42)] md:w-[6.2rem]"
            >
              <div className="aspect-[3/4] bg-[#e7dcc9]">
                {document.fileType?.startsWith('application/pdf') && document.fileUrl ? (
                  <object
                    data={document.fileUrl + '#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH'}
                    type="application/pdf"
                    aria-label={document.title}
                    className="h-full w-full bg-[#efe4ce]"
                  >
                    <DocumentCardFallback />
                  </object>
                ) : document.fileUrl || document.imageData ? (
                  <img
                    src={document.fileUrl || document.imageData || ''}
                    alt={document.title}
                    className="h-full w-full object-cover sepia-[0.12] contrast-[1.02] saturate-[0.86]"
                    draggable={false}
                  />
                ) : (
                  <DocumentCardFallback />
                )}
              </div>
              <div className="bg-[#120d08]/92 px-1.5 py-1">
                <p className="truncate text-[0.5rem] font-black uppercase tracking-normal text-[#fff7e6] md:text-[0.58rem]">
                  {document.personName || document.title}
                </p>
                <p className="truncate text-[0.48rem] font-semibold text-[#f8e5bd]/70 md:text-[0.54rem]">
                  {formatDocumentType(document.documentType)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const LineageThread = ({ scene }: { scene: LegadoStoryScene }) => {
  if (scene.memberPhotos?.length) return null;

  const photoNodes = scene.memberPhotos?.slice(0, 8) || [];
  if (photoNodes.length < 2 || scene.visual === 'calabria' || scene.visual === 'migration') return null;

  return (
    <motion.div
      className="pointer-events-none absolute bottom-[6.2vh] left-1/2 z-30 w-[min(68rem,76vw)] -translate-x-1/2 md:bottom-[6.8vh]"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.05, delay: 0.75, ease: 'easeOut' }}
    >
      <div className="relative h-20">
        <motion.div
          className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[#f8e5bd]/58 to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.7, delay: 0.85, ease: 'easeInOut' }}
        />
        <div className="relative flex h-full items-center justify-evenly px-5 md:px-8">
          {photoNodes.map((photo, index) => {
            return (
              <motion.div
                key={photo.memberId || scene.id + '-node-' + index}
                className="relative grid place-items-center"
                initial={{ opacity: 0, scale: 0.78, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1 + index * 0.08, ease: 'easeOut' }}
              >
                <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[#f8e5bd]/80 bg-[#f7ead0] shadow-[0_10px_28px_rgba(0,0,0,0.38)] md:h-12 md:w-12">
                  <img src={photo.photoData} alt="" className="h-full w-full object-cover sepia-[0.2] saturate-[0.88]" draggable={false} />
                  {photo.deceased ? <span className="absolute right-0 top-0 h-3 w-3 rounded-full bg-[#050505] ring-1 ring-[#f8e5bd]/80" /> : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

const formatCreditDate = (value?: string | null) => {
  const normalized = value?.trim();
  if (!normalized) return null;

  const isoDate = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return isoDate[3] + '/' + isoDate[2] + '/' + isoDate[1];

  return normalized;
};

const formatCreditDates = (member: NonNullable<LegadoStoryScene['creditMembers']>[number]) => {
  const birthDate = formatCreditDate(member.birth);
  const deathDate = formatCreditDate(member.death);
  if (birthDate && deathDate) return birthDate + ' - ' + deathDate;
  if (birthDate) return 'N. ' + birthDate;
  if (deathDate) return 'F. ' + deathDate;
  return 'Memoria familiar';
};

const getCreditDockSeconds = (creditIndex: number, durationSeconds: number) =>
  Math.min(creditIndex * 0.95, durationSeconds - 4);

const getCreditRollDurationSeconds = (memberCount: number) =>
  Math.max(46, Math.min(92, memberCount * 1.15));

const getPhotoSparkleStyle = (index: number, total: number): React.CSSProperties => {
  const xBase = 5 + ((index * 37 + total * 11) % 90);
  const yBase = 6 + ((index * 53 + total * 7) % 86);
  const size = 38 + ((index * 17) % 30);

  return {
    left: Math.max(4, Math.min(92, xBase)) + '%',
    top: Math.max(6, Math.min(88, yBase)) + '%',
    width: size,
    height: size,
  };
};

const getPhotoSparkleTiming = (index: number, total: number) => {
  const duration = 5.2 + (((index * 17 + total * 3) % 11) * 0.38);
  const phase = ((index * 41 + total * 13) % 100) / 100;

  return {
    duration,
    delay: -(duration * phase),
  };
};

const LegacyPhotoConstellation = ({ members }: { members: NonNullable<LegadoStoryScene['creditMembers']> }) => {
  const photoMembers = members.filter((member) => member.photoData);
  if (!photoMembers.length) return null;

  return (
    <div className="absolute inset-x-[3vw] bottom-[4vh] top-[12vh] z-[36] overflow-hidden md:inset-x-[5vw] md:top-[12vh]">
      <p className="absolute left-1/2 top-0 z-10 -translate-x-1/2 text-center text-[0.62rem] font-black uppercase tracking-[0.28em] text-[#f8e5bd]/70 md:text-xs">
        Rostros de la familia
      </p>
      {photoMembers.map((member, index) => {
        const sparkleTiming = getPhotoSparkleTiming(index, photoMembers.length);

        return (
        <motion.div
          key={'legacy-photo-spark-' + member.memberId + '-' + index}
          className="absolute grid place-items-center"
          style={getPhotoSparkleStyle(index, photoMembers.length)}
          initial={{ opacity: 0, scale: 0.82, filter: 'blur(1px)' }}
          animate={{
            opacity: [0, 0, 0.96, 0.1, 0, 0.82, 0.08, 0, 0.92, 0],
            scale: [0.82, 0.82, 1.08, 0.92, 0.82, 1.03, 0.9, 0.82, 1.06, 0.82],
            filter: ['blur(1px)', 'blur(1px)', 'blur(0px)', 'blur(0px)', 'blur(1px)', 'blur(0px)', 'blur(0px)', 'blur(1px)', 'blur(0px)', 'blur(1px)'],
          }}
          transition={{
            duration: sparkleTiming.duration,
            delay: sparkleTiming.delay,
            times: [0, 0.18, 0.205, 0.24, 0.42, 0.45, 0.49, 0.72, 0.75, 1],
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div className="absolute inset-[-32%] rounded-full bg-[#f8e5bd]/18 blur-xl" />
          <div className="relative h-full w-full overflow-hidden rounded-full border border-[#f8e5bd]/76 bg-[#f7ead0] shadow-[0_0_32px_rgba(248,229,189,0.42),0_14px_34px_rgba(0,0,0,0.46)]">
            <img
              src={member.photoData || ''}
              alt={member.name}
              className="h-full w-full object-cover sepia-[0.16] contrast-[1.05] saturate-[0.9]"
              draggable={false}
            />
          </div>
        </motion.div>
        );
      })}
    </div>
  );
};

const LegacyCredits = ({
  members,
  dedication,
  showDedication,
  showDedicationText,
}: {
  members: NonNullable<LegadoStoryScene['creditMembers']>;
  dedication?: { text: string; mode: string } | null;
  showDedication: boolean;
  showDedicationText: boolean;
}) => {
  const durationSeconds = getCreditRollDurationSeconds(members.length);
  const isNanoDedication = dedication?.mode === 'openai';
  const dedicationFrameClass = isNanoDedication
    ? 'border-emerald-200/70 bg-emerald-950/82 ring-2 ring-emerald-300/35'
    : 'border-[#f8e5bd]/38 bg-[#080706]/82';

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[35] overflow-hidden text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
    >
      <div className="absolute inset-x-0 bottom-0 top-[22vh] overflow-hidden md:top-[20vh]">
        <div
          className="legacy-credit-roll mx-auto flex w-[min(58rem,88vw)] flex-col items-center gap-2.5 pb-[48vh] transition-opacity duration-700 md:gap-3"
          style={{
            '--credit-duration': durationSeconds + 's',
            opacity: showDedication ? 0 : 1,
          } as React.CSSProperties}
        >
          <p className="mb-5 font-serif text-2xl font-black uppercase tracking-normal text-[#fff7e6] drop-shadow-[0_4px_22px_rgba(0,0,0,0.8)] md:text-5xl">
            Creditos del linaje
          </p>
          {members.map((member, index) => {
            const isImportant = member.memberId === 'alessandro' || member.memberId === 'jocelyn';
            const photoEntryX = index % 2 === 0 ? '-48vw' : '48vw';
            return (
            <motion.div
              key={member.memberId + '-' + index}
              className={`flex w-full max-w-4xl items-center justify-center gap-3 border-b pb-2 text-center md:gap-5 ${isImportant ? 'border-[#f8e5bd]/42 bg-[#f8e5bd]/10 px-2 py-2 shadow-[0_0_34px_rgba(248,229,189,0.14)]' : 'border-[#f8e5bd]/10'}`}
              initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, delay: getCreditDockSeconds(index, durationSeconds), ease: 'easeOut' }}
            >
              {member.photoData ? (
                <motion.div
                  className={`h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 bg-[#f7ead0] shadow-[0_10px_26px_rgba(0,0,0,0.42)] md:h-16 md:w-16 ${isImportant ? 'border-[#fff7e6] ring-2 ring-[#f8e5bd]/80' : 'border-[#f8e5bd]/78'}`}
                  initial={{ opacity: 0, x: photoEntryX, scale: 0.82, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 1.25, delay: getCreditDockSeconds(index, durationSeconds), ease: [0.16, 1, 0.3, 1] }}
                >
                  <img
                    src={member.photoData}
                    alt={member.name}
                    className="h-full w-full object-cover sepia-[0.12] contrast-[1.05] saturate-[0.92]"
                    draggable={false}
                  />
                </motion.div>
              ) : null}
              <div className="min-w-0 text-center">
                <p className={`font-serif text-lg font-black leading-tight drop-shadow-[0_3px_16px_rgba(0,0,0,0.78)] md:text-3xl ${isImportant ? 'text-[#f8e5bd]' : 'text-[#fff7e6]'}`}>
                  {member.name}
                </p>
                <p className="mt-1 text-[0.66rem] font-black uppercase leading-snug tracking-normal text-[#f8e5bd]/82 md:text-xs">
                  {formatCreditDates(member)}
                </p>
                <p className="mt-0.5 text-[0.58rem] font-black uppercase leading-snug tracking-normal text-[#f8e5bd]/62 md:text-[0.68rem]">
                  {member.treePosition || 'Linaje familiar'}
                </p>
              </div>
            </motion.div>
            );
          })}
          <p className="mt-8 font-serif text-xl font-black text-[#fff7e6]/92 md:text-3xl">
            Una historia viva, guardada por la familia.
          </p>
        </div>
      </div>
      <AnimatePresence>
        {showDedication && showDedicationText ? (
          <motion.div
            className={'absolute left-1/2 top-1/2 z-[38] w-[min(34rem,86vw)] rounded-[0.45rem] border px-4 py-4 text-center shadow-[0_24px_80px_rgba(0,0,0,0.52)] backdrop-blur-md md:top-[22vh] md:w-[min(48rem,82vw)] md:px-10 md:py-7 ' + dedicationFrameClass}
            style={{ x: '-50%', y: '-50%' }}
            initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            transition={{ duration: 1.15, ease: 'easeOut' }}
          >
            <p className={'mb-3 text-[0.65rem] font-black uppercase tracking-[0.32em] md:text-xs ' + (isNanoDedication ? 'text-emerald-100' : 'text-[#f8e5bd]/78')}>
              Mencion especial
            </p>
            <p className="mx-auto max-w-[30rem] font-serif text-[1.06rem] font-black leading-snug text-[#fff7e6] drop-shadow-[0_4px_22px_rgba(0,0,0,0.72)] md:max-w-[42rem] md:text-3xl">
              {dedication?.text}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {showDedication ? <LegacyPhotoConstellation members={members} /> : null}
    </motion.div>
  );
};

const LegadoSangiovanniGame = () => {
  const navigate = useNavigate();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [showLegacyCredits, setShowLegacyCredits] = useState(false);
  const [showLegacyDedication, setShowLegacyDedication] = useState(false);
  const [showLegacyDedicationText, setShowLegacyDedicationText] = useState(false);
  const [dedicationNonce, setDedicationNonce] = useState<string | number>();
  const primaryMusicRef = useRef<HTMLAudioElement | null>(null);
  const secondaryMusicRef = useRef<HTMLAudioElement | null>(null);
  const activeMusicRef = useRef<0 | 1>(0);
  const musicFadeFrameRef = useRef<number | null>(null);
  const musicFadeRunningRef = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const aiNarrative = useMemo(resolveAiNarrativeMode, []);
  const forceCredits = useMemo(() => new URLSearchParams(window.location.search).get('credits') === '1', []);
  const fastCredits = useMemo(() => new URLSearchParams(window.location.search).get('fast') === '1', []);
  const { data: storybook, isFetching: storybookFetching } = useSiennaStorybook(true, aiNarrative);

  const scenes = storybook?.slides?.length ? storybook.slides : legadoStoryScenes;
  const scene = scenes[sceneIndex] || scenes[0];
  const hasLegacyCredits = scene.visual === 'legacy' && Boolean(scene.creditMembers?.length);
  const { data: legacyDedication, isFetching: dedicationFetching } = useSiennaStorybookDedication(
    dedicationNonce,
    hasLegacyCredits && Boolean(dedicationNonce)
  );
  const showNanoDedication = showLegacyDedication && Boolean(legacyDedication?.text);
  const hasNanoActive = storybookFetching || dedicationFetching;
  const scenePlaybackMs = useMemo(() => getScenePlaybackMs(scene), [scene]);
  const isFinished = sceneIndex === scenes.length - 1;
  const totalProgress = useMemo(
    () => ((sceneIndex + 1) / scenes.length) * 100,
    [sceneIndex, scenes.length]
  );
  const cameraMove = useMemo(() => {
    const direction = sceneIndex % 2 === 0 ? 1 : -1;
    return {
      x: direction * 28,
      y: sceneIndex % 3 === 0 ? -18 : 16,
      startScale: sceneIndex % 2 === 0 ? 1.04 : 1.14,
      endScale: sceneIndex % 2 === 0 ? 1.18 : 1.03,
    };
  }, [sceneIndex]);

  useEffect(() => {
    setSceneIndex((current) => Math.min(current, Math.max(0, scenes.length - 1)));
  }, [scenes.length]);

  useEffect(() => {
    if (!forceCredits || !scenes.length) return;
    setSceneIndex(scenes.length - 1);
  }, [forceCredits, scenes.length]);

  useEffect(() => {
    if (!playing || isFinished) return;

    const timer = window.setTimeout(() => {
      setSceneIndex((current) => Math.min(scenes.length - 1, current + 1));
    }, scenePlaybackMs);

    return () => window.clearTimeout(timer);
  }, [playing, scenePlaybackMs, sceneIndex, isFinished, scenes.length]);

  useEffect(() => {
    setShowLegacyCredits(false);
    setShowLegacyDedication(false);
    setShowLegacyDedicationText(false);
    setDedicationNonce(undefined);
    if (!hasLegacyCredits) return;
    setDedicationNonce(scene.id + '-' + Date.now());
    if (forceCredits || fastCredits) {
      setShowLegacyCredits(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowLegacyCredits(true);
    }, getTypedNarrativeMs(scene) + 2800);

    return () => window.clearTimeout(timer);
  }, [scene, hasLegacyCredits, forceCredits, fastCredits]);

  useEffect(() => {
    setShowLegacyDedication(false);
    setShowLegacyDedicationText(false);
    if (!showLegacyCredits || !hasLegacyCredits || !scene.creditMembers?.length) return;

    const timer = window.setTimeout(() => {
      setShowLegacyDedication(true);
      setShowLegacyDedicationText(true);
    }, fastCredits ? 2600 : Math.max(8000, getCreditRollDurationSeconds(scene.creditMembers.length) * 1000 - 6500));

    return () => window.clearTimeout(timer);
  }, [showLegacyCredits, hasLegacyCredits, scene.id, scene.creditMembers?.length, fastCredits]);

  useEffect(() => {
    if (!showNanoDedication || !showLegacyDedicationText) return;

    const timer = window.setTimeout(() => {
      setShowLegacyDedicationText(false);
    }, fastCredits ? 3200 : 8000);

    return () => window.clearTimeout(timer);
  }, [showNanoDedication, showLegacyDedicationText, fastCredits]);

  useEffect(() => {
    const wakeLockApi = (navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
    }).wakeLock;
    if (!wakeLockApi) return;

    let cancelled = false;

    const releaseWakeLock = () => {
      const lock = wakeLockRef.current;
      wakeLockRef.current = null;
      if (lock) void lock.release().catch(() => undefined);
    };

    const requestWakeLock = async () => {
      try {
        releaseWakeLock();
        const lock = await wakeLockApi.request('screen');
        if (cancelled || !playing) {
          void lock.release().catch(() => undefined);
          return;
        }
        wakeLockRef.current = lock;
      } catch {
        wakeLockRef.current = null;
      }
    };

    if (playing) {
      void requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && playing) void requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [playing]);

  useEffect(() => {
    const audios = [primaryMusicRef.current, secondaryMusicRef.current] as const;
    const cancelFade = () => {
      if (musicFadeFrameRef.current) window.cancelAnimationFrame(musicFadeFrameRef.current);
      musicFadeFrameRef.current = null;
      musicFadeRunningRef.current = false;
    };

    const crossfadeToNextTrack = () => {
      if (musicFadeRunningRef.current) return;
      const currentIndex = activeMusicRef.current;
      const nextIndex = currentIndex === 0 ? 1 : 0;
      const current = audios[currentIndex];
      const next = audios[nextIndex];
      if (!current || !next) return;

      musicFadeRunningRef.current = true;
      next.currentTime = 0;
      next.volume = 0;
      void next.play().catch(() => {
        musicFadeRunningRef.current = false;
        setMusicEnabled(false);
      });

      const startedAt = performance.now();
      const fadeMs = STORYTELLER_CROSSFADE_SECONDS * 1000;
      const step = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / fadeMs);
        current.volume = STORYTELLER_MUSIC_VOLUME * (1 - progress);
        next.volume = STORYTELLER_MUSIC_VOLUME * progress;

        if (progress < 1) {
          musicFadeFrameRef.current = window.requestAnimationFrame(step);
          return;
        }

        current.pause();
        current.currentTime = 0;
        current.volume = STORYTELLER_MUSIC_VOLUME;
        next.volume = STORYTELLER_MUSIC_VOLUME;
        activeMusicRef.current = nextIndex as 0 | 1;
        musicFadeFrameRef.current = null;
        musicFadeRunningRef.current = false;
      };

      musicFadeFrameRef.current = window.requestAnimationFrame(step);
    };

    const handleTimeUpdate = () => {
      const current = audios[activeMusicRef.current];
      if (!current || !Number.isFinite(current.duration) || current.duration <= 0) return;
      if (current.duration - current.currentTime <= STORYTELLER_CROSSFADE_SECONDS) crossfadeToNextTrack();
    };

    const handleEnded = () => crossfadeToNextTrack();

    audios.forEach((audio, index) => {
      if (!audio) return;
      audio.loop = false;
      audio.volume = index === activeMusicRef.current ? STORYTELLER_MUSIC_VOLUME : 0;
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
    });

    if (!musicEnabled || !playing) {
      cancelFade();
      audios.forEach((audio) => audio?.pause());
      return () => {
        audios.forEach((audio) => {
          audio?.removeEventListener('timeupdate', handleTimeUpdate);
          audio?.removeEventListener('ended', handleEnded);
        });
      };
    }

    const activeAudio = audios[activeMusicRef.current];
    activeAudio?.play().catch(() => setMusicEnabled(false));

    return () => {
      audios.forEach((audio) => {
        audio?.removeEventListener('timeupdate', handleTimeUpdate);
        audio?.removeEventListener('ended', handleEnded);
      });
    };
  }, [musicEnabled, playing]);

  useEffect(() => {
    return () => {
      if (musicFadeFrameRef.current) window.cancelAnimationFrame(musicFadeFrameRef.current);
      primaryMusicRef.current?.pause();
      secondaryMusicRef.current?.pause();
    };
  }, []);

  const toggleMusic = () => setMusicEnabled((value) => !value);
  const togglePlaying = () => setPlaying((value) => !value);

  const handleStagePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-legado-control="true"]')) return;
    togglePlaying();
  };

  const advance = () => {
    if (isFinished) {
      setSceneIndex(0);
      setPlaying(true);
      return;
    }

    setSceneIndex((current) => Math.min(scenes.length - 1, current + 1));
  };

  const goToPrevious = () => {
    setPlaying(true);
    setSceneIndex((current) => Math.max(0, current - 1));
  };

  const goToNext = () => {
    setPlaying(true);
    setSceneIndex((current) => Math.min(scenes.length - 1, current + 1));
  };

  const goToScene = (index: number) => {
    setPlaying(true);
    setSceneIndex(index);
    setMapOpen(false);
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#080706] text-[#fff7e6]">
      <style>{`
        @keyframes scene-progress {
          from { width: 0%; }
          to { width: 100%; }
        }

        .scene-progress {
          animation: scene-progress var(--scene-duration) linear forwards;
        }

        @keyframes legado-cursor {
          0%, 45% { opacity: 1; }
          46%, 100% { opacity: 0; }
        }

        .typewriter-cursor {
          display: inline-block;
          margin-left: 0.12em;
          animation: legado-cursor 0.75s steps(1, end) infinite;
        }

        @keyframes legacy-credit-roll {
          from { transform: translateY(var(--credit-start-y, 58vh)); }
          to { transform: translateY(-100%); }
        }

        .legacy-credit-roll {
          animation: legacy-credit-roll var(--credit-duration) linear forwards;
        }

        @keyframes legacy-document-carousel {
          from { transform: translateX(100vw); }
          to { transform: translateX(-100%); }
        }

        .legacy-document-carousel {
          width: max-content;
          animation: legacy-document-carousel 42s linear infinite;
        }

        @media (min-width: 768px) {
          .legacy-credit-roll {
            --credit-start-y: 50vh;
          }
        }

      `}</style>
      <audio ref={primaryMusicRef} src={STORYTELLER_MUSIC_TRACKS[0]} preload="auto" />
      <audio ref={secondaryMusicRef} src={STORYTELLER_MUSIC_TRACKS[1]} preload="auto" />

      <div className="relative h-full w-full overflow-hidden bg-[#080706]" onPointerUp={handleStagePointerUp}>

        <AnimatePresence initial={false}>
          <motion.section
            key={scene.id}
            className="absolute inset-0"
            initial={{ opacity: 0.28, scale: 1.025 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.38, scale: 1.012 }}
            transition={{ duration: 1.65, ease: 'easeInOut' }}
          >
            <motion.div
              className="absolute inset-[-8%] bg-cover bg-center"
              style={{ backgroundImage: `url(${scene.backgroundImage})` }}
              initial={{ scale: cameraMove.startScale, x: -cameraMove.x, y: -cameraMove.y, opacity: 0.92 }}
              animate={{ scale: cameraMove.endScale, x: cameraMove.x, y: cameraMove.y, opacity: 1 }}
              transition={{
                scale: { duration: scenePlaybackMs / 1000, ease: 'easeInOut' },
                x: { duration: scenePlaybackMs / 1000, ease: 'easeInOut' },
                y: { duration: scenePlaybackMs / 1000, ease: 'easeInOut' },
                opacity: { duration: 0.55 },
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_42%,rgba(255,244,218,0.08)_0%,rgba(8,7,6,0.28)_38%,rgba(8,7,6,0.82)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,7,6,0.82),rgba(8,7,6,0.32)_42%,rgba(8,7,6,0.56))]" />
            <div className="absolute inset-0 bg-[#9a6d3f]/20 mix-blend-color" />
            {!showLegacyCredits && scene.visual !== 'legacy' && scene.memberPhotos?.length ? (
              <MemberPhotoCollage photos={scene.memberPhotos} />
            ) : scene.archiveImage && (
              <motion.img
                src={scene.archiveImage}
                alt={scene.archiveCaption || ''}
                className="pointer-events-none absolute bottom-[-2vh] left-[-7vw] z-20 h-[50vh] max-h-[540px] min-h-[280px] w-auto object-contain opacity-60 mix-blend-screen sepia [mask-image:radial-gradient(circle_at_center,black_0%,black_46%,transparent_82%)] md:left-auto md:right-[-4vw]"
                draggable={false}
                initial={{ opacity: 0, scale: 0.98, x: 18, filter: 'blur(3px)' }}
                animate={{ opacity: 0.66, scale: 1.08, x: 0, filter: 'blur(0.4px)' }}
                transition={{ duration: Math.min(5.5, scenePlaybackMs / 2500), delay: 0.45, ease: 'easeInOut' }}
              />
            )}
            <LineageThread scene={scene} />
            <NarrativeText scene={scene} playing={playing} hideBody={showLegacyCredits} wide={!scene.memberPhotos?.length} />
            {!showLegacyCredits && scene.id === 'puente-presente' && scene.documentThumbnails?.length ? (
              <DocumentThumbnailCarousel documents={scene.documentThumbnails} />
            ) : null}
            <AnimatePresence>
              {showLegacyCredits && scene.creditMembers?.length ? (
                <LegacyCredits
                  members={scene.creditMembers}
                  dedication={legacyDedication || null}
                  showDedication={showNanoDedication}
                  showDedicationText={showLegacyDedicationText}
                />
              ) : null}
            </AnimatePresence>
          </motion.section>
        </AnimatePresence>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-50 h-1 bg-[#f7ead0]/10">
          <div
            key={`${scene.id}-${playing ? 'playing' : 'paused'}`}
            className={playing && !isFinished ? 'scene-progress h-full bg-[#991b1b]' : 'h-full bg-[#991b1b]'}
            style={{
              width: isFinished ? '100%' : undefined,
              '--scene-duration': `${scenePlaybackMs}ms`,
            } as React.CSSProperties}
          />
        </div>

        <div data-legado-control="true" className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-50 flex items-center gap-2 opacity-95 transition-opacity hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#111827] bg-[#f7f3ea]/90 text-[#111827] shadow-[0_14px_40px_rgba(0,0,0,0.32)] backdrop-blur transition"
            aria-label="Volver a la app"
            title="Volver a la app"
          >
            <Home className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggleMusic}
            className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#111827] bg-[#f7f3ea]/90 text-[#111827] shadow-[0_14px_40px_rgba(0,0,0,0.32)] backdrop-blur transition"
            aria-label={musicEnabled ? 'Apagar musica' : 'Encender musica'}
            title={musicEnabled ? 'Apagar musica' : 'Encender musica'}
          >
            {musicEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={togglePlaying}
            className="grid h-10 w-10 place-items-center rounded-full border-2 shadow-[0_14px_40px_rgba(0,0,0,0.32)] backdrop-blur transition"
            style={hasNanoActive ? {
              backgroundColor: '#10b981',
              borderColor: '#d1fae5',
              color: '#ffffff',
              boxShadow: '0 0 0 4px rgba(110, 231, 183, 0.82), 0 14px 40px rgba(6, 78, 59, 0.44)',
            } : {
              backgroundColor: 'rgba(247, 243, 234, 0.9)',
              borderColor: '#111827',
              color: '#111827',
            }}
            aria-label={playing ? 'Pausar' : 'Reproducir'}
            title={playing ? 'Pausar' : 'Reproducir'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        </div>

        <div data-legado-control="true" className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-50 flex items-center gap-2 opacity-35 transition-opacity hover:opacity-95">
          <button
            type="button"
            onClick={goToPrevious}
            disabled={sceneIndex === 0}
            className="grid h-11 w-11 place-items-center rounded-full border border-[#f8e5bd]/35 bg-[#080706]/45 text-[#fff7e6] shadow-[0_14px_40px_rgba(0,0,0,0.28)] backdrop-blur transition disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Escena anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            disabled={isFinished}
            className="grid h-11 w-11 place-items-center rounded-full border border-[#f8e5bd]/35 bg-[#080706]/45 text-[#fff7e6] shadow-[0_14px_40px_rgba(0,0,0,0.28)] backdrop-blur transition disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Escena siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div data-legado-control="true" className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-50">
          <button
            type="button"
            onClick={() => setMapOpen((value) => !value)}
            className="grid h-11 w-11 place-items-center rounded-full border border-[#f8e5bd]/35 bg-[#080706]/45 text-[#fff7e6] shadow-[0_14px_40px_rgba(0,0,0,0.28)] backdrop-blur transition hover:bg-[#080706]/68"
            aria-label="Mapa de escenas"
          >
            {mapOpen ? <X className="h-5 w-5" /> : <Map className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mapOpen && (
            <motion.div
              className="absolute bottom-[calc(max(1rem,env(safe-area-inset-bottom))+3.5rem)] left-4 z-50 max-h-[48vh] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-[#f8e5bd]/28 bg-[#080706]/78 p-3 text-[#fff7e6] shadow-[0_24px_70px_rgba(0,0,0,0.48)] backdrop-blur-md"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f8e5bd]/80">Mapa narrativo</p>
                <p className="text-xs font-bold text-[#fff7e6]/55">{sceneIndex + 1}/{scenes.length}</p>
              </div>
              <div className="max-h-[38vh] space-y-1 overflow-y-auto pr-1">
                {scenes.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToScene(index)}
                    className={`flex w-full items-center gap-2 rounded px-2 py-2 text-left transition ${index === sceneIndex ? 'bg-[#f8e5bd]/18 text-[#fff7e6]' : 'text-[#fff7e6]/68 hover:bg-[#f8e5bd]/10 hover:text-[#fff7e6]'}`}
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${index === sceneIndex ? 'bg-[#b88a4d]' : 'bg-[#fff7e6]/35'}`} />
                    <span className="min-w-0 flex-1 truncate text-xs font-bold md:text-sm">{item.title}</span>
                    {item.year ? <span className="text-[0.62rem] font-black text-[#f8e5bd]/65">{item.year}</span> : null}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pointer-events-none absolute bottom-5 left-20 z-40 hidden w-40 overflow-hidden rounded-full bg-[#f7ead0]/12 md:block">
          <div className="h-1.5 rounded-full bg-[#991b1b]" style={{ width: `${totalProgress}%` }} />
        </div>
      </div>
    </div>
  );
};

export default LegadoSangiovanniGame;
