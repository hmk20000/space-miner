export const Buildings = [
    {
        key: 'furnace',
        name: 'building.furnace',
        sprite: 'buildings',
        frame: 0,
        cost: {
            furnace: 1  // 용광로 아이템 1개 소비
        },
        size: { width: 1, height: 1 },  // 타일 단위 크기
        description: 'building.furnace.description'
    },
    {
        key: 'miner',
        name: 'building.miner',
        sprite: 'buildings',
        frame: 1,
        cost: {
            miner: 1  // 채굴기 아이템 1개 소비
        },
        size: { width: 1, height: 1 },
        description: 'building.miner.description',
        // 채굴기 특수 속성
        miningSpeed: 2000,  // 2초마다 채굴
        range: 0,  // 자신의 위치만 채굴하도록 변경
        inventory: {  // 채굴기의 인벤토리 설정 추가
            maxSize: 50  // 최대 저장량
        }
    },
    {
        key: 'warehouse',
        name: 'building.warehouse',
        sprite: 'buildings',
        frame: 2,  // 창고의 스프라이트 프레임
        cost: {
            warehouse: 1  // 창고 아이템 1개 소비
        },
        size: { width: 1, height: 1 },
        description: 'building.warehouse.description',
        inventory: {  // 창고의 인벤토리 설정 추가
            maxSize: 100  // 최대 저장량
        }
    }
    // 추가 건물들...
];

export class BuildingManager {
    static getBuildingByKey(key) {
        return Buildings.find(building => building.key === key);
    }

    static canBuild(itemManager, building) {
        return Object.entries(building.cost).every(
            ([item, amount]) => itemManager.getItemAmount(item) >= amount
        );
    }

    static consumeResources(itemManager, building) {
        Object.entries(building.cost).forEach(([item, amount]) => {
            itemManager.removeItem(item, amount);
        });
    }
} 