import CraftingUI from '../ui/CraftingUI';
import InventoryUI from '../ui/InventoryUI';
import { UIStyles } from '../ui/UISystem';
import SettingsUI from '../ui/SettingsUI';
import i18n from '../localization/i18n';
import GameMap from '../map/GameMap';
import { BuildingManager } from '../data/Buildings';
import { ItemManager } from '../managers/ItemManager';
import CameraManager from '../managers/CameraManager';
import BuildingUI from '../ui/BuildingUI';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.itemManager = new ItemManager();
        this.cameraManager = null;  // create()에서 초기화

        // depth 상수 정의
        this.depths = {
            MAP: 0,
            TILE: 1,
            BUILDING: 2,
            TILE_INFO: 3,
            CHARACTER: 4,
            EFFECT: 5,
            WORLD_UI: 6,
            OVERLAY_UI: 7
        };

        this.buildMode = {
            active: false,
            building: null
        };
    }

    preload() {
        this.load.spritesheet('resources', 'assets/resources.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.image('tiles', 'assets/tiles.png');
        this.load.image('player', 'assets/player.png');
        this.load.spritesheet('buildings', 'assets/buildings.png', {
            frameWidth: 32,
            frameHeight: 32
        });
    }

    create() {
        // 맵 생성 (특정 시드값으로 초기화)
        this.gameMap = new GameMap(this);
        this.gameMap.setSeed(12345);
        this.gameMap.create();
        
        // 플레이어 생성
        this.createPlayer();
        
        // 메인 게임 카메라 설정
        this.cameraManager = new CameraManager(this);
        
        // UI 생성
        this.inventoryUI = new InventoryUI(this);
        this.craftingUI = new CraftingUI(this);
        this.settingsUI = new SettingsUI(this);
        this.buildingUI = new BuildingUI(this);
        
        // 초기 아이템 목록 업데이트
        this.inventoryUI.updateUI();  // 인벤토리 UI 업데이트

        // UI 버튼 생성
        this.createUIButtons();

        // 입력 이벤트 설정
        this.input.on('pointerdown', (pointer) => {
            // 먼저 UI 상태 저장
            const wasUIOpen = this.inventoryUI.isOpen || 
                             this.craftingUI.isOpen || 
                             this.settingsUI.isOpen ||
                             this.buildingUI.isOpen;

            // UI 영역 클릭 체크 (패널 위치 기준)
            const isClickingUIArea = () => {
                if (!wasUIOpen) return false;
                
                const centerX = this.scale.width / 2;
                const centerY = this.scale.height / 2;
                const panelWidth = 400;  // UI 패널 크기
                const panelHeight = 500;

                return pointer.x >= centerX - panelWidth/2 && 
                       pointer.x <= centerX + panelWidth/2 && 
                       pointer.y >= centerY - panelHeight/2 && 
                       pointer.y <= centerY + panelHeight/2;
            };

            // 건물 설치 모드일 때
            if (this.buildMode.active) {
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const tileX = Math.floor(worldPoint.x / this.gameMap.getTileSize());
                const tileY = Math.floor(worldPoint.y / this.gameMap.getTileSize());
                
                this.placeBuilding(tileX, tileY);
                return;
            }

            // 건물 클릭 체크
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const tileX = Math.floor(worldPoint.x / this.gameMap.getTileSize());
            const tileY = Math.floor(worldPoint.y / this.gameMap.getTileSize());
            
            const clickedBuilding = this.gameMap.findBuildingAt(tileX, tileY);
            if (clickedBuilding) {
                this.closeAllUI();
                this.buildingUI.showBuilding(clickedBuilding);
                return;
            }

            // UI가 열려있었거나 UI 영역을 클릭했으면 이동하지 않음
            if (wasUIOpen || isClickingUIArea()) {
                return;
            }

            // 건물 설치 가능 여부 체크
            if (this.canPlaceBuilding(tileX, tileY)) {
                // 창고 건물 설치 가능
                if (this.buildMode.building.key === 'warehouse') {
                    // 창고는 자원 위에 설치할 수 없음
                    const hasResource = this.gameMap.findResourceAt(tileX, tileY);
                    if (hasResource) {
                        this.showMessage(i18n.t('ui.building.cannot_place_here'), true);
                        return;
                    }
                }
            }

            // UI 버튼 영역 클릭 시 이동하지 않음
            if (this.isClickingUIButton(pointer)) {
                return;
            }

            // 캐릭터 위치 체크
            const playerTileX = Math.floor(this.player.x / this.gameMap.getTileSize());
            const playerTileY = Math.floor(this.player.y / this.gameMap.getTileSize());

            // 캐릭터가 있는 타일을 클릭했다면 아무것도 하지 않음
            if (tileX === playerTileX && tileY === playerTileY) {
                return;
            }
            
            // 플레이어 이동
            this.movePlayerTo(tileX * this.gameMap.getTileSize() + this.gameMap.getTileSize()/2, tileY * this.gameMap.getTileSize() + this.gameMap.getTileSize()/2);
        });

        // 건물 설치를 위한 마우스 이벤트
        this.input.on('pointermove', (pointer) => {
            if (this.buildMode.active && this.buildMode.preview) {
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const tileX = Math.floor(worldPoint.x / this.gameMap.getTileSize());
                const tileY = Math.floor(worldPoint.y / this.gameMap.getTileSize());
                
                // 프리뷰 위치 업데이트
                this.buildMode.preview.setPosition(
                    tileX * this.gameMap.getTileSize() + this.gameMap.getTileSize()/2,
                    tileY * this.gameMap.getTileSize() + this.gameMap.getTileSize()/2
                );

                // 설치 가능 여부에 따라 색상 변경
                const canPlace = this.canPlaceBuilding(tileX, tileY);
                const hasResource = this.gameMap.findResourceAt(tileX, tileY);
                
                // 채굴기인 경우 자원이 있어야 하고, 다른 건물인 경우 자원이 없어야 함
                const isValidPlacement = this.buildMode.building.key === 'miner' ? hasResource : !hasResource;
                
                if (canPlace && isValidPlacement) {
                    this.buildMode.preview.setTint(0x00ff00);
                } else {
                    this.buildMode.preview.setTint(0xff0000);
                }
            }
        });
    }

    resize() {
        this.gameMap.resize();
        
        // 카메라 경계 재설정
        this.cameras.main.setBounds(0, 0, 
            this.gameMap.getWidth() * this.gameMap.getTileSize(), 
            this.gameMap.getHeight() * this.gameMap.getTileSize()
        );
        
        // UI 카메라 재설정
        this.cameraManager.setupCameras();
    }

    createPlayer() {
        // 맵의 중앙 타일 좌표 계산
        const centerTileX = Math.floor(this.gameMap.getWidth() / 2);
        const centerTileY = Math.floor(this.gameMap.getHeight() / 2);

        // 타일 좌표를 월드 좌표로 변환 (타일의 중앙에 위치하도록)
        const worldX = (centerTileX * this.gameMap.getTileSize()) + (this.gameMap.getTileSize() / 2);
        const worldY = (centerTileY * this.gameMap.getTileSize()) + (this.gameMap.getTileSize() / 2);

        this.player = this.add.sprite(worldX, worldY, 'player');
        this.player.setDepth(this.depths.CHARACTER);
        this.player.isMoving = false;
    }

    movePlayerTo(x, y) {
        if (this.player.isMoving) return;

        const distance = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            x, y
        );

        this.player.isMoving = true;

        this.tweens.add({
            targets: this.player,
            x: x,
            y: y,
            duration: distance * 3,
            onComplete: () => {
                this.player.isMoving = false;
            }
        });
    }

    createUIButtons() {
        // UI 요소들을 저장할 배열
        const uiElements = [];
        
        const padding = 20;
        const buttonWidth = 50;
        const buttonHeight = 50;

        // 인벤토리 버튼
        const inventoryButton = this.add.rectangle(padding + buttonWidth/2, padding + buttonHeight/2, 
            buttonWidth, buttonHeight, 0x444444);
        inventoryButton.setScrollFactor(0);
        inventoryButton.setDepth(this.depths.WORLD_UI);
        inventoryButton.setAlpha(1);
        inventoryButton.setInteractive();
        uiElements.push(inventoryButton);

        const inventoryIcon = this.add.text(padding + buttonWidth/2, padding + buttonHeight/2, 'I', {
            ...UIStyles.text.button,
            fontSize: '32px',
            color: '#ffffff'
        });
        inventoryIcon.setOrigin(0.5);
        inventoryIcon.setScrollFactor(0);
        inventoryIcon.setDepth(this.depths.WORLD_UI);
        uiElements.push(inventoryIcon);

        // 제작 버튼
        const craftButton = this.add.rectangle(padding*2 + buttonWidth*1.5, padding + buttonHeight/2, 
            buttonWidth, buttonHeight, 0x444444);
        craftButton.setScrollFactor(0);
        craftButton.setDepth(this.depths.WORLD_UI);
        craftButton.setAlpha(1);
        craftButton.setInteractive();
        uiElements.push(craftButton);

        const craftIcon = this.add.text(padding*2 + buttonWidth*1.5, padding + buttonHeight/2, 'C', {
            ...UIStyles.text.button,
            fontSize: '32px',
            color: '#ffffff'
        });
        craftIcon.setOrigin(0.5);
        craftIcon.setScrollFactor(0);
        craftIcon.setDepth(this.depths.WORLD_UI);
        uiElements.push(craftIcon);

        // 설정 버튼
        const settingsButton = this.add.rectangle(
            padding*3 + buttonWidth*2.5, 
            padding + buttonHeight/2,
            buttonWidth, 
            buttonHeight, 
            0x444444
        );
        settingsButton.setScrollFactor(0);
        settingsButton.setDepth(this.depths.WORLD_UI);
        settingsButton.setAlpha(1);
        settingsButton.setInteractive();
        uiElements.push(settingsButton);

        const settingsIcon = this.add.text(
            padding*3 + buttonWidth*2.5, 
            padding + buttonHeight/2, 
            'S', 
            {
                ...UIStyles.text.button,
                fontSize: '32px',
                color: '#ffffff'
            }
        );
        settingsIcon.setOrigin(0.5);
        settingsIcon.setScrollFactor(0);
        settingsIcon.setDepth(this.depths.WORLD_UI);
        uiElements.push(settingsIcon);

        // 모든 UI 요소들은 메인 카메라에서 무시되고 UI 카메라에서만 보이도록 설정
        if (this.cameraManager.uiCamera) {
            this.cameras.main.ignore(uiElements);
        }

        // 버튼 이벤트
        inventoryButton.on('pointerover', () => {
            inventoryButton.setFillStyle(0x666666);
        });
        inventoryButton.on('pointerout', () => {
            inventoryButton.setFillStyle(0x444444);
        });
        inventoryButton.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            if (this.inventoryUI.isOpen) {
                this.inventoryUI.hide();
            } else {
                // 다른 UI가 열려있으면 모두 닫기
                this.closeAllUI();
                this.inventoryUI.show();
            }
        });

        craftButton.on('pointerover', () => {
            craftButton.setFillStyle(0x666666);
        });
        craftButton.on('pointerout', () => {
            craftButton.setFillStyle(0x444444);
        });
        craftButton.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            if (this.craftingUI.isOpen) {
                this.craftingUI.hide();
            } else {
                // 다른 UI가 열려있으면 모두 닫기
                this.closeAllUI();
                this.craftingUI.show();
            }
        });

        // 설정 버튼 이벤트
        settingsButton.on('pointerover', () => {
            settingsButton.setFillStyle(0x666666);
        });
        settingsButton.on('pointerout', () => {
            settingsButton.setFillStyle(0x444444);
        });
        settingsButton.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            if (this.settingsUI.isOpen) {
                this.settingsUI.hide();
            } else {
                // 다른 UI가 열려있으면 모두 닫기
                this.closeAllUI();
                this.settingsUI.show();
            }
        });

        // 설정 툴팁 추가
        this.createTooltip(settingsButton, 'Settings (S)');

        // 키보드 단축키 추가
        this.input.keyboard.on('keydown-I', () => {
            if (this.inventoryUI.isOpen) {
                this.inventoryUI.hide();
            } else {
                this.closeAllUI();
                this.inventoryUI.show();
            }
        });

        this.input.keyboard.on('keydown-C', () => {
            if (this.craftingUI.isOpen) {
                this.craftingUI.hide();
            } else {
                this.closeAllUI();
                this.craftingUI.show();
            }
        });

        this.input.keyboard.on('keydown-S', () => {
            if (this.settingsUI.isOpen) {
                this.settingsUI.hide();
            } else {
                this.closeAllUI();
                this.settingsUI.show();
            }
        });
    }

    createTooltip(button, text) {
        button.on('pointerover', () => {
            const x = button.x + button.width/2 + 5;
            const y = button.y;
            
            this.tooltip = this.add.text(x, y, text, {
                ...UIStyles.text.normal,
                backgroundColor: '#000000',
                padding: { x: 5, y: 2 }
            });
            this.tooltip.setScrollFactor(0);
            this.tooltip.setDepth(this.depths.WORLD_UI);
        });

        button.on('pointerout', () => {
            if (this.tooltip) {
                this.tooltip.destroy();
                this.tooltip = null;
            }
        });
    }

    // UI 버튼 영역 클릭 여부 확인
    isClickingUIButton(pointer) {
        const padding = 20;
        const buttonWidth = 50;
        const buttonHeight = 50;
        
        // 버튼들의 영역 정의
        const buttonAreas = [
            { // 인벤토리 버튼
                x: padding,
                y: padding,
                width: buttonWidth,
                height: buttonHeight
            },
            { // 제작 버튼
                x: padding*2 + buttonWidth,
                y: padding,
                width: buttonWidth,
                height: buttonHeight
            },
            { // 설정 버튼
                x: padding*3 + buttonWidth*2,
                y: padding,
                width: buttonWidth,
                height: buttonHeight
            }
        ];

        // 클릭 위치가 버튼 영역 내에 있는지 확인
        return buttonAreas.some(area => {
            return pointer.x >= area.x && 
                   pointer.x <= area.x + area.width &&
                   pointer.y >= area.y && 
                   pointer.y <= area.y + area.height;
        });
    }

    // 모든 UI를 닫는 헬퍼 메서드
    closeAllUI() {
        if (this.inventoryUI.isOpen) this.inventoryUI.hide();
        if (this.craftingUI.isOpen) this.craftingUI.hide();
        if (this.settingsUI.isOpen) this.settingsUI.hide();
        if (this.buildingUI.isOpen) this.buildingUI.hide();
    }

    update() {
        // 플레이어가 자원 위에 있는지 확인하고 채굴
        if (!this.player.isMoving) {
            const playerTileX = Math.floor(this.player.x / this.gameMap.getTileSize());
            const playerTileY = Math.floor(this.player.y / this.gameMap.getTileSize());

            this.gameMap.getResources().getChildren().forEach((resource) => {
                const resourceTileX = Math.floor(resource.x / this.gameMap.getTileSize());
                const resourceTileY = Math.floor(resource.y / this.gameMap.getTileSize());

                if (playerTileX === resourceTileX && playerTileY === resourceTileY) {
                    this.mineResource(resource);
                }
            });
        }

        // 채굴기 업데이트
        this.gameMap.buildings.getChildren().forEach(building => {
            if (building.getData('type') === 'miner') {
                const currentTime = this.time.now;
                const lastMineTime = building.getData('lastMineTime') || 0;
                const buildingData = BuildingManager.getBuildingByKey('miner');
                
                const tileX = Math.floor(building.x / this.gameMap.getTileSize());
                const tileY = Math.floor(building.y / this.gameMap.getTileSize());
                
                // 자원이 있는지 확인
                const hasResource = this.gameMap.findResourceAt(tileX, tileY);
                
                // 자원 유무에 따라 채굴기 색상 변경
                if (hasResource) {
                    building.clearTint();  // 기본 색상으로 복원
                    
                    // 채굴 로직
                    if (currentTime - lastMineTime >= buildingData.miningSpeed) {
                        const deposit = hasResource.getData('deposit');
                        
                        if (deposit > 0) {
                            const resourceType = hasResource.getData('type');
                            
                            // 채굴기 인벤토리에 추가
                            const inventory = building.getData('inventory') || {};
                            inventory[resourceType] = (inventory[resourceType] || 0) + 1;
                            building.setData('inventory', inventory);
                            
                            // 마지막 채굴 시간 업데이트
                            building.setData('lastMineTime', currentTime);

                            // 채굴 이벤트 발생
                            this.events.emit('minerUpdate', building);

                            // 자원 깜빡임 효과
                            this.tweens.add({
                                targets: hasResource,
                                alpha: 0.3,
                                duration: 100,
                                yoyo: true,
                                repeat: 1
                            });

                            // 매장량 감소
                            hasResource.setData('deposit', deposit - 1);
                            hasResource.getData('depositText').setText((deposit - 1).toString());
                            
                            // 매장량이 0이 되면 자원 제거
                            if (deposit - 1 <= 0) {
                                const fadeTargets = [hasResource, hasResource.getData('depositText')];
                                this.cameraManager.uiCamera.ignore(fadeTargets);
                                this.cameras.main.ignore(this.cameraManager.getUIElements());

                                this.tweens.add({
                                    targets: fadeTargets,
                                    alpha: 0,
                                    duration: 500,
                                    onComplete: () => {
                                        hasResource.getData('depositText').destroy();
                                        hasResource.destroy();
                                    }
                                });
                            }
                        }
                    }
                } else {
                    building.setTint(0xff0000);  // 자원이 없으면 빨간색으로 변경
                }
            }
        });

        // 인벤토리 업데이트 이벤트 발생
        this.events.emit('updateInventory');
    }

    // 자원 채굴 메서드
    mineResource(resource) {
        const currentTime = this.time.now;
        const lastMineTime = resource.getData('lastMineTime') || 0;
        
        if (currentTime - lastMineTime >= 1000) {
            const deposit = resource.getData('deposit');
            if (deposit > 0) {
                const resourceType = resource.getData('type');
                
                // 인벤토리에 추가
                this.itemManager.addItem(resourceType);
                
                // 마지막 채굴 시간 업데이트
                resource.setData('lastMineTime', currentTime);
                
                // 자원 깜빡임 효과
                this.tweens.add({
                    targets: resource,
                    alpha: 0.3,
                    duration: 100,
                    yoyo: true,
                    repeat: 1
                });

                // 매장량 감소
                resource.setData('deposit', deposit - 1);
                resource.getData('depositText').setText((deposit - 1).toString());
                
                // 매장량이 0이 되면 자원 제거
                if (deposit - 1 <= 0) {
                    const fadeTargets = [resource, resource.getData('depositText')];
                    this.cameraManager.uiCamera.ignore(fadeTargets);
                    this.cameras.main.ignore(this.cameraManager.getUIElements());

                    this.tweens.add({
                        targets: fadeTargets,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            resource.getData('depositText').destroy();
                            resource.destroy();
                        }
                    });
                }
            }
        }
    }

    enterBuildMode(buildingKey) {
        // 이전 건물 설치 모드가 활성화되어 있다면 종료
        if (this.buildMode.active) {
            this.exitBuildMode();
        }

        const building = BuildingManager.getBuildingByKey(buildingKey);
        if (!building) return;

        this.buildMode.active = true;
        this.buildMode.building = building;

        // 프리뷰 생성
        this.buildMode.preview = this.add.sprite(0, 0, 'buildings', building.frame);
        this.buildMode.preview.setAlpha(0.7);
        this.buildMode.preview.setDepth(this.depths.BUILDING);
        
        // 프리뷰는 게임 요소로 취급하여 UI 카메라에서 무시
        this.cameraManager.uiCamera.ignore(this.buildMode.preview);

        // 커서 변경
        this.input.setDefaultCursor('crosshair');
    }

    exitBuildMode() {
        this.buildMode.active = false;
        this.buildMode.building = null;
        if (this.buildMode.preview) {
            this.buildMode.preview.destroy();
            this.buildMode.preview = null;
        }
        this.input.setDefaultCursor('default');
    }

    canPlaceBuilding(tileX, tileY) {
        // 맵 범위 체크
        if (tileX < 0 || tileX >= this.gameMap.getWidth() || 
            tileY < 0 || tileY >= this.gameMap.getHeight()) {
            return false;
        }

        // 건물 설치 모드가 활성화되어 있지 않으면 false 반환
        if (!this.buildMode.active || !this.buildMode.building) {
            return false;
        }

        // 다른 건물이 있는지 체크
        const hasBuilding = this.gameMap.findBuildingAt(tileX, tileY);
        if (hasBuilding) return false;

        // 건물 타입별 설치 조건 체크
        if (this.buildMode.building.key === 'miner') {
            // 채굴기는 자원 위에만 설치 가능
            const hasResource = this.gameMap.findResourceAt(tileX, tileY);
            return hasResource !== null;
        } else {
            // 다른 건물들은 자원 위에 설치 불가
            const hasResource = this.gameMap.findResourceAt(tileX, tileY);
            return !hasResource;
        }
    }

    placeBuilding(tileX, tileY) {
        if (!this.buildMode.active || !this.buildMode.building) return;
        if (!this.canPlaceBuilding(tileX, tileY)) {
            // 설치 불가능한 위치일 때 메시지 표시
            this.showMessage(i18n.t('ui.building.cannot_place_here'), true);
            return;
        }

        const building = this.buildMode.building;
        
        // 비용 확인 - ItemManager 사용
        if (!BuildingManager.canBuild(this.itemManager, building)) {
            // 자원 부족 메시지 표시
            this.showMessage(i18n.t('ui.building.not_enough_resources'), true);
            return;
        }

        // 자원 소비 - ItemManager 사용
        BuildingManager.consumeResources(this.itemManager, building);

        // 건물 생성
        this.gameMap.placeBuilding(tileX, tileY, building);

        // UI 업데이트
        this.inventoryUI.updateUI();

        // 건물 설치 모드 종료
        this.exitBuildMode();
    }

    // 메시지 표시 메서드 추가
    showMessage(text, isError = false) {
        if (this.messageText) {
            this.messageText.destroy();
        }

        this.messageText = this.add.text(
            this.scale.width / 2,
            this.scale.height - 100,
            text,
            {
                fontSize: '20px',
                fill: isError ? '#ff0000' : '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            }
        );
        this.messageText.setOrigin(0.5);
        this.messageText.setScrollFactor(0);
        this.messageText.setDepth(this.depths.OVERLAY_UI);

        // 2초 후 메시지 제거
        this.time.delayedCall(2000, () => {
            if (this.messageText) {
                this.messageText.destroy();
                this.messageText = null;
            }
        });
    }
} 