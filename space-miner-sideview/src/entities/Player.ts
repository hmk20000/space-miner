import Phaser from 'phaser';
import { PLAYER_CONFIG } from '../constants/GameConstants';
import { WorldManager } from '../managers/WorldManager';
import { BLOCK_CONFIG } from '../constants/GameConstants';
import { InventoryManager } from '../managers/InventoryManager';
import { Item } from '../types/ItemTypes';

export class Player extends Phaser.Physics.Arcade.Sprite {
    private worldManager: WorldManager;
    
    constructor(scene: Phaser.Scene, x: number, y: number, worldManager: WorldManager) {
        super(scene, x, y);
        this.worldManager = worldManager;

        const radius = PLAYER_CONFIG.SIZE.WIDTH / 2;

        // 원형 그래픽 생성
        const graphics = scene.add.graphics();
        graphics.lineStyle(2, 0x000000);
        graphics.fillStyle(0x00ff00, 1);
        graphics.beginPath();
        graphics.arc(radius, radius, radius, 0, Math.PI * 2);
        graphics.closePath();
        graphics.fill();
        graphics.stroke();

        graphics.generateTexture('player', PLAYER_CONFIG.SIZE.WIDTH, PLAYER_CONFIG.SIZE.HEIGHT);
        graphics.destroy();

        this.setTexture('player');
        this.setOrigin(0.5, 0.5);
        
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCircle(radius, 0, 0);
        body.setBounce(PLAYER_CONFIG.MOVEMENT.BOUNCE);
        body.setCollideWorldBounds(false);

        scene.add.existing(this);
    }

    public mine(worldX: number, worldY: number): void {
        const chunk = this.worldManager.getChunkAtWorldPosition(worldX, worldY);
        if (!chunk) return;

        const relativeX = worldX - chunk.layer.x;
        const relativeY = worldY - chunk.layer.y;
        
        const tileX = Math.floor(relativeX / BLOCK_CONFIG.SIZE);
        const tileY = Math.floor(relativeY / BLOCK_CONFIG.SIZE);

        const tile = chunk.layer.getTileAt(tileX, tileY);

        if (tile?.properties?.isMineable) {
            // 인벤토리에 추가
            const inventoryManager = InventoryManager.getInstance();
            const blockItem: Item = {
                id: 'dirt_block',
                name: '흙 블록',
                type: 'block',
                stackable: true,
                maxStack: 64
            };

            if (inventoryManager.addItem(blockItem)) {
                // 채굴 성공 시에만 블록 제거
                this.scene.game.events.emit('miningComplete', { x: worldX, y: worldY });
            }
        }
    }

    public move(direction: 'left' | 'right' | 'none'): void {
        switch (direction) {
            case 'left':
                this.setVelocityX(-PLAYER_CONFIG.MOVEMENT.SPEED);
                break;
            case 'right':
                this.setVelocityX(PLAYER_CONFIG.MOVEMENT.SPEED);
                break;
            case 'none':
                this.setVelocityX(0);
                break;
        }
    }

    public jump(): void {
        // 바닥에 닿아있는지 확인 (body.blocked.down 또는 body.touching.down)
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body && (body.blocked.down || body.touching.down)) {
            body.setVelocityY(-PLAYER_CONFIG.MOVEMENT.JUMP_FORCE);
        }
    }

    // 타일과의 충돌 체크 및 처리
    public checkTileCollision(tile: Phaser.Tilemaps.Tile): boolean {
        if (!tile || !this.body) return false;

        const body = this.body as Phaser.Physics.Arcade.Body;
        const tileWorldY = tile.tilemapLayer.tileToWorldY(tile.y);
        const playerBottom = body.position.y + body.height;
        
        // 플레이어가 타일 위에 있고, 높이 차이가 1블록 이하일 때
        if (playerBottom <= tileWorldY + 8 && playerBottom > tileWorldY - 8) {
            body.position.y = tileWorldY - body.height;
            body.setVelocityY(0);
            return false;  // 충돌 무시
        }

        return true;  // 일반 충돌 처리
    }

    public placeBlock(worldX: number, worldY: number): void {
        const chunk = this.worldManager.getChunkAtWorldPosition(worldX, worldY);
        if (!chunk) return;

        const relativeX = worldX - chunk.layer.x;
        const relativeY = worldY - chunk.layer.y;
        
        const tileX = Math.floor(relativeX / BLOCK_CONFIG.SIZE);
        const tileY = Math.floor(relativeY / BLOCK_CONFIG.SIZE);

        // 해당 위치에 타일이 없는지 확인
        const tile = chunk.layer.getTileAt(tileX, tileY);
        if (!tile) {
            // 인벤토리에서 흙 블록 찾기
            const inventoryManager = InventoryManager.getInstance();
            if (inventoryManager.removeItem('dirt_block', 1)) {
                // 블록 설치
                this.scene.game.events.emit('blockPlace', { 
                    x: worldX, 
                    y: worldY, 
                    type: 'dirt_block' 
                });
            }
        }
    }

    destroy(fromScene?: boolean) {
        super.destroy(fromScene);
    }
} 