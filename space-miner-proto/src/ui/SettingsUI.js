import { BaseUI, UIStyles } from './UISystem';
import i18n from '../localization/i18n';

export default class SettingsUI extends BaseUI {
    constructor(scene) {
        super(scene);
        this.createUI();
        
        // 언어 변경 시 UI 업데이트
        i18n.addListener(() => this.updateTexts());
    }

    createUI() {
        // 패널 생성
        const panel = this.createPanel(300, 400);
        this.addElement('panel', panel);

        // 제목 생성
        const title = this.createTitle(i18n.t('ui.settings.title'));
        title.setDepth(this.depths.OVERLAY_UI);
        title.setAlpha(1);
        this.addElement('title', title);

        // 닫기 버튼 생성
        const closeButton = this.createCloseButton(130);
        closeButton.setDepth(this.depths.OVERLAY_UI);
        closeButton.setAlpha(1);
        this.addElement('closeButton', closeButton);

        // 설정 옵션들 생성
        this.createSettingsOptions();

        this.hide();
    }

    createSettingsOptions() {
        const { x, y } = this.getCenterCoordinates();
        
        // 언어 선택 레이블
        const languageLabel = this.scene.add.text(x - 100, y - 70, i18n.t('ui.settings.language') + ':', UIStyles.text.normal);
        languageLabel.setScrollFactor(0);
        languageLabel.setDepth(this.depths.OVERLAY_UI);
        languageLabel.setAlpha(1);
        languageLabel.setInteractive();
        languageLabel.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
        });
        this.addElement('languageLabel', languageLabel);

        // 언어 선택 버튼들
        const languages = [
            { text: 'English', value: 'en' },
            { text: '한국어', value: 'ko' },
            { text: '日本語', value: 'ja' }
        ];

        const buttons = languages.map((lang, index) => {
            const button = this.scene.add.rectangle(x, y - 20 + index * 50, 200, 40, UIStyles.colors.buttonNormal);
            button.setScrollFactor(0);
            button.setDepth(this.depths.OVERLAY_UI);
            button.setAlpha(1);
            button.setInteractive();

            const text = this.scene.add.text(x, y - 20 + index * 50, lang.text, UIStyles.text.normal);
            text.setOrigin(0.5);
            text.setScrollFactor(0);
            text.setDepth(this.depths.OVERLAY_UI);
            text.setAlpha(1);

            button.on('pointerover', () => {
                button.setFillStyle(UIStyles.colors.buttonHover);
            });
            button.on('pointerout', () => {
                button.setFillStyle(UIStyles.colors.buttonNormal);
            });
            button.on('pointerdown', (pointer) => {
                pointer.event.stopPropagation();
                this.selectLanguage(lang.value, lang.text);
            });

            text.setInteractive();
            text.on('pointerdown', (pointer) => {
                pointer.event.stopPropagation();
            });

            return [button, text];
        });

        this.addElement('languageButtons', buttons.flat());
    }

    selectLanguage(language, languageName) {
        i18n.setLanguage(language);
        this.showMessage(i18n.t('ui.settings.languageChanged', { language: languageName }));
    }

    updateTexts() {
        const title = this.elements.get('title');
        if (title) {
            title.setText(i18n.t('ui.settings.title'));
            title.setDepth(this.depths.OVERLAY_UI);
            title.setAlpha(1);
        }

        const languageLabel = this.elements.get('languageLabel');
        if (languageLabel) {
            languageLabel.setText(i18n.t('ui.settings.language') + ':');
            languageLabel.setDepth(this.depths.OVERLAY_UI);
            languageLabel.setAlpha(1);
        }
    }
} 