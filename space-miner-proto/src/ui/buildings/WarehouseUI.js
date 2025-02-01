import { BaseUI, UIStyles } from '../UISystem';
import i18n from '../../localization/i18n';
import BaseBuildingUI from './BaseBuildingUI';

export default class WarehouseUI extends BaseBuildingUI {
    constructor(scene, building, parentPanel) {
        super(scene, building, parentPanel);
    }

    createUI() {
        // Warehouse UI 생성 로직
        const inventory = this.building.getData('inventory') || {};
        let y = this.panel.y - 100;

        // Warehouse 인벤토리 제목
        const title = this.scene.add.text(
            this.panel.x,
            y,
            '창고 인벤토리',
            {
                ...UIStyles.text.normal,
                fontSize: '20px',
                color: '#ffffff'
            }
        );
        title.setOrigin(0.5, 0);
        title.setDepth(this.depths.OVERLAY_UI);
        this.addElement('warehouse_title', title);
        y += 30;

        // 자원 목록 표시
        Object.entries(inventory).forEach(([resourceType, amount]) => {
            const resourceText = this.scene.add.text(
                this.panel.x,
                y,
                `${i18n.t(`resource.${resourceType}`)}: ${amount}`,
                {
                    ...UIStyles.text.normal,
                    fontSize: '18px',
                    color: '#ffffff'
                }
            );
            resourceText.setOrigin(0.5, 0);
            resourceText.setDepth(this.depths.OVERLAY_UI);
            this.addElement(`warehouse_${resourceType}`, resourceText);
            y += 30;
        });
    }

    moveItemToBuilding(itemKey) {
        const amount = this.scene.itemManager.getItemAmount(itemKey);
        if (amount > 0) {
            const inventory = this.building.getData('inventory') || {};
            inventory[itemKey] = (inventory[itemKey] || 0) + 1;
            this.building.setData('inventory', inventory);
            this.scene.itemManager.removeItem(itemKey, 1);
            this.updateUI();
            return true;
        }
        return false;
    }

    moveItemToPlayer(resourceType) {
        const inventory = this.building.getData('inventory') || {};
        const amount = inventory[resourceType] || 0;

        if (amount > 0) {
            console.log(`가져오기 버튼 클릭: ${resourceType} - 현재 수량: ${amount}`);
            this.scene.itemManager.addItem(resourceType, 1);
            inventory[resourceType] -= 1;
            if (inventory[resourceType] <= 0) {
                delete inventory[resourceType];
            }
            this.building.setData('inventory', inventory);
            this.updateUI();
            return true;
        }
        return false;
    }
} 