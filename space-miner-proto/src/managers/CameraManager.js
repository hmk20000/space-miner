export default class CameraManager {
    constructor(scene) {
        this.scene = scene;
        this.mainCamera = scene.cameras.main;
        this.uiCamera = null;
        this.setupCameras();
    }

    setupCameras() {
        // 메인 카메라 설정
        this.mainCamera.setBounds(0, 0, 
            this.scene.gameMap.getWidth() * this.scene.gameMap.getTileSize(), 
            this.scene.gameMap.getHeight() * this.scene.gameMap.getTileSize()
        );
        this.mainCamera.startFollow(this.scene.player);
        this.mainCamera.setZoom(1.5);

        // UI 카메라 설정
        this.setupUICamera();
    }

    setupUICamera() {
        if (this.uiCamera) {
            this.uiCamera.destroy();
        }

        this.uiCamera = this.scene.cameras.add(0, 0, 
            this.scene.scale.width, 
            this.scene.scale.height
        );
        this.uiCamera.setScroll(0, 0);
        this.uiCamera.transparent = true;
        this.uiCamera.setZoom(1);

        this.updateCameraSettings();
    }

    updateCameraSettings() {
        // UI 카메라는 게임 요소만 무시
        this.uiCamera.ignore(this.getGameElements());

        // 메인 카메라는 UI 요소만 무시
        this.mainCamera.ignore(this.getUIElements());
    }

    // 게임 요소 (메인 카메라에서 보임)
    getGameElements() {
        const elements = [
            this.scene.gameMap.getGroundLayer(),
            this.scene.gameMap.getResources(),
            this.scene.player,
            this.scene.gameMap.buildings,
            ...this.scene.gameMap.getResources().getChildren().map(r => r.getData('depositText'))
        ];

        // 건물 프리뷰가 있다면 포함
        if (this.scene.buildMode?.preview) {
            elements.push(this.scene.buildMode.preview);
        }

        return elements;
    }

    // UI 요소 (UI 카메라에서 보임)
    getUIElements() {
        const elements = [];
        
        // UI 컴포넌트들의 요소
        if (this.scene.inventoryUI) elements.push(...this.scene.inventoryUI.getAllElements());
        if (this.scene.craftingUI) elements.push(...this.scene.craftingUI.getAllElements());
        if (this.scene.settingsUI) elements.push(...this.scene.settingsUI.getAllElements());

        // UI 버튼들
        if (this.scene.uiButtons) {
            elements.push(...this.scene.uiButtons);
        }

        return elements;
    }

    // 여러 UI 요소 한번에 추가
    addUIElements(elements) {
        this.mainCamera.ignore(elements);
    }

    // 단일 UI 요소 추가
    addUIElement(element) {
        this.mainCamera.ignore(element);
    }

    // 여러 게임 요소 한번에 추가
    addGameElements(elements) {
        this.uiCamera.ignore(elements);
    }

    // 단일 게임 요소 추가
    addGameElement(element) {
        this.uiCamera.ignore(element);
    }

    resize() {
        this.setupCameras();
    }
} 