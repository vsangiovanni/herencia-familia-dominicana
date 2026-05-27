import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Home, Map, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSiennaStorybook } from '@/hooks/useSiennaData';
import NarrativeText from '@/story/legado/NarrativeText';
import type { LegadoStoryScene } from '@/story/legado/storyScenes';
import { legadoStoryScenes } from '@/story/legado/storyScenes';

const TYPEWRITER_INITIAL_DELAY_MS = 720;
const getTypewriterCharMs = (length: number) => {
  if (length > 900) return 18;
  if (length > 650) return 20;
  if (length > 420) return 24;
  if (length > 240) return 28;
  return 34;
};
const getAfterTypewriterHoldMs = (length: number) => {
  if (length > 900) return 4500;
  if (length > 650) return 3800;
  if (length > 420) return 3200;
  if (length > 240) return 3000;
  return 2600;
};

const STORYTELLER_MUSIC_SRC = '/game/legado/audio/across-two-shores.mp3';

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
  return Math.max(minimum, calculated + 900);
};

const MemberPhotoCollage = ({ photos }: { photos: NonNullable<LegadoStoryScene['memberPhotos']> }) => {
  if (!photos.length) return null;

  return (
    <motion.div
      className="pointer-events-none absolute right-[5vw] top-[33vh] z-30 flex max-h-[54vh] max-w-[5.6rem] flex-col flex-nowrap items-center gap-1.5 overflow-hidden md:bottom-[8vh] md:left-auto md:right-[7vw] md:top-auto md:max-h-none md:max-w-[38vw] md:flex-row md:flex-wrap md:items-end md:justify-end md:gap-2.5 md:overflow-visible"
      initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 1.05, delay: 0.55, ease: 'easeOut' }}
    >
      {photos.slice(0, 12).map((photo, index) => (
        <div
          key={`${photo.memberId}-${index}`}
          className="group relative grid place-items-center"
        >
          <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-[#f8e5bd]/80 bg-[#f7ead0] shadow-[0_12px_32px_rgba(0,0,0,0.42)] ring-2 ring-[#080706]/50 md:h-20 md:w-20 xl:h-24 xl:w-24">
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
          <div className="mt-0.5 max-w-[4.6rem] truncate rounded-full bg-[#080706]/58 px-1.5 py-0.5 text-center text-[0.52rem] font-bold uppercase tracking-normal text-[#fff7e6]/90 backdrop-blur md:mt-1 md:max-w-[6rem] md:px-2 md:text-[0.65rem]">
            {photo.name}
          </div>
        </div>
      ))}
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

const formatCreditYears = (member: NonNullable<LegadoStoryScene['creditMembers']>[number]) => {
  const birthYear = member.birth?.slice(0, 4);
  const deathYear = member.death?.slice(0, 4);
  if (birthYear && deathYear) return birthYear + ' - ' + deathYear;
  if (birthYear) return 'N. ' + birthYear;
  if (deathYear) return 'F. ' + deathYear;
  return 'Memoria familiar';
};

const LegacyCredits = ({ members }: { members: NonNullable<LegadoStoryScene['creditMembers']> }) => {
  const durationSeconds = Math.max(46, Math.min(92, members.length * 1.15));
  const photoMembers = members
    .map((member, index) => ({ ...member, creditIndex: index }))
    .filter((member) => member.photoData);

  return (
    <motion.div
      className="pointer-events-none absolute bottom-0 left-[7vw] right-[5vw] top-[20vh] z-[35] overflow-hidden text-left md:left-[11vw] md:right-[14vw] md:top-[18vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
    >
      <div className="absolute right-0 top-[8vh] z-10 hidden h-[66vh] w-16 overflow-hidden md:block">
        <div
          className="legacy-credit-photo-queue flex flex-col items-center gap-2"
          style={{
            '--credit-duration': durationSeconds + 's',
            '--photo-count': photoMembers.length,
          } as React.CSSProperties}
        >
        {photoMembers.slice(0, 18).map((member) => (
          <div
            key={'rail-' + member.memberId}
            className="legacy-credit-photo-rail h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#f8e5bd]/55 bg-[#f7ead0] shadow-[0_10px_26px_rgba(0,0,0,0.42)]"
            style={{ '--dock-delay': Math.min(member.creditIndex * 0.95, durationSeconds - 4) + 's' } as React.CSSProperties}
          >
            <img
              src={member.photoData || ''}
              alt=""
              className="h-full w-full object-cover sepia-[0.2] contrast-[1.05] saturate-[0.88]"
              draggable={false}
            />
          </div>
        ))}
        </div>
      </div>
      <div
        className="legacy-credit-roll flex max-w-4xl flex-col items-stretch gap-3 pb-[48vh] md:pr-24"
        style={{ '--credit-duration': durationSeconds + 's' } as React.CSSProperties}
      >
        <p className="mb-5 font-serif text-2xl font-black uppercase tracking-normal text-[#fff7e6] drop-shadow-[0_4px_22px_rgba(0,0,0,0.8)] md:text-5xl">
          Creditos del linaje
        </p>
        {members.map((member, index) => (
          <div key={member.memberId + '-' + index} className="flex w-full items-center gap-3 border-b border-[#f8e5bd]/10 pb-2 md:gap-5">
            {member.photoData ? (
              <div
                className="legacy-credit-photo-dock h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[#f8e5bd]/78 bg-[#f7ead0] shadow-[0_10px_26px_rgba(0,0,0,0.42)] md:h-16 md:w-16"
                style={{ '--dock-delay': Math.min(index * 0.95, durationSeconds - 4) + 's' } as React.CSSProperties}
              >
                <img
                  src={member.photoData}
                  alt={member.name}
                  className="h-full w-full object-cover sepia-[0.2] contrast-[1.05] saturate-[0.88]"
                  draggable={false}
                />
              </div>
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-full border border-[#f8e5bd]/18 bg-[#080706]/35 md:h-16 md:w-16" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <p className="font-serif text-lg font-black leading-tight text-[#fff7e6] drop-shadow-[0_3px_16px_rgba(0,0,0,0.78)] md:text-3xl">
                {member.name}
              </p>
              <p className="mt-1 text-[0.62rem] font-black uppercase tracking-[0.22em] text-[#f8e5bd]/78 md:text-xs">
                {formatCreditYears(member)} · {member.treePosition || 'Linaje familiar'}
              </p>
            </div>
          </div>
        ))}
        <p className="mt-8 font-serif text-xl font-black text-[#fff7e6]/92 md:text-3xl">
          Una historia viva, guardada por la familia.
        </p>
      </div>
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
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const aiNarrative = useMemo(() => new URLSearchParams(window.location.search).get('ai') === '1', []);
  const forceCredits = useMemo(() => new URLSearchParams(window.location.search).get('credits') === '1', []);
  const { data: storybook } = useSiennaStorybook(true, aiNarrative);

  const scenes = storybook?.slides?.length ? storybook.slides : legadoStoryScenes;
  const scene = scenes[sceneIndex] || scenes[0];
  const isNanoNarrative = scene?.narrativeMode === 'openai' || scene?.narrativeMode === 'cache';
  const hasLegacyCredits = scene.visual === 'legacy' && Boolean(scene.creditMembers?.length);
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
    if (!hasLegacyCredits) return;
    if (forceCredits) {
      setShowLegacyCredits(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowLegacyCredits(true);
    }, getTypedNarrativeMs(scene) + 1500);

    return () => window.clearTimeout(timer);
  }, [scene, hasLegacyCredits, forceCredits]);

  useEffect(() => {
    const audio = musicRef.current;
    if (!audio) return;

    audio.volume = 0.72;
    audio.loop = true;

    if (!musicEnabled) {
      audio.pause();
      return;
    }

    audio.play().catch(() => setMusicEnabled(false));
  }, [musicEnabled]);

  useEffect(() => {
    return () => {
      musicRef.current?.pause();
    };
  }, []);

  const toggleMusic = () => setMusicEnabled((value) => !value);

  const advance = () => {
    if (isFinished) {
      setSceneIndex(0);
      setPlaying(true);
      return;
    }

    setSceneIndex((current) => Math.min(scenes.length - 1, current + 1));
  };

  const goToPrevious = () => {
    setPlaying(false);
    setSceneIndex((current) => Math.max(0, current - 1));
  };

  const goToNext = () => {
    setPlaying(false);
    setSceneIndex((current) => Math.min(scenes.length - 1, current + 1));
  };

  const goToScene = (index: number) => {
    setPlaying(false);
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
          from { transform: translateY(58vh); }
          to { transform: translateY(-100%); }
        }

        .legacy-credit-roll {
          animation: legacy-credit-roll var(--credit-duration) linear forwards;
        }

        @keyframes legacy-credit-photo-queue {
          from { transform: translateY(0); }
          to { transform: translateY(calc(var(--photo-count) * -3.5rem)); }
        }

        .legacy-credit-photo-queue {
          animation: legacy-credit-photo-queue var(--credit-duration) linear forwards;
        }

        @keyframes legacy-credit-photo-dock {
          0%, 70% {
            opacity: 0;
            transform: translateX(34vw) scale(0.78);
          }
          82% {
            opacity: 1;
            transform: translateX(8vw) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes legacy-credit-photo-rail {
          0%, 70% {
            opacity: 0.9;
            transform: translateX(0) scale(1);
          }
          82% {
            opacity: 0.42;
            transform: translateX(-1.4rem) scale(0.92);
          }
          100% {
            opacity: 0;
            transform: translateX(-4rem) scale(0.74);
          }
        }

        .legacy-credit-photo-dock {
          animation: legacy-credit-photo-dock 1.15s ease-out both;
          animation-delay: var(--dock-delay);
        }

        .legacy-credit-photo-rail {
          animation: legacy-credit-photo-rail 1.15s ease-out both;
          animation-delay: var(--dock-delay);
        }
      `}</style>
      <audio ref={musicRef} src={STORYTELLER_MUSIC_SRC} preload="auto" loop />

      <div className="relative h-full w-full overflow-hidden bg-[#080706]">

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
            {scene.memberPhotos?.length ? (
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
            <NarrativeText scene={scene} hideBody={showLegacyCredits} wide={!scene.memberPhotos?.length} />
            <AnimatePresence>
              {showLegacyCredits && scene.creditMembers?.length ? (
                <LegacyCredits members={scene.creditMembers} />
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

        <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-50 flex items-center gap-2 opacity-95 transition-opacity hover:opacity-100 focus-within:opacity-100">
          {isNanoNarrative ? (
            <div className="hidden rounded-full border border-[#111827] bg-[#f7f3ea]/88 px-3 py-2 text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#111827] shadow-[0_14px_40px_rgba(0,0,0,0.24)] backdrop-blur sm:block">
              Nano
            </div>
          ) : null}
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
            onClick={() => setPlaying((value) => !value)}
            className={`grid h-10 w-10 place-items-center rounded-full border-2 bg-[#f7f3ea]/90 text-[#111827] shadow-[0_14px_40px_rgba(0,0,0,0.32)] backdrop-blur transition ${isNanoNarrative ? 'border-emerald-400 ring-2 ring-emerald-300/80' : 'border-[#111827]'}`}
            aria-label={playing ? 'Pausar' : 'Reproducir'}
            title={isNanoNarrative ? 'Narrativa generada por Nano' : playing ? 'Pausar' : 'Reproducir'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        </div>

        <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-50 flex items-center gap-2 opacity-35 transition-opacity hover:opacity-95">
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

        <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-50">
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

        {isFinished && (
          <button
            type="button"
            onClick={advance}
            className="absolute inset-0 z-10 cursor-default"
            aria-label="Reiniciar historia"
          />
        )}

        <div className="pointer-events-none absolute bottom-5 left-20 z-40 hidden w-40 overflow-hidden rounded-full bg-[#f7ead0]/12 md:block">
          <div className="h-1.5 rounded-full bg-[#991b1b]" style={{ width: `${totalProgress}%` }} />
        </div>
      </div>
    </div>
  );
};

export default LegadoSangiovanniGame;
