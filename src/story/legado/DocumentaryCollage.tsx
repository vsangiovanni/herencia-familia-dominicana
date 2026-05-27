import { motion } from 'framer-motion';
import type { LegadoStoryVisual } from './storyScenes';

type Props = {
  visual: LegadoStoryVisual;
};

const ink = '#1d1712';
const sepia = '#6f4d32';

const PhotoCard = ({ x, y, name, delay }: { x: number; y: number; name: string; delay: number }) => (
  <motion.g
    initial={{ opacity: 0, y: 22, rotate: -2 }}
    animate={{ opacity: 1, y: 0, rotate: -2 }}
    transition={{ duration: 0.9, delay }}
  >
    <rect x={x} y={y} width="118" height="154" rx="2" fill="#d9c3a2" stroke={ink} strokeWidth="2" />
    <rect x={x + 13} y={y + 14} width="92" height="94" fill="#3a2a20" opacity="0.22" />
    <path
      d={`M${x + 44} ${y + 61} C${x + 42} ${y + 38} ${x + 75} ${y + 38} ${x + 73} ${y + 61} C${x + 72} ${y + 80} ${x + 46} ${y + 80} ${x + 44} ${y + 61}Z`}
      fill="#2b211a"
      opacity="0.72"
    />
    <path
      d={`M${x + 28} ${y + 105} C${x + 45} ${y + 86} ${x + 75} ${y + 86} ${x + 91} ${y + 105}`}
      fill="transparent"
      stroke="#2b211a"
      strokeWidth="11"
      strokeLinecap="round"
      opacity="0.68"
    />
    <path d={`M${x + 20} ${y + 127} C${x + 43} ${y + 119} ${x + 78} ${y + 136} ${x + 99} ${y + 124}`} stroke={sepia} strokeWidth="2" fill="transparent" />
    <text x={x + 59} y={y + 144} textAnchor="middle" className="fill-[#3b2a1d] text-[14px] font-semibold">
      {name}
    </text>
  </motion.g>
);

const ShipSketch = () => (
  <motion.g
    initial={{ opacity: 0, x: -80 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 1.2, delay: 0.6 }}
  >
    <path d="M90 657 C190 684 318 684 425 655 L390 715 C275 748 164 735 116 704 Z" fill="#2b241f" opacity="0.86" />
    <path d="M116 655 C202 632 310 634 425 655" stroke={ink} strokeWidth="5" fill="transparent" />
    <path d="M170 625 V455 M244 640 V410 M326 630 V478" stroke={ink} strokeWidth="6" strokeLinecap="round" />
    <path d="M168 488 C214 458 258 462 306 500 M242 438 C300 400 350 418 388 462" stroke={ink} strokeWidth="4" fill="transparent" />
    <path d="M124 742 C205 716 293 760 383 731 C444 711 487 724 530 742" stroke={sepia} strokeWidth="4" fill="transparent" opacity="0.55" />
  </motion.g>
);

const PassportSketch = () => (
  <motion.g
    initial={{ opacity: 0, rotate: 8, y: 30 }}
    animate={{ opacity: 1, rotate: 8, y: 0 }}
    transition={{ duration: 1, delay: 1.25 }}
  >
    <rect x="1010" y="398" width="178" height="230" rx="4" fill="#b79664" stroke={ink} strokeWidth="3" opacity="0.9" />
    <rect x="1030" y="422" width="138" height="186" rx="2" fill="transparent" stroke="#4a3221" strokeWidth="2" opacity="0.55" />
    <path d="M1062 472 C1088 452 1115 452 1141 472 C1126 489 1080 489 1062 472Z" stroke="#4a3221" strokeWidth="4" fill="transparent" />
    <path d="M1050 532 H1152 M1050 558 H1152 M1068 585 H1134" stroke="#4a3221" strokeWidth="3" strokeLinecap="round" opacity="0.72" />
    <text x="1099" y="455" textAnchor="middle" className="fill-[#4a3221] text-[18px] font-black tracking-[0.16em]">
      PASSAPORTO
    </text>
  </motion.g>
);

const DocumentaryCollage = ({ visual }: Props) => (
  <svg className="absolute inset-0 z-10 h-full w-full" viewBox="0 0 1440 860" aria-hidden="true">
    <defs>
      <filter id="collageShadow">
        <feDropShadow dx="10" dy="12" stdDeviation="8" floodColor="#1d1712" floodOpacity="0.22" />
      </filter>
    </defs>

    <motion.g filter="url(#collageShadow)">
      {(visual === 'calabria' || visual === 'migration' || visual === 'legacy') && <ShipSketch />}
      {(visual === 'migration' || visual === 'legacy') && <PassportSketch />}
      {(visual === 'calabria' || visual === 'migration' || visual === 'familyTree' || visual === 'legacy') && (
        <>
          <PhotoCard x={610} y={365} name="Paolo" delay={0.9} />
          <PhotoCard x={742} y={356} name="Vincenzo" delay={1.05} />
        </>
      )}
    </motion.g>

    {(visual === 'migration' || visual === 'legacy') && (
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.65 }}>
        <path d="M486 660 C620 612 734 627 845 585 C942 548 1008 511 1110 448" stroke="#7f1d1d" strokeWidth="4" strokeDasharray="10 13" fill="transparent" />
        <circle cx="486" cy="660" r="8" fill="#7f1d1d" />
        <circle cx="1110" cy="448" r="8" fill="#7f1d1d" />
      </motion.g>
    )}
  </svg>
);

export default DocumentaryCollage;
