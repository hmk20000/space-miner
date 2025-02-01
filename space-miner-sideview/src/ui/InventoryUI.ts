import { InventoryManager } from '../managers/InventoryManager';

export class InventoryUI {
    private scene: Phaser.Scene;
    private inventoryManager: InventoryManager;
    private container: Phaser.GameObjects.Container;
    private graphics: Phaser.GameObjects.Graphics;
    private x: number = 0;
    private y: number = 0;
    private itemTexts: Phaser.GameObjects.Text[] = [];
    private quantityTexts: Phaser.GameObjects.Text[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.inventoryManager = InventoryManager.getInstance();
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.graphics = this.scene.add.graphics();
        this.graphics.setScrollFactor(0);
        this.createInventoryUI();
    }

    private createInventoryUI(): void {
        const padding = 10;
        const slotSize = 40;
        const slotsPerRow = 5;

        // 우측 상단에 위치하도록 계산
        const startX = this.scene.cameras.main.width - ((slotSize + padding) * slotsPerRow + padding * 2);
        const startY = padding;

        this.x = startX;
        this.y = startY;

        // 배경 생성
        const bg = this.scene.add.rectangle(
            startX + ((slotSize + padding) * slotsPerRow) / 2,
            startY + ((slotSize + padding) * 2) / 2,
            (slotSize + padding) * slotsPerRow + padding,
            (slotSize + padding) * 2 + padding,
            0x000000,
            0.5
        );
        this.container.add(bg);

        // 초기 인벤토리 표시
        this.updateInventoryDisplay();
    }

    private clearTexts(): void {
        // 기존 텍스트 객체들 제거
        this.itemTexts.forEach(text => text.destroy());
        this.quantityTexts.forEach(text => text.destroy());
        this.itemTexts = [];
        this.quantityTexts = [];
    }

    private updateInventoryDisplay(): void {
        const items = this.inventoryManager.getItems();
        
        // 기존 표시 지우기
        this.graphics.clear();
        this.clearTexts();

        // 빈 슬롯 배경 그리기 (10개)
        for (let i = 0; i < 10; i++) {
            const x = this.x + (i % 5) * 40;
            const y = this.y + Math.floor(i / 5) * 40;

            // 슬롯 배경 (회색)
            this.graphics.fillStyle(0x666666, 0.5);
            this.graphics.fillRect(x, y, 36, 36);

            // 슬롯 테두리
            this.graphics.lineStyle(1, 0xffffff, 0.3);
            this.graphics.strokeRect(x, y, 36, 36);
        }

        // items가 배열인지 확인
        if (Array.isArray(items)) {
            // 아이템 표시
            items.forEach((item, index) => {
                if (!item) return;  // 아이템이 유효한지 확인

                const x = this.x + (index % 5) * 40;
                const y = this.y + Math.floor(index / 5) * 40;

                // 아이템 배경 (더 진한 회색)
                this.graphics.fillStyle(0x888888, 0.8);
                this.graphics.fillRect(x, y, 36, 36);
                
                // 아이템 이름
                const itemText = this.scene.add.text(x + 18, y + 12, item.name || '???', {
                    fontSize: '10px',
                    color: '#ffffff'
                }).setOrigin(0.5).setScrollFactor(0);
                this.itemTexts.push(itemText);

                // 아이템 수량 표시
                if (item.quantity > 1) {
                    const quantityText = this.scene.add.text(x + 28, y + 28, item.quantity.toString(), {
                        fontSize: '12px',
                        color: '#ffffff',
                        backgroundColor: '#000000'
                    }).setOrigin(0.5).setScrollFactor(0);
                    this.quantityTexts.push(quantityText);
                }
            });
        }
    }

    // update 메서드 다시 추가
    public update(): void {
        this.updateInventoryDisplay();
    }
} 