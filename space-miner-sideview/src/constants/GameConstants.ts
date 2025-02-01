export const GAME_CONFIG = {
    GRAVITY: { x: 0, y: 960 },
    SCREEN: {
        WIDTH: window.innerWidth,
        HEIGHT: window.innerHeight
    }
};
export const BLOCK_CONFIG = {
    SIZE: 16,//Math.floor(PLAYER_CONFIG.SIZE.WIDTH * 0.25), // 8x8 픽셀
    COLOR: 0x663300
};
export const CHUNK_CONFIG = {
    BLOCKS_WIDTH: 32,  // 청크당 가로 블록 수
    BLOCKS_HEIGHT: 32, // 청크당 세로 블록 수
    // WIDTH: BLOCK_CONFIG.SIZE * 32,  // 청크의 실제 픽셀 너비
    // HEIGHT: BLOCK_CONFIG.SIZE * 32, // 청크의 실제 픽셀 높이
    // GROUND_HEIGHT: BLOCK_CONFIG.SIZE,
    // GROUND_COLOR: BLOCK_CONFIG.COLOR,
    // SEGMENTS: 32, // 청크당 지형 세그먼트 수
    // LOAD_DISTANCE: 200
} as const;

export const PLAYER_CONFIG = {
    INITIAL: {
        X: BLOCK_CONFIG.SIZE * (CHUNK_CONFIG.BLOCKS_WIDTH / 2), // 중앙 청크의 중앙
        Y: window.innerHeight * 0.5  // 화면 중앙 높이
    },
    SIZE: {
        WIDTH: 32,  // 플레이어 기본 크기
        HEIGHT: 32
    },
    MOVEMENT: {
        SPEED: 160,
        JUMP_FORCE: 300,
        BOUNCE: 0.2
    }
};

export const SCENE_KEYS = {
    INTRO: 'IntroScene',
    LOADING: 'LoadingScene',
    MAIN: 'MainScene'
} as const;

export const ASSETS = {
    TILEMAP: {
        KEY: 'map',
        PATH: 'assets/tiles/map.json'
    },
    TILESET: {
        KEY: 'tiles',
        PATH: 'assets/tiles/tileset.png'
    }
} as const;




// 청크 식별을 위한 타입 다시 추가
export type ChunkId = string;  // `${number},${number}` 형식