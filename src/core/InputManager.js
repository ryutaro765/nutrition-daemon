/**
 * 入力管理クラス
 * キーボード入力の状態を管理し、ゲーム操作に変換
 */
export class InputManager {
    constructor() {
        this.keys = {};
        this.previousKeys = {};
        this.initializeEventListeners();
    }

    /**
     * イベントリスナーの初期化
     */
    initializeEventListeners() {
        // キーダウンイベント
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            // ブラウザデフォルトの動作を防ぐ（矢印キーでのスクロール等）
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });

        // キーアップイベント
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // フォーカス失ったときにキー状態をリセット
        window.addEventListener('blur', () => {
            this.keys = {};
        });
    }

    /**
     * フレーム更新（前フレームの状態を保存）
     */
    update() {
        this.previousKeys = { ...this.keys };
        
        // デバッグログを削除
    }

    /**
     * キーが押されているかどうか
     * @param {string} keyCode - キーコード
     * @returns {boolean} 押されているかどうか
     */
    isKeyDown(keyCode) {
        return !!this.keys[keyCode];
    }

    /**
     * キーが押された瞬間かどうか（フレーム単位）
     * @param {string} keyCode - キーコード
     * @returns {boolean} 押された瞬間かどうか
     */
    isKeyPressed(keyCode) {
        const current = !!this.keys[keyCode];
        const previous = !!this.previousKeys[keyCode];
        const result = current && !previous;
        
        // デバッグログを削除（パフォーマンス向上）
        
        return result;
    }

    /**
     * キーが離された瞬間かどうか（フレーム単位）
     * @param {string} keyCode - キーコード
     * @returns {boolean} 離された瞬間かどうか
     */
    isKeyReleased(keyCode) {
        return !this.keys[keyCode] && !!this.previousKeys[keyCode];
    }

    /**
     * 移動入力の取得
     * @returns {Object} 移動方向 {x: -1/0/1, y: -1/0/1}
     */
    getMovementInput() {
        let x = 0;
        let y = 0;

        // 横方向移動
        if (this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA')) {
            x = -1;
        } else if (this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD')) {
            x = 1;
        }

        // 縦方向移動
        if (this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW')) {
            y = -1;
        } else if (this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS')) {
            y = 1;
        }

        return { x, y };
    }

    /**
     * 射撃ボタンが押されているか
     * @returns {boolean} 射撃ボタンが押されているか
     */
    isShooting() {
        return this.isKeyDown('Space') || this.isKeyDown('KeyZ');
    }

    /**
     * 射撃ボタンが押された瞬間か
     * @returns {boolean} 射撃ボタンが押された瞬間か
     */
    isShootPressed() {
        return this.isKeyPressed('Space') || this.isKeyPressed('KeyZ');
    }

    /**
     * ゲーム開始ボタンが押されたか
     * @returns {boolean} ゲーム開始ボタンが押されたか
     */
    isStartPressed() {
        return this.isKeyPressed('Enter') || this.isKeyPressed('Space');
    }

    /**
     * ポーズボタンが押されたか
     * @returns {boolean} ポーズボタンが押されたか
     */
    isPausePressed() {
        return this.isKeyPressed('KeyP') || this.isKeyPressed('Escape');
    }

    /**
     * リスタートボタンが押されたか
     * @returns {boolean} リスタートボタンが押されたか
     */
    isRestartPressed() {
        const result = this.isKeyPressed('KeyR');
        
        // デバッグログを削除
        
        return result;
    }

    /**
     * コンティニューボタンが押されたか
     * @returns {boolean} コンティニューボタンが押されたか
     */
    isContinuePressed() {
        const cPressed = this.isKeyPressed('KeyC');
        const enterPressed = this.isKeyPressed('Enter');
        const result = cPressed || enterPressed;
        
        // デバッグログを削除
        
        return result;
    }

    /**
     * デバッグ用キーが押されたか
     * @returns {boolean} デバッグキーが押されたか
     */
    isDebugPressed() {
        return this.isKeyPressed('KeyF1');
    }

    /**
     * ミュートボタンが押されたか
     * @returns {boolean} ミュートボタンが押されたか
     */
    isMutePressed() {
        return this.isKeyPressed('KeyM');
    }

    /**
     * フルスクリーンボタンが押されたか
     * @returns {boolean} フルスクリーンボタンが押されたか
     */
    isFullscreenPressed() {
        return this.isKeyPressed('KeyF');
    }

    /**
     * 高速モード手動発動ボタンが押されたか（デバッグ用）
     * @returns {boolean} 高速モードボタンが押されたか
     */
    isSpeedModePressed() {
        return this.isKeyPressed('KeyX');
    }

    /**
     * レーザー手動発動ボタンが押されたか（デバッグ用）
     * @returns {boolean} レーザーボタンが押されたか
     */
    isLaserPressed() {
        return this.isKeyPressed('KeyL');
    }

    /**
     * 任意のキーが押されているか
     * @returns {boolean} 何かしらのキーが押されているか
     */
    isAnyKeyDown() {
        return Object.values(this.keys).some(key => key);
    }

    /**
     * 任意のキーが押された瞬間か
     * @returns {boolean} 何かしらのキーが押された瞬間か
     */
    isAnyKeyPressed() {
        for (const keyCode in this.keys) {
            if (this.isKeyPressed(keyCode)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 押されているキーの一覧を取得（デバッグ用）
     * @returns {Array} 押されているキーコードの配列
     */
    getPressedKeys() {
        return Object.keys(this.keys).filter(key => this.keys[key]);
    }

    /**
     * 入力状態のリセット
     */
    reset() {
        this.keys = {};
        this.previousKeys = {};
    }

    /**
     * キー設定の説明文を取得
     * @returns {Object} キー設定の説明
     */
    getKeyConfig() {
        return {
            movement: {
                description: '移動',
                keys: ['Arrow Keys', 'WASD']
            },
            shoot: {
                description: '射撃',
                keys: ['Space', 'Z']
            },
            start: {
                description: 'ゲーム開始',
                keys: ['Enter', 'Space']
            },
            pause: {
                description: 'ポーズ',
                keys: ['P', 'Escape']
            },
            restart: {
                description: 'リスタート',
                keys: ['R']
            },
            continue: {
                description: 'コンティニュー',
                keys: ['C', 'Enter']
            },
            mute: {
                description: 'ミュート',
                keys: ['M']
            },
            fullscreen: {
                description: 'フルスクリーン',
                keys: ['F']
            },
            debug: {
                description: 'デバッグ情報',
                keys: ['F1']
            }
        };
    }

    /**
     * 特定のキーコンビネーションが押されているか
     * @param {Array} keyCodes - キーコードの配列
     * @returns {boolean} 全てのキーが同時に押されているか
     */
    areKeysDown(keyCodes) {
        return keyCodes.every(keyCode => this.isKeyDown(keyCode));
    }

    /**
     * アクション名でキーが押されているかチェック
     * @param {string} action - アクション名
     * @returns {boolean} キーが押されているか
     */
    isPressed(action) {
        const result = this._checkAction(action);
        // デバッグログを削除
        return result;
    }

    /**
     * アクション判定のヘルパーメソッド
     * @param {string} action - アクション名
     * @returns {boolean} キーが押されているか
     */
    _checkAction(action) {
        switch (action) {
            case 'shoot':
                return this.isShooting();
            case 'enter':
                return this.isKeyDown('Enter');
            case 'escape':
                return this.isKeyDown('Escape');
            case 'up':
                return this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW');
            case 'down':
                return this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS');
            case 'left':
                return this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA');
            case 'right':
                return this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD');
            case 'pause':
                return this.isKeyDown('KeyP') || this.isKeyDown('Escape');
            case 'restart':
                return this.isKeyDown('KeyR');
            default:
                return false;
        }
    }

    /**
     * アクション名でキーが押された瞬間かチェック
     * @param {string} action - アクション名
     * @returns {boolean} キーが押された瞬間か
     */
    wasJustPressed(action) {
        const result = this._checkJustPressed(action);
        // デバッグログを削除
        return result;
    }

    /**
     * キーが押された瞬間のアクション判定のヘルパーメソッド
     * @param {string} action - アクション名
     * @returns {boolean} キーが押された瞬間か
     */
    _checkJustPressed(action) {
        switch (action) {
            case 'shoot':
                return this.isShootPressed();
            case 'enter':
                return this.isKeyPressed('Enter');
            case 'escape':
                return this.isKeyPressed('Escape');
            case 'up':
                return this.isKeyPressed('ArrowUp') || this.isKeyPressed('KeyW');
            case 'down':
                return this.isKeyPressed('ArrowDown') || this.isKeyPressed('KeyS');
            case 'left':
                return this.isKeyPressed('ArrowLeft') || this.isKeyPressed('KeyA');
            case 'right':
                return this.isKeyPressed('ArrowRight') || this.isKeyPressed('KeyD');
            case 'pause':
                return this.isKeyPressed('KeyP') || this.isKeyPressed('Escape');
            case 'restart':
                return this.isKeyPressed('KeyR');
            default:
                return false;
        }
    }

    /**
     * デバッグ用：現在の入力状態を出力
     */
    debugLog() {
        const pressedKeys = this.getPressedKeys();
        if (pressedKeys.length > 0) {
            console.log('Pressed keys:', pressedKeys);
        }
        
        const movement = this.getMovementInput();
        if (movement.x !== 0 || movement.y !== 0) {
            console.log('Movement:', movement);
        }
        
        if (this.isShooting()) {
            console.log('Shooting: true');
        }
    }
}