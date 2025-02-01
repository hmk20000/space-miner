// 아이템 종류 정의
export const ItemTypes = {
    RESOURCE: 'resource',  // 자원
    BUILDING: 'building',  // 건물
    MATERIAL: 'material'   // 제작 재료
};

// 아이템 정보 정의
export const Items = [
    // 자원 아이템
    {
        key: 'iron',
        type: ItemTypes.RESOURCE,
        name: 'resource.iron',
        stackable: true,
        maxStack: 999
    },
    {
        key: 'copper',
        type: ItemTypes.RESOURCE,
        name: 'resource.copper',
        stackable: true,
        maxStack: 999
    },
    {
        key: 'gold',
        type: ItemTypes.RESOURCE,
        name: 'resource.gold',
        stackable: true,
        maxStack: 999
    },
    
    // 제작 재료
    {
        key: 'iron_bar',
        type: ItemTypes.MATERIAL,
        name: 'resource.iron_bar',
        stackable: true,
        maxStack: 999
    },
    {
        key: 'copper_bar',
        type: ItemTypes.MATERIAL,
        name: 'resource.copper_bar',
        stackable: true,
        maxStack: 999
    },
    {
        key: 'gold_bar',
        type: ItemTypes.MATERIAL,
        name: 'resource.gold_bar',
        stackable: true,
        maxStack: 999
    },
    {
        key: 'steel_bar',
        type: ItemTypes.MATERIAL,
        name: 'resource.steel_bar',
        stackable: true,
        maxStack: 999
    },
    
    // 건물 아이템
    {
        key: 'furnace',
        type: ItemTypes.BUILDING,
        name: 'building.furnace',
        stackable: false,
        buildable: true,
        sprite: 'buildings',
        frame: 0,
        description: 'building.furnace.description'
    },
    {
        key: 'miner',
        type: ItemTypes.BUILDING,
        name: 'building.miner',
        stackable: true,
        maxStack: 10,
        buildable: true
    },
    {
        key: 'warehouse',
        type: ItemTypes.BUILDING,
        name: 'building.warehouse',
        stackable: true,
        maxStack: 10,
        buildable: true
    }
];