import React, { useState, useEffect, useCallback, useRef } from 'react';

/* 
  Valhalla.py Game Component
  Design: Nordic Minimalism with professional 16-bit pixel art (Stardew Valley style)
  Features: Top-down map with tileset, character movement, collision detection
  Scene: Bjorn's Viking homestead
*/

interface Position {
  x: number;
  y: number;
}

interface GameTile {
  type: string;
  walkable: boolean;
  tileX: number; // Position in tileset (column)
  tileY: number; // Position in tileset (row)
}

const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const MOVEMENT_SPEED = 0.12;
const TILESET_TILE_SIZE = 32;

// Tileset coordinates for each tile type (16x16 grid)
const TILE_COORDS: Record<string, { x: number; y: number }> = {
  // Grass tiles
  grass_0: { x: 0, y: 0 },
  grass_1: { x: 1, y: 0 },
  grass_2: { x: 2, y: 0 },
  grass_3: { x: 3, y: 0 },
  
  // Dirt/path tiles
  dirt_0: { x: 4, y: 0 },
  dirt_1: { x: 5, y: 0 },
  dirt_2: { x: 6, y: 0 },
  dirt_3: { x: 7, y: 0 },
  
  // Water tiles
  water_0: { x: 0, y: 4 },
  water_1: { x: 1, y: 4 },
  water_2: { x: 2, y: 4 },
  water_3: { x: 3, y: 4 },
  
  // Trees
  tree_pine_1: { x: 5, y: 1 },
  tree_pine_2: { x: 6, y: 1 },
  tree_oak_1: { x: 7, y: 1 },
  tree_oak_2: { x: 8, y: 1 },
  
  // Rocks
  rock_1: { x: 2, y: 2 },
  rock_2: { x: 7, y: 2 },
  rock_3: { x: 8, y: 2 },
  
  // Grass with flowers
  grass_flowers_1: { x: 9, y: 4 },
  grass_flowers_2: { x: 10, y: 4 },
  
  // House
  house: { x: 10, y: 5 },
  
  // Rune stones
  rune_stone_1: { x: 11, y: 5 },
  rune_stone_2: { x: 12, y: 5 },
  rune_stone_3: { x: 13, y: 5 },
  
  // Fences
  fence_h: { x: 14, y: 5 },
  fence_v: { x: 15, y: 5 },
  
  // Snow
  snow_1: { x: 10, y: 6 },
  snow_2: { x: 11, y: 6 },
  
  // Sand
  sand_1: { x: 8, y: 4 },
  sand_2: { x: 9, y: 4 },
};

// Generate Bjorn's homestead map
const generateMap = (): GameTile[][] => {
  const map: GameTile[][] = [];
  
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: GameTile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      let tile: GameTile;
      
      // Water stream on left side
      if (x === 1 && (y >= 8 && y <= 12)) {
        const coords = TILE_COORDS[`water_${Math.floor(Math.random() * 4)}`];
        tile = { type: 'water', walkable: false, tileX: coords.x, tileY: coords.y };
      }
      // Main house in center
      else if (x >= 9 && x <= 11 && y >= 6 && y <= 8) {
        const coords = TILE_COORDS['house'];
        tile = { type: 'house', walkable: false, tileX: coords.x, tileY: coords.y };
      }
      // Palisade fence around property
      else if ((x === 4 || x === 16) && (y >= 5 && y <= 10)) {
        const coords = TILE_COORDS['fence_v'];
        tile = { type: 'fence', walkable: false, tileX: coords.x, tileY: coords.y };
      }
      else if ((y === 4 || y === 11) && (x >= 4 && x <= 16)) {
        const coords = TILE_COORDS['fence_h'];
        tile = { type: 'fence', walkable: false, tileX: coords.x, tileY: coords.y };
      }
      // Rune stone marker on left
      else if (x === 3 && y === 5) {
        const coords = TILE_COORDS['rune_stone_1'];
        tile = { type: 'rune', walkable: false, tileX: coords.x, tileY: coords.y };
      }
      // Well near house
      else if (x === 8 && y === 7) {
        const coords = TILE_COORDS['rock_1'];
        tile = { type: 'well', walkable: false, tileX: coords.x, tileY: coords.y };
      }
      // Scattered rocks
      else if ((x === 13 && y === 9) || (x === 6 && y === 10) || (x === 14 && y === 12)) {
        const coords = TILE_COORDS[`rock_${Math.floor(Math.random() * 3) + 1}`];
        tile = { type: 'rock', walkable: false, tileX: coords.x, tileY: coords.y };
      }
      // Trees scattered around
      else if (Math.random() < 0.12 && !(x >= 4 && x <= 16 && y >= 4 && y <= 11)) {
        const treeType = Math.random() < 0.5 ? 'tree_pine_1' : 'tree_oak_1';
        const coords = TILE_COORDS[treeType];
        tile = { type: 'tree', walkable: false, tileX: coords.x, tileY: coords.y };
      }
      // Dirt paths
      else if ((x === 10 && y >= 11 && y <= 13) || (x >= 17 && x <= 19 && y === 7)) {
        const coords = TILE_COORDS[`dirt_${Math.floor(Math.random() * 4)}`];
        tile = { type: 'dirt', walkable: true, tileX: coords.x, tileY: coords.y };
      }
      // Grass with flowers in garden area
      else if (x >= 12 && x <= 14 && y >= 9 && y <= 10 && Math.random() < 0.6) {
        const coords = TILE_COORDS[`grass_flowers_${Math.floor(Math.random() * 2) + 1}`];
        tile = { type: 'grass_flowers', walkable: true, tileX: coords.x, tileY: coords.y };
      }
      // Default grass
      else {
        const coords = TILE_COORDS[`grass_${Math.floor(Math.random() * 4)}`];
        tile = { type: 'grass', walkable: true, tileX: coords.x, tileY: coords.y };
      }
      
      row.push(tile);
    }
    map.push(row);
  }
  
  return map;
};

