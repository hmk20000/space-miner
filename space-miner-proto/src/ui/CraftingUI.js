import { BaseUI, UIStyles } from './UISystem';
import i18n from '../localization/i18n';
import { RecipeManager } from '../data/Recipes';
import { Items } from '../data/Items';

export default class CraftingUI extends BaseUI {
    constructor(scene) {
        super(scene);
        this.createUI();
        
        // 언어 변경 시 UI 업데이트
        i18n.addListener(() => this.updateTexts());

        // 아이템 변경 구독
        this.scene.itemManager.addListener(() => {
            if (this.isOpen) {
                this.updateUI();
            }
        });
    }

    createUI() {
        // 패널 생성
        const panel = this.createPanel(400, 500);
        this.addElement('panel', panel);

        // 제목 생성
        const title = this.createTitle(i18n.t('ui.crafting.title'));
        this.addElement('title', title);

        // 닫기 버튼 생성
        const closeButton = this.createCloseButton();
        this.addElement('closeButton', closeButton);

        // 레시피 버튼 생성
        const startX = panel.x - 150;
        const startY = panel.y - 100;

        RecipeManager.getAllRecipes().forEach((recipe, index) => {
            const y = startY + (index * 80);

            // 레시피 이름
            const text = this.scene.add.text(startX, y, i18n.t(`recipe.${recipe.key}`), UIStyles.text.normal);
            text.setScrollFactor(0);
            text.setDepth(this.depths.OVERLAY_UI);

            // 재료 목록
            const ingredientText = this.scene.add.text(startX, y + 20, '', UIStyles.text.normal);
            ingredientText.setScrollFactor(0);
            ingredientText.setDepth(this.depths.OVERLAY_UI);
            this.updateIngredientText(ingredientText, recipe);

            // 제작 버튼
            const { button, text: buttonText } = this.createButton(
                startX + 250, y,
                100, 40,
                i18n.t('ui.crafting.craft'),
                () => this.craft(recipe)
            );

            this.addElement(`${recipe.key}_text`, text);
            this.addElement(`${recipe.key}_ingredients`, ingredientText);
            this.addElement(`${recipe.key}_button`, [button, buttonText]);
        });

        this.hide();
    }

    craft(recipe) {
        if (RecipeManager.craft(this.scene.itemManager, recipe)) {
            // 제작 성공
            const resultItem = Object.keys(recipe.result)[0];
            const itemName = i18n.t(Items.find(item => item.key === resultItem).name);
            this.showMessage(i18n.t('ui.crafting.success', { item: itemName }));
            this.updateUI();
        } else {
            // 재료 부족
            this.showMessage(i18n.t('ui.crafting.not_enough'), true);
        }
    }

    updateTexts() {
        // 제목 업데이트
        const title = this.elements.get('title');
        if (title) {
            title.setText(i18n.t('ui.crafting.title'));
        }

        // 레시피 텍스트 업데이트
        RecipeManager.getAllRecipes().forEach(recipe => {
            const text = this.elements.get(`${recipe.key}_text`);
            if (text) {
                text.setText(i18n.t(`recipe.${recipe.key}`));
            }

            const [_, buttonText] = this.elements.get(`${recipe.key}_button`);
            if (buttonText) {
                buttonText.setText(i18n.t('ui.crafting.craft'));
            }
        });
    }

    updateIngredientText(textElement, recipe) {
        const ingredients = Object.entries(recipe.ingredients)
            .map(([item, amount]) => {
                const itemData = Items.find(i => i.key === item);
                const currentAmount = this.scene.itemManager.getItemAmount(item);
                const color = currentAmount >= amount ? '#FFFFFF' : '#FF0000';
                return `${i18n.t(itemData.name)}: ${currentAmount}/${amount}`;
            })
            .join('\n');
        textElement.setText(ingredients);
    }

    updateUI() {
        if (!this.isOpen) return;  // 창이 닫혀있으면 업데이트하지 않음
        super.updateUI();

        RecipeManager.getAllRecipes().forEach(recipe => {
            const ingredientText = this.elements.get(`${recipe.key}_ingredients`);
            if (ingredientText) {
                this.updateIngredientText(ingredientText, recipe);
            }
        });
    }
} 