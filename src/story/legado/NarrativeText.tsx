import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { LegadoStoryScene } from './storyScenes';

const splitNarrativeLines = (text: string) =>
  text
    .split(/(?<=\.)\s+/)
    .map((line) => line.trim())
    .filter(Boolean);

const getTypewriterCharMs = (length: number) => {
  if (length > 900) return 26;
  if (length > 650) return 29;
  if (length > 420) return 33;
  if (length > 240) return 38;
  return 44;
};

const IMPORTANT_MEMBER_NAMES = [
  'Alessandro de Paola Sangiovanni',
  'Jocelyn del Jesús Sangiovanni Báez',
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const IMPORTANT_MEMBER_PATTERN = new RegExp(
  '(' + IMPORTANT_MEMBER_NAMES.map(escapeRegExp).join('|') + ')',
  'gi'
);

const renderHighlightedNarrative = (text: string) =>
  text.split(IMPORTANT_MEMBER_PATTERN).map((part, index) => {
    const isImportant = IMPORTANT_MEMBER_NAMES.some(
      (name) => name.localeCompare(part, 'es', { sensitivity: 'base' }) === 0
    );

    if (!isImportant) return part;

    return (
      <span
        key={part + '-' + index}
        className="rounded bg-[#f8e5bd]/22 px-1 font-black text-[#fff7e6] shadow-[0_0_22px_rgba(248,229,189,0.28)] ring-1 ring-[#f8e5bd]/45"
      >
        {part}
      </span>
    );
  });

const NarrativeText = ({
  scene,
  hideBody = false,
  wide = false,
}: {
  scene: LegadoStoryScene;
  hideBody?: boolean;
  wide?: boolean;
}) => {
  const typedSource = useMemo(() => splitNarrativeLines(scene.text).join('\n'), [scene.text]);
  const [typedText, setTypedText] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTypedText('');
    let index = 0;
    let interval: number | undefined;
    const initialDelay = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1;
        setTypedText(typedSource.slice(0, index));
        if (index >= typedSource.length) {
          window.clearInterval(interval);
        }
      }, getTypewriterCharMs(typedSource.length));
    }, 720);

    return () => {
      window.clearTimeout(initialDelay);
      if (interval) window.clearInterval(interval);
    };
  }, [scene.id, typedSource]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [typedText]);

  return (
  <div className={`absolute left-[5vw] top-[5vh] z-30 md:top-[7vh] ${wide ? 'max-w-[88vw] md:max-w-[72vw] xl:max-w-[62vw]' : 'max-w-[70vw] md:max-w-[58vw] xl:max-w-[48vw]'}`}>
    <motion.p
      className="text-xs font-black uppercase tracking-[0.24em] text-[#f4dfb8]/88 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] md:text-sm"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75 }}
    >
      {scene.location}
    </motion.p>
    <motion.h1
      className="mt-3 max-w-5xl font-serif text-3xl font-black uppercase leading-[0.98] tracking-normal text-[#fff7e6] drop-shadow-[0_4px_22px_rgba(0,0,0,0.75)] md:mt-4 md:text-6xl xl:text-7xl"
      initial={{ opacity: 0, filter: 'blur(6px)', clipPath: 'inset(0 100% 0 0)' }}
      animate={{ opacity: 1, filter: 'blur(0px)', clipPath: 'inset(0 0% 0 0)' }}
      transition={{ duration: 1.15, ease: 'easeOut' }}
    >
      {scene.title}
    </motion.h1>
    <motion.div
      className="mt-4 h-1 w-20 bg-[#b88a4d] md:mt-5 md:w-28"
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.95, delay: 0.35 }}
    />
    <motion.div
      ref={scrollRef}
      className={`mt-4 max-h-[61vh] overflow-hidden pr-2 [mask-image:none] md:mt-5 md:max-h-[calc(100vh-21rem)] md:overflow-hidden md:pr-0 xl:max-h-[calc(100vh-23rem)] ${wide ? 'max-w-[86vw] md:max-w-4xl' : 'max-w-[68vw] md:max-w-2xl'}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: hideBody ? 0 : 1, y: 0, filter: hideBody ? 'blur(7px)' : 'blur(0px)' }}
      transition={{ duration: hideBody ? 1.15 : 0.8, delay: hideBody ? 0 : 0.55, ease: 'easeOut' }}
    >
      <p className="whitespace-pre-line font-serif text-base font-semibold leading-7 text-[#fff7e6]/88 drop-shadow-[0_3px_18px_rgba(0,0,0,0.78)] md:text-2xl md:leading-9">
        {renderHighlightedNarrative(typedText)}
        {typedText.length < typedSource.length ? <span className="typewriter-cursor">|</span> : null}
      </p>
    </motion.div>
  </div>
  );
};

export default NarrativeText;
