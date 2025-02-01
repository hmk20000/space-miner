// UI 디자인 시스템의 기본 스타일과 설정
export const UIStyles = {
    colors: {
        panel: 0x000000,
        panelAlpha: 0.9,
        textPrimary: '#ffffff',
        textSecondary: '#cccccc',
        buttonHover: 0x444444,
        buttonNormal: 0x333333,
        success: '#00ff00',
        error: '#ff0000'
    },
    text: {
        title: {
            fontSize: '32px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff'
        },
        normal: {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff'
        },
        button: {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff'
        }
    },
    padding: {
        small: 10,
        normal: 20,
        large: 30
    }
};

// 기본 UI 패널 클래스
export class BaseUI {
    constructor(scene) {
        this.scene = scene;
        this.elements = new Map();
        this.isOpen = false;
        this.depths = scene.depths;

        // 생성될 때 카메라 설정
        this.setupCamera();
    }

    setupCamera() {
        // UI 요소들은 메인 카메라에서는 무시되고 UI 카메라에서만 보이도록 설정
        const elements = this.getAllElements();
        if (elements.length > 0) {
            this.scene.cameraManager.addUIElements(elements);
        }
    }

    getAllElements() {
        const elements = [];
        this.elements.forEach(element => {
            if (Array.isArray(element)) {
                elements.push(...element);
            } else {
                elements.push(element);
            }
        });
        return elements;
    }

    addElement(key, element) {
        this.elements.set(key, element);
        // 새로운 요소가 추가될 때마다 카메라 설정
        if (Array.isArray(element)) {
            this.scene.cameraManager.addUIElements(element);
        } else {
            this.scene.cameraManager.addUIElement(element);
        }
    }

    clearElements() {
        // 모든 UI 요소 제거
        this.elements.forEach(element => {
            if (Array.isArray(element)) {
                element.forEach(e => e.destroy());
            } else {
                element.destroy();
            }
        });
        this.elements.clear();
    }

    show() {
        this.isOpen = true;
        this.elements.forEach(element => {
            if (element.setVisible) {
                element.setVisible(true);
            }
        });
    }

    hide() {
        // 다음 프레임에서 UI 숨기기 (이벤트 처리 후)
        this.scene.time.delayedCall(0, () => {
            this.isOpen = false;
            this.getAllElements().forEach(element => {
                element.setVisible(false);
            });
        });
    }

    createPanel(width, height) {
        const panel = this.scene.add.rectangle(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            width, height,
            0x000000
        );
        panel.setScrollFactor(0);
        panel.setDepth(this.depths.OVERLAY_UI);
        panel.setAlpha(0.8);
        panel.setInteractive();
        panel.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
        });
        return panel;
    }

    createTitle(text) {
        const title = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2 - 220,
            text,
            UIStyles.text.title
        );
        title.setOrigin(0.5);
        title.setScrollFactor(0);
        title.setDepth(this.depths.OVERLAY_UI);
        return title;
    }

    createCloseButton() {
        const closeButton = this.scene.add.text(
            this.scene.scale.width / 2 + 180,
            this.scene.scale.height / 2 - 220,
            'X',
            UIStyles.text.button
        );
        closeButton.setOrigin(0.5);
        closeButton.setScrollFactor(0);
        closeButton.setDepth(this.depths.OVERLAY_UI);
        closeButton.setInteractive();
        closeButton.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();  // 이벤트 전파 중지
            this.hide();
        });
        return closeButton;
    }

    createButton(x, y, width, height, text, onClick) {
        const button = this.scene.add.rectangle(x, y, width, height, 0x444444);
        button.setScrollFactor(0);
        button.setDepth(this.depths.OVERLAY_UI);
        button.setInteractive();
        button.on('pointerdown', (pointer) => {
            console.log('버튼 클릭');
            onClick(pointer.event);  // 이벤트 객체 전달
        });

        const buttonText = this.scene.add.text(x, y, text, UIStyles.text.normal);
        buttonText.setOrigin(0.5);
        buttonText.setScrollFactor(0);
        buttonText.setDepth(this.depths.OVERLAY_UI);
        buttonText.setInteractive();
        buttonText.on('pointerdown', (pointer) => {
            onClick(pointer.event);  // 이벤트 객체 전달
        });

        const destroy = ()=>{
            button.destroy();
            buttonText.destroy();
        }

        return { button, text: buttonText, destroy };
    }

    // 화면 중앙 좌표 가져오기
    getCenterCoordinates() {
        return {
            x: this.scene.cameras.main.width / 2,
            y: this.scene.cameras.main.height / 2
        };
    }

    // 메시지 표시
    showMessage(text, isError = false) {
        if (this.elements.has('message')) {
            this.elements.get('message').destroy();
        }

        const { x, y } = this.getCenterCoordinates();
        const message = this.scene.add.text(x, y + 100, text, {
            ...UIStyles.text.normal,
            fill: isError ? UIStyles.colors.error : UIStyles.colors.success
        });
        message.setOrigin(0.5);
        message.setScrollFactor(0);
        message.setDepth(this.depths.OVERLAY_UI);

        this.elements.set('message', message);

        this.scene.time.delayedCall(2000, () => {
            if (this.elements.has('message')) {
                this.elements.get('message').destroy();
                this.elements.delete('message');
            }
        });
    }
} 