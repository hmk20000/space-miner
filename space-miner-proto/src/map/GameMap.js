import i18n from '../localization/i18n';
import { createNoise2D } from 'simplex-noise';
import alea from 'alea';  // simplex-noise에서 권장하는 난수 생성기

export default class GameMap {
    constructor(scene) {
        this.scene = scene;
        this.tileSize = 32;
        this.resources = null;
        this.depths = scene.depths;
        this.seed = 12345; // 기본 시드값
        this.initNoise();
        this.buildings = scene.add.group();
    }

    // 시드값으로 노이즈 초기화
    initNoise(seed = this.seed) {
        this.seed = seed;
        // alea를 사용하여 시드 기반 난수 생성기 생성
        const prng = alea(seed);
        // 난수 생성기를 사용하여 노이즈 함수 생성
        this.noise2D = createNoise2D(prng);
    }

    // 시드값 설정 메서드
    setSeed(seed) {
        if (this.seed !== seed) {
            this.initNoise(seed);
            // 자원 재생성
            this.placeResources();
        }
    }

    // 현재 시드값 반환
    getSeed() {
        return this.seed;
    }

    calculateSize() {
        // 화면 크기 가져오기
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // 줌 레벨 고려하여 맵 크기 계산
        const zoom = 1.5; // 현재 사용 중인 줌 레벨
        this.width = Math.ceil((width / this.tileSize) * zoom);
        this.height = Math.ceil((height / this.tileSize) * zoom);
    }

    create() {
        this.calculateSize();
        this.createGround();
        this.placeResources();
    }

