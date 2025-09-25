import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * ゲーム画面管理システム
 * タイトル、メニュー、設定などの画面遷移を管理
 */
export class GameScreens {
    constructor() {
        this.currentScreen = 'title';
        this.previousScreen = null;
        this.transitionState = 'none'; // none, fadeOut, fadeIn
        this.transitionTimer = 0;
        this.transitionDuration = 30; // フレーム数
        
        // 画面固有の状態
        this.screenStates = {
            title: {
                logoScale: 1,
                logoRotation: 0,
                starField: [],
                glowIntensity: 0
            },
            menu: {
                selectedIndex: 0,
                options: ['Start Game', 'Boss Mode', 'Settings', 'Credits', 'Exit'],
                cursorPosition: 0,
                menuScale: 1,
                inputDelay: 0
            },
            bossMode: {
                selectedIndex: 0,
                options: ['ビタミンデーモン (Stage 1)', 'ミネラルデーモン (Stage 2)', '氷結の魔王 (Stage 3)', 'Back'],
                cursorPosition: 0,
                inputDelay: 0
            },
            settings: {
                selectedIndex: 0,
                inputDelay: 0,
                options: [
                    { name: 'Master Volume', value: 70, min: 0, max: 100, step: 10 },
                    { name: 'BGM Volume', value: 50, min: 0, max: 100, step: 10 },
                    { name: 'SFX Volume', value: 80, min: 0, max: 100, step: 10 },
                    { name: 'Difficulty', value: 'Normal', options: ['Easy', 'Normal', 'Hard', 'Extreme'] },
                    { name: 'Screen Mode', value: 'Windowed', options: ['Windowed', 'Fullscreen'] },
                    { name: 'Back', action: 'back' }
                ]
            },
            credits: {
                scrollOffset: 0,
                inputDelay: 0,
                credits: [
                    { text: '魔城伝説 - Demon Castle Legend', size: 'title', color: '#FFD700' },
                    { text: '', size: 'medium' },
                    { text: 'Programming & Design', size: 'large', color: '#00FF00' },
                    { text: 'Claude AI Assistant', size: 'medium' },
                    { text: '', size: 'medium' },
                    { text: 'Music System', size: 'large', color: '#00FF00' },
                    { text: 'Tone.js Procedural Music', size: 'medium' },
                    { text: '', size: 'medium' },
                    { text: 'Graphics', size: 'large', color: '#00FF00' },
                    { text: 'Pixel Art & Canvas 2D', size: 'medium' },
                    { text: '', size: 'medium' },
                    { text: 'Special Thanks', size: 'large', color: '#00FF00' },
                    { text: 'All Classic Shoot\'em Up Games', size: 'medium' },
                    { text: 'Gradius Series', size: 'medium' },
                    { text: 'R-Type Series', size: 'medium' },
                    { text: 'Salamander/Life Force', size: 'medium' },
                    { text: '', size: 'medium' },
                    { text: 'Technology Stack', size: 'large', color: '#00FF00' },
                    { text: 'ES6 Modules', size: 'medium' },
                    { text: 'HTML5 Canvas', size: 'medium' },
                    { text: 'Tone.js Audio Engine', size: 'medium' },
                    { text: 'Vite Build System', size: 'medium' },
                    { text: '', size: 'medium' },
                    { text: '© 2024 Magic Castle Studios', size: 'medium', color: '#888888' },
                    { text: '', size: 'medium' },
                    { text: 'Press ESC to return', size: 'small', color: '#FFFF00' }
                ]
            },
            loading: {
                progress: 0,
                message: 'Loading...',
                dots: 0,
                spinner: 0
            },
            story: {
                textIndex: 0,
                characterIndex: 0,
                storyText: [
                    'Long ago, in a land shrouded by eternal darkness...',
                    'The Demon Castle appeared, spreading evil across the realm.',
                    'Heroes fell one by one to its terrible power.',
                    'But now, a new champion rises...',
                    'Armed with ancient weapons and unwavering courage,',
                    'you must storm the castle and defeat the Demon Lords!',
                    '',
                    'Your journey begins now...'
                ],
                typewriterSpeed: 3,
                isComplete: false
            }
        };
        
        // カラーテーマ
        this.colors = {
            primary: '#00FF00',
            secondary: '#FFFF00',
            accent: '#FF6600',
            danger: '#FF0000',
            background: '#000000',
            text: '#FFFFFF',
            shadow: 'rgba(0, 0, 0, 0.8)',
            glow: 'rgba(0, 255, 0, 0.5)'
        };
        
        // フォント設定
        this.fonts = {
            small: '16px "Courier New", monospace',
            medium: '20px "Courier New", monospace',
            large: '28px "Courier New", monospace',
            title: 'bold 48px "Courier New", monospace',
            subtitle: 'bold 24px "Courier New", monospace'
        };
        
        this.initializeScreens();
    }

