import { ChunkManager } from './ChunkManager';
import { BLOCK_CONFIG, CHUNK_CONFIG, ChunkId } from '../constants/GameConstants';
import { TileChange } from '../types/ChunkTypes';

interface ChunkData {
    x: number;
    y: number;
    changes: TileChange[];
    lastModified: number;
}

interface StoredChunkData {
    x: number;
    y: number;
    changes: TileChange[];
    lastModified: number;
}

export class WorldManager {
    private static instance: WorldManager;
    private chunkManager: ChunkManager;
    private chunks: Map<ChunkId, ChunkData> = new Map();
    private player?: Phaser.Physics.Arcade.Sprite;
    private scene?: Phaser.Scene;
    
    private constructor() {
        this.chunkManager = ChunkManager.getInstance();
    }

    public static getInstance(): WorldManager {
        if (!WorldManager.instance) {
            WorldManager.instance = new WorldManager();
        }
        return WorldManager.instance;
    }

    public init(scene: Phaser.Scene): void {
        this.chunkManager.init(scene);
        this.loadChunks();  // 저장된 청크 데이터 로드
        this.scene = scene;
    }

    public createChunk(x: number, y: number): void {
        const chunkId = `${x},${y}` as ChunkId;
        
        if (this.chunks.has(chunkId) || this.chunkManager.getChunk(chunkId)) {
            return;
        }
        
        const savedData = this.chunkManager.loadChunkData(chunkId);
        
        const chunkData: ChunkData = {
            x,
            y,
            changes: savedData?.changes || [],
            lastModified: savedData?.lastModified || Date.now()
        };
        
        this.chunks.set(chunkId, chunkData);
        this.chunkManager.createChunk(x, y);
        
        if (chunkData.changes.length > 0) {
            this.applyChangesToChunk(chunkId, chunkData.changes);
        }

        if (this.player) {
            this.chunkManager.setupCollision(this.player);
        }
    }

    private applyChangesToChunk(chunkId: ChunkId, changes: TileChange[]): void {
        const chunk = this.chunkManager.getChunk(chunkId);
        if (!chunk) return;

        changes.forEach(change => {
            if (change.index === -1) {
                // 타일 제거
                this.chunkManager.removeTileAt(chunkId, change.x, change.y);
            } else {
                // 타일 변경
                this.chunkManager.setTileAt(chunkId, change.x, change.y, change.index);
            }
        });
    }

    public addTileChange(chunkId: ChunkId, x: number, y: number, index: number): void {
        const chunk = this.chunks.get(chunkId);
        if (!chunk) return;

        const change: TileChange = {
            x,
            y,
            index,
            timestamp: Date.now()
        };

        chunk.changes.push(change);
        chunk.lastModified = change.timestamp;
        
        this.saveChunkData(chunkId);
    }

    private loadChunks(): void {
        const savedData = localStorage.getItem('worldData');
        if (savedData) {
            const parsedData = JSON.parse(savedData) as Record<string, ChunkData>;
            Object.entries(parsedData).forEach(([id, data]) => {
                this.chunks.set(id as ChunkId, data);
            });
        }
    }

    public getChunkData(chunkId: ChunkId): ChunkData | undefined {
        return this.chunks.get(chunkId);
    }

    public isChunkModified(chunkId: ChunkId): boolean {
        return (this.chunks.get(chunkId)?.changes.length || 0) > 0;
    }

    public getActiveChunks(): ChunkId[] {
        return Array.from(this.chunks.keys());
    }

    public setupCollision(player: Phaser.Physics.Arcade.Sprite): void {
        this.player = player;  // 플레이어 참조 저장
        this.chunkManager.setupCollision(player);
    }

    public removeTileAtWorldPosition(worldX: number, worldY: number): void {
        // 월드 좌표를 청크 좌표로 변환
        const chunkX = Math.floor(worldX / (CHUNK_CONFIG.BLOCKS_WIDTH * BLOCK_CONFIG.SIZE));
        const chunkId = `${chunkX},0` as ChunkId;

        // 월드 좌표를 타일 좌표로 변환
        const chunk = this.chunkManager.getChunk(chunkId);
        if (chunk) {
            const tileX = Math.floor(chunk.layer.worldToTileX(worldX));
            const tileY = Math.floor(chunk.layer.worldToTileY(worldY));
            
            // 타일 제거 및 변경 내역 추가
            this.chunkManager.removeTileAt(chunkId, tileX, tileY);
            this.addTileChange(chunkId, tileX, tileY, -1);  // -1은 제거된 타일
        }
    }

