import { BaseUI, UIStyles } from './UISystem';
import i18n from '../localization/i18n';
import { ItemTypes } from '../data/Items';

export default class InventoryUI extends BaseUI {
    constructor(scene) {
        super(scene);
        this.createUI();
        
        // 언어 변경 시 UI 업데이트
        i18n.addListener(() => {
            if (this.isOpen) {
                this.updateTexts();
            }
        });

        // 아이템 변경 구독
        this.scene.itemManager.addListener(() => {
            if (this.isOpen) {
                this.updateUI();
            }
        });
    }

    createUI() {
        // 패널 생성
        this.panel = this.createPanel(400, 500);
        this.addElement('panel', this.panel);

        // 제목 생성 (번역된 제목 사용)
        const title = this.createTitle(i18n.t('ui.inventory.title'));
        this.addElement('title', title);

        // 닫기 버튼 생성
        const closeButton = this.createCloseButton();
        this.addElement('closeButton', closeButton);

        // 초기 상태는 숨김
        this.hide();
    }

    createItemList() {
        // 보유한 아이템만 표시
        const items = this.scene.itemManager.getInventoryItems();
        
        items.forEach((item, index) => {
            const y = this.panel.y - 100 + (index * 40);
            const amount = this.scene.itemManager.getItemAmount(item.key);
            
            // 아이템 이름 (번역된)
            const itemName = i18n.t(item.name);
            const text = this.scene.add.text(
                this.panel.x - 150, y, 
                `${itemName}: ${amount}`, 
                UIStyles.text.normal
            );
            text.setScrollFactor(0);
            text.setDepth(this.depths.OVERLAY_UI);
            
            // 건물 아이템인 경우 설치 버튼 추가
            if (item.type === ItemTypes.BUILDING && item.buildable) {
                const { button, text: buttonText } = this.createButton(
                    this.panel.x + 100, y,
                    80, 30,
                    i18n.t('ui.inventory.place'),
                    (event) => {
                        if (event) {
                            event.stopPropagation();  // 이벤트 전파 중지
                        }
                        // 먼저 UI를 닫고
                        this.hide();
                        // 그 다음 설치 모드 진입
                        this.scene.time.delayedCall(0, () => {
                            this.scene.enterBuildMode(item.key);
                        });
                    }
                );
                this.addElement(`${item.key}_build_button`, [button, buttonText]);
            }

            this.addElement(`${item.key}_text`, text);
        });
    }

    updateUI() {
        if (!this.isOpen) return;  // 창이 닫혀있으면 업데이트 하지 않음

        // 기존 아이템 목록만 제거
        this.elements.forEach((element, key) => {
            if (key !== 'panel' && key !== 'title' && key !== 'closeButton') {
                if (Array.isArray(element)) {
                    element.forEach(e => e.destroy());
                } else {
                    element.destroy();
                }
                this.elements.delete(key);
            }
        });
        
        // 인벤토리 아이템 목록 표시
        const items = this.scene.itemManager.getInventoryItems();
        items.forEach((item, index) => {
            const y = this.panel.y - 100 + (index * 40);
            const amount = this.scene.itemManager.getItemAmount(item.key);
            
            // 아이템 이름 (번역된)
            const itemName = i18n.t(item.name);
            const text = this.scene.add.text(
                this.panel.x - 150, y, 
                `${itemName}: ${amount}`, 
                UIStyles.text.normal
            );
            text.setScrollFactor(0);
            text.setDepth(this.depths.OVERLAY_UI);
            
            this.addElement(`${item.key}_text`, text);
        });
    }

    show() {
        super.show();
        this.createItemList();  // UI가 표시될 때 아이템 목록 생성
    }

    hide() {
        // 아이템 목록 제거
        this.elements.forEach((element, key) => {
            if (key !== 'panel' && key !== 'title' && key !== 'closeButton') {
                if (Array.isArray(element)) {
                    element.forEach(e => e.destroy());
                } else {
                    element.destroy();
                }
                this.elements.delete(key);
            }
        });
        super.hide();
    }

    updateTexts() {
        if (!this.isOpen) return;  // 창이 닫혀있으면 업데이트 하지 않음

        // inventory의 각 아이템에 대해 텍스트 업데이트
        const items = this.scene.itemManager.getInventoryItems();
        items.forEach(item => {
            const textElement = this.elements.get(`${item.key}_text`);
            if (textElement) {
                const itemName = i18n.t(item.name);
                const amount = this.scene.itemManager.getItemAmount(item.key);
                textElement.setText(`${itemName}: ${amount}`);
            }
        });
    }
} 