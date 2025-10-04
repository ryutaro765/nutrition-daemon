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
                options: ['ビタミンデーモン (Stage 1)', 'ミネラルデーモン (Stage 2)', 'ビタミンエンジェル (Stage 3)', 'Back'],
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
            },
            ending: {
                phase: 'entrance', // entrance, dialogue, celebration
                timer: 0,
                popolonX: -100,
                popolonY: 450,
                aphroditeX: 600,
                aphroditeY: 350,
                targetPopolonX: 450,
                dialogueIndex: 0,
                characterIndex: 0,
                typewriterSpeed: 4, // Doubled speed for faster typing
                dialogues: [
                    { speaker: 'ポポロン', text: 'ブロッコリー姫！魔王たちを倒したぞ！' },
                    { speaker: 'ブロッコリー姫', text: '我が勇敢なるポポロン...よく来てくれました！' },
                    { speaker: 'ポポロン', text: '愛する君を救うためなら、何物も俺を止められない' },
                    { speaker: 'ブロッコリー姫', text: '一緒にこの大地に平和を取り戻しましょう！' },
                    { speaker: 'ナレーター', text: 'かくして勇者ポポロンはブロッコリー姫を救い出した...' },
                    { speaker: 'ナレーター', text: '魔城は崩れ去り、光が再び大地に戻った' },
                    { speaker: 'ナレーター', text: '二人の愛は全ての悪を打ち破り、永遠の幸せを手に入れた' },
                    { speaker: 'ナレーター', text: 'ありがとう ポポロン！' }
                ],
                sparkles: [],
                hearts: [],
                completed: false
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
            case 'ending':
                this.screenStates.ending.phase = 'entrance';
                this.screenStates.ending.timer = 0;
                this.screenStates.ending.popolonX = -100;
                this.screenStates.ending.popolonY = 450;
                this.screenStates.ending.dialogueIndex = 0;
                this.screenStates.ending.characterIndex = 0;
                this.screenStates.ending.sparkles = [];
                this.screenStates.ending.hearts = [];
                this.screenStates.ending.completed = false;
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
            case 'ending':
                result = this.updateEndingScreen(input);
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
                    case 2: return { action: 'start_boss_battle', bossIndex: 2 }; // ビタミンエンジェル (Final Stage)
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
     * エンディング画面更新
     * @param {Object} input - 入力状態
     */
    updateEndingScreen(input) {
        const state = this.screenStates.ending;
        state.timer++;

        switch (state.phase) {
            case 'entrance':
                // Popolon walks towards Aphrodite - faster entrance
                if (state.popolonX < state.targetPopolonX) {
                    state.popolonX += 6; // Doubled speed from 3 to 6
                } else {
                    state.phase = 'dialogue';
                    state.timer = 0;
                }
                break;

            case 'dialogue':
                // Handle dialogue typewriter effect
                if (state.dialogueIndex < state.dialogues.length) {
                    const currentDialogue = state.dialogues[state.dialogueIndex];
                    if (state.characterIndex < currentDialogue.text.length) {
                        state.characterIndex += state.typewriterSpeed / 60;
                        if (state.characterIndex >= currentDialogue.text.length) {
                            state.characterIndex = currentDialogue.text.length;
                        }
                    }

                    // Auto-advance dialogue after a delay - much faster pacing
                    if (state.characterIndex >= currentDialogue.text.length && state.timer > 90) { // 1.5 seconds instead of 3
                        state.dialogueIndex++;
                        state.characterIndex = 0;
                        state.timer = 0;
                    }
                } else {
                    state.phase = 'celebration';
                    state.timer = 0;
                    // Generate celebratory effects
                    this.generateCelebrationEffects(state);
                }
                break;

            case 'celebration':
                // Update celebration effects
                this.updateCelebrationEffects(state);
                
                // Mark as completed after celebration - shorter celebration
                if (state.timer > 300) { // 5 seconds instead of 10
                    state.completed = true;
                }
                break;
        }

        // Skip functionality
        if (input.wasJustPressed('shoot') || input.wasJustPressed('enter') || input.wasJustPressed('space')) {
            if (state.completed || state.phase === 'celebration') {
                return 'title'; // Return to title after ending
            } else {
                // Skip to next dialogue or phase
                if (state.phase === 'dialogue' && state.dialogueIndex < state.dialogues.length) {
                    state.characterIndex = state.dialogues[state.dialogueIndex].text.length;
                    state.timer = 90; // Trigger auto-advance - faster
                } else if (state.phase === 'entrance') {
                    state.popolonX = state.targetPopolonX;
                    state.phase = 'dialogue';
                    state.timer = 0;
                }
            }
        }

        // ESC to skip to title
        if (input.wasJustPressed('escape')) {
            return 'title';
        }

        return null;
    }

    /**
     * Generate celebration effects (hearts, sparkles)
     */
    generateCelebrationEffects(state) {
        // Generate more sparkles for enhanced celebration
        for (let i = 0; i < 80; i++) { // Increased from 50 to 80
            state.sparkles.push({
                x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
                y: Math.random() * GAME_CONFIG.CANVAS_HEIGHT,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 120 + Math.random() * 60,
                maxLife: 120 + Math.random() * 60,
                size: Math.random() * 4 + 2 // Slightly larger sparkles
            });
        }

        // Generate more hearts for enhanced effect
        for (let i = 0; i < 40; i++) { // Doubled from 20 to 40
            state.hearts.push({
                x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
                y: GAME_CONFIG.CANVAS_HEIGHT + Math.random() * 100,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 1,
                life: 180 + Math.random() * 120,
                maxLife: 180 + Math.random() * 120,
                size: Math.random() * 25 + 18, // Slightly larger hearts
                rotation: Math.random() * Math.PI * 2
            });
        }
    }

    /**
     * Update celebration effects
     */
    updateCelebrationEffects(state) {
        // Update sparkles
        for (let i = state.sparkles.length - 1; i >= 0; i--) {
            const sparkle = state.sparkles[i];
            sparkle.x += sparkle.vx;
            sparkle.y += sparkle.vy;
            sparkle.life--;
            
            if (sparkle.life <= 0 || sparkle.x < 0 || sparkle.x > GAME_CONFIG.CANVAS_WIDTH || 
                sparkle.y < 0 || sparkle.y > GAME_CONFIG.CANVAS_HEIGHT) {
                state.sparkles.splice(i, 1);
            }
        }

        // Update hearts
        for (let i = state.hearts.length - 1; i >= 0; i--) {
            const heart = state.hearts[i];
            heart.x += heart.vx;
            heart.y += heart.vy;
            heart.rotation += 0.02;
            heart.life--;
            
            if (heart.life <= 0 || heart.y < -50) {
                state.hearts.splice(i, 1);
            }
        }

        // Continuously generate new effects during celebration
        if (state.timer % 30 === 0) { // Every 0.5 seconds
            // Add more sparkles continuously
            for (let i = 0; i < 15; i++) { // Increased from 10 to 15
                state.sparkles.push({
                    x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
                    y: Math.random() * GAME_CONFIG.CANVAS_HEIGHT,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 120,
                    maxLife: 120,
                    size: Math.random() * 4 + 2 // Slightly larger sparkles
                });
            }
        }

        if (state.timer % 30 === 0) { // Every 0.5 seconds instead of every second
            // Add more hearts continuously
            for (let i = 0; i < 6; i++) { // Doubled from 3 to 6
                state.hearts.push({
                    x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
                    y: GAME_CONFIG.CANVAS_HEIGHT + 20,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 3 - 1,
                    life: 180,
                    maxLife: 180,
                    size: Math.random() * 25 + 18, // Slightly larger hearts
                    rotation: Math.random() * Math.PI * 2
                });
            }
        }
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
            case 'ending':
                this.drawEndingScreen(renderer);
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
        renderer.ctx.fillText('©OMEGA 1986', centerX, centerY - 10);
        
        // 点滅する操作案内
        const blinkAlpha = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;
        renderer.ctx.font = '24px "Courier New", monospace';
        renderer.ctx.fillStyle = `rgba(255, 255, 255, ${blinkAlpha})`;
        renderer.ctx.fillText('PUSH SPACE KEY', centerX, centerY + 60);

        // バージョン情報（右下）
        renderer.ctx.font = '12px "Courier New", monospace';
        renderer.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        renderer.ctx.textAlign = 'right';
        renderer.ctx.fillText('v0.2.0', GAME_CONFIG.CANVAS_WIDTH - 10, GAME_CONFIG.CANVAS_HEIGHT - 10);
        renderer.ctx.textAlign = 'center';
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
     * エンディング画面描画
     * @param {Object} renderer - レンダラー
     */
    drawEndingScreen(renderer) {
        const state = this.screenStates.ending;
        
        // Beautiful gradient background (sunset/romance theme)
        const gradient = renderer.ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#FF6B6B'); // Warm pink sky
        gradient.addColorStop(0.5, '#FFE66D'); // Golden horizon
        gradient.addColorStop(1, '#4ECDC4'); // Soft teal ground
        
        renderer.ctx.fillStyle = gradient;
        renderer.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

        // Add some clouds for atmosphere
        this.drawClouds(renderer);

        // Draw celebration effects first (background layer)
        this.drawCelebrationEffects(renderer, state);

        // Draw Popolon sprite (PNG version) - 1.5x size
        if (renderer.drawSprite) {
            renderer.drawSprite('popolon_png', state.popolonX, state.popolonY, 0.375); // 256px -> 96px (1.5x)
        } else {
            // Fallback rectangle
            renderer.ctx.fillStyle = '#4169E1';
            renderer.ctx.fillRect(state.popolonX, state.popolonY, 96, 96);
        }

        // Draw Broccoli Princess sprite (PNG version) - 1.5x size
        if (renderer.drawSprite) {
            renderer.drawSprite('broccoli_princess_png', state.aphroditeX, state.aphroditeY, 0.375); // 256px -> 96px (1.5x)
        } else {
            // Fallback rectangle
            renderer.ctx.fillStyle = '#90EE90';
            renderer.ctx.fillRect(state.aphroditeX, state.aphroditeY, 96, 96);
        }

        // Draw dialogue box if in dialogue phase
        if (state.phase === 'dialogue' && state.dialogueIndex < state.dialogues.length) {
            this.drawDialogueBox(renderer, state);
        }

        // Draw completion message in celebration phase
        if (state.phase === 'celebration') {
            this.drawCelebrationMessage(renderer, state);
        }

        // Draw controls hint
        this.drawEndingControls(renderer, state);
    }

    /**
     * Draw clouds for atmosphere
     */
    drawClouds(renderer) {
        const cloudPositions = [
            { x: 100, y: 80, size: 60 },
            { x: 300, y: 120, size: 80 },
            { x: 500, y: 60, size: 70 },
            { x: 650, y: 100, size: 50 }
        ];

        renderer.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (const cloud of cloudPositions) {
            // Simple cloud shape using circles
            renderer.ctx.beginPath();
            renderer.ctx.arc(cloud.x, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
            renderer.ctx.arc(cloud.x + cloud.size * 0.4, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            renderer.ctx.arc(cloud.x + cloud.size * 0.8, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
            renderer.ctx.arc(cloud.x - cloud.size * 0.2, cloud.y, cloud.size * 0.7, 0, Math.PI * 2);
            renderer.ctx.fill();
        }
    }

    /**
     * Draw celebration effects (sparkles and hearts)
     */
    drawCelebrationEffects(renderer, state) {
        // Draw sparkles
        for (const sparkle of state.sparkles) {
            const alpha = sparkle.life / sparkle.maxLife;
            renderer.ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
            renderer.ctx.fillRect(sparkle.x - sparkle.size/2, sparkle.y - sparkle.size/2, sparkle.size, sparkle.size);
            
            // Add a glow effect
            renderer.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
            renderer.ctx.fillRect(sparkle.x - sparkle.size/4, sparkle.y - sparkle.size/4, sparkle.size/2, sparkle.size/2);
        }

        // Draw hearts with enhanced effects
        for (const heart of state.hearts) {
            const alpha = heart.life / heart.maxLife;
            const pulseFactor = Math.sin(Date.now() * 0.01 + heart.x * 0.01) * 0.2 + 1; // Pulsing effect
            
            renderer.ctx.save();
            renderer.ctx.translate(heart.x, heart.y);
            renderer.ctx.rotate(heart.rotation);
            renderer.ctx.scale(pulseFactor, pulseFactor);
            
            // Draw glow effect
            renderer.ctx.shadowColor = '#FF69B4';
            renderer.ctx.shadowBlur = 15;
            renderer.ctx.fillStyle = `rgba(255, 105, 180, ${alpha})`;
            
            // Draw heart shape
            const size = heart.size;
            renderer.ctx.beginPath();
            renderer.ctx.moveTo(0, size * 0.3);
            renderer.ctx.bezierCurveTo(-size * 0.5, -size * 0.2, -size * 0.5, size * 0.2, 0, size * 0.8);
            renderer.ctx.bezierCurveTo(size * 0.5, size * 0.2, size * 0.5, -size * 0.2, 0, size * 0.3);
            renderer.ctx.fill();
            
            // Add inner white highlight
            renderer.ctx.shadowBlur = 0;
            renderer.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
            renderer.ctx.scale(0.6, 0.6);
            renderer.ctx.beginPath();
            renderer.ctx.moveTo(0, size * 0.3);
            renderer.ctx.bezierCurveTo(-size * 0.5, -size * 0.2, -size * 0.5, size * 0.2, 0, size * 0.8);
            renderer.ctx.bezierCurveTo(size * 0.5, size * 0.2, size * 0.5, -size * 0.2, 0, size * 0.3);
            renderer.ctx.fill();
            
            renderer.ctx.restore();
        }
    }

    /**
     * Draw dialogue box
     */
    drawDialogueBox(renderer, state) {
        const currentDialogue = state.dialogues[state.dialogueIndex];
        const boxHeight = 120;
        const boxY = GAME_CONFIG.CANVAS_HEIGHT - boxHeight - 20;
        const margin = 40;

        // Dialogue box background
        renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        renderer.ctx.fillRect(margin, boxY, GAME_CONFIG.CANVAS_WIDTH - margin * 2, boxHeight);
        
        // Border
        renderer.ctx.strokeStyle = '#FFD700';
        renderer.ctx.lineWidth = 3;
        renderer.ctx.strokeRect(margin, boxY, GAME_CONFIG.CANVAS_WIDTH - margin * 2, boxHeight);

        // Speaker name
        renderer.ctx.font = 'bold 20px "Courier New", monospace';
        renderer.ctx.fillStyle = '#FFD700';
        renderer.ctx.textAlign = 'left';
        renderer.ctx.fillText(currentDialogue.speaker + ':', margin + 20, boxY + 30);

        // Dialogue text with typewriter effect
        const displayText = currentDialogue.text.substring(0, Math.floor(state.characterIndex));
        renderer.ctx.font = '18px "Courier New", monospace';
        renderer.ctx.fillStyle = '#FFFFFF';
        
        // Word wrap
        const words = displayText.split(' ');
        const maxWidth = GAME_CONFIG.CANVAS_WIDTH - margin * 2 - 40;
        let line = '';
        let y = boxY + 60;
        
        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = renderer.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && line !== '') {
                renderer.ctx.fillText(line, margin + 20, y);
                line = word + ' ';
                y += 25;
            } else {
                line = testLine;
            }
        }
        renderer.ctx.fillText(line, margin + 20, y);

        renderer.ctx.textAlign = 'start';
    }

    /**
     * Draw celebration message
     */
    drawCelebrationMessage(renderer, state) {
        const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
        const centerY = 80;

        // "THE END" with rainbow effect
        const time = Date.now() * 0.001;
        renderer.ctx.font = 'bold 48px "Courier New", monospace';
        renderer.ctx.textAlign = 'center';
        
        const text = "THE END";
        for (let i = 0; i < text.length; i++) {
            const hue = (time * 100 + i * 60) % 360;
            renderer.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            const charWidth = renderer.ctx.measureText(text[i]).width;
            const x = centerX - (text.length * charWidth) / 2 + i * charWidth;
            renderer.ctx.fillText(text[i], x, centerY);
        }

        // "THANK YOU POPOLON!" message with heart symbols
        renderer.ctx.font = 'bold 32px "Courier New", monospace';
        renderer.ctx.fillStyle = '#FF69B4'; // Pink color
        const pulseFactor = Math.sin(time * 4) * 0.1 + 1; // Pulsing effect
        renderer.ctx.save();
        renderer.ctx.scale(pulseFactor, pulseFactor);
        renderer.ctx.fillText('♥ THANK YOU POPOLON! ♥', centerX / pulseFactor, (centerY + 70) / pulseFactor);
        renderer.ctx.restore();
        
        // Subtitle
        renderer.ctx.font = 'bold 24px "Courier New", monospace';
        renderer.ctx.fillStyle = '#FFD700';
        renderer.ctx.fillText('おめでとうございます！', centerX, centerY + 120); // Japanese congratulations
        
        renderer.ctx.font = '18px "Courier New", monospace';
        renderer.ctx.fillStyle = '#FFFFFF';
        renderer.ctx.fillText('姫君アフロディーテを救い出しました！', centerX, centerY + 150); // Japanese text

        renderer.ctx.textAlign = 'start';
    }

    /**
     * Draw ending controls
     */
    drawEndingControls(renderer, state) {
        const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
        const y = GAME_CONFIG.CANVAS_HEIGHT - 30;

        renderer.ctx.font = '16px "Courier New", monospace';
        renderer.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        renderer.ctx.textAlign = 'center';

        if (state.completed || state.phase === 'celebration') {
            const blinkAlpha = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
            renderer.ctx.fillStyle = `rgba(255, 255, 0, ${blinkAlpha})`;
            renderer.ctx.fillText('Press SPACE to return to title', centerX, y);
        } else {
            renderer.ctx.fillText('Press SPACE to skip • ESC for title', centerX, y);
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