    public update(playerX: number, playerY: number): void {
        // 플레이어의 청크 위치 계산
        const currentChunkX = Math.floor(playerX / (BLOCK_CONFIG.SIZE * CHUNK_CONFIG.BLOCKS_WIDTH));
        const currentChunkY = Math.floor(playerY / (BLOCK_CONFIG.SIZE * CHUNK_CONFIG.BLOCKS_HEIGHT));
        
        // 활성화할 청크 범위 계산
        const range = 2;  // 플레이어 주변 2칸까지 생성
        const minX = currentChunkX - range;
        const maxX = currentChunkX + range;
        const minY = currentChunkY - range;
        const maxY = currentChunkY + range;

        // 범위 밖의 청크 제거
        this.chunks.forEach((_, chunkId) => {
            const [x, y] = chunkId.split(',').map(Number);
            if (x < minX || x > maxX || y < minY || y > maxY) {
                this.removeChunk(chunkId);
            }
        });

        // 필요한 청크 생성 (상하좌우)
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const chunkId = `${x},${y}` as ChunkId;
                if (!this.chunkManager.getChunk(chunkId)) {
                    this.createChunk(x, y);
                }
            }
        }
    }

    public removeChunk(chunkId: ChunkId): void {
        const chunk = this.chunks.get(chunkId);
        if (chunk) {
            if (chunk.changes.length > 0) {
                this.saveChunkData(chunkId);
            }

            this.chunkManager.removeChunk(chunkId);
            this.chunks.delete(chunkId);
        }
    }

    private saveChunkData(chunkId: ChunkId): void {
        const chunk = this.chunks.get(chunkId);
        if (!chunk || chunk.changes.length === 0) return;

        try {
            const storedData: StoredChunkData = {
                x: chunk.x,
                y: chunk.y,
                changes: chunk.changes,
                lastModified: chunk.lastModified
            };
            this.chunkManager.saveChunkData(chunkId, storedData);
        } catch (e) {
            console.warn('Failed to save chunk data:', e);
            this.cleanupOldChunks();
        }
    }

    private cleanupOldChunks(): void {
        // localStorage에서 chunk로 시작하는 키 찾기
        const chunkKeys = Object.keys(localStorage).filter(key => key.startsWith('chunk_'));
        
        // 가장 오래된 것부터 20%를 삭제
        const removeCount = Math.ceil(chunkKeys.length * 0.2);
        chunkKeys.slice(0, removeCount).forEach(key => {
            localStorage.removeItem(key);
        });
    }

    public getChunkAtWorldPosition(worldX: number, worldY: number) {
        if (!this.scene) return null;

        const chunkX = Math.floor(worldX / (CHUNK_CONFIG.BLOCKS_WIDTH * BLOCK_CONFIG.SIZE));
        const baseY = Math.floor(this.scene.cameras.main.height * 0.5) || 0;
        const relativeY = worldY - baseY;
        const chunkY = Math.floor(relativeY / (CHUNK_CONFIG.BLOCKS_HEIGHT * BLOCK_CONFIG.SIZE));

        const chunkId = `${chunkX},${chunkY}` as ChunkId;
        return this.chunkManager.getChunk(chunkId);
    }

    public placeTileAtWorldPosition(worldX: number, worldY: number, tileIndex: number): void {
        if (!this.scene) return;

        const chunkX = Math.floor(worldX / (CHUNK_CONFIG.BLOCKS_WIDTH * BLOCK_CONFIG.SIZE));
        const baseY = Math.floor(this.scene.cameras.main.height * 0.5) || 0;
        const relativeY = worldY - baseY;
        const chunkY = Math.floor(relativeY / (CHUNK_CONFIG.BLOCKS_HEIGHT * BLOCK_CONFIG.SIZE));
        
        const chunkId = `${chunkX},${chunkY}` as ChunkId;
        const chunk = this.chunkManager.getChunk(chunkId);
        
        if (chunk) {
            const tileX = Math.floor(chunk.layer.worldToTileX(worldX));
            const tileY = Math.floor(chunk.layer.worldToTileY(worldY));
            
            // 타일 설치 및 변경 내역 추가
            this.chunkManager.setTileAt(chunkId, tileX, tileY, tileIndex);
            this.addTileChange(chunkId, tileX, tileY, tileIndex);
        }
    }

} 