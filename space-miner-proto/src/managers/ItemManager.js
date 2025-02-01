import { Items } from '../data/Items';

export class ItemManager {
    constructor() {
        this.inventory = new Map();
        this.listeners = new Set();  // 아이템 변경 리스너
        this.initializeInventory();
    }

    initializeInventory() {
        // 모든 아이템의 초기 수량을 0으로 설정
        Items.forEach(item => {
            this.inventory.set(item.key, 0);
        });

        // 초기 아이템 설정
        this.addItem('miner', 3);  // 자동 채굴기 3개 지급
        this.addItem('warehouse', 4);  // 창고 4개 추가
    }

    /**
     * 아이템 수량 가져오기
     */
    getItemAmount(key) {
        return this.inventory.get(key) || 0;
    }

    /**
     * 아이템 추가
     * @returns {boolean} 추가 성공 여부
     */
    addItem(key, amount = 1) {
        const item = Items.find(item => item.key === key);
        if (!item) return false;

        const currentAmount = this.getItemAmount(key);
        
        // 스택 가능한 아이템인 경우 최대 스택 수 체크
        if (item.stackable) {
            const newAmount = Math.min(currentAmount + amount, item.maxStack);
            this.inventory.set(key, newAmount);
            this.notifyListeners();  // 아이템 추가 후 알림
            return true;
        }
        // 스택 불가능한 아이템은 1개만 보유 가능
        else {
            if (currentAmount === 0) {
                this.inventory.set(key, 1);
                this.notifyListeners();  // 아이템 추가 후 알림
                return true;
            }
            return false;
        }
    }

    /**
     * 아이템 제거
     * @returns {boolean} 제거 성공 여부
     */
    removeItem(key, amount = 1) {
        const currentAmount = this.getItemAmount(key);
        if (currentAmount >= amount) {
            this.inventory.set(key, currentAmount - amount);
            this.notifyListeners();  // 아이템 제거 후 알림
            return true;
        }
        return false;
    }

    /**
     * 보유한 아이템 목록 가져오기
     * @returns {Array} 보유한 아이템 정보 배열
     */
    getInventoryItems() {
        return Items.filter(item => this.getItemAmount(item.key) > 0);
    }

    /**
     * 특정 타입의 아이템 목록 가져오기
     */
    getItemsByType(type) {
        return Items.filter(item => 
            item.type === type && this.getItemAmount(item.key) > 0
        );
    }

    /**
     * 건설 가능한 아이템 목록 가져오기
     */
    getBuildableItems() {
        return Items.filter(item => 
            item.buildable && this.getItemAmount(item.key) > 0
        );
    }

    /**
     * 아이템을 보유하고 있는지 확인
     */
    hasItem(key, amount = 1) {
        return this.getItemAmount(key) >= amount;
    }

    /**
     * 여러 아이템을 한번에 소비
     * @param {Object} items - { itemKey: amount } 형태의 객체
     * @returns {boolean} 소비 가능 여부
     */
    consumeItems(items) {
        // 먼저 모든 아이템이 충분한지 확인
        const canConsume = Object.entries(items).every(
            ([key, amount]) => this.hasItem(key, amount)
        );

        // 충분하다면 소비 실행
        if (canConsume) {
            Object.entries(items).forEach(([key, amount]) => {
                this.removeItem(key, amount);
            });
        }

        return canConsume;
    }

    getItemData(key) {
        return Items.find(item => item.key === key);
    }

    // 리스너 추가
    addListener(callback) {
        this.listeners.add(callback);
    }

    // 리스너 제거
    removeListener(callback) {
        this.listeners.delete(callback);
    }

    // 모든 리스너에게 변경 알림
    notifyListeners() {
        this.listeners.forEach(callback => callback());
    }
} 