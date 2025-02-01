import Phaser from 'phaser';
import { SCENE_KEYS } from '../constants/GameConstants';

export class IntroScene extends Phaser.Scene {
    private texts: Phaser.GameObjects.Text[] = [];

    constructor() {
        super({ key: SCENE_KEYS.INTRO });
    }

    create() {        
        this.setupText();
        this.setupInput();
        this.setupAutoTransition();
    }


    private setupText(): void {
        // 텍스트 생성 및 배열에 저장
        const titleText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 50,
            'Welcome to Space Miner!',
            { fontSize: '32px', color: '#ffffff' }
        ).setOrigin(0.5);

        const startText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'Press SPACE or click to start',
            { fontSize: '24px', color: '#ffffff' }
        ).setOrigin(0.5);

        this.texts.push(titleText, startText);
    }

    private setupInput(): void {
        

        this.input?.keyboard?.on('keydown-SPACE', () => {
            this.startGame();
        });
        this.input?.on('pointerdown', () => {
            this.startGame();
        });
    }

    private setupAutoTransition(): void {
        this.time.delayedCall(1000, () => {
            this.startGame();
        });
    }

    private startGame(): void {
        this.scene.start(SCENE_KEYS.LOADING);
    }
} 