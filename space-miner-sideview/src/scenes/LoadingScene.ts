import Phaser from 'phaser';
import { SCENE_KEYS } from '../constants/GameConstants';


export class LoadingScene extends Phaser.Scene {

    constructor() {
        super({ key: SCENE_KEYS.LOADING });
    }

    create() {
    // 초기 청크 생성 시작
    }
} 