export interface Item {
    id: string;
    name: string;
    type: 'block' | 'tool' | 'resource';
    stackable: boolean;
    maxStack?: number;
}

export interface InventoryItem extends Item {
    quantity: number;
} 