import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { LegadoStoryScene } from './storyScenes';

const splitNarrativeLines = (text: string) =>
  text
    .split(/(?<=\.)\s+/)
    .map((line) => line.trim())
    .filter(Boolean);

const getTypewriterCharMs = (length: number) => {
  if (length > 900) return 18;
  if (length > 650) return 20;
  if (length > 420) return 24;
  if (length > 240) return 28;
  return 34;
};

const NarrativeText = ({ scene }: { scene: LegadoStoryScene }) => {
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
  <div className="absolute left-[5vw] top-[5vh] z-30 max-w-[70vw] md:top-[7vh] md:max-w-[58vw] xl:max-w-[48vw]">
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
      className="mt-4 max-h-[43vh] max-w-[68vw] overflow-hidden pr-2 [mask-image:linear-gradient(to_bottom,transparent_0%,black_8%,black_88%,transparent_100%)] md:mt-5 md:max-h-none md:max-w-2xl md:overflow-visible md:pr-0 md:[mask-image:none]"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.55, ease: 'easeOut' }}
    >
      <p className="whitespace-pre-line font-serif text-base font-semibold leading-7 text-[#fff7e6]/88 drop-shadow-[0_3px_18px_rgba(0,0,0,0.78)] md:text-2xl md:leading-9">
        {typedText}
        {typedText.length < typedSource.length ? <span className="typewriter-cursor">|</span> : null}
      </p>
    </motion.div>
  </div>
  );
};

export default NarrativeText;
