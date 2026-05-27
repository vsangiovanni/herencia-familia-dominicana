import { motion } from 'framer-motion';
import type { LegadoStoryVisual } from './storyScenes';

const pathTransition = { duration: 3.8, ease: 'easeInOut' as const };

const DrawPath = ({ d, className = '', delay = 0 }: { d: string; className?: string; delay?: number }) => (
  <motion.path
    d={d}
    className={className}
    fill="transparent"
    initial={{ pathLength: 0, opacity: 0 }}
    animate={{ pathLength: 1, opacity: 1 }}
    transition={{ ...pathTransition, delay }}
  />
);

const InkPath = ({ d, delay = 0, width = 6 }: { d: string; delay?: number; width?: number }) => (
  <>
    <motion.path
      d={d}
      fill="transparent"
      stroke="rgba(17,24,39,0.18)"
      strokeWidth={width + 6}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ ...pathTransition, delay }}
    />
    <motion.path
      d={d}
      fill="transparent"
      stroke="#111827"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ ...pathTransition, delay: delay + 0.08 }}
    />
  </>
);

const DrawCircle = ({ cx, cy, r, delay = 0 }: { cx: number; cy: number; r: number; delay?: number }) => (
  <motion.circle
    cx={cx}
    cy={cy}
    r={r}
    className="stroke-[#111827] stroke-[5]"
    fill="rgba(153,27,27,0.06)"
    initial={{ scale: 0.4, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.7, delay }}
    style={{ transformOrigin: `${cx}px ${cy}px` }}
  />
);

const AnimatedMap = ({ visual }: { visual: LegadoStoryVisual }) => (
  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 860" aria-hidden="true">
    <defs>
      <linearGradient id="legadoGold" x1="0" x2="1" y1="0" y2="1">
        <stop stopColor="#b91c1c" />
        <stop offset="1" stopColor="#7f1d1d" />
      </linearGradient>
      <filter id="legadoGlow">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="paperRough">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" />
      </filter>
    </defs>

    <motion.rect
      x="64"
      y="62"
      width="1312"
      height="724"
      rx="4"
      fill="rgba(255,252,243,0.42)"
      stroke="rgba(17,24,39,0.16)"
      strokeWidth="2"
      filter="url(#paperRough)"
      initial={{ scale: 0.45, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.5 }}
      style={{ transformOrigin: '720px 430px' }}
    />

    <DrawPath d="M156 540 C212 430 316 430 354 324 C412 169 565 172 640 255 C707 330 646 451 732 508 C827 571 956 484 1056 548 C1140 601 1189 684 1284 656" className="stroke-[#111827]/20 stroke-[4]" />
    <DrawPath d="M112 228 C244 176 354 222 470 160 C600 90 720 130 812 202 C906 274 1010 278 1132 218 C1230 170 1306 182 1364 230" className="stroke-[#111827]/16 stroke-[3]" delay={0.2} />

    {(visual === 'calabria' || visual === 'legacy') && (
      <g>
        <InkPath d="M252 560 C306 468 346 392 392 332 C446 404 491 484 532 560" delay={0.25} width={7} />
        <InkPath d="M418 560 C476 441 535 330 604 252 C676 355 728 464 788 560" delay={0.45} width={7} />
        <InkPath d="M688 560 C730 486 775 414 820 358 C873 428 914 493 958 560" delay={0.65} width={6} />
        <InkPath d="M472 612 V502 L574 430 L676 502 V612" delay={0.9} width={6} />
        <InkPath d="M430 506 L574 404 L720 506" delay={1.1} width={8} />
        <DrawPath d="M416 668 C461 648 493 680 537 660 C584 637 620 684 665 659 C684 650 699 649 718 656" className="stroke-[#991b1b] stroke-[5]" delay={1.65} />
      </g>
    )}

    {visual === 'migration' && (
      <g>
        <DrawPath d="M314 472 C498 320 660 358 812 440 S1038 568 1210 402" className="stroke-[url(#legadoGold)] stroke-[7]" delay={0.2} />
        <InkPath d="M438 478 C514 490 612 490 704 478 L648 542 C588 535 548 536 498 542 Z" delay={0.7} width={6} />
        <InkPath d="M572 476 V330 M586 346 C650 376 684 420 698 466 H586 Z" delay={0.95} width={6} />
        <DrawPath d="M284 438 C324 426 350 446 389 433" className="stroke-[#991b1b] stroke-[5]" delay={1.4} />
        <DrawPath d="M1160 382 C1210 365 1252 397 1304 375" className="stroke-[#991b1b] stroke-[5]" delay={1.7} />
      </g>
    )}

    {visual === 'puertoPlata' && (
      <g>
        <InkPath d="M360 612 V428 H490 V612 M538 612 V342 H700 V612 M748 612 V452 H914 V612 M956 612 V500 H1082 V612" delay={0.3} width={7} />
        <InkPath d="M310 612 H1128" delay={0.55} width={9} />
        <DrawPath d="M330 316 C494 250 628 300 760 258 S1026 188 1160 282" className="stroke-[url(#legadoGold)] stroke-[7]" delay={0.9} />
        <DrawPath d="M610 686 C672 664 732 702 792 676 C826 661 858 670 884 682" className="stroke-[#991b1b] stroke-[5]" delay={1.55} />
      </g>
    )}

    {(visual === 'familyTree' || visual === 'legacy') && (
      <g filter="url(#legadoGlow)">
        <InkPath d="M720 646 C702 522 710 394 720 270" delay={0.2} width={9} />
        <InkPath d="M720 400 C560 386 502 286 410 212 M720 408 C878 386 940 286 1030 212 M718 520 C590 526 510 606 424 690 M724 520 C850 526 934 606 1020 690" delay={0.5} width={6} />
        {[410, 1030, 424, 1020, 720].map((x, index) => (
          <DrawCircle key={x} cx={x} cy={[212, 212, 690, 690, 270][index]} r={45} delay={1 + index * 0.15} />
        ))}
      </g>
    )}
  </svg>
);

export default AnimatedMap;
