import Phaser from 'phaser';

export class TilemapTestScene extends Phaser.Scene {
    private tilemap!: Phaser.Tilemaps.Tilemap;
    private layer!: Phaser.Tilemaps.TilemapLayer;

    constructor() {
        super({ key: 'TilemapTestScene' });
    }

    create() {
        // 0. 배경 설정
        this.cameras.main.setBackgroundColor('#87CEEB');  // 하늘색 배경

        // 1. 타일맵 생성
        this.tilemap = this.make.tilemap({
            tileWidth: 32,
            tileHeight: 32,
            width: 20,
            height: 15
        });

        // 2. 단색 타일셋 생성
        const graphics = this.add.graphics();
        graphics.fillStyle(0x663300);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('tile', 32, 32);
        graphics.destroy();

        // 3. 타일셋 추가
        const tileset = this.tilemap.addTilesetImage('tile');
        if (!tileset) return;

        // 4. 레이어 생성 (투명 배경으로)
        this.layer = this.tilemap.createBlankLayer('ground', tileset, 0, 0)!;
        this.layer.setAlpha(1);  // 레이어 완전 불투명

        // 5. 기본 지형 생성
        for (let x = 0; x < 20; x++) {
            const height = 10;
            for (let y = height; y < 15; y++) {
                const tile = this.layer.putTileAt(0, x, y);
                tile.setCollision(true);
                tile.properties = { isMineable: true };
            }
        }

        // 6. 우클릭으로 타일 제거 가능하게 설정
        this.input.mouse?.disableContextMenu();

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.button === 2) { // 우클릭 확인
                const tileX = this.layer.worldToTileX(pointer.worldX);
                const tileY = this.layer.worldToTileY(pointer.worldY);
                
                const tile = this.layer.getTileAt(tileX, tileY);
                if (tile && tile.properties.isMineable) {
                    this.layer.removeTileAt(tileX, tileY);
                    console.log('Tile removed at:', { x: tileX, y: tileY });
                }
            }
        });

        // 7. 디버그 표시
        this.layer.renderDebug(this.add.graphics(), {
            tileColor: null,
            collidingTileColor: new Phaser.Display.Color(243, 134, 48, 128)
        });
    }
} 