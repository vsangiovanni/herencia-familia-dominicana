import Phaser from 'phaser';
import type { LegacyGameEvent } from './types';

type LegacySceneEventHandler = (event: LegacyGameEvent) => void;

export class LegadoVincenzoScene extends Phaser.Scene {
  private onGameEvent: LegacySceneEventHandler;
  private player?: Phaser.Physics.Arcade.Sprite;
  private playerShadow?: Phaser.GameObjects.Ellipse;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<string, Phaser.Input.Keyboard.Key>;
  private touchDirection: -1 | 0 | 1 = 0;
  private touchJumpRequested = false;
  private documentCollected = false;
  private hintSent = false;
  private convergenceSent = false;
  private portal?: Phaser.Physics.Arcade.Sprite;
  private portalGlow?: Phaser.GameObjects.Arc;
  private objectiveText?: Phaser.GameObjects.Text;
  private lastStepAt = 0;

  constructor(onGameEvent: LegacySceneEventHandler) {
    super('legado-vincenzo');
    this.onGameEvent = onGameEvent;
  }

  preload() {
    this.load.image('santa-domenica-concept', '/game/legado/sangiovanni-door-game-scene.png');
    this.load.image('victor-explorer', '/game/legado/characters/victor-explorer-v2.png');
  }

  create() {
    this.physics.world.setBounds(0, 0, 430, 932);
    this.createTextures();
    this.createBackdrop();
    this.createLevel();

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keys = this.input.keyboard?.addKeys('A,D,W,SPACE') as Record<string, Phaser.Input.Keyboard.Key>;
    window.addEventListener('legado-game-left-down', this.handleLeftDown);
    window.addEventListener('legado-game-right-down', this.handleRightDown);
    window.addEventListener('legado-game-move-up', this.handleMoveUp);
    window.addEventListener('legado-game-jump', this.handleJump);
    window.addEventListener('pointerup', this.handleMoveUp);
    window.addEventListener('pointercancel', this.handleMoveUp);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.removeTouchListeners());

    this.cameras.main.setBounds(0, 0, 430, 932);
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(215, 466);
    this.cameras.main.setScroll(0, 0);