export const Game: React.FC = () => {
  const [playerPos, setPlayerPos] = useState<Position>({ x: 10, y: 12 });
  const [map] = useState<GameTile[][]>(generateMap());
  const [gameLog] = useState<string[]>([
    'Witaj w Valhalla.py!',
    'Jesteś w domu Bjorna "Byte-Axe"',
    'Przygotuj się do wyruszenia...'
  ]);
  const [tilesetLoaded, setTilesetLoaded] = useState(false);
  
  // Use ref to track pressed keys
  const keysPressed = useRef<Record<string, boolean>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tilesetRef = useRef<HTMLImageElement | null>(null);
  const playerImgRef = useRef<HTMLImageElement | null>(null);

  // Handle key press
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
      e.preventDefault();
      keysPressed.current[key] = true;
    }
  }, []);

  // Handle key release
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
      keysPressed.current[key] = false;
    }
  }, []);

  // Add event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Load tileset and player image
  useEffect(() => {
    const tileset = new Image();
    tileset.src = '/images/tileset_complete.png';
    tileset.onload = () => {
      tilesetRef.current = tileset;
      setTilesetLoaded(true);
    };
    tileset.onerror = () => {
      console.error('Failed to load tileset');
    };

    const playerImg = new Image();
    playerImg.src = '/images/bjorn_character.png';
    playerImg.onload = () => {
      playerImgRef.current = playerImg;
    };
  }, []);

  // Draw game
  useEffect(() => {
    if (!canvasRef.current || !tilesetLoaded || !tilesetRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Clear canvas with sky blue background
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map[y][x];
        const sourceX = tile.tileX * TILESET_TILE_SIZE;
        const sourceY = tile.tileY * TILESET_TILE_SIZE;

        ctx.drawImage(
          tilesetRef.current,
          sourceX,
          sourceY,
          TILESET_TILE_SIZE,
          TILESET_TILE_SIZE,
          x * TILE_SIZE,
          y * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        );
      }
    }

    // Draw player
    if (playerImgRef.current) {
      ctx.drawImage(
        playerImgRef.current,
        Math.floor(playerPos.x * TILE_SIZE),
        Math.floor(playerPos.y * TILE_SIZE),
        TILE_SIZE,
        TILE_SIZE
      );
    }

    // Draw coordinates
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 100, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`X: ${playerPos.x.toFixed(1)}`, 15, 30);
    ctx.fillText(`Y: ${playerPos.y.toFixed(1)}`, 15, 50);
  }, [map, playerPos, tilesetLoaded]);

  // Game loop for movement
  useEffect(() => {
    const gameLoop = setInterval(() => {
      setPlayerPos(prevPos => {
        let newX = prevPos.x;
        let newY = prevPos.y;

        // Check which keys are pressed
        if (keysPressed.current['arrowup'] || keysPressed.current['w']) {
          newY = Math.max(0, newY - MOVEMENT_SPEED);
        }
        if (keysPressed.current['arrowdown'] || keysPressed.current['s']) {
          newY = Math.min(MAP_HEIGHT - 1, newY + MOVEMENT_SPEED);
        }
        if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
          newX = Math.max(0, newX - MOVEMENT_SPEED);
        }
        if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
          newX = Math.min(MAP_WIDTH - 1, newX + MOVEMENT_SPEED);
        }

        // Check collision
        const tileX = Math.floor(newX);
        const tileY = Math.floor(newY);
        
        if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
          if (map[tileY][tileX].walkable) {
            return { x: newX, y: newY };
          }
        }

        return prevPos;
      });
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [map]);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 gap-4 overflow-hidden">
      {/* Game Title */}
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-slate-100 mb-1">
          Valhalla.py
        </h1>
        <p className="text-sm text-slate-400">Kod Króla Węży</p>
      </div>

      {/* Game Canvas */}
      <div className="relative bg-slate-900 border-4 border-slate-600 shadow-2xl" 
           style={{
             width: MAP_WIDTH * TILE_SIZE,
             height: MAP_HEIGHT * TILE_SIZE,
             imageRendering: 'pixelated',
           }}>
        <canvas
          ref={canvasRef}
          width={MAP_WIDTH * TILE_SIZE}
          height={MAP_HEIGHT * TILE_SIZE}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            imageRendering: 'pixelated',
          } as React.CSSProperties}
        />
      </div>

      {/* Game Info */}
      <div className="w-full max-w-2xl">
        <div className="bg-slate-800 border-2 border-slate-700 p-3 rounded-lg shadow-lg text-sm">
          <h2 className="font-bold text-slate-100 mb-2">Instrukcje</h2>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
            <div>
              <p className="font-semibold mb-1">⬆️ Poruszanie:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Strzałki lub W/A/S/D</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">🏠 Lokacja:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Dom Bjorna "Byte-Axe"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {!tilesetLoaded && (
        <div className="text-slate-400 text-xs">Ładowanie grafiki...</div>
      )}
    </div>
  );
};
