import { Item, InventoryItem } from '../types/ItemTypes';
import { createStorage } from '../util/storage';

export class InventoryManager {
    private static instance: InventoryManager;
    private items: InventoryItem[] = [];
    private maxSlots: number = 10;
    private storage = createStorage('inventory');

    private constructor() {
        this.loadData();  // 생성자에서 데이터 로드
    }

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
            this.saveData();  // 수량 변경 시 저장
            return true;
        }

        // 새 슬롯에 추가
        if (this.items.length < this.maxSlots) {
            this.items.push({
                ...item,
                quantity: 1
            });
            this.saveData();  // 새 아이템 추가 시 저장
            return true;
        }

        return false;  // 인벤토리 가득 참
    }

    public removeItem(itemId: string, amount: number = 1): boolean {
        const itemIndex = this.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return false;

        const item = this.items[itemIndex];
        item.quantity -= amount;

        if (item.quantity <= 0) {
            this.items.splice(itemIndex, 1);
        }

        this.saveData();  // 아이템 제거 시 저장
        return true;
    }

    public getItems(): InventoryItem[] {
        return this.items || [];  // 항상 배열 반환
    }

    public saveData(): void {
        try {
            this.storage.save(this.items);
        } catch (error) {
            console.warn('Failed to save inventory data:', error);
        }
    }

    private loadData(): void {
        try {
            const savedItems = this.storage.load();
            this.items = Array.isArray(savedItems) ? savedItems : [];
        } catch (error) {
            console.warn('Failed to load inventory data:', error);
            this.items = [];
        }
    }
} 