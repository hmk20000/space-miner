import './style.css'
import Phaser from 'phaser'
import { MainScene } from './scenes/MainScene' // Import the MainScene
import { IntroScene } from './scenes/IntroScene' // Import the IntroScene
import { GameManager } from './managers/GameManager';
import { GAME_CONFIG } from './constants/GameConstants';
import { LoadingScene } from './scenes/LoadingScene';
import { TilemapTestScene } from './scenes/TilemapTestScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE, // FIT 대신 RESIZE 사용
        width: window.innerWidth,
        height: window.innerHeight,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade', // 물리 엔진 설정
        arcade: {
            gravity: GAME_CONFIG.GRAVITY, // 중력 설정
            debug: false // 디버그 모드 비활성화
        }
    },
    scene: [MainScene]  // 테스트를 위해 임시로 변경
};

// 게임 인스턴스 생성 및 저장
const game = new Phaser.Game(config);

// Initialize the GameManager
const gameManager = GameManager.getInstance();
gameManager.init();

// 우클릭 방지 (컨텍스트 메뉴만 막고 이벤트는 허용)
// window.addEventListener('contextmenu', (e) => {
//     e.preventDefault();
//     return false;
// }, false);

// 리사이즈 이벤트 핸들러
window.addEventListener('resize', () => {
    // 게임 크기 업데이트
    game.scale.resize(window.innerWidth, window.innerHeight);
    
    // 현재 활성화된 씬 가져오기
    const currentScene = game.scene.getScenes(true)[0];
    if (currentScene) {
        // 카메라 바운드 업데이트
        currentScene.cameras.main.setBounds(
            -Infinity,
            0,
            Infinity,
            window.innerHeight
        );
    }
});