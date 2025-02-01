import Phaser from 'phaser';
import { BLOCK_CONFIG, CHUNK_CONFIG, type ChunkId } from '../constants/GameConstants';
import { TileManager } from './TileManager';
import { createStorage } from '../util/storage';
import { ChunkData } from '../types/ChunkTypes';

export class ChunkManager {
    private static instance: ChunkManager;
    private scene?: Phaser.Scene;
    private tileManager: TileManager;
    private activeChunks: Map<ChunkId, {
        tilemap: Phaser.Tilemaps.Tilemap;
        layer: Phaser.Tilemaps.TilemapLayer;
    }> = new Map();

    private storage = createStorage('chunks');

    private constructor() {
        this.tileManager = TileManager.getInstance();
    }

    public static getInstance(): ChunkManager {
        if (!ChunkManager.instance) {
            ChunkManager.instance = new ChunkManager();
        }
        return ChunkManager.instance;
    }

    public init(scene: Phaser.Scene): void {
        this.scene = scene;
        this.tileManager.init(scene);
    }

    public createChunk(x: number, y: number, tileData?: number[]): void {
        if (!this.scene) throw new Error('ChunkManager not initialized');

        const chunkId = `${x},${y}` as ChunkId;
        if (this.activeChunks.has(chunkId)) return;

        // 1. 타일맵 생성
        const tilemap = this.scene.make.tilemap({
            tileWidth: BLOCK_CONFIG.SIZE,
            tileHeight: BLOCK_CONFIG.SIZE,
            width: CHUNK_CONFIG.BLOCKS_WIDTH,
            height: CHUNK_CONFIG.BLOCKS_HEIGHT
        });

        // 2. 타일셋 생성 및 추가
        const tileKey = `tile_${chunkId}`;
        const texture = this.tileManager.createSlopeTileset(tileKey);
        const tileset = tilemap.addTilesetImage(tileKey, texture.key);
        if (!tileset) return;

        // 3. 레이어 생성 - 기준점을 화면 중앙으로
        const baseY = Math.floor(this.scene.cameras.main.height * 0.5);  // 화면 중앙
        const chunkY = baseY + (y * CHUNK_CONFIG.BLOCKS_HEIGHT * BLOCK_CONFIG.SIZE);
        
        const layer = tilemap.createBlankLayer(
            'ground',
            tileset,
            x * CHUNK_CONFIG.BLOCKS_WIDTH * BLOCK_CONFIG.SIZE,
            chunkY
        );
        if (!layer) return;

        // 4. 지형 생성
        if (tileData) {
            // 저장된 타일 데이터로 생성
            for (let i = 0; i < tileData.length; i++) {
                const tileX = i % CHUNK_CONFIG.BLOCKS_WIDTH;
                const tileY = Math.floor(i / CHUNK_CONFIG.BLOCKS_WIDTH);
                if (tileData[i] !== -1) {
                    const tile = layer.putTileAt(tileData[i], tileX, tileY);
                    this.tileManager.setTileProperties(tile);
                }
            }
        } else {
            // 새로운 지형 생성
            const groundLevel = Math.floor(tilemap.height * 0.3);

            for (let tileX = 0; tileX < tilemap.width; tileX++) {
                for (let tileY = 0; tileY < tilemap.height; tileY++) {
                    if (y > 0 || (y === 0 && tileY >= groundLevel)) {
                        const tile = layer.putTileAt(0, tileX, tileY);
                        this.tileManager.setTileProperties(tile, {
                            isMineable: true,
                            type: 'ground'
                        });
                    }
                }
            }
        }

        // 모든 타일의 모양 업데이트
        // for (let tileX = 0; tileX < tilemap.width; tileX++) {
        //     for (let tileY = 0; tileY < tilemap.height; tileY++) {
        //         const tile = layer.getTileAt(tileX, tileY);
        //         if (tile) {
        //             this.tileManager.updateTileShape(layer, tileX, tileY);
        //         }
        //     }
        // }

        // 5. 충돌 설정
        layer.setCollisionByProperty({ isMineable: true });
        
        // 디버그 표시 설정
        if (this.scene.physics.world.debugGraphic) {
            layer.renderDebug(this.scene.physics.world.debugGraphic, {
                tileColor: null,
                collidingTileColor: new Phaser.Display.Color(243, 134, 48, 128),
                faceColor: new Phaser.Display.Color(40, 39, 37, 128)
            });
        }

        // 6. 청크 저장
        this.activeChunks.set(chunkId, { tilemap, layer });
    }

