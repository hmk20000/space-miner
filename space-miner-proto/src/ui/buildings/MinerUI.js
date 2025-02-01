import BaseBuildingUI from './BaseBuildingUI';

export default class MinerUI extends BaseBuildingUI {
    constructor(scene, building, parentPanel) {
        super(scene, building, parentPanel);
        this.scene.events.on('minerUpdate', this.onMinerUpdate, this);
    }

    onMinerUpdate(updatedBuilding) {
        if (this.building === updatedBuilding) {
            this.updateUI();
        }
    }

    // 채굴기는 플레이어로부터 아이템을 받지 않음
    moveItemToBuilding(itemKey) {
        // 채굴기는 자동으로만 아이템을 얻음
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
            return true;
        }
        return false;
    }

    destroy() {
        if (this.scene && this.scene.events) {
            this.scene.events.off('minerUpdate', this.onMinerUpdate, this);
        }
        if (super.destroy) {
            super.destroy();
        }
    }
} 