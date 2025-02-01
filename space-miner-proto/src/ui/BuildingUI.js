import { BaseUI, UIStyles } from './UISystem';
import i18n from '../localization/i18n';
import MinerUI from './buildings/MinerUI';
import WarehouseUI from './buildings/WarehouseUI';

export default class BuildingUI extends BaseUI {
    constructor(scene) {
        super(scene);
        this.selectedBuilding = null;
        this.buildingSpecificUI = null;
        this.createUI();
    }

    createUI() {
        // 패널 생성
        this.panel = this.createPanel(600, 400);
        this.addElement('panel', this.panel);

        // 제목 생성
        this.title = this.createTitle('');
        this.addElement('title', this.title);

        // 닫기 버튼 생성
        const closeButton = this.createCloseButton();
        this.addElement('closeButton', closeButton);

        // 초기 상태는 숨김
        this.hide();
    }

    showBuilding(building) {
        this.selectedBuilding = building;
        
        // 건물 타입에 따른 제목 설정
        this.title.setText(i18n.t(`building.${building.getData('type')}`));

        // 기존 건물별 UI 제거
        if (this.buildingSpecificUI) {
            this.buildingSpecificUI.destroy();
            this.buildingSpecificUI = null;
        }

        // 건물별 UI 생성
        this.createBuildingSpecificUI(building);

        // 인벤토리 구독
        this.scene.events.on('updateInventory', this.updateBuildingInfo, this);

        this.show();
        // 건물별 UI도 표시하고 isOpen 상태 설정
        if (this.buildingSpecificUI) {
            this.buildingSpecificUI.isOpen = true;  // isOpen 상태 설정
            this.buildingSpecificUI.show();
        }
    }

    hide() {
        // 건물별 UI 숨기기
        if (this.buildingSpecificUI) {
            this.buildingSpecificUI.isOpen = false;  // isOpen 상태 해제
            this.buildingSpecificUI.hide();
        }

        super.hide();
        // 인벤토리 구독 해제
        this.scene.events.off('updateInventory', this.updateBuildingInfo, this);
        
        // 건물별 UI 제거
        if (this.buildingSpecificUI) {
            this.buildingSpecificUI.destroy();
            this.buildingSpecificUI = null;
        }
    }

    createBuildingSpecificUI(building) {
        const buildingType = building.getData('type');
        let BuildingUIClass;

        // 건물 타입에 따른 UI 클래스 선택
        switch (buildingType) {
            case 'miner':
                BuildingUIClass = MinerUI;
                break;
            case 'warehouse':
                BuildingUIClass = WarehouseUI;
                break;
            default:
                console.warn(`Unknown building type: ${buildingType}`);
                return;
        }

        // 건물별 UI 인스턴스 생성 (부모 패널 전달)
        this.buildingSpecificUI = new BuildingUIClass(this.scene, building, this.panel);
        this.buildingSpecificUI.createUI();
    }

    updateBuildingInfo() {
        if (!this.buildingSpecificUI || !this.isOpen) return;
        
        // 건물별 UI 업데이트
        this.buildingSpecificUI.updateUI();
    }

    destroy() {
        if (this.buildingSpecificUI) {
            this.buildingSpecificUI.destroy();
        }
        super.destroy();
    }
} 