    createGround() {
        // 맵 데이터 생성
        const data = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push(0); // 0은 기본 땅 타일
            }
            data.push(row);
        }

        // 타일맵 생성
        this.tilemap = this.scene.make.tilemap({
            data: data,
            tileWidth: this.tileSize,
            tileHeight: this.tileSize
        });
        
        const tiles = this.tilemap.addTilesetImage('tiles');
        this.groundLayer = this.tilemap.createLayer(0, tiles, 0, 0);
        this.groundLayer.setDepth(this.depths.MAP);
    }

    placeResources() {
        if (this.resources) {
            this.resources.clear(true, true);
        }
        this.resources = this.scene.add.group();

        // 자원 종류 및 생성 규칙 정의
        const resourceTypes = [
            { 
                name: 'iron', 
                frame: 0,
                noiseScale: 0.05,    // 패턴의 크기 조절 (값이 작을수록 더 큰 패턴)
                threshold: 0.7,     // 생성 빈도 조절 (값이 클수록 더 희귀)
                deposit: {
                    min: 15,        // 최소 매장량
                    max: 25         // 최대 매장량
                }
            },
            { 
                name: 'copper', 
                frame: 1,
                noiseScale: 0.05,   
                threshold: 0.7,     
                deposit: {
                    min: 10,
                    max: 20
                }
            },
            { 
                name: 'gold', 
                frame: 2,
                noiseScale: 0.9,  
                threshold: 0.95,    
                deposit: {
                    min: 5,
                    max: 15
                }
            }
        ];

        // 각 자원 타입별로 노이즈 맵 생성
        const occupiedTiles = new Set();

        resourceTypes.forEach((resource, index) => {
            // 오프셋을 사용하여 각 자원 타입마다 다른 노이즈 패턴 생성
            const offsetX = index * 1000;
            const offsetY = index * 1000;

            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const tileKey = `${x},${y}`;
                    if (occupiedTiles.has(tileKey)) continue;

                    // 노이즈 값 계산 (-1 ~ 1 범위)
                    const noiseValue = this.noise2D(
                        (x + offsetX) * resource.noiseScale, 
                        (y + offsetY) * resource.noiseScale
                    );
                    
                    // 노이즈 값을 0~1 범위로 변환
                    const normalizedNoise = (noiseValue + 1) / 2;

                    // 임계값을 넘으면 자원 생성
                    if (normalizedNoise > resource.threshold) {
                        // 군집도를 높이기 위한 추가 확률 계산
                        // 주변 타일에 같은 자원이 있으면 생성 확률 증가
                        const neighborBonus = this.checkNeighbors(x, y, resource.name);
                        const finalThreshold = resource.threshold - (neighborBonus * 0.1);

                        if (normalizedNoise > finalThreshold) {
                            this.createResource(x, y, resource);
                            occupiedTiles.add(tileKey);
                        }
                    }
                }
            }
        });
    }

    // 주변 8칸에 같은 자원이 있는지 확인
    checkNeighbors(x, y, resourceType) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;

                const checkX = x + dx;
                const checkY = y + dy;

                // 맵 범위 체크
                if (checkX < 0 || checkX >= this.width || checkY < 0 || checkY >= this.height) {
                    continue;
                }

                // 해당 위치의 자원 확인
                const resource = this.findResourceAt(checkX, checkY);
                if (resource && resource.getData('type') === resourceType) {
                    count++;
                }
            }
        }
        return count;
    }

    findResourceAt(x, y) {
        return this.resources.getChildren().find(resource => {
            const resourceX = Math.floor(resource.x / this.tileSize);
            const resourceY = Math.floor(resource.y / this.tileSize);
            return resourceX === x && resourceY === y;
        });
    }

    createResource(x, y, resourceType) {
        // 랜덤 매장량 계산
        const randomDeposit = Phaser.Math.Between(
            resourceType.deposit.min,
            resourceType.deposit.max
        );

        const resourceSprite = this.scene.add.sprite(
            x * this.tileSize + this.tileSize/2,
            y * this.tileSize + this.tileSize/2,
            'resources',
            resourceType.frame
        );
        resourceSprite.setData('type', resourceType.name);
        resourceSprite.setData('deposit', randomDeposit);
        
        // 매장량 텍스트 추가
        const depositText = this.scene.add.text(
            resourceSprite.x,
            resourceSprite.y,
            randomDeposit.toString(),
            {
                fontSize: '16px',
                fill: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                stroke: '#000000',
                strokeThickness: 2,
                resolution: 2,
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 2,
                    fill: true
                }
            }
        );
        depositText.setOrigin(0.5);
        depositText.setDepth(this.depths.TILE_INFO);
        resourceSprite.setData('depositText', depositText);
        
        resourceSprite.setDepth(this.depths.TILE);
        
        this.resources.add(resourceSprite);
    }

    resize() {
        this.calculateSize();
        this.createGround();
        this.placeResources();
    }

    getWidth() {
        return this.width;
    }

    getHeight() {
        return this.height;
    }

    getTileSize() {
        return this.tileSize;
    }

    getResources() {
        return this.resources;
    }

    getGroundLayer() {
        return this.groundLayer;
    }

    placeBuilding(tileX, tileY, buildingData) {
        const building = this.scene.add.sprite(
            tileX * this.tileSize + this.tileSize/2,
            tileY * this.tileSize + this.tileSize/2,
            buildingData.sprite,
            buildingData.frame
        );
        building.setDepth(this.scene.depths.BUILDING);
        
        // 건물 데이터 저장
        building.setData('type', buildingData.key);
        building.setData('lastMineTime', 0);  // 채굴기용 타이머
        
        // 건물을 게임 요소로 취급하여 UI 카메라에서 무시하도록 설정
        this.scene.cameraManager.addGameElement(building);
        
        // 건물 그룹에 추가
        this.buildings.add(building);
        
        return building;
    }

    findBuildingAt(x, y) {
        return this.buildings.getChildren().find(building => {
            const bx = Math.floor(building.x / this.tileSize);
            const by = Math.floor(building.y / this.tileSize);
            return bx === x && by === y;
        });
    }

    findResourcesInRange(x, y, range) {
        const resources = [];
        this.resources.getChildren().forEach(resource => {
            // 자원의 타일 좌표 계산
            const resourceX = Math.floor(resource.x / this.tileSize);
            const resourceY = Math.floor(resource.y / this.tileSize);
            
            // 채굴기의 타일 좌표와 비교
            // 맨해튼 거리로 범위 체크 (x 차이 + y 차이)
            const distance = Math.abs(resourceX - x) + Math.abs(resourceY - y);
            
            // 채굴기와 같은 타일에 있거나 범위 내에 있는 자원 추가
            if (distance <= range) {
                resources.push(resource);
            }
        });
        return resources;
    }
} 