    this.add.text(28, 158, 'SANTA DOMENICA', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#F8E7B0',
      stroke: '#08111f',
      strokeThickness: 5,
    }).setScrollFactor(0);

    this.add.text(30, 184, 'Casa Sangiovanni - origen jugable', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: '#A7F3D0',
    }).setScrollFactor(0);
  }

  update() {
    if (!this.player || !this.cursors || !this.keys) return;

    const left = this.cursors.left?.isDown || this.keys.A?.isDown || this.touchDirection === -1;
    const right = this.cursors.right?.isDown || this.keys.D?.isDown || this.touchDirection === 1;
    const jump = Phaser.Input.Keyboard.JustDown(this.cursors.up!) || Phaser.Input.Keyboard.JustDown(this.keys.W) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || this.touchJumpRequested;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.touchJumpRequested = false;

    if (left) {
      this.player.setVelocityX(-230);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(230);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (jump && body.blocked.down) {
      this.player.setVelocityY(-520);
    }

    this.updatePlayerLocomotion(left || right, body.blocked.down);

    if (!this.hintSent && this.player.x > 210 && !this.documentCollected) {
      this.hintSent = true;
      this.onGameEvent({ type: 'hint_requested', anchorId: 'acta-ruta-vincenzo' });
    }
  }

  private createTextures() {
    const g = this.add.graphics();

    g.fillStyle(0x24190f, 0.92);
    g.fillRoundedRect(0, 0, 128, 24, 8);
    g.fillStyle(0x6f5637, 0.88);
    g.fillRoundedRect(4, 3, 120, 12, 7);
    g.lineStyle(2, 0xd4af37, 0.3);
    g.strokeRoundedRect(1, 1, 126, 22, 8);
    g.generateTexture('legacy-platform', 128, 24);
    g.clear();

    g.fillStyle(0xf5d58a, 1);
    g.fillRoundedRect(0, 0, 34, 44, 5);
    g.lineStyle(2, 0x8f6425, 1);
    g.strokeRoundedRect(2, 2, 30, 40, 5);
    g.lineStyle(1, 0x8f6425, 0.55);
    g.lineBetween(8, 14, 27, 14);
    g.lineBetween(8, 22, 25, 22);
    g.lineBetween(8, 30, 22, 30);
    g.generateTexture('legacy-document', 34, 44);
    g.clear();

    g.lineStyle(8, 0x2dd4bf, 0.9);
    g.strokeRoundedRect(8, 10, 70, 104, 32);
    g.lineStyle(3, 0xd4af37, 0.85);
    g.strokeRoundedRect(18, 22, 50, 82, 25);
    g.generateTexture('legacy-portal', 86, 124);
    g.destroy();
  }

  private createBackdrop() {
    this.add.rectangle(215, 466, 430, 932, 0x18263b, 1);
    this.add.rectangle(215, 210, 430, 420, 0xf3b36a, 0.18);
    this.add.circle(365, 165, 52, 0xf8e7b0, 0.28);

    const mountains = this.add.graphics();
    mountains.fillStyle(0x4f6b73, 0.48);
    mountains.fillTriangle(-40, 382, 110, 188, 260, 382);
    mountains.fillStyle(0x375661, 0.62);
    mountains.fillTriangle(88, 396, 266, 164, 480, 396);
    mountains.fillStyle(0x6f7f62, 0.34);
    mountains.fillTriangle(230, 384, 372, 218, 510, 384);

    this.add.rectangle(215, 392, 430, 34, 0x5aa0ae, 0.24);
    this.add.rectangle(215, 418, 430, 18, 0xf8e7b0, 0.12);

    const backdrop = this.add.image(215, 456, 'santa-domenica-concept');
    const source = this.textures.get('santa-domenica-concept').getSourceImage() as HTMLImageElement;
    const scale = Math.min(650 / source.width, 366 / source.height);
    backdrop.setScale(scale);
    backdrop.setAlpha(0.96);
    backdrop.setDepth(1);

    this.add.rectangle(215, 466, 430, 932, 0x06101d, 0.08);
    this.add.rectangle(215, 790, 430, 284, 0x03070c, 0.42);
    this.add.ellipse(214, 704, 390, 82, 0xd4af37, 0.12);
    this.add.ellipse(214, 706, 332, 48, 0x2dd4bf, 0.1);

    const town = this.add.graphics();
    const houses = [
      [22, 496, 84, 122, 0x8b6b4f, 0xb85d3e],
      [94, 468, 96, 150, 0xb58b62, 0x9f5234],
      [186, 500, 92, 118, 0x947255, 0xc56a42],
      [276, 472, 110, 148, 0xb38a63, 0xa95539],
      [360, 518, 82, 100, 0x806a53, 0xc2673e],
    ];
    houses.forEach(([x, y, w, h, wall, roof]) => {
      town.fillStyle(wall, 0.62);
      town.fillRoundedRect(x, y, w, h, 4);
      town.fillStyle(roof, 0.78);
      town.fillTriangle(x - 8, y, x + w / 2, y - 38, x + w + 8, y);
      town.fillStyle(0x1b2630, 0.5);
      town.fillRect(x + w * 0.24, y + 42, w * 0.18, h * 0.28);
      town.fillRect(x + w * 0.62, y + 36, w * 0.18, h * 0.3);
    });

    this.add.circle(54, 642, 34, 0x5f7d3c, 0.34).setDepth(2);
    this.add.circle(388, 604, 44, 0x5f7d3c, 0.26).setDepth(2);
    this.add.rectangle(72, 424, 6, 252, 0x5b6f38, 0.42).setAngle(-8).setDepth(2);
    this.add.rectangle(374, 394, 5, 270, 0x5b6f38, 0.34).setAngle(10).setDepth(2);

    const path = this.add.graphics();
    path.lineStyle(4, 0xd4af37, 0.38);
    path.beginPath();
    path.moveTo(18, 744);
    path.bezierCurveTo(122, 704, 238, 712, 412, 676);
    path.strokePath();
    path.lineStyle(2, 0x2dd4bf, 0.28);
    path.beginPath();
    path.moveTo(38, 758);
    path.bezierCurveTo(152, 722, 262, 730, 416, 694);
    path.strokePath();

    this.add.text(40, 418, '1860', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#F8E7B0',
      stroke: '#07111f',
      strokeThickness: 4,
    }).setAlpha(0.75);

    this.add.text(258, 570, 'Casa Sangiovanni', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#F8E7B0',
      stroke: '#07111f',
      strokeThickness: 4,
    }).setAlpha(0.82);

    for (let i = 0; i < 65; i += 1) {
      const x = Phaser.Math.Between(0, 430);
      const y = Phaser.Math.Between(120, 790);
      const size = Phaser.Math.FloatBetween(1.4, 3.8);
      const color = i % 3 === 0 ? 0xd4af37 : 0x7dd3fc;
      const star = this.add.circle(x, y, size, color, 0.35);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.18, to: 0.72 },
        duration: Phaser.Math.Between(1500, 3200),
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private createLevel() {
    const platforms = this.physics.add.staticGroup();
    const platformData = [
      [92, 742, 1.25],
      [196, 706, 1.2],
      [286, 666, 1.1],
      [356, 698, 1.05],
    ];

    const walkableRoute = platforms.create(215, 746, 'legacy-platform') as Phaser.Physics.Arcade.Sprite;
    walkableRoute.setScale(4.4, 0.85).setAlpha(0.01).refreshBody();

    platformData.forEach(([x, y, scale]) => {
      const platform = platforms.create(x, y, 'legacy-platform') as Phaser.Physics.Arcade.Sprite;
      platform.setScale(scale, 1.05).setAlpha(0.78).refreshBody();
    });

    this.playerShadow = this.add.ellipse(128, 675, 110, 24, 0x020611, 0.52);
    this.playerShadow.setDepth(4);

    this.player = this.physics.add.sprite(128, 558, 'victor-explorer');
    this.player.setScale(0.3);
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.player.setDragX(1100);
    this.player.setMaxVelocity(260, 620);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setSize(230, 470, true);
    playerBody.setOffset(380, 330);

    this.physics.add.collider(this.player, platforms);
    this.cameras.main.stopFollow();

    const document = this.physics.add.sprite(250, 626, 'legacy-document');
    document.setScale(1.35);
    document.setDepth(8);
    document.setImmovable(true);
    const documentBody = document.body as Phaser.Physics.Arcade.Body;
    documentBody.setAllowGravity(false);
    documentBody.setSize(86, 92, true);
    const documentGlow = this.add.circle(250, 626, 34, 0xd4af37, 0.24);
    documentGlow.setDepth(7);
    this.tweens.add({ targets: documentGlow, scale: 1.28, alpha: 0.42, duration: 850, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: document, y: 614, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.physics.add.overlap(this.player, document, () => {
      if (this.documentCollected) return;
      this.documentCollected = true;
      this.player?.setVelocity(80, 0);
      documentGlow.destroy();
      document.disableBody(true, true);
      this.onGameEvent({ type: 'document_collected', documentId: 'acta-ruta-vincenzo' });
      this.showPickupFeedback();
      this.unlockPortal();
    });

    this.portalGlow = this.add.circle(350, 600, 54, 0x2dd4bf, 0.22);
    this.portalGlow.setVisible(false);
    this.portal = this.physics.add.sprite(350, 650, 'legacy-portal');
    this.portal.setScale(0.68);
    this.portal.setAlpha(0.18);
    this.portal.setImmovable(true);
    this.physics.add.overlap(this.player, this.portal, () => {
      if (!this.documentCollected || this.convergenceSent) return;
      this.convergenceSent = true;
      this.onGameEvent({ type: 'convergence_unlocked', convergenceId: 'portal-paolo' });
    });

    this.objectiveText = this.add.text(126, 564, 'Acta antigua', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#F8E7B0',
      stroke: '#07111f',
      strokeThickness: 4,
    });

    this.add.text(292, 558, 'Portal', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#7DD3FC',
      stroke: '#07111f',
      strokeThickness: 4,
    });
  }

  private unlockPortal() {
    if (!this.portal || !this.portalGlow) return;
    this.portal.setAlpha(1);
    this.portalGlow.setVisible(true);
    this.tweens.add({ targets: this.portalGlow, scale: 1.28, alpha: 0.42, duration: 900, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: this.portal, y: 618, duration: 900, yoyo: true, repeat: -1 });
  }

  private showPickupFeedback() {
    this.objectiveText?.setText('Acta recuperada - convergencia activada');
    this.objectiveText?.setColor('#A7F3D0');

    const burst = this.add.circle(250, 626, 16, 0xd4af37, 0.75);
    const ring = this.add.circle(250, 626, 32, 0x2dd4bf, 0.22);
    this.tweens.add({
      targets: [burst, ring],
      scale: 2.2,
      alpha: 0,
      duration: 620,
      ease: 'Sine.easeOut',
      onComplete: () => {
        burst.destroy();
        ring.destroy();
      },
    });
  }

  private updatePlayerLocomotion(isMoving: boolean, isGrounded: boolean) {
    if (!this.player) return;

    const walking = isMoving && isGrounded;
    const phase = this.time.now / 95;
    const bob = walking ? Math.sin(phase) : 0;
    const lean = walking ? Math.sin(phase) * 2.4 : 0;
    const squash = walking ? Math.abs(Math.sin(phase)) * 0.012 : 0;

    this.player.setScale(0.3 + squash, 0.3 - squash * 0.7);
    this.player.setAngle(lean);

    if (this.playerShadow) {
      this.playerShadow.setPosition(this.player.x, this.player.y + 86);
      this.playerShadow.setScale(walking ? 1 + Math.abs(bob) * 0.12 : 1, walking ? 1 - Math.abs(bob) * 0.08 : 1);
      this.playerShadow.setAlpha(isGrounded ? 0.52 : 0.25);
    }

    if (!walking || this.time.now - this.lastStepAt < 165) return;
    this.lastStepAt = this.time.now;

    const footOffset = this.player.flipX ? -18 : 18;
    const step = this.add.ellipse(this.player.x + footOffset, this.player.y + 91, 18, 6, 0xd4af37, 0.36);
    step.setDepth(6);
    this.tweens.add({
      targets: step,
      scaleX: 1.9,
      scaleY: 1.35,
      alpha: 0,
      duration: 340,
      ease: 'Sine.easeOut',
      onComplete: () => step.destroy(),
    });
  }

  private handleLeftDown = () => {
    this.touchDirection = -1;
  };

  private handleRightDown = () => {
    this.touchDirection = 1;
  };

  private handleMoveUp = () => {
    this.touchDirection = 0;
  };

  private handleJump = () => {
    this.touchJumpRequested = true;
  };

  private removeTouchListeners() {
    window.removeEventListener('legado-game-left-down', this.handleLeftDown);
    window.removeEventListener('legado-game-right-down', this.handleRightDown);
    window.removeEventListener('legado-game-move-up', this.handleMoveUp);
    window.removeEventListener('legado-game-jump', this.handleJump);
    window.removeEventListener('pointerup', this.handleMoveUp);
    window.removeEventListener('pointercancel', this.handleMoveUp);
  }
}
