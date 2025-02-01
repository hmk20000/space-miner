export const Recipes = [
    { 
        key: 'iron_bar',
        ingredients: { iron: 2 },
        result: { iron_bar: 1 }
    },
    { 
        key: 'copper_bar',
        ingredients: { copper: 2 },
        result: { copper_bar: 1 }
    },
    { 
        key: 'gold_bar',
        ingredients: { gold: 2 },
        result: { gold_bar: 1 }
    },
    { 
        key: 'steel_bar',
        ingredients: { iron_bar: 3 },
        result: { steel_bar: 1 }
    },
    {
        key: 'furnace',
        ingredients: {
            iron: 10,
            copper: 5
        },
        result: { furnace: 1 }
    },
    {
        key: 'miner',
        ingredients: {
            iron: 15,
            copper: 10,
            iron_bar: 5
        },
        result: { miner: 1 }
    }
];

// 레시피 검색 및 관리를 위한 유틸리티 함수들
export class RecipeManager {
    static getRecipeByKey(key) {
        return Recipes.find(recipe => recipe.key === key);
    }

    static getAllRecipes() {
        return Recipes;
    }

    static checkIngredients(itemManager, recipe) {
        return Object.entries(recipe.ingredients).every(
            ([item, amount]) => itemManager.hasItem(item, amount)
        );
    }

    static consumeIngredients(itemManager, recipe) {
        Object.entries(recipe.ingredients).forEach(([item, amount]) => {
            itemManager.removeItem(item, amount);
        });
    }

    static addResult(itemManager, recipe) {
        Object.entries(recipe.result).forEach(([item, amount]) => {
            itemManager.addItem(item, amount);
        });
    }

    static craft(itemManager, recipe) {
        if (!this.checkIngredients(itemManager, recipe)) {
            return false;
        }

        this.consumeIngredients(itemManager, recipe);
        this.addResult(itemManager, recipe);
        return true;
    }
} 