import { motion } from 'framer-motion';
import type { LegadoStoryVisual } from './storyScenes';

type Props = {
  visual: LegadoStoryVisual;
  sceneId: string;
};

const routeByVisual: Record<LegadoStoryVisual, { x: number[]; y: number[]; rotate: number[] }> = {
  calabria: {
    x: [640, 600, 520, 455, 390, 340],
    y: [515, 460, 430, 455, 520, 610],
    rotate: [-18, -12, -8, -16, -20, -12],
  },
  migration: {
    x: [330, 455, 600, 760, 940, 1135],
    y: [480, 395, 375, 420, 485, 405],
    rotate: [-20, -8, -4, -10, -18, -8],
  },
  puertoPlata: {
    x: [350, 460, 590, 730, 870, 1030],
    y: [615, 430, 560, 350, 520, 615],
    rotate: [-17, -10, -19, -8, -15, -20],
  },
  familyTree: {
    x: [720, 710, 585, 425, 720, 880, 1030],
    y: [660, 470, 360, 230, 280, 365, 230],
    rotate: [-16, -10, -20, -12, -8, -18, -10],
  },
  legacy: {
    x: [715, 600, 480, 620, 780, 950, 1040],
    y: [650, 540, 690, 405, 305, 500, 690],
    rotate: [-14, -19, -10, -8, -16, -21, -12],
  },
};

const HandDrawing = ({ visual, sceneId }: Props) => {
  const route = routeByVisual[visual];

  return (
    <motion.svg
      key={sceneId}
      className="pointer-events-none absolute inset-0 z-40 h-full w-full"
      viewBox="0 0 1440 860"
      aria-hidden="true"
    >
      <motion.g
        initial={{
          x: route.x[0] + 120,
          y: route.y[0] + 80,
          rotate: route.rotate[0],
          opacity: 0,
        }}
        animate={{
          x: route.x,
          y: route.y,
          rotate: route.rotate,
          opacity: [0, 1, 1, 1, 0.95],
        }}
        transition={{ duration: 7.2, ease: 'easeInOut', times: route.x.map((_, index) => index / (route.x.length - 1)) }}
        style={{ transformOrigin: '80px 82px' }}
      >
        <ellipse cx="89" cy="96" rx="64" ry="28" fill="rgba(17,24,39,0.18)" filter="blur(11px)" />
        <path
          d="M34 57 C42 24 76 15 103 25 C126 34 138 55 133 80 C128 107 101 129 68 125 C40 121 25 91 34 57Z"
          fill="#d0a17d"
        />
        <path
          d="M47 61 C55 35 81 29 101 36 C119 42 128 58 123 78 C119 98 97 113 72 111 C52 109 40 84 47 61Z"
          fill="#efc6a0"
          opacity="0.92"
        />
        <path d="M64 43 C72 61 72 78 65 97" stroke="#9d6d51" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
        <path d="M84 38 C90 58 88 78 82 101" stroke="#9d6d51" strokeWidth="3" strokeLinecap="round" opacity="0.38" />
        <path d="M104 43 C109 61 106 79 99 98" stroke="#9d6d51" strokeWidth="3" strokeLinecap="round" opacity="0.34" />
        <path
          d="M126 70 C150 80 167 95 178 118 C181 126 174 134 165 131 C146 124 130 108 116 88Z"
          fill="#c28f6d"
        />
        <path
          d="M36 81 C22 89 12 103 9 120 C8 128 16 135 25 131 C43 124 51 105 56 87Z"
          fill="#e2b58f"
        />
        <path
          d="M8 128 L180 38"
          stroke="#181512"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path d="M16 124 L188 35" stroke="#f7f2e7" strokeWidth="5" strokeLinecap="round" opacity="0.86" />
        <path d="M0 132 L19 118 L24 135 Z" fill="#111827" />
        <motion.circle
          cx="1"
          cy="132"
          r="6"
          fill="#111827"
          animate={{ scale: [0.75, 1.2, 0.8], opacity: [0.45, 0.95, 0.5] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.g>
    </motion.svg>
  );
};

export default HandDrawing;