    public removeChunk(chunkId: ChunkId): void {
        const chunk = this.activeChunks.get(chunkId);
        if (chunk) {
            chunk.layer.destroy();
            chunk.tilemap.destroy();
            this.activeChunks.delete(chunkId);
        }
    }


    public getAllChunkData(): Record<ChunkId, ChunkData> {
        return this.storage.load();
    }

    public saveChunkData(chunkId: ChunkId, data: ChunkData): void {
        const allChunks = this.getAllChunkData();
        allChunks[chunkId] = data;
        this.storage.save(allChunks);
    }

    public loadChunkData(chunkId: ChunkId): ChunkData | null {
        const allChunks = this.getAllChunkData();
        return allChunks[chunkId] || null;
    }

    public setupCollision(player: Phaser.Physics.Arcade.Sprite): void {
        if (!this.scene) return;
        
        // 기존 충돌 제거
        this.scene.physics.world.colliders.destroy();
        
        // 새로운 충돌 설정
        this.activeChunks.forEach(chunk => {
            if (chunk.layer.active) {  // 활성화된 레이어만 충돌 설정
                this.scene!.physics.add.collider(player, chunk.layer);
            }
        });
    }

    public removeTileAtWorldPosition(worldX: number, worldY: number): void {
        if (!this.scene) return;

        // 월드 좌표를 청크 좌표로 변환
        const chunkX = Math.floor(worldX / (CHUNK_CONFIG.BLOCKS_WIDTH * BLOCK_CONFIG.SIZE));
        const chunkId = `${chunkX},0` as ChunkId;  // 현재는 y=0만 사용

        const chunk = this.activeChunks.get(chunkId);
        if (chunk) {
            // 월드 좌표를 타일 좌표로 변환
            const tileX = Math.floor(chunk.layer.worldToTileX(worldX));
            const tileY = Math.floor(chunk.layer.worldToTileY(worldY));
            
            this.tileManager.removeTile(chunk.layer, tileX, tileY);
        }
    }

    public update(playerX: number): void {
        if (!this.scene) return;

        // 플레이어의 청크 위치 계산
        const currentChunkX = Math.floor(playerX / (CHUNK_CONFIG.BLOCKS_WIDTH * BLOCK_CONFIG.SIZE));
        
        // 플레이어 주변 청크 생성
        for (let x = currentChunkX - 1; x <= currentChunkX + 1; x++) {
            const chunkId = `${x},0` as ChunkId;
            if (!this.activeChunks.has(chunkId)) {
                this.createChunk(x, 0);
            }
        }

        // 범위 밖의 청크 제거
        this.activeChunks.forEach((chunk, id) => {
            const [x] = id.split(',').map(Number);
            if (x < currentChunkX - 2 || x > currentChunkX + 2) {
                this.removeChunk(id);
            }
        });
    }

    public getTileData(chunkId: ChunkId): number[] | null {
        const chunk = this.activeChunks.get(chunkId);
        if (!chunk) return null;

        const tileData: number[] = [];
        const layer = chunk.layer;

        // 모든 타일의 인덱스 저장
        for (let y = 0; y < layer.height; y++) {
            for (let x = 0; x < layer.width; x++) {
                const tile = layer.getTileAt(x, y);
                tileData.push(tile ? tile.index : -1);
            }
        }

        return tileData;
    }

    public removeTileAt(chunkId: ChunkId, x: number, y: number): void {
        const chunk = this.activeChunks.get(chunkId);
        if (!chunk) return;
        
        this.tileManager.removeTile(chunk.layer, x, y);
    }

    public setTileAt(chunkId: ChunkId, x: number, y: number, index: number): void {
        const chunk = this.activeChunks.get(chunkId);
        if (!chunk) return;

        const tile = chunk.layer.putTileAt(index, x, y);
        this.tileManager.setTileProperties(tile);
        this.tileManager.updateTileShape(chunk.layer, x, y);
    }

    public getChunk(chunkId: ChunkId) {
        return this.activeChunks.get(chunkId);
    }

    public getActiveChunks(): ChunkId[] {
        return Array.from(this.activeChunks.keys());
    }
} 