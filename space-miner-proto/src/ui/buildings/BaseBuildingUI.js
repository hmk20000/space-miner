import { BaseUI, UIStyles } from '../UISystem';
import i18n from '../../localization/i18n';

export default class BaseBuildingUI extends BaseUI {
    constructor(scene, building, parentPanel) {
        super(scene);
        this.building = building;
        this.panel = parentPanel;
    }

    createUI() {
        this.createPlayerInventory();
        // this.createBuildingInventory();
    }

    createPlayerInventory() {
        // 좌측: 플레이어 인벤토리
        let y = this.panel.y - 100;

        // 플레이어 인벤토리 제목
        const playerTitle = this.scene.add.text(
            this.panel.x - 200,
            y,
            '내 인벤토리',
            {
                ...UIStyles.text.normal,
                fontSize: '20px',
                color: '#ffffff'
            }
        );
        playerTitle.setOrigin(0.5, 0);
        playerTitle.setDepth(this.depths.OVERLAY_UI);
        this.addElement('player_title', playerTitle);
        y += 30;


        const testButton = this.createButton(
            this.panel.x - 200,
            y,
            80, 30,
            '테스트',
            () => {
                console.log('테스트 버튼 클릭');
            }
        );
        this.addElement('test_button', testButton);
        // // 플레이어 아이템 목록
        // const playerInventory = this.scene.itemManager.getInventoryItems();
        // playerInventory.forEach(item => {
        //     const amount = this.scene.itemManager.getItemAmount(item.key);
        //     const itemText = this.scene.add.text(
        //         this.panel.x - 200,
        //         y,
        //         `${i18n.t(item.name)}: ${amount}`,
        //         {
        //             ...UIStyles.text.normal,
        //             fontSize: '18px',
        //             color: '#ffffff'
        //         }
        //     );
        //     itemText.setOrigin(0.5, 0);
        //     itemText.setDepth(this.depths.OVERLAY_UI);
        //     this.addElement(`player_${item.key}`, itemText);

        //     // 이동 버튼 추가
        //     const moveButton = this.scene.add.text(
        //         this.panel.x - 100,
        //         y,
        //         '→',
        //         {
        //             ...UIStyles.text.normal,
        //             fontSize: '20px',
        //             backgroundColor: '#444444',
        //             padding: { x: 10, y: 5 }
        //         }
        //     ).setInteractive();
        //     moveButton.setOrigin(0.5, 0);
        //     moveButton.setDepth(this.depths.OVERLAY_UI);
        //     moveButton.on('pointerdown', () => {
        //         console.log(`이동 버튼 클릭: ${item.key}`);
        //         if (this.moveItemToBuilding(item.key)) {
        //             this.updateUI();  // 이동 성공 시 UI 업데이트
        //         }
        //     });
        //     this.addElement(`move_to_building_${item.key}`, moveButton);

        //     y += 30;
        // });
    }

    createBuildingInventory() {
        // 우측: 건물 인벤토리
        let y = this.panel.y - 100;

        // 건물 인벤토리 제목
        const buildingTitle = this.scene.add.text(
            this.panel.x + 200,
            y,
            `${i18n.t(`building.${this.building.getData('type')}`)} 인벤토리`,
            {
                ...UIStyles.text.normal,
                fontSize: '20px',
                color: '#ffffff'
            }
        );
        buildingTitle.setOrigin(0.5, 0);
        buildingTitle.setDepth(this.depths.OVERLAY_UI);
        this.addElement('building_title', buildingTitle);
        y += 30;

        // 건물 인벤토리 목록
        const inventory = this.building.getData('inventory') || {};
        Object.entries(inventory).forEach(([resourceType, amount]) => {
            const itemText = this.scene.add.text(
                this.panel.x + 200,
                y,
                `${i18n.t(`resource.${resourceType}`)}: ${amount}`,
                {
                    ...UIStyles.text.normal,
                    fontSize: '18px',
                    color: '#ffffff'
                }
            );
            itemText.setOrigin(0.5, 0);
            itemText.setDepth(this.depths.OVERLAY_UI);
            this.addElement(`building_${resourceType}`, itemText);

            // 이동 버튼 추가
            const moveButton = this.scene.add.text(
                this.panel.x + 100,
                y,
                '←',
                {
                    ...UIStyles.text.normal,
                    fontSize: '20px',
                    backgroundColor: '#444444',
                    padding: { x: 10, y: 5 }
                }
            ).setInteractive();
            moveButton.setOrigin(0.5, 0);
            moveButton.setDepth(this.depths.OVERLAY_UI);
            moveButton.on('pointerdown', () => {
                console.log(`이동 버튼 클릭: ${resourceType}`);
                if (this.moveItemToPlayer(resourceType)) {
                    this.updateUI();  // 이동 성공 시 UI 업데이트
                }
            });
            this.addElement(`move_to_player_${resourceType}`, moveButton);

            y += 30;
        });
    }

    moveItemToBuilding(itemKey) {
        console.log(`이동 버튼 클릭: ${itemKey}`);
        // 구현은 각 건물별 UI에서 오버라이드
    }

    moveItemToPlayer(itemKey) {
        // 구현은 각 건물별 UI에서 오버라이드
    }

    updateUI() {
        if (!this.isOpen) return;

        // 기존 요소 제거
        this.elements.forEach((element, key) => {
            if (key !== 'panel') {
                if (Array.isArray(element)) {
                    element.forEach(e => e.destroy());
                } else {
                    element.destroy();
                }
                this.elements.delete(key);
            }
        });

        // UI 다시 생성
        this.createUI();
    }

    destroy() {
        // 기존 요소 제거
        this.elements.forEach((element, key) => {
            if (key !== 'panel') {
                if (Array.isArray(element)) {
                    element.forEach(e => e.destroy());
                } else {
                    element.destroy();
                }
            }
        });
        this.elements.clear();
    }
} 