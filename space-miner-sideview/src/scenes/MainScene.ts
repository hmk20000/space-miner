import Phaser from 'phaser';

import { Player } from '../entities/Player';
import { PLAYER_CONFIG, SCENE_KEYS, BLOCK_CONFIG } from '../constants/GameConstants';
import { InputManager } from '../managers/InputManager';
import { InventoryUI } from '../ui/InventoryUI';
import { ChunkManager } from '../managers/ChunkManager';
import { WorldManager } from '../managers/WorldManager';

// Custom Scene type
interface MyScene extends Phaser.Scene {
    player: Player;
    worldManager: WorldManager;  // WorldManager 추가
}

export class MainScene extends Phaser.Scene implements MyScene {
    public player!: Player;
    private inputManager: InputManager;
    private inventoryUI!: InventoryUI;
    private chunkManager: ChunkManager;
    private worldManager: WorldManager;

    constructor() {
        super({ key: SCENE_KEYS.MAIN });
        this.inputManager = InputManager.getInstance();
        this.chunkManager = ChunkManager.getInstance();
        this.worldManager = WorldManager.getInstance();
    }

    preload() {
        // 이미지 로드 제거
    }

    create() {
        this.setupBackground();
        this.setupPlayer();
        this.setupCamera();
        this.setupInput();
        this.setupInventory();
        this.setupWorld();

        // 디버그 렌더러 활성화
        this.physics.world.createDebugGraphic();
        this.physics.world.debugGraphic.setVisible(true);
    }

    private setupBackground(): void {
        this.cameras.main.setBackgroundColor('#87CEEB');
    }

    private setupPlayer(): void {
        this.player = new Player(
            this,
            PLAYER_CONFIG.INITIAL.X,
            PLAYER_CONFIG.INITIAL.Y,
            this.worldManager  // WorldManager 전달
        );
    }

    private setupCamera(): void {
        // 카메라 경계 제거 (무한 스크롤을 위해)
        this.cameras.main.setBounds(
            -Infinity,  // 왼쪽 끝
            -Infinity,  // 위쪽 끝
            Infinity,   // 오른쪽 끝
            Infinity    // 아래쪽 끝
        );

        // 카메라가 플레이어를 부드럽게 따라가도록 설정
        this.cameras.main.startFollow(
            this.player,
            true,       // 부드러운 움직임 활성화
            0.1,        // 수평 감속
            0.1,        // 수직 감속
            0,          // 수평 오프셋
            0           // 수직 오프셋 (0으로 변경하여 중앙에 위치)
        );

        // 데드존 제거 (항상 부드럽게 따라가도록)
        this.cameras.main.setDeadzone(0, 0);
    }

    private setupInput(): void {
        this.inputManager.init(this);
    }

    private setupInventory(): void {
        this.inventoryUI = new InventoryUI(this);
    }

    private setupWorld(): void {
        this.worldManager.init(this);
        this.worldManager.setupCollision(this.player);

        // 우클릭으로 채굴, 좌클릭으로 설치
        this.input.mouse?.disableContextMenu();
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            
            if (pointer.rightButtonDown()) {
                // 채굴
                this.player.mine(worldPoint.x, worldPoint.y);
            } else if (pointer.leftButtonDown()) {
                // 설치
                this.player.placeBlock(worldPoint.x, worldPoint.y);
            }
        });

        // 채굴 완료 이벤트 처리
        this.game.events.on('miningComplete', (target: { x: number; y: number }) => {
            this.worldManager.removeTileAtWorldPosition(target.x, target.y);
        });

        // 블록 설치 이벤트 처리
        this.game.events.on('blockPlace', (data: { x: number; y: number; type: string }) => {
            this.worldManager.placeTileAtWorldPosition(data.x, data.y, 0);  // 0은 기본 타일 인덱스
        });

        this.worldManager.update(this.player.x, this.player.y);
    }

    update() {
        if (!this.player) return;
        this.handlePlayerMovement();
        
        // 플레이어 업데이트 (채굴 진행도 포함)
        this.player.update(this.time.now, this.time.delta);
        
        this.worldManager.update(this.player.x, this.player.y);

        if (this.inventoryUI) {
            this.inventoryUI.update();
        }
    }

    private handlePlayerMovement(): void {
        const cursors = this.inputManager.getCursors();
        
        // Horizontal movement
        if (cursors.left.isDown || this.inputManager.isAPressed()) {
            this.player.move('left');
        } else if (cursors.right.isDown || this.inputManager.isDPressed()) {
            this.player.move('right');
        } else {
            this.player.move('none');
        }

        // Jump
        if (this.inputManager.isSpacePressed()) {
            this.player.jump();
        }
    }
} 