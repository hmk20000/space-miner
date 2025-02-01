import { Item, InventoryItem } from '../types/ItemTypes';

export class InventoryManager {
    private static instance: InventoryManager;
    private items: InventoryItem[] = [];
    private maxSlots: number = 10;

    private constructor() {}

    public static getInstance(): InventoryManager {
        if (!InventoryManager.instance) {
            InventoryManager.instance = new InventoryManager();
        }
        return InventoryManager.instance;
    }

    public addItem(item: Item): boolean {
        // 이미 있는 아이템인지 확인
        const existingItem = this.items.find(i => i.id === item.id);
        
        if (existingItem && item.stackable) {
            existingItem.quantity++;
            return true;
        }

        // 새 슬롯에 추가
        if (this.items.length < this.maxSlots) {
            this.items.push({
                ...item,
                quantity: 1
            });
            return true;
        }

        return false;  // 인벤토리 가득 참
    }

    public getItems(): InventoryItem[] {
        return this.items;
    }
} 