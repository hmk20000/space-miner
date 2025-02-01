import Phaser from 'phaser';

export class InputManager {
    private static instance: InputManager;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wKey!: Phaser.Input.Keyboard.Key;
    private aKey!: Phaser.Input.Keyboard.Key;
    private sKey!: Phaser.Input.Keyboard.Key;
    private dKey!: Phaser.Input.Keyboard.Key;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private iKey!: Phaser.Input.Keyboard.Key;

    private constructor() {
        // Private constructor to prevent instantiation
    }

    public static getInstance(): InputManager {
        if (!InputManager.instance) {
            InputManager.instance = new InputManager();
        }
        return InputManager.instance;
    }

    public init(scene: Phaser.Scene): void {

        if (!scene.input?.keyboard) {
            throw new Error('Keyboard input is not available');
        }

        // Initialize input for the given scene
        this.cursors = scene.input.keyboard.createCursorKeys(); // Create cursor keys

        // Create WASD keys
        this.wKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.aKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.sKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.dKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        // Create space key
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.iKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    }

    public getCursors(): Phaser.Types.Input.Keyboard.CursorKeys {
        return this.cursors; // Return the cursor keys
    }

    public isWPressed(): boolean {
        return this.wKey.isDown; // Check if W is pressed
    }

    public isAPressed(): boolean {
        return this.aKey.isDown; // Check if A is pressed
    }

    public isSPressed(): boolean {
        return this.sKey.isDown; // Check if S is pressed
    }

    public isDPressed(): boolean {
        return this.dKey.isDown; // Check if D is pressed
    }

    public isSpacePressed(): boolean {
        return this.spaceKey.isDown; // Check if space is pressed
    }

    public isIPressed(): boolean {
        return this.iKey.isDown; // Check if I is pressed
    }

    // Add more methods for handling different input types (mouse, gamepad, etc.)
} 