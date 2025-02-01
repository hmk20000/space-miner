import Phaser from 'phaser';
import { BLOCK_CONFIG } from '../constants/GameConstants';

export class TileManager {
    private static instance: TileManager;
    private scene?: Phaser.Scene;

    private constructor() {}

    public static getInstance(): TileManager {
        if (!TileManager.instance) {
            TileManager.instance = new TileManager();
        }
        return TileManager.instance;
    }

    public init(scene: Phaser.Scene): void {
        this.scene = scene;
    }

    public createTileset(key: string, color: number = BLOCK_CONFIG.COLOR, alpha: number = 0.8): Phaser.Textures.Texture {
        if (!this.scene) throw new Error('TileManager not initialized');

        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color, alpha);
        graphics.fillRect(0, 0, BLOCK_CONFIG.SIZE, BLOCK_CONFIG.SIZE);
        graphics.generateTexture(key, BLOCK_CONFIG.SIZE, BLOCK_CONFIG.SIZE);
        graphics.destroy();

        return this.scene.textures.get(key);
    }

    public removeTile(layer: Phaser.Tilemaps.TilemapLayer, x: number, y: number): void {
        const tile = layer.getTileAt(x, y);
        if (tile?.properties?.isMineable) {
            layer.removeTileAt(x, y);

            this.updateSurroundingTiles(layer, x, y);
        }
    }

    private updateSurroundingTiles(layer: Phaser.Tilemaps.TilemapLayer, x: number, y: number): void {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                
                const targetX = x + dx;
                const targetY = y + dy;
                
                if (layer.hasTileAt(targetX, targetY)) {
                    this.updateTileShape(layer, targetX, targetY);
                }
            }
        }
    }

    public setTileProperties(tile: Phaser.Tilemaps.Tile, properties: any = { isMineable: true }): void {
        if (!tile) return;
        
        if (!tile.properties) {
            tile.properties = {};
        }

        tile.properties = {
            ...tile.properties,
            ...properties
        };
    }

    public createSlopeTileset(key: string, color: number = BLOCK_CONFIG.COLOR, alpha: number = 0.8): Phaser.Textures.Texture {
        if (!this.scene) throw new Error('TileManager not initialized');

        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color, alpha);

        // 3개의 타일을 가로로 배열한 텍스처 생성 (기본, 왼쪽 경사, 오른쪽 경사)
        const width = BLOCK_CONFIG.SIZE * 3;
        const height = BLOCK_CONFIG.SIZE;

        // 기본 타일 (인덱스 0)
        graphics.fillRect(0, 0, BLOCK_CONFIG.SIZE, BLOCK_CONFIG.SIZE);

        // 왼쪽 위 경사 (인덱스 1)
        graphics.beginPath();
        graphics.moveTo(BLOCK_CONFIG.SIZE, BLOCK_CONFIG.SIZE);
        graphics.lineTo(BLOCK_CONFIG.SIZE * 2, BLOCK_CONFIG.SIZE);
        graphics.lineTo(BLOCK_CONFIG.SIZE * 2, 0);
        graphics.closePath();
        graphics.fill();

        // 오른쪽 위 경사 (인덱스 2)
        graphics.beginPath();
        graphics.moveTo(BLOCK_CONFIG.SIZE * 2, 0);
        graphics.lineTo(BLOCK_CONFIG.SIZE * 3, BLOCK_CONFIG.SIZE);
        graphics.lineTo(BLOCK_CONFIG.SIZE * 2, BLOCK_CONFIG.SIZE);
        graphics.closePath();
        graphics.fill();

        // 하나의 텍스처로 생성
        graphics.generateTexture(key, width, height);
        graphics.destroy();

        return this.scene.textures.get(key);
    }

    public updateTileShape(layer: Phaser.Tilemaps.TilemapLayer, x: number, y: number): void {
        const tile = layer.getTileAt(x, y);
        if (!tile) return;

        const above = layer.getTileAt(x, y - 1);
        const left = layer.getTileAt(x - 1, y);
        const right = layer.getTileAt(x + 1, y);

        // 기본 타일로 초기화
        layer.putTileAt(0, x, y);
        tile.properties = { isMineable: true };
        tile.resetCollision();

        if (!above) {  // 위에 타일이 없을 때
            if (!left && right) {  // 왼쪽 위 모서리
                layer.putTileAt(1, x, y);
                tile.properties.slope = 'left';
                // 왼쪽 하단에 작은 콜라이더
                const collisionWidth = BLOCK_CONFIG.SIZE / 3;
                tile.setCollision(false);
                tile.setCollisionCallback((sprite: Phaser.Physics.Arcade.Sprite) => {
                    const body = sprite.body as Phaser.Physics.Arcade.Body;
                    const tileWorldX = tile.tilemapLayer.tileToWorldX(tile.x);
                    const tileWorldY = tile.tilemapLayer.tileToWorldY(tile.y);
                    
                    // 왼쪽 하단 영역에서만 충돌
                    return body.x < tileWorldX + collisionWidth && 
                           body.y > tileWorldY + BLOCK_CONFIG.SIZE - collisionWidth;
                });
            } else if (!right && left) {  // 오른쪽 위 모서리
                layer.putTileAt(2, x, y);
                tile.properties.slope = 'right';
                // 오른쪽 하단에 작은 콜라이더
                const collisionWidth = BLOCK_CONFIG.SIZE / 3;
                tile.setCollision(false);
                tile.setCollisionCallback((sprite: Phaser.Physics.Arcade.Sprite) => {
                    const body = sprite.body as Phaser.Physics.Arcade.Body;
                    const tileWorldX = tile.tilemapLayer.tileToWorldX(tile.x);
                    const tileWorldY = tile.tilemapLayer.tileToWorldY(tile.y);
                    
                    // 오른쪽 하단 영역에서만 충돌
                    return body.x > tileWorldX + BLOCK_CONFIG.SIZE - collisionWidth && 
                           body.y > tileWorldY + BLOCK_CONFIG.SIZE - collisionWidth;
                });
            } else {
                // 일반 타일은 전체 충돌
                tile.setCollision(true);
            }
        } else {
            // 위에 타일이 있으면 전체 충돌
            tile.setCollision(true);
        }
    }
} 