'use client';
import { useEffect, useRef } from 'react';
import { DISTRICTS } from '@/lib/gameUtils';

interface Props {
  onDistrictClick: (districtId: string) => void;
  controlledDistricts: string[];
}

export default function GameMap({ onDistrictClick, controlledDistricts }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import('phaser').Game | null>(null);

  useEffect(() => {
    let game: import('phaser').Game;

    const initPhaser = async () => {
      const Phaser = (await import('phaser')).default;

      class NeonCityScene extends Phaser.Scene {
        private districtZones: Phaser.GameObjects.Container[] = [];

        constructor() { super({ key: 'NeonCityScene' }); }

        preload() {
          // Grid background drawn procedurally — no asset load needed
        }

        create() {
          const { width, height } = this.scale;

          // ── Starfield / grid background ─────────────────────
          const bg = this.add.graphics();
          bg.fillStyle(0x0a0818, 1);
          bg.fillRect(0, 0, width, height);

          // Grid lines
          const grid = this.add.graphics();
          grid.lineStyle(1, 0x1a1040, 0.6);
          for (let x = 0; x < width; x += 40)  { grid.moveTo(x, 0); grid.lineTo(x, height); }
          for (let y = 0; y < height; y += 40) { grid.moveTo(0, y); grid.lineTo(width, y); }
          grid.strokePath();

          // Atmospheric glow orbs
          const orb1 = this.add.circle(width * 0.2, height * 0.3, 120, 0xa389f4, 0.06);
          const orb2 = this.add.circle(width * 0.8, height * 0.7, 100, 0x26c6da, 0.06);
          this.tweens.add({ targets: [orb1, orb2], alpha: { from: 0.04, to: 0.12 }, duration: 2500, yoyo: true, repeat: -1 });

          // Title
          this.add.text(width / 2, 28, '🌆  NEON CITY MAP', {
            fontSize: '18px', fontFamily: 'Archivo Black', color: '#a389f4',
            stroke: '#000', strokeThickness: 3,
          }).setOrigin(0.5);

          // ── District positions ────────────────────────────────
          const positions = [
            { x: width * 0.18, y: height * 0.32 },
            { x: width * 0.50, y: height * 0.20 },
            { x: width * 0.82, y: height * 0.32 },
            { x: width * 0.18, y: height * 0.70 },
            { x: width * 0.50, y: height * 0.78 },
            { x: width * 0.82, y: height * 0.70 },
          ];

          DISTRICTS.forEach((district, i) => {
            const pos = positions[i];
            const isControlled = controlledDistricts.includes(district.id);
            const colorNum = parseInt(district.color.replace('#', ''), 16);

            const container = this.add.container(pos.x, pos.y);

            // Hexagon base
            const hex = this.add.graphics();
            hex.fillStyle(colorNum, isControlled ? 0.35 : 0.12);
            hex.lineStyle(2, colorNum, isControlled ? 1 : 0.5);
            hex.fillRoundedRect(-64, -44, 128, 88, 12);
            hex.strokeRoundedRect(-64, -44, 128, 88, 12);
            container.add(hex);

            // Glow behind (only for controlled)
            if (isControlled) {
              const glow = this.add.graphics();
              glow.fillStyle(colorNum, 0.15);
              glow.fillCircle(0, 0, 80);
              container.addAt(glow, 0);
              this.tweens.add({ targets: glow, alpha: { from: 0.1, to: 0.3 }, duration: 1500, yoyo: true, repeat: -1 });
            }

            // Name text
            container.add(this.add.text(0, -16, district.name, {
              fontSize: '12px', fontFamily: 'Archivo Black', color: district.color,
              stroke: '#000', strokeThickness: 2,
            }).setOrigin(0.5));

            // Drop text
            container.add(this.add.text(0, 4, `drops ${district.drop.toUpperCase()}`, {
              fontSize: '9px', fontFamily: 'Inter', color: '#aaaaaa',
            }).setOrigin(0.5));

            // Controlled badge
            if (isControlled) {
              container.add(this.add.text(0, 24, '✦ CONTROLLED', {
                fontSize: '9px', fontFamily: 'Archivo Black', color: '#ffd700',
              }).setOrigin(0.5));
            }

            // Difficulty stars
            container.add(this.add.text(0, 34, '★'.repeat(district.difficulty), {
              fontSize: '10px', color: colorNum > 0xffffff / 2 ? '#000' : '#ffffff66',
            }).setOrigin(0.5));

            // Interaction
            const hitArea = this.add.rectangle(0, 0, 128, 88, 0x000000, 0)
              .setInteractive({ useHandCursor: true });
            container.add(hitArea);

            hitArea.on('pointerover', () => {
              this.tweens.add({ targets: container, scaleX: 1.08, scaleY: 1.08, duration: 150 });
              hex.clear();
              hex.fillStyle(colorNum, 0.5);
              hex.lineStyle(3, colorNum, 1);
              hex.fillRoundedRect(-64, -44, 128, 88, 12);
              hex.strokeRoundedRect(-64, -44, 128, 88, 12);
            });

            hitArea.on('pointerout', () => {
              this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 150 });
              hex.clear();
              hex.fillStyle(colorNum, isControlled ? 0.35 : 0.12);
              hex.lineStyle(2, colorNum, isControlled ? 1 : 0.5);
              hex.fillRoundedRect(-64, -44, 128, 88, 12);
              hex.strokeRoundedRect(-64, -44, 128, 88, 12);
            });

            hitArea.on('pointerdown', () => onDistrictClick(district.id));

            this.districtZones.push(container);
          });

          // Connecting lines between districts
          const lineGraphics = this.add.graphics();
          lineGraphics.lineStyle(1, 0x333366, 0.4);
          const pairs = [[0,1],[1,2],[0,3],[1,4],[2,5],[3,4],[4,5],[1,3],[1,5]];
          pairs.forEach(([a, b]) => {
            const pa = positions[a], pb = positions[b];
            lineGraphics.moveTo(pa.x, pa.y);
            lineGraphics.lineTo(pb.x, pb.y);
          });
          lineGraphics.strokePath();

          // Floating particle effect
          for (let p = 0; p < 30; p++) {
            const particle = this.add.circle(
              Phaser.Math.Between(0, width),
              Phaser.Math.Between(0, height),
              Phaser.Math.Between(1, 3),
              0xa389f4, 0.6
            );
            this.tweens.add({
              targets: particle,
              y: particle.y - Phaser.Math.Between(40, 120),
              alpha: 0,
              duration: Phaser.Math.Between(3000, 7000),
              repeat: -1,
              delay: Phaser.Math.Between(0, 5000),
              onRepeat: () => {
                particle.y = height;
                particle.x = Phaser.Math.Between(0, width);
                particle.alpha = 0.6;
              }
            });
          }
        }
      }

      const config: import('phaser').Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width:  containerRef.current?.clientWidth  || 800,
        height: 340,
        backgroundColor: '#0a0818',
        parent: containerRef.current!,
        scene: NeonCityScene,
        transparent: false,
        antialias: true,
      };

      game = new Phaser.Game(config);
      gameRef.current = game;
    };

    initPhaser();
    return () => { game?.destroy(true); };
  }, [controlledDistricts, onDistrictClick]);

  return (
    <div ref={containerRef} className="game-map-container" style={{ width: '100%', borderRadius: 16, overflow: 'hidden' }} />
  );
}