    /**
     * 画面初期化
     */
    initializeScreens() {
        // タイトル画面の星フィールド生成
        this.generateStarField();
        
        // 各画面の初期化
        this.resetScreenState('title');
    }

    /**
     * 星フィールド生成
     */
    generateStarField() {
        const stars = [];
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
                y: Math.random() * GAME_CONFIG.CANVAS_HEIGHT,
                speed: Math.random() * 3 + 1,
                brightness: Math.random() * 0.8 + 0.2,
                size: Math.random() * 2 + 1
            });
        }
        this.screenStates.title.starField = stars;
    }

    /**
     * 画面遷移
     * @param {string} newScreen - 新しい画面名
     * @param {boolean} immediate - 即座に遷移するか
     */
    transitionTo(newScreen, immediate = false) {
        if (this.currentScreen === newScreen) return;
        
        this.previousScreen = this.currentScreen;
        
        if (immediate) {
            this.currentScreen = newScreen;
            this.transitionState = 'none';
            this.resetScreenState(newScreen);
        } else {
            this.transitionState = 'fadeOut';
            this.transitionTimer = this.transitionDuration;
            
            // フェードアウト完了後に新しい画面へ
            setTimeout(() => {
                this.currentScreen = newScreen;
                this.transitionState = 'fadeIn';
                this.transitionTimer = this.transitionDuration;
                this.resetScreenState(newScreen);
            }, (this.transitionDuration / 60) * 1000);
        }
    }

    /**
     * 画面状態リセット
     * @param {string} screenName - 画面名
     */
    resetScreenState(screenName) {
        switch (screenName) {
            case 'title':
                this.screenStates.title.logoScale = 1;
                this.screenStates.title.logoRotation = 0;
                this.screenStates.title.glowIntensity = 0;
                break;
            case 'menu':
                this.screenStates.menu.selectedIndex = 0;
                this.screenStates.menu.cursorPosition = 0;
                this.screenStates.menu.menuScale = 1;
                break;
            case 'bossMode':
                this.screenStates.bossMode.selectedIndex = 0;
                this.screenStates.bossMode.cursorPosition = 0;
                break;
            case 'settings':
                this.screenStates.settings.selectedIndex = 0;
                break;
            case 'credits':
                this.screenStates.credits.scrollOffset = 0;
                break;
            case 'loading':
                this.screenStates.loading.progress = 0;
                this.screenStates.loading.dots = 0;
                this.screenStates.loading.spinner = 0;
                break;
            case 'story':
                this.screenStates.story.textIndex = 0;
                this.screenStates.story.characterIndex = 0;
                this.screenStates.story.isComplete = false;
                break;
        }
    }

    /**
     * 画面更新
     * @param {Object} input - 入力状態
     * @returns {string|null} 遷移指示
     */
    update(input) {
        // 遷移更新
        this.updateTransition();
        
        // 現在の画面更新
        let result = null;
        switch (this.currentScreen) {
            case 'title':
                result = this.updateTitleScreen(input);
                break;
            case 'menu':
                result = this.updateMenuScreen(input);
                break;
            case 'bossMode':
                result = this.updateBossModeScreen(input);
                break;
            case 'settings':
                result = this.updateSettingsScreen(input);
                break;
            case 'credits':
                result = this.updateCreditsScreen(input);
                break;
            case 'loading':
                result = this.updateLoadingScreen();
                break;
            case 'story':
                result = this.updateStoryScreen(input);
                break;
        }
        
        return result;
    }

    /**
     * 遷移更新
     */
    updateTransition() {
        if (this.transitionState !== 'none' && this.transitionTimer > 0) {
            this.transitionTimer--;
            
            if (this.transitionTimer <= 0) {
                if (this.transitionState === 'fadeOut') {
                    this.transitionState = 'fadeIn';
                    this.transitionTimer = this.transitionDuration;
                } else {
                    this.transitionState = 'none';
                }
            }
        }
    }

    /**
     * タイトル画面更新
     * @param {Object} input - 入力状態
     */
    updateTitleScreen(input) {
        const state = this.screenStates.title;
        
        // ロゴアニメーション
        state.logoScale = 1 + Math.sin(Date.now() * 0.002) * 0.1;
        state.logoRotation += 0.005;
        state.glowIntensity = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
        
        // 星フィールド更新
        for (const star of state.starField) {
            star.y += star.speed;
            if (star.y > GAME_CONFIG.CANVAS_HEIGHT) {
                star.y = -10;
                star.x = Math.random() * GAME_CONFIG.CANVAS_WIDTH;
            }
        }
        
        // 入力処理
        if (input.isPressed('shoot') || input.isPressed('enter')) {
            return 'menu';
        }
        
        return null;
    }

    /**
     * メニュー画面更新
     * @param {Object} input - 入力状態
     */
    updateMenuScreen(input) {
        const state = this.screenStates.menu;
        
        // 入力遅延管理
        if (state.inputDelay > 0) {
            state.inputDelay--;
        }
        
        // カーソル移動（遅延がない時のみ）
        if (state.inputDelay === 0) {
            if (input.isPressed('up')) {
                state.selectedIndex = Math.max(0, state.selectedIndex - 1);
                state.inputDelay = 15; // 15フレーム（0.25秒）の遅延
                console.log('✅ Menu up - selectedIndex:', state.selectedIndex);
            }
            if (input.isPressed('down')) {
                state.selectedIndex = Math.min(state.options.length - 1, state.selectedIndex + 1);
                state.inputDelay = 15; // 15フレーム（0.25秒）の遅延
                console.log('✅ Menu down - selectedIndex:', state.selectedIndex);
            }
            
            // メニュー選択
            if (input.isPressed('shoot') || input.isPressed('enter')) {
                console.log('✅ Menu select - index:', state.selectedIndex);
                switch (state.selectedIndex) {
                    case 0: return 'start_game';
                    case 1: return 'bossMode';
                    case 2: return 'settings';
                    case 3: return 'credits';
                    case 4: return 'exit';
                }
            }
            
            // 戻る
            if (input.isPressed('escape')) {
                return 'title';
            }
        }
        
        // カーソル位置アニメーション
        const targetPosition = state.selectedIndex * 50;
        state.cursorPosition += (targetPosition - state.cursorPosition) * 0.2;
        
        return null;
    }

    /**
     * ボスモード画面更新
     * @param {Object} input - 入力状態
     */
    updateBossModeScreen(input) {
        const state = this.screenStates.bossMode;
        
        // 入力遅延管理
        if (state.inputDelay > 0) {
            state.inputDelay--;
        }
        
        // カーソル移動（遅延がない時のみ）
        if (state.inputDelay === 0) {
            if (input.isPressed('up')) {
                state.selectedIndex = Math.max(0, state.selectedIndex - 1);
                state.inputDelay = 15;
                console.log('✅ Boss Mode up - selectedIndex:', state.selectedIndex);
            }
            if (input.isPressed('down')) {
                state.selectedIndex = Math.min(state.options.length - 1, state.selectedIndex + 1);
                state.inputDelay = 15;
                console.log('✅ Boss Mode down - selectedIndex:', state.selectedIndex);
            }
            
            // ボス選択
            if (input.isPressed('shoot') || input.isPressed('enter')) {
                console.log('✅ Boss Mode select - index:', state.selectedIndex);
                switch (state.selectedIndex) {
                    case 0: return { action: 'start_boss_battle', bossIndex: 0 }; // ビタミンデーモン
                    case 1: return { action: 'start_boss_battle', bossIndex: 1 }; // ミネラルデーモン
                    case 2: return { action: 'start_boss_battle', bossIndex: 2 }; // 氷結の魔王
                    case 3: return 'menu'; // Back
                }
            }
            
            // 戻る
            if (input.isPressed('escape')) {
                return 'menu';
            }
        }
        
        // カーソル位置アニメーション
        const targetPosition = state.selectedIndex * 50;
        state.cursorPosition += (targetPosition - state.cursorPosition) * 0.2;
        
        return null;
    }

    /**
     * 設定画面更新
     * @param {Object} input - 入力状態
     */
    updateSettingsScreen(input) {
        const state = this.screenStates.settings;
        
        // 入力遅延管理
        if (state.inputDelay > 0) {
            state.inputDelay--;
        }
        
        // 入力処理（遅延がない時のみ）
        if (state.inputDelay === 0) {
            // カーソル移動
            if (input.isPressed('up')) {
                state.selectedIndex = Math.max(0, state.selectedIndex - 1);
                state.inputDelay = 15;
                console.log('✅ Settings up - selectedIndex:', state.selectedIndex);
            }
            if (input.isPressed('down')) {
                state.selectedIndex = Math.min(state.options.length - 1, state.selectedIndex + 1);
                state.inputDelay = 15;
                console.log('✅ Settings down - selectedIndex:', state.selectedIndex);
            }
            
            const option = state.options[state.selectedIndex];
            
            // 値変更
            if (input.isPressed('left') || input.isPressed('right')) {
                const direction = input.isPressed('right') ? 1 : -1;
                
                if (option.min !== undefined && option.max !== undefined) {
                    // 数値設定
                    option.value = Math.max(option.min, 
                        Math.min(option.max, option.value + direction * option.step));
                    console.log('✅ Settings value changed:', option.name, '=', option.value);
                } else if (option.options) {
                    // 選択肢設定
                    const currentIndex = option.options.indexOf(option.value);
                    const newIndex = Math.max(0, 
                        Math.min(option.options.length - 1, currentIndex + direction));
                    option.value = option.options[newIndex];
                    console.log('✅ Settings option changed:', option.name, '=', option.value);
                }
                state.inputDelay = 10; // 値変更は少し短い遅延
            }
            
            // 選択
            if (input.isPressed('shoot') || input.isPressed('enter')) {
                if (option.action === 'back') {
                    console.log('✅ Settings back to menu');
                    state.inputDelay = 15;
                    return 'menu';
                }
            }
            
            // 戻る
            if (input.isPressed('escape')) {
                console.log('✅ Settings escape to menu');
                state.inputDelay = 15;
                return 'menu';
            }
        }
        
        return null;
    }

    /**
     * クレジット画面更新
     * @param {Object} input - 入力状態
     */
    updateCreditsScreen(input) {
        const state = this.screenStates.credits;
        
        // 入力遅延管理
        if (state.inputDelay > 0) {
            state.inputDelay--;
        }
        
        // 自動スクロール
        state.scrollOffset += 1;
        
        // 手動スクロール
        if (input.isPressed('up')) {
            state.scrollOffset -= 3;
        }
        if (input.isPressed('down')) {
            state.scrollOffset += 3;
        }
        
        // スクロール制限
        state.scrollOffset = Math.max(0, 
            Math.min(state.credits.length * 40, state.scrollOffset));
        
        // 戻る（遅延がない時のみ）
        if (state.inputDelay === 0 && (input.isPressed('escape') || input.isPressed('shoot'))) {
            state.inputDelay = 15; // 連続入力防止
            console.log('✅ Credits back to menu');
            return 'menu';
        }
        
        return null;
    }

    /**
     * ローディング画面更新
     */
    updateLoadingScreen() {
        const state = this.screenStates.loading;
        
        // プログレス更新（外部から設定される）
        state.dots = (state.dots + 0.1) % 4;
        state.spinner += 0.2;
        
        return null;
    }

    /**
     * ストーリー画面更新
     * @param {Object} input - 入力状態
     */
    updateStoryScreen(input) {
        const state = this.screenStates.story;
        
        if (!state.isComplete) {
            // タイプライター効果
            if (state.textIndex < state.storyText.length) {
                const currentText = state.storyText[state.textIndex];
                if (state.characterIndex < currentText.length) {
                    state.characterIndex += state.typewriterSpeed / 60;
                    if (state.characterIndex >= currentText.length) {
                        state.characterIndex = currentText.length;
                        setTimeout(() => {
                            state.textIndex++;
                            state.characterIndex = 0;
                        }, 1000);
                    }
                }
            } else {
                state.isComplete = true;
            }
        }
        
        // スキップ
        if (input.wasJustPressed('shoot') || input.wasJustPressed('enter')) {
            if (state.isComplete) {
                return 'start_game';
            } else {
                state.isComplete = true;
                state.textIndex = state.storyText.length;
            }
        }
        
        // 戻る
        if (input.wasJustPressed('escape')) {
            return 'menu';
        }
        
        return null;
    }

    /**
     * 画面描画
     * @param {Object} renderer - レンダラー
     */
    draw(renderer) {
        // 背景クリア
        renderer.ctx.fillStyle = this.colors.background;
        renderer.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        
        // 現在の画面描画
        switch (this.currentScreen) {
            case 'title':
                this.drawTitleScreen(renderer);
                break;
            case 'menu':
                this.drawMenuScreen(renderer);
                break;
            case 'bossMode':
                this.drawBossModeScreen(renderer);
                break;
            case 'settings':
                this.drawSettingsScreen(renderer);
                break;
            case 'credits':
                this.drawCreditsScreen(renderer);
                break;
            case 'loading':
                this.drawLoadingScreen(renderer);
                break;
            case 'story':
                this.drawStoryScreen(renderer);
                break;
        }
        
        // 遷移エフェクト描画
        this.drawTransition(renderer);
    }

    /**
     * タイトル画面描画（オリジナルKnightmare風）
     * @param {Object} renderer - レンダラー
     */
    drawTitleScreen(renderer) {
        const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
        const centerY = GAME_CONFIG.CANVAS_HEIGHT / 2;
        
        // 黒背景（完全に黒）
        renderer.ctx.fillStyle = '#000000';
        renderer.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        
        // ゲームタイトル：KNIGHTMARE（オリジナル風）
        renderer.ctx.font = 'bold 56px "Courier New", monospace';
        renderer.ctx.fillStyle = '#FFFFFF';
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillText('KNIGHTMARE', centerX, centerY - 120);
        
        // 日本語タイトル：魔城栄養伝説（赤色）
        renderer.ctx.font = 'bold 48px "Courier New", monospace';
        renderer.ctx.fillStyle = '#FF4444';
        renderer.ctx.fillText('魔城栄養伝説', centerX, centerY - 60);
        
        // コピーライト表示
        renderer.ctx.font = '20px "Courier New", monospace';
        renderer.ctx.fillStyle = '#FFFFFF';
        renderer.ctx.fillText('©NAMIKO 1986', centerX, centerY - 10);
        
        // 点滅する操作案内
        const blinkAlpha = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;
        renderer.ctx.font = '24px "Courier New", monospace';
        renderer.ctx.fillStyle = `rgba(255, 255, 255, ${blinkAlpha})`;
        renderer.ctx.fillText('PUSH SPACE KEY', centerX, centerY + 60);
        
        // バージョン情報（小さく右下）
        renderer.ctx.font = '12px "Courier New", monospace';
        renderer.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        renderer.ctx.textAlign = 'right';
        renderer.ctx.fillText('v1.0.0', GAME_CONFIG.CANVAS_WIDTH - 10, GAME_CONFIG.CANVAS_HEIGHT - 10);
        
        renderer.ctx.textAlign = 'start';
    }

    /**
     * メニュー画面描画
     * @param {Object} renderer - レンダラー
     */
    drawMenuScreen(renderer) {
        const state = this.screenStates.menu;
        const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
        const startY = GAME_CONFIG.CANVAS_HEIGHT / 2 - 100;
        
        // タイトル
        renderer.ctx.font = this.fonts.large;
        renderer.ctx.fillStyle = this.colors.primary;
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillText('MAIN MENU', centerX, startY - 50);
        
        // メニューオプション
        state.options.forEach((option, index) => {
            const y = startY + index * 50;
            const isSelected = index === state.selectedIndex;
            
            renderer.ctx.font = this.fonts.medium;
            renderer.ctx.fillStyle = isSelected ? this.colors.secondary : this.colors.text;
            renderer.ctx.textAlign = 'center';
            renderer.ctx.fillText(option, centerX, y);
            
            // 選択カーソル
            if (isSelected) {
                const cursorY = startY + state.cursorPosition - 10;
                renderer.ctx.fillStyle = this.colors.accent;
                renderer.ctx.fillText('>', centerX - 150, cursorY);
                renderer.ctx.fillText('<', centerX + 150, cursorY);
            }
        });
        
        renderer.ctx.textAlign = 'start';
    }

    /**
     * ボスモード画面描画
     * @param {Object} renderer - レンダラー
     */
    drawBossModeScreen(renderer) {
        const state = this.screenStates.bossMode;
        const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
        const startY = GAME_CONFIG.CANVAS_HEIGHT / 2 - 100;
        
        // タイトル
        renderer.ctx.font = this.fonts.large;
        renderer.ctx.fillStyle = this.colors.primary;
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillText('BOSS MODE', centerX, startY - 50);
        
        // サブタイトル
        renderer.ctx.font = this.fonts.small;
        renderer.ctx.fillStyle = this.colors.text;
        renderer.ctx.fillText('Select a boss to challenge directly', centerX, startY - 20);
        
        // ボスオプション
        state.options.forEach((option, index) => {
            const y = startY + index * 50;
            const isSelected = index === state.selectedIndex;
            
            renderer.ctx.font = this.fonts.medium;
            renderer.ctx.fillStyle = isSelected ? this.colors.secondary : this.colors.text;
            renderer.ctx.textAlign = 'center';
            renderer.ctx.fillText(option, centerX, y);
            
            // 選択カーソル
            if (isSelected) {
                const cursorY = startY + state.cursorPosition - 10;
                renderer.ctx.fillStyle = this.colors.accent;
                renderer.ctx.fillText('>', centerX - 200, cursorY);
                renderer.ctx.fillText('<', centerX + 200, cursorY);
            }
        });
        
        // ヒント表示
        renderer.ctx.font = this.fonts.small;
        renderer.ctx.fillStyle = this.colors.text;
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillText('Press SPACE to select, ESC to go back', centerX, GAME_CONFIG.CANVAS_HEIGHT - 50);
        
        renderer.ctx.textAlign = 'start';
    }

    /**
     * 設定画面描画
     * @param {Object} renderer - レンダラー
     */
    drawSettingsScreen(renderer) {
        const state = this.screenStates.settings;
        const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
        const startY = 150;
        
        // タイトル
        renderer.ctx.font = this.fonts.large;
        renderer.ctx.fillStyle = this.colors.primary;
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillText('SETTINGS', centerX, 100);
        
        // 設定オプション
        state.options.forEach((option, index) => {
            const y = startY + index * 40;
            const isSelected = index === state.selectedIndex;
            
            renderer.ctx.font = this.fonts.medium;
            renderer.ctx.fillStyle = isSelected ? this.colors.secondary : this.colors.text;
            renderer.ctx.textAlign = 'left';
            renderer.ctx.fillText(option.name, 100, y);
            
            // 値表示
            if (option.value !== undefined && option.action !== 'back') {
                renderer.ctx.textAlign = 'right';
                renderer.ctx.fillText(option.value.toString(), 700, y);
                
                // 選択中の項目のバー表示
                if (isSelected && option.min !== undefined) {
                    const barWidth = 200;
                    const barHeight = 10;
                    const barX = 450;
                    const barY = y + 5;
                    const fillWidth = (option.value - option.min) / (option.max - option.min) * barWidth;
                    
                    renderer.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    renderer.ctx.fillRect(barX, barY, barWidth, barHeight);
                    
                    renderer.ctx.fillStyle = this.colors.accent;
                    renderer.ctx.fillRect(barX, barY, fillWidth, barHeight);
                }
            }
            
            // 選択カーソル
            if (isSelected) {
                renderer.ctx.fillStyle = this.colors.accent;
                renderer.ctx.textAlign = 'left';
                renderer.ctx.fillText('>', 50, y);
            }
        });
        
        // 操作案内
        renderer.ctx.font = this.fonts.small;
        renderer.ctx.fillStyle = this.colors.secondary;
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillText('Use LEFT/RIGHT to change values, ESC to go back', centerX, GAME_CONFIG.CANVAS_HEIGHT - 50);
        
        renderer.ctx.textAlign = 'start';
    }

    /**
     * クレジット画面描画
     * @param {Object} renderer - レンダラー
     */
    drawCreditsScreen(renderer) {
        const state = this.screenStates.credits;
        const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
        
        // クレジットテキスト
        state.credits.forEach((credit, index) => {
            const y = 100 + index * 40 - state.scrollOffset;
            
            // 画面内のみ描画
            if (y > -50 && y < GAME_CONFIG.CANVAS_HEIGHT + 50) {
                let font, color;
                
                switch (credit.size) {
                    case 'title': font = this.fonts.title; break;
                    case 'large': font = this.fonts.large; break;
                    case 'medium': font = this.fonts.medium; break;
                    case 'small': font = this.fonts.small; break;
                    default: font = this.fonts.medium; break;
                }
                
                color = credit.color || this.colors.text;
                
                renderer.ctx.font = font;
                renderer.ctx.fillStyle = color;
                renderer.ctx.textAlign = 'center';
                renderer.ctx.fillText(credit.text, centerX, y);
            }
        });
        
        renderer.ctx.textAlign = 'start';
    }

    /**
     * ローディング画面描画
     * @param {Object} renderer - レンダラー
     */
    drawLoadingScreen(renderer) {
        const state = this.screenStates.loading;
        const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
        const centerY = GAME_CONFIG.CANVAS_HEIGHT / 2;
        
        // ローディングメッセージ
        const dots = '.'.repeat(Math.floor(state.dots));
        renderer.ctx.font = this.fonts.large;
        renderer.ctx.fillStyle = this.colors.text;
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillText(state.message + dots, centerX, centerY - 50);
        
        // プログレスバー
        const barWidth = 400;
        const barHeight = 20;
        const barX = centerX - barWidth / 2;
        const barY = centerY;
        
        renderer.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        renderer.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const fillWidth = barWidth * (state.progress / 100);
        renderer.ctx.fillStyle = this.colors.primary;
        renderer.ctx.fillRect(barX, barY, fillWidth, barHeight);
        
        // パーセンテージ
        renderer.ctx.font = this.fonts.medium;
        renderer.ctx.fillStyle = this.colors.text;
        renderer.ctx.fillText(`${Math.floor(state.progress)}%`, centerX, centerY + 50);
        
        // スピナー
        renderer.ctx.save();
        renderer.ctx.translate(centerX, centerY - 100);
        renderer.ctx.rotate(state.spinner);
        
        for (let i = 0; i < 8; i++) {
            const alpha = (i + state.spinner) % 8 / 8;
            
            renderer.ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
            renderer.ctx.fillRect(20, -2, 10, 4);
            renderer.ctx.rotate(Math.PI / 4);
        }
        
        renderer.ctx.restore();
        renderer.ctx.textAlign = 'start';
    }

    /**
     * ストーリー画面描画
     * @param {Object} renderer - レンダラー
     */
    drawStoryScreen(renderer) {
        const state = this.screenStates.story;
        const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
        const startY = 150;
        
        // ストーリーテキスト
        for (let i = 0; i <= state.textIndex && i < state.storyText.length; i++) {
            const y = startY + i * 50;
            let text = state.storyText[i];
            
            // タイプライター効果
            if (i === state.textIndex && !state.isComplete) {
                text = text.substring(0, Math.floor(state.characterIndex));
            }
            
            renderer.ctx.font = this.fonts.medium;
            renderer.ctx.fillStyle = this.colors.text;
            renderer.ctx.textAlign = 'center';
            renderer.ctx.fillText(text, centerX, y);
        }
        
        // 続行案内
        if (state.isComplete) {
            const blinkAlpha = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
            renderer.ctx.font = this.fonts.small;
            renderer.ctx.fillStyle = `rgba(255, 255, 0, ${blinkAlpha})`;
            renderer.ctx.textAlign = 'center';
            renderer.ctx.fillText('Press SPACE to Continue', centerX, GAME_CONFIG.CANVAS_HEIGHT - 50);
        }
        
        renderer.ctx.textAlign = 'start';
    }

    /**
     * 遷移エフェクト描画
     * @param {Object} renderer - レンダラー
     */
    drawTransition(renderer) {
        if (this.transitionState === 'none') return;
        
        let alpha;
        if (this.transitionState === 'fadeOut') {
            alpha = 1 - (this.transitionTimer / this.transitionDuration);
        } else {
            alpha = this.transitionTimer / this.transitionDuration;
        }
        
        renderer.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        renderer.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    }

    /**
     * ローディングプログレス設定
     * @param {number} progress - プログレス (0-100)
     * @param {string} message - メッセージ
     */
    setLoadingProgress(progress, message = 'Loading...') {
        this.screenStates.loading.progress = Math.max(0, Math.min(100, progress));
        this.screenStates.loading.message = message;
    }

    /**
     * 現在の画面取得
     * @returns {string} 現在の画面名
     */
    getCurrentScreen() {
        return this.currentScreen;
    }

    /**
     * 設定値取得
     * @returns {Object} 設定値
     */
    getSettings() {
        const settings = {};
        for (const option of this.screenStates.settings.options) {
            if (option.value !== undefined && option.action !== 'back') {
                settings[option.name] = option.value;
            }
        }
        return settings;
    }

    /**
     * 設定値適用
     * @param {Object} settings - 設定値
     */
    applySettings(settings) {
        for (const option of this.screenStates.settings.options) {
            if (settings[option.name] !== undefined) {
                option.value = settings[option.name];
            }
        }
    }
}