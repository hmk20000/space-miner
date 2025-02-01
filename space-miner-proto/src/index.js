import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game',
        width: '100%',
        height: '100%',
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: MainScene
};

const game = new Phaser.Game(config);

// 창 크기가 변경될 때 게임 크기도 자동으로 조정
window.addEventListener('resize', () => {
    game.scale.refresh();
    
    // 현재 활성화된 씬의 resize 메서드 호출
    const currentScene = game.scene.getScenes(true)[0];
    if (currentScene && currentScene.resize) {
        currentScene.resize();
    }
}); 