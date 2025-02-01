export class BaseUI {
    constructor(scene) {
        this.scene = scene;
        this.elements = new Map();
        this.isOpen = false;
        this.depths = scene.depths;
    }

    getAllElements() {
        const elements = [];
        this.elements.forEach(element => {
            if (Array.isArray(element)) {
                elements.push(...element);
            } else {
                elements.push(element);
            }
        });
        return elements;
    }

    addElement(key, element) {
        this.elements.set(key, element);
    }

    clearElements() {
        // 모든 UI 요소 제거
        this.elements.forEach(element => {
            if (Array.isArray(element)) {
                element.forEach(e => e.destroy());
            } else {
                element.destroy();
            }
        });
        this.elements.clear();
    }

    show() {
        this.isOpen = true;
        this.getAllElements().forEach(element => {
            element.setVisible(true);
        });
    }

    hide() {
        this.isOpen = false;
        this.getAllElements().forEach(element => {
            element.setVisible(false);
        });
    }

    updateUI() {
    }

    destroy() {
        // 기존 요소 제거
        this.elements.forEach((element, key) => {
            if (Array.isArray(element)) {
                element.forEach(e => e.destroy());
            } else {
                element.destroy();
            }
        });
        this.elements.clear();
    }
} 