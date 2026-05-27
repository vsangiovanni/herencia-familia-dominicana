import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { LegadoVincenzoScene } from './LegadoVincenzoScene';
import type { LegacyGameEvent } from './types';

type LegadoGameCanvasProps = {
  onGameEvent: (event: LegacyGameEvent) => void;
};

const LegadoGameCanvas = ({ onGameEvent }: LegadoGameCanvasProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const eventHandlerRef = useRef(onGameEvent);

  useEffect(() => {
    eventHandlerRef.current = onGameEvent;
  }, [onGameEvent]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 430,
      height: 932,
      backgroundColor: '#07111f',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 980 },
          debug: false,
        },
      },
      scene: [new LegadoVincenzoScene((event) => eventHandlerRef.current(event))],
    });

    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[360px] w-full overflow-hidden bg-[#07111f] [&>canvas]:!h-full [&>canvas]:!w-full [&>canvas]:object-cover xl:rounded-md"
    />
  );
};

export default LegadoGameCanvas;
