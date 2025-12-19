import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

/*
  Valhalla.py Game with Phaser 3
  Design: Professional 16-bit pixel art
  Features: Bjorn's house interior with professional graphics, character movement, Nordic aesthetic
*/

export const GamePhaser: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    // Main game scene
    class HouseScene extends Phaser.Scene {
      private player?: Phaser.Physics.Arcade.Sprite;
      private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
      private wasdKeys?: Record<string, Phaser.Input.Keyboard.Key>;
      private collisionLayer?: Phaser.Physics.Arcade.StaticGroup;
      private currentDirection: 'up' | 'down' | 'left' | 'right' = 'down';

      constructor() {
        super({ key: 'HouseScene' });
      }

      preload() {
        // Load the generated map and player sprite
        this.load.image('mapBackground', '/images/map_house.png');
        this.load.image('playerSprite', '/images/player_bjorn.png');
      }

      create() {
        const mapWidth = 1024;
        const mapHeight = 768;
        const tileSize = 32;

        // Add the map background
        const mapBg = this.add.image(mapWidth / 2, mapHeight / 2, 'mapBackground');
        mapBg.setOrigin(0.5, 0.5);
        mapBg.setDisplaySize(mapWidth, mapHeight);

        // Create collision layer for walls and furniture
        this.collisionLayer = this.physics.add.staticGroup();

        // Define collision areas based on the map layout
        // Walls (perimeter)
        for (let x = 0; x < 16; x++) {
          // Top wall
          const topWall = this.physics.add.staticImage(x * tileSize + tileSize / 2, tileSize / 2, 'mapBackground');
          topWall.setDisplaySize(tileSize, tileSize);
          topWall.setVisible(false);
          this.collisionLayer?.add(topWall);

          // Bottom wall
          const bottomWall = this.physics.add.staticImage(x * tileSize + tileSize / 2, mapHeight - tileSize / 2, 'mapBackground');
          bottomWall.setDisplaySize(tileSize, tileSize);
          bottomWall.setVisible(false);
          this.collisionLayer?.add(bottomWall);
        }

        for (let y = 1; y < 11; y++) {
          // Left wall
          const leftWall = this.physics.add.staticImage(tileSize / 2, y * tileSize + tileSize / 2, 'mapBackground');
          leftWall.setDisplaySize(tileSize, tileSize);
          leftWall.setVisible(false);
          this.collisionLayer?.add(leftWall);

          // Right wall
          const rightWall = this.physics.add.staticImage(mapWidth - tileSize / 2, y * tileSize + tileSize / 2, 'mapBackground');
          rightWall.setDisplaySize(tileSize, tileSize);
          rightWall.setVisible(false);
          this.collisionLayer?.add(rightWall);
        }

        // Furniture collision areas
        const furniturePositions = [
          // Shelves (left side)
          { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 }, { x: 2, y: 6 }, { x: 2, y: 7 }, { x: 2, y: 8 },
          // Table (center)
          { x: 7, y: 5 }, { x: 8, y: 5 },
          // Bed (right side)
          { x: 13, y: 4 }, { x: 14, y: 4 }, { x: 13, y: 5 }, { x: 14, y: 5 },
        ];

        furniturePositions.forEach(pos => {
          const collider = this.physics.add.staticImage(
            pos.x * tileSize + tileSize / 2,
            pos.y * tileSize + tileSize / 2,
            'mapBackground'
          );
          collider.setDisplaySize(tileSize, tileSize);
          collider.setVisible(false);
          this.collisionLayer?.add(collider);
        });

        // Create player sprite
        this.player = this.physics.add.sprite(
          8 * tileSize + tileSize / 2,
          8 * tileSize + tileSize / 2,
          'playerSprite'
        );
        this.player.setDisplaySize(tileSize, tileSize);
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0);
        
        // Set initial sprite frame (down direction)
        this.player.setCrop(0, 64, 64, 64);

        // Collision with walls and furniture
        if (this.collisionLayer) {
          this.physics.add.collider(this.player, this.collisionLayer);
        }

        // Set up input
        this.cursors = this.input.keyboard?.createCursorKeys();
        this.wasdKeys = {
          w: this.input.keyboard?.addKey('W')!,
          a: this.input.keyboard?.addKey('A')!,
          s: this.input.keyboard?.addKey('S')!,
          d: this.input.keyboard?.addKey('D')!,
        };

        // Camera
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(1.5);
      }

      update() {
        if (!this.player || !this.cursors || !this.wasdKeys) return;

        const speed = 150;
        let velocityX = 0;
        let velocityY = 0;

        // Check input
        if (this.cursors.left?.isDown || this.wasdKeys.a?.isDown) {
          velocityX = -speed;
          this.currentDirection = 'left';
        }
        if (this.cursors.right?.isDown || this.wasdKeys.d?.isDown) {
          velocityX = speed;
          this.currentDirection = 'right';
        }
        if (this.cursors.up?.isDown || this.wasdKeys.w?.isDown) {
          velocityY = -speed;
          this.currentDirection = 'up';
        }
        if (this.cursors.down?.isDown || this.wasdKeys.s?.isDown) {
          velocityY = speed;
          this.currentDirection = 'down';
        }

        // Apply velocity
        this.player.setVelocity(velocityX, velocityY);

        // Update sprite frame based on direction
        const frameMappings: Record<string, { x: number; y: number }> = {
          up: { x: 0, y: 0 },
          down: { x: 0, y: 64 },
          left: { x: 64, y: 0 },
          right: { x: 64, y: 64 },
        };

        const frame = frameMappings[this.currentDirection];
        this.player.setCrop(frame.x, frame.y, 64, 64);
      }
    }

    // Phaser configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: 512,
      height: 384,
      backgroundColor: '#1a1a2e',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: HouseScene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        pixelArt: true,
        antialias: false,
      },
    };

    // Create game instance
    gameRef.current = new Phaser.Game(config);

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, []);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 gap-4">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold text-slate-100 mb-2">Valhalla.py</h1>
        <p className="text-lg text-slate-400">Kod Króla Węży</p>
      </div>

      <div
        id="game-container"
        className="border-4 border-slate-600 shadow-2xl rounded-lg overflow-hidden"
        style={{ imageRendering: 'pixelated' }}
      />

      <div className="w-full max-w-2xl">
        <div className="bg-slate-800 border-2 border-slate-700 p-4 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold text-slate-100 mb-3">Instrukcje</h2>
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
            <div>
              <p className="font-semibold mb-2">⬆️ Poruszanie:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Strzałki góra/dół/lewo/prawo</li>
                <li>Lub klawisze W/A/S/D</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">🏠 Lokacja:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Wnętrze domu Bjorna</li>
                <li>Przygotuj się do przygody!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
