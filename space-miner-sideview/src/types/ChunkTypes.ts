export interface TileChange {
    x: number;
    y: number;
    index: number;  // -1: 제거됨, 0: 기본 타일, 1: 왼쪽 경사, 2: 오른쪽 경사
    timestamp: number;  // 변경된 시간
}

export interface ChunkData {
    x: number;
    y: number;
    changes: TileChange[];  // 타일 변경 내역
    lastModified: number;   // 마지막 수정 시간
} 