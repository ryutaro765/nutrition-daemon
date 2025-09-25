// 設定・データ
import { GAME_CONFIG } from './config/gameConfig.js';
import { drawSprite } from './config/spriteData.js';

// コアシステム
import { GameState } from './core/GameState.js';
import { InputManager } from './core/InputManager.js';
import { Renderer } from './core/Renderer.js';

// エンティティクラス
import { Player } from './entities/Player.js';
import { BulletFactory } from './entities/Bullet.js';
import { EnemyFactory } from './entities/Enemy.js';
import { BossFactory } from './entities/Boss.js';
import { PowerUpFactory } from './entities/PowerUp.js';

// システムクラス
import { CollisionSystem } from './systems/CollisionSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { BackgroundSystem } from './systems/BackgroundSystem.js';
import { WeaponSystem } from './systems/WeaponSystem.js';

// オーディオシステム
import { AudioManager } from './audio/AudioManager.js';
import { BGMPlayer } from './audio/BGMPlayer.js';
import { SoundEffects } from './audio/SoundEffects.js';

// UIシステム
import { UIManager } from './ui/UIManager.js';
import { GameScreens } from './ui/GameScreens.js';
import { StageNameDisplay } from './ui/StageNameDisplay.js';
import { BossIntroDisplay } from './ui/BossIntroDisplay.js';

/**
 * メインゲームクラス
 * すべてのシステムを統合してゲームを実行
 */
class Game {
    constructor() {
        // Canvas設定
        this.canvas = null;
        this.ctx = null;
        
        // ゲーム状態
        this.isRunning = false;
        this.gameLoop = null;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.frameCount = 0;
        
        // パフォーマンス監視
        this.fpsHistory = [];
        this.averageFPS = 60;
        this.performanceWarning = false;
        this.skipFrameCounter = 0;
        this.adaptiveSkipping = false;
        
        // コアシステム
        this.gameState = new GameState();
        this.inputManager = new InputManager();
        this.renderer = null;
        
        // ゲームオブジェクト
        this.player = null;
        this.enemies = [];
        this.boss = null;
        this.bullets = [];
        this.enemyBullets = [];
        this.powerUps = [];
        
        // システム
        this.particleSystem = new ParticleSystem();
        this.backgroundSystem = new BackgroundSystem();
        this.weaponSystem = new WeaponSystem();
        
        // オーディオ
        this.audioManager = new AudioManager();
        this.bgmPlayer = null;
        this.soundEffects = null;
        
        // UI
        this.uiManager = new UIManager();
        this.gameScreens = new GameScreens();
        this.stageNameDisplay = new StageNameDisplay();
        this.bossIntroDisplay = new BossIntroDisplay();
        
        // ゲーム制御
        this.currentScreen = 'title';
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * ゲーム初期化
     */
    async init() {
        try {
            // Canvas初期化
            this.initCanvas();
            
            // レンダラー初期化
            this.renderer = new Renderer(this.canvas);
            
            // オーディオ初期化
            await this.initAudio();
            
            // プレイヤー初期化
            this.initPlayer();
            
            // イベントリスナー設定
            this.setupEventListeners();
            
            // 初期化完了
            this.isInitialized = true;
            
            console.log('Game initialized successfully');
            
            // ゲームループ開始
            this.start();
            
        } catch (error) {
            console.error('Game initialization failed:', error);
            console.error('Error details:', error.stack);
            console.error('Error name:', error.name);
            console.error('Error constructor:', error.constructor.name);
            
            // 特定のエラータイプをチェック
            if (error.name === 'ReferenceError') {
                this.showError(`Module loading error: ${error.message}. Please check that all files are properly loaded.`);
            } else if (error.name === 'TypeError') {
                this.showError(`Type error: ${error.message}. Please check browser compatibility.`);
            } else {
                this.showError(`Failed to initialize game: ${error.message}. Please check console for details.`);
            }
        }
    }

    /**
     * Canvas初期化
     */
    initCanvas() {
        try {
            console.log('=== Canvas Initialization Debug ===');
            console.log('Document ready state:', document.readyState);
            
            // より確実な要素取得
            let canvas = document.getElementById('gameCanvas');
            console.log('Initial canvas search result:', canvas);
            
            // 要素が見つからない場合、少し待って再試行
            if (!canvas) {
                console.log('Canvas not found, searching all canvas elements...');
                const allCanvas = document.querySelectorAll('canvas');
                console.log('All canvas elements found:', allCanvas);
                
                if (allCanvas.length > 0) {
                    canvas = allCanvas[0]; // 最初のcanvas要素を使用
                    console.log('Using first canvas element found');
                }
            }
            
            // 詳細なcanvas検証
            if (canvas) {
                console.log('Canvas validation:');
                console.log('- Element:', canvas);
                console.log('- Type:', typeof canvas);
                console.log('- Constructor:', canvas.constructor?.name);
                console.log('- TagName:', canvas.tagName);
                console.log('- NodeType:', canvas.nodeType);
                console.log('- Is HTMLCanvasElement:', canvas instanceof HTMLCanvasElement);
                console.log('- Has getContext:', typeof canvas.getContext);
                console.log('- Parent element:', canvas.parentElement);
                
                // プロトタイプチェーン確認
                let proto = canvas;
                const chain = [];
                while (proto) {
                    chain.push(proto.constructor?.name || 'Unknown');
                    proto = Object.getPrototypeOf(proto);
                    if (chain.length > 10) break; // 無限ループ防止
                }
                console.log('Prototype chain:', chain);
            }
            
            if (!canvas || canvas.tagName !== 'CANVAS') {
                console.warn('Valid canvas not found, creating new one...');
                canvas = document.createElement('canvas');
                canvas.id = 'gameCanvas';
                canvas.width = GAME_CONFIG.CANVAS_WIDTH;
                canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
                
                // 適切な場所に追加
                const container = document.querySelector('.game-container');
                if (container) {
                    // 既存のcanvasがあれば削除
                    const existingCanvas = container.querySelector('#gameCanvas');
                    if (existingCanvas) {
                        container.removeChild(existingCanvas);
                    }
                    container.appendChild(canvas);
                    console.log('Canvas added to game-container');
                } else {
                    document.body.appendChild(canvas);
                    console.log('Canvas added to body');
                }
            } else {
                // 既存のcanvasを使用
                canvas.width = GAME_CONFIG.CANVAS_WIDTH;
                canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
                console.log('Using existing canvas');
            }
            
            this.canvas = canvas;
            
            // getContextの最終確認
            console.log('Final getContext check:', typeof this.canvas.getContext);
            
            if (typeof this.canvas.getContext !== 'function') {
                console.error('CRITICAL: Canvas getContext method is not available');
                console.error('Canvas object keys:', Object.getOwnPropertyNames(this.canvas));
                console.error('Canvas prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.canvas)));
                throw new Error('Canvas element does not have getContext method');
            }
            
            // 2Dコンテキスト取得
            console.log('Getting 2D context...');
            this.ctx = this.canvas.getContext('2d');
            console.log('2D context result:', this.ctx);
            
            if (!this.ctx) {
                throw new Error('Failed to get 2D rendering context');
            }
            
            // コンテキスト設定
            this.ctx.imageSmoothingEnabled = false;
            
            // Canvas スタイル設定
            this.canvas.style.backgroundColor = '#000000';
            this.canvas.style.display = 'block';
            this.canvas.style.margin = '0 auto';
            this.canvas.style.imageRendering = 'pixelated';
            this.canvas.style.position = 'relative';
            this.canvas.style.zIndex = '0';
            
            console.log('✅ Canvas initialized successfully');
            console.log('Final canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
            
        } catch (error) {
            console.error('❌ Canvas initialization failed:', error);
            console.error('Error stack:', error.stack);
            throw error;
        }
    }

    /**
     * オーディオ初期化（完全無効化版）
     */
    async initAudio() {
        console.log('🚫 Game: Audio system completely disabled to prevent freeze');
        this.audioEnabled = false;
        this.bgmPlayer = null;
        this.soundEffects = null;
        
        // AudioManagerも音響機能を無効化
        this.audioManager.isDisabled = true;
        
        console.log('✅ Game: Audio system disabled successfully');
    }

    /**
     * プレイヤー初期化
     */
    initPlayer() {
        try {
            this.player = new Player(
                GAME_CONFIG.CANVAS_WIDTH / 2 - 24,
                GAME_CONFIG.CANVAS_HEIGHT - 100
            );
            console.log('✅ Player initialized at:', this.player.x, this.player.y);
            console.log('✅ Player object:', this.player);
        } catch (error) {
            console.error('❌ Player initialization failed:', error);
            console.error('Error stack:', error.stack);
            throw error;
        }
    }

    /**
     * イベントリスナー設定
     */
    setupEventListeners() {
        try {
            // ウィンドウフォーカス
            window.addEventListener('focus', () => {
                if (this.isRunning) {
                    this.lastTime = performance.now();
                }
            });
            
            // ウィンドウリサイズ
            window.addEventListener('resize', () => {
                this.handleResize();
            });
            
            // ページ離脱時の処理
            window.addEventListener('beforeunload', () => {
                this.cleanup();
            });
            
            // オーディオコンテキスト開始（ユーザーインタラクション後）
            document.addEventListener('click', () => {
                console.log('🖱️ Game: User clicked, initializing audio...');
                this.audioManager.initializeAfterUserInteraction().then(success => {
                    console.log('Game: Audio initialization result:', success);
                    if (success) {
                        console.log('✅ Game: Audio ready for use');
                    }
                }).catch(error => {
                    console.error('❌ Game: Audio initialization failed:', error);
                });
            }, { once: true });
            
            console.log('Event listeners initialized successfully');
        } catch (error) {
            console.error('Event listener setup failed:', error);
            throw error;
        }
    }

    /**
     * ゲームループ開始
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop = requestAnimationFrame(this.loop.bind(this));
        
        console.log('Game loop started');
    }

    /**
     * ゲームループ停止
     */
    stop() {
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
    }

    /**
     * メインゲームループ（安全版）
     */
    loop(currentTime) {
        if (!this.isRunning) return;
        
        // フレーム時間計算
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.frameCount++;
        
        // 異常なデルタタイムのチェック（フリーズ検出）
        if (this.deltaTime > 1000) { // 1秒以上かかった場合
            console.error(`🚨 Long frame detected: ${this.deltaTime}ms`);
            this.deltaTime = 16; // 正常な値にリセット
            this.activateEmergencyMode(); // 緊急モード発動
        }
        
        // FPS計算とパフォーマンス監視
        this.updatePerformanceMetrics();
        
        // アダプティブスキップ処理
        if (this.shouldSkipFrame()) {
            this.gameLoop = requestAnimationFrame(this.loop.bind(this));
            return;
        }
        
        try {
            // 入力更新
            this.inputManager.update();
            
            // 画面別処理
            this.updateCurrentScreen();
            
            // 描画
            this.render();
            
        } catch (error) {
            console.error('Game loop error at frame', this.frameCount, ':', error);
            console.error('Loop stage - DeltaTime:', this.deltaTime, 'CurrentScreen:', this.currentScreen);
            
            // エラーカウンターを増加
            if (!this.errorCount) this.errorCount = 0;
            this.errorCount++;
            
            // 連続エラーでゲーム停止
            if (this.errorCount > 10) {
                console.error('🚨 Too many errors, stopping game to prevent freeze');
                this.isRunning = false;
                this.showError('Game stopped due to repeated errors. Please reload the page.');
                return;
            }
            
            // 軽微なエラーの場合は継続
            console.warn(`⚠️ Continuing after error ${this.errorCount}/10`);
            this.activateEmergencyMode(); // 緊急モード発動
        }
        
        // 次のフレーム
        this.gameLoop = requestAnimationFrame(this.loop.bind(this));
    }
    
    /**
     * パフォーマンスメトリクス更新
     */
    updatePerformanceMetrics() {
        // FPS計算
        const fps = this.deltaTime > 0 ? 1000 / this.deltaTime : 60;
        this.fpsHistory.push(fps);
        
        // 履歴を100フレームに制限
        if (this.fpsHistory.length > 100) {
            this.fpsHistory.shift();
        }
        
        // 平均FPS計算
        if (this.frameCount % 60 === 0) { // 1秒おきに更新
            this.averageFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
            
            // パフォーマンス警告チェック - より積極的な制御
            if (this.averageFPS < 30) {
                // 緊急パフォーマンス制御
                if (!this.emergencyMode) {
                    this.emergencyMode = true;
                    console.error(`🚨 EMERGENCY: FPS critically low ${this.averageFPS.toFixed(1)}, activating emergency mode`);
                    this.activateEmergencyMode();
                }
            } else if (this.averageFPS < 45) {
                if (!this.performanceWarning) {
                    this.performanceWarning = true;
                    this.adaptiveSkipping = true;
                    console.warn(`⚠️ Performance warning: FPS dropped to ${this.averageFPS.toFixed(1)}, enabling adaptive skipping`);
                    
                    // パーティクルシステムにクールダウン設定
                    if (this.particleSystem && this.particleSystem.setCreationCooldown) {
                        this.particleSystem.setCreationCooldown(30);
                    }
                }
            } else if (this.averageFPS > 55 && this.performanceWarning) {
                this.performanceWarning = false;
                this.adaptiveSkipping = false;
                this.emergencyMode = false;
                console.log(`✅ Performance recovered: FPS is ${this.averageFPS.toFixed(1)}, disabling adaptive skipping`);
            }
        }
        
        // パフォーマンスログ（緊急時つの10秒おき）
        if (this.frameCount % 600 === 0 && this.performanceWarning) {
            const entities = this.getEntityCounts();
            console.log(`🔍 Performance status: FPS=${this.averageFPS.toFixed(1)}, Entities=${entities.total}, Particles=${entities.particles}`);
        }
    }
    
    /**
     * フレームスキップ判定
     * @returns {boolean} スキップすべきか
     */
    shouldSkipFrame() {
        if (!this.adaptiveSkipping) return false;
        
        // 重い処理が発生している場合のみスキップ
        const entities = this.getEntityCounts();
        
        // 緊急モードではより積極的にスキップ
        if (this.emergencySkipping) {
            const isEmergencyLoad = entities.total > 100 || entities.particles > 50;
            if (isEmergencyLoad) {
                this.skipFrameCounter++;
                if (this.skipFrameCounter >= 1) { // 毎フレームスキップ
                    this.skipFrameCounter = 0;
                    return true;
                }
            }
        } else {
            const isHeavyLoad = entities.total > 400 || entities.particles > 300;
            if (isHeavyLoad) {
                this.skipFrameCounter++;
                if (this.skipFrameCounter >= 2) { // 2フレームに1回スキップ
                    this.skipFrameCounter = 0;
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * 緊急パフォーマンスモード有効化
     */
    activateEmergencyMode() {
        try {
            console.log('🚨 Activating emergency performance mode...');
            
            // 弾丸数を大幅制限
            const maxBullets = 50; // 通常200から50に
            if (this.bullets.length > maxBullets) {
                this.bullets.splice(0, this.bullets.length - maxBullets);
                console.log(`Emergency: Reduced bullets to ${maxBullets}`);
            }
            
            // 敵数を制限
            const maxEnemies = 15; // 通常50から15に
            if (this.enemies.length > maxEnemies) {
                this.enemies.splice(0, this.enemies.length - maxEnemies);
                console.log(`Emergency: Reduced enemies to ${maxEnemies}`);
            }
            
            // パーティクルを大幅削減
            if (this.particleSystem) {
                if (this.particleSystem.clear) {
                    this.particleSystem.clear();
                }
                if (this.particleSystem.setCreationCooldown) {
                    this.particleSystem.setCreationCooldown(60); // 2倍のクールダウン
                }
                console.log('Emergency: Particle system limited');
            }
            
            // BGMを一時停止（CPUリソース節約）
            if (this.audioManager && this.audioManager.pauseBGM) {
                this.audioManager.pauseBGM();
                console.log('Emergency: BGM paused to save CPU');
            }
            
            // フレームスキップ強化
            this.adaptiveSkipping = true;
            this.emergencySkipping = true;
            
            console.log('✅ Emergency mode activated');
        } catch (error) {
            console.error('Failed to activate emergency mode:', error);
        }
    }

    /**
     * エンティティ数取得
     * @returns {Object} エンティティ数情報
     */
    getEntityCounts() {
        const particles = this.particleSystem.getParticleCount();
        const enemies = this.enemies.length;
        const bullets = this.bullets.length + this.enemyBullets.length;
        const powerUps = this.powerUps.length;
        
        return {
            particles,
            enemies,
            bullets,
            powerUps,
            total: particles + enemies + bullets + powerUps
        };
    }

    /**
     * 現在の画面更新
     */
    updateCurrentScreen() {
        const input = this.inputManager;
        
        if (this.currentScreen === 'game') {
            this.updateGame();
        } else {
            const result = this.gameScreens.update(input);
            if (result) {
                this.handleScreenTransition(result);
            }
        }
    }

    /**
     * 画面遷移処理
     * @param {string} result - 遷移先
     */
    handleScreenTransition(result) {
        // Handle boss mode selection
        if (result && typeof result === 'object' && result.action === 'start_boss_battle') {
            this.startBossBattle(result.bossIndex);
            return;
        }
        
        switch (result) {
            case 'start_game':
                this.startNewGame();
                break;
            case 'settings':
                this.gameScreens.transitionTo('settings');
                break;
            case 'credits':
                this.gameScreens.transitionTo('credits');
                break;
            case 'bossMode':
                this.gameScreens.transitionTo('bossMode');
                break;
            case 'menu':
                this.gameScreens.transitionTo('menu');
                break;
            case 'title':
                this.gameScreens.transitionTo('title');
                break;
            case 'exit':
                this.exitGame();
                break;
        }
    }

    /**
     * ボス戦開始
     * @param {number} bossIndex - ボスインデックス (0-2)
     */
    startBossBattle(bossIndex) {
        console.log(`🏰 Starting boss battle with boss ${bossIndex}`);
        
        const oldScreen = this.currentScreen;
        this.currentScreen = 'game';
        console.log(`   - Screen: ${oldScreen} -> ${this.currentScreen}`);
        
        // ゲーム状態リセット
        this.gameState.initializeState();
        
        // プレイヤー初期化
        this.initializePlayer();
        
        // 武器システム初期化
        this.weaponSystem.initializeState();
        
        // 画面クリア
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.explosions = [];
        this.particles = [];
        
        // ボス戦モードとして設定
        this.gameState.isBossMode = true;
        this.gameState.isBossBattle = true;
        this.gameState.currentBoss = bossIndex + 1; // 1-3
        
        // 適切なステージ設定
        this.gameState.currentStage = bossIndex;
        this.backgroundSystem.setStage(bossIndex);
        
        // ボス生成
        this.boss = BossFactory.createBoss(bossIndex);
        
        console.log(`🎯 Boss battle initialized: Boss ${bossIndex}, Stage ${bossIndex}`);
    }

    /**
     * 新しいゲーム開始
     */
    startNewGame() {
        console.log('🎮 startNewGame() called - Restarting game completely');
        
        const oldScreen = this.currentScreen;
        this.currentScreen = 'game';
        console.log(`   - Screen: ${oldScreen} -> ${this.currentScreen}`);
        
        // ゲーム状態リセット
        this.gameState.initializeState();
        this.gameState.startGame(); // startGame()メソッドを使用して完全に初期化
        
        // 初期ステージ名を表示
        this.stageNameDisplay.showStageName(this.gameState.currentStage);
        
        // Continue状態を強制的にクリア（追加の安全策）
        this.gameState.showingContinue = false;
        this.gameState.continueTimer = 0;
        this.gameState.gameOver = false;
        
        console.log(`   - GameState reset and started: gameStarted=${this.gameState.gameStarted}, gameOver=${this.gameState.gameOver}, showingContinue=${this.gameState.showingContinue}`);
        
        this.weaponSystem.reset();
        this.particleSystem.clear();
        this.uiManager.reset();
        
        // プレイヤーリセット
        this.initPlayer();
        console.log(`   - Player reset at position: (${this.player.x}, ${this.player.y})`);
        
        // 配列クリア
        const oldCounts = {
            enemies: this.enemies.length,
            bullets: this.bullets.length,
            enemyBullets: this.enemyBullets.length,
            powerUps: this.powerUps.length
        };
        
        this.enemies = [];
        this.boss = null;
        this.bullets = [];
        this.enemyBullets = [];
        this.powerUps = [];
        
        console.log(`   - Entities cleared: enemies ${oldCounts.enemies}->0, bullets ${oldCounts.bullets}->0, enemyBullets ${oldCounts.enemyBullets}->0, powerUps ${oldCounts.powerUps}->0`);
        
        // オーディオ初期化（緊急修正版）
        console.log('🎵 Game: Starting BGM for new game...');
        this.audioManager.initializeAfterUserInteraction().then((success) => {
            if (success) {
                console.log('✅ Game: AudioManager initialized for game');
                console.log('🎵 Game: Attempting to play stage1 BGM...');
                // BGM再生（フリーズ防止のため無効化）
                // this.audioManager.playBGM('stage1');
                console.log('🎵 Game: BGM play command sent');
            } else {
                console.warn('⚠️ Game: AudioManager initialization failed, no BGM');
            }
        }).catch(err => {
            console.error('❌ Game: AudioManager initialization failed:', err);
        });
        
        console.log('✅ New game started successfully');
    }

    /**
     * ゲーム更新
     */
    updateGame() {
        const input = this.inputManager;
        
        // ポーズ処理（入力遅延も追加）
        if (!this.pauseInputDelay) this.pauseInputDelay = 0;
        if (this.pauseInputDelay > 0) this.pauseInputDelay--;
        
        if (this.pauseInputDelay === 0 && input.isPressed('pause')) {
            this.gameState.togglePause();
            this.pauseInputDelay = 30; // 0.5秒の遅延
            console.log('⏸️ Game paused/unpaused');
        }
        
        if (this.gameState.isPaused) {
            return;
        }
        
        // ゲームオーバー処理（Continue画面も含む）
        if (this.gameState.gameOver || this.gameState.showingContinue || this.gameState.hp <= 0) {
            this.handleGameOver(input);
            return;
        }
        
        // 通常ゲーム更新
        this.updateGameplay(input);
    }

    /**
     * ゲームプレイ更新（軽量版）
     * @param {Object} input - 入力管理
     */
    updateGameplay(input) {
        // システム更新（軽量化）
        this.gameState.update();
        this.weaponSystem.update(input, this.gameState);
        this.backgroundSystem.update(this.gameState);
        
        // パーティクル更新を大幅制限
        if (this.frameCount % 3 === 0) { // 3フレームに1回のみ
            this.particleSystem.update();
        }
        
        // プレイヤー更新
        if (this.player) {
            const terrain = this.backgroundSystem.getTerrain();
            this.player.update(input, this.gameState, terrain.rivers, terrain.bridges);
            
            // 射撃処理
            const newBullets = this.weaponSystem.shoot(this.player, input, this.gameState);
            if (newBullets.length > 0) {
                // 武器発射SE（フリーズ防止のため完全無効化）
                // this.audioManager.playSFX('shoot');
                // console.log('🚀 Bullets created:', newBullets.length, 'Total bullets:', this.bullets.length + newBullets.length);
            }
            // 弾丸数上限チェック後に追加
            this.addBulletsWithLimit(newBullets);
            
            // マズルフラッシュ効果
            const weaponState = this.weaponSystem.getWeaponState();
            if (weaponState.muzzleFlash) {
                this.particleSystem.createSparks(
                    this.player.x + this.player.width / 2,
                    this.player.y,
                    '#FFFF00',
                    3
                );
            }
        }
        
        // 敵生成・更新
        this.updateEnemies();
        
        // ボス出現チェック・更新
        this.checkAndSpawnBoss();
        this.updateBoss();
        
        // 弾丸更新
        this.updateBullets();
        
        // 弾丸数制限チェック
        this.enforceBulletLimits();
        
        // パワーアップ更新
        this.updatePowerUps();
        
        // 衝突判定
        this.handleCollisions();
        
        // BGM更新
        this.updateAudio();
        
        // UI更新
        this.uiManager.update(this.gameState, this.weaponSystem.getWeaponState());
        this.stageNameDisplay.update();
        this.bossIntroDisplay.update();
    }

    /**
     * 敵更新（安全版）
     */
    updateEnemies() {
        // 緊急安全制御：敵数制限を厳格化
        const MAX_ENEMIES = 20; // 50から20に大幅削減
        
        if (this.enemies.length > MAX_ENEMIES) {
            // 敵数が上限を超えたら古い敵から削除
            const removeCount = this.enemies.length - MAX_ENEMIES;
            this.enemies.splice(0, removeCount);
            console.warn(`⚠️ Emergency enemy reduction: removed ${removeCount} enemies`);
        }
        
        // 新しい敵生成（上限チェック付き）
        const newEnemies = EnemyFactory.spawnEnemies(this.gameState);
        if (newEnemies.length > 0) {
            // 敵数上限近い場合は生成数を制限
            const availableSlots = Math.max(0, MAX_ENEMIES - this.enemies.length);
            
            if (availableSlots < newEnemies.length) {
                // 上限を超える分は生成しない
                const limitedEnemies = newEnemies.slice(0, availableSlots);
                this.enemies.push(...limitedEnemies);
                
                if (this.frameCount % 180 === 0) { // 3秒に1回ログ
                    console.log(`👾 Enemy spawn limited: ${limitedEnemies.length}/${newEnemies.length} spawned, total enemies: ${this.enemies.length}`);
                }
            } else {
                this.enemies.push(...newEnemies);
                // console.log('✅ Enemies spawned:', newEnemies.length);
            }
        }
        
        // 敵更新
        for (const enemy of this.enemies) {
            enemy.update(this.player, this.enemyBullets);
        }
        
        // 削除処理
        this.enemies = this.enemies.filter(enemy => !enemy.shouldRemove);
        
        // 敵数上限制御
        this.enforceEnemyLimit();
    }

    /**
     * ボス出現チェック
     */
    checkAndSpawnBoss() {
        // ボスが既にアクティブな場合は何もしない
        if (this.gameState.isBossBattle || this.boss) {
            return;
        }
        
        // デバッグ：ボス出現情報を表示（10秒に1回に減量）
        if (this.frameCount % 600 === 0) {
            const distance = this.gameState.totalDistance;
            const bossDistance = GAME_CONFIG.GAMEPLAY.BOSS_SPAWN_DISTANCE;
            const expectedBoss = Math.floor(distance / bossDistance);
            const progress = ((distance % bossDistance) / bossDistance * 100).toFixed(1);
            console.log(`🏰 Boss progress: ${distance.toFixed(1)}/${bossDistance} (${progress}%), Next boss: ${expectedBoss}, Defeated: ${this.gameState.bossesDefeated}`);
        }
        
        // ボス出現判定（より厳密に）
        if (this.gameState.shouldSpawnBoss()) {
            const expectedBoss = Math.floor(this.gameState.totalDistance / GAME_CONFIG.GAMEPLAY.BOSS_SPAWN_DISTANCE);
            
            // 既に撃破したボスは再出現させない
            if (expectedBoss > this.gameState.bossesDefeated) {
                console.log(`🏰 Boss spawn triggered! Distance: ${this.gameState.totalDistance}, Boss: ${expectedBoss}, Defeated: ${this.gameState.bossesDefeated}`);
                
                // ボス戦開始
                this.gameState.startBossBattle(expectedBoss);
                
                // 敵をクリア（ボス戦に集中）
                this.enemies = [];
                
                console.log(`🎯 Boss battle ${expectedBoss} initiated!`);
            }
        }
    }

    /**
     * ボス更新
     */
    updateBoss() {
        if (this.gameState.isBossBattle && !this.boss) {
            // ボス生成
            const bossIndex = Math.min(2, this.gameState.currentBoss - 1); // currentBoss は 1-3 なので -1 して 0-2 にする
            console.log(`🎯 Creating boss with index: ${bossIndex}, currentBoss: ${this.gameState.currentBoss}`);
            this.boss = BossFactory.createBoss(bossIndex);
            
            // ボス登場演出を開始
            this.bossIntroDisplay.showBossIntro(bossIndex);
            
            this.uiManager.setElementVisibility('warning', true);
            // 【緊急無効化】ボス警告音を無効化
            // this.audioManager.playSFX('bossWarning');
        }
        
        if (this.boss) {
            this.boss.update(this.player, this.enemyBullets);
            
            if (this.boss.shouldRemove) {
                // ボス撃破処理
                this.handleBossDefeat();
            }
        }
    }

    /**
     * 弾丸更新（安全版）
     */
    updateBullets() {
        // 緊急安全制御：弾丸数制限を厳格化
        const totalBullets = this.bullets.length + this.enemyBullets.length;
        if (totalBullets > 100) {
            // 弾丸数が100を超えたら強制的に半分に削減
            this.bullets.splice(0, Math.floor(this.bullets.length / 2));
            this.enemyBullets.splice(0, Math.floor(this.enemyBullets.length / 2));
            console.warn(`⚠️ Emergency bullet reduction: ${totalBullets} -> ${this.bullets.length + this.enemyBullets.length}`);
        }
        
        // パフォーマンス制御：弾丸数が多い場合は更新頻度を制限（緩和）
        if (totalBullets > 150 && this.frameCount % 2 !== 0) {
            return; // 2フレームに1回のみ更新（150個から制限開始）
        }
        
        try {
            // プレイヤー弾更新（安全性チェック付き）
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const bullet = this.bullets[i];
                
                if (!bullet) {
                    console.warn('⚠️ Null bullet found at index', i, 'removing...');
                    this.bullets.splice(i, 1);
                    continue;
                }
                
                if (bullet.shouldRemove) {
                    this.bullets.splice(i, 1);
                    continue;
                }
                
                if (typeof bullet.update === 'function') {
                    bullet.update();
                    
                    // レーザー弾のエフェクト（安全な座標チェック付き）
                    if (bullet.type === 'laser' && 
                        typeof bullet.x === 'number' && typeof bullet.y === 'number' &&
                        typeof bullet.vx === 'number' && typeof bullet.vy === 'number') {
                        this.particleSystem.createLaserTrail(
                            bullet.x, bullet.y, bullet.vx, bullet.vy, '#00FFFF'
                        );
                    }
                } else {
                    console.error('❌ Invalid bullet found in player bullets at index', i, ':', bullet);
                    this.bullets.splice(i, 1);
                }
            }
            
            // 敵弾更新（安全性チェック付き）
            for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
                const bullet = this.enemyBullets[i];
                
                if (!bullet) {
                    console.warn('⚠️ Null enemy bullet found at index', i, 'removing...');
                    this.enemyBullets.splice(i, 1);
                    continue;
                }
                
                if (bullet.shouldRemove) {
                    this.enemyBullets.splice(i, 1);
                    continue;
                }
                
                if (typeof bullet.update === 'function') {
                    bullet.update();
                } else {
                    console.error('❌ Invalid enemy bullet at index', i, ':', {
                        bullet: bullet,
                        type: typeof bullet,
                        constructor: bullet?.constructor?.name,
                        keys: bullet ? Object.keys(bullet) : 'null/undefined'
                    });
                    this.enemyBullets.splice(i, 1);
                }
            }
            
            // フレーム毎のパフォーマンス監視ログ（1秒に1回）
            if (this.frameCount % 60 === 0 && totalBullets > 200) {
                console.log(`🎯 Bullet performance: Player=${this.bullets.length}, Enemy=${this.enemyBullets.length}, Total=${totalBullets}`);
            }
            
        } catch (error) {
            console.error('❌ Error in updateBullets:', error);
            console.error('Player bullets count:', this.bullets?.length);
            console.error('Enemy bullets count:', this.enemyBullets?.length);
            
            // エラー時の安全処理：無効な弾丸を全て削除
            this.bullets = this.bullets.filter(bullet => 
                bullet && typeof bullet.update === 'function' && !bullet.shouldRemove
            );
            this.enemyBullets = this.enemyBullets.filter(bullet => 
                bullet && typeof bullet.update === 'function' && !bullet.shouldRemove
            );
        }
    }

    /**
     * 弾丸数制限強制（武器影響範囲のため緩和）
     */
    enforceBulletLimits() {
        const MAX_PLAYER_BULLETS = 250; // 200から250に増加
        const MAX_ENEMY_BULLETS = 400; // 300から400に増加
        
        // プレイヤー弾の上限制御
        if (this.bullets.length > MAX_PLAYER_BULLETS) {
            const removeCount = this.bullets.length - MAX_PLAYER_BULLETS;
            this.bullets.splice(0, removeCount); // 古い弾から削除
            // console.log(`🎯 Player bullets limited: removed ${removeCount}, now ${this.bullets.length}`);
        }
        
        // 敵弾の上限制御
        if (this.enemyBullets.length > MAX_ENEMY_BULLETS) {
            const removeCount = this.enemyBullets.length - MAX_ENEMY_BULLETS;
            this.enemyBullets.splice(0, removeCount); // 古い弾から削除
            // console.log(`🎯 Enemy bullets limited: removed ${removeCount}, now ${this.enemyBullets.length}`);
        }
    }
    
    /**
     * 弾丸追加（上限付き）
     * @param {Array} newBullets - 新しい弾丸配列
     */
    addBulletsWithLimit(newBullets) {
        const MAX_PLAYER_BULLETS = 250; // 影響範囲のため増加
        
        if (newBullets.length === 0) return;
        
        // 現在の弾丸数 + 新しい弾丸数が上限を超える場合
        const projectedTotal = this.bullets.length + newBullets.length;
        if (projectedTotal > MAX_PLAYER_BULLETS) {
            // 古い弾を先に削除してから追加
            const removeCount = projectedTotal - MAX_PLAYER_BULLETS;
            this.bullets.splice(0, removeCount);
        }
        
        this.bullets.push(...newBullets);
    }
    
    /**
     * 敵数上限制御
     */
    enforceEnemyLimit() {
        const MAX_ENEMIES = 50;
        
        if (this.enemies.length > MAX_ENEMIES) {
            // 古い敵から削除（パフォーマンス優先）
            const removeCount = this.enemies.length - MAX_ENEMIES;
            const removedEnemies = this.enemies.splice(0, removeCount);
            
            // 削除される敵のリソースを解放
            removedEnemies.forEach(enemy => {
                if (enemy.dispose && typeof enemy.dispose === 'function') {
                    enemy.dispose();
                }
            });
            
            if (this.frameCount % 300 === 0) { // 5秒に1回ログ
                console.log(`👾 Enemy limit enforced: removed ${removeCount}, remaining ${this.enemies.length}`);
            }
        }
    }
    
    /**
     * パワーアップ更新
     */
    updatePowerUps() {
        for (const powerUp of this.powerUps) {
            powerUp.update();
        }
        
        this.powerUps = this.powerUps.filter(powerUp => !powerUp.shouldRemove);
    }

    /**
     * 衝突判定処理
     */
    handleCollisions() {
        try {
            // エンティティの安全性チェック
            if (!this.player) {
                console.warn('⚠️ handleCollisions: Player is null, skipping collision detection');
                return;
            }
            
            const entities = {
                player: this.player,
                enemies: Array.isArray(this.enemies) ? this.enemies : [],
                boss: this.boss,
                bullets: Array.isArray(this.bullets) ? this.bullets : [],
                enemyBullets: Array.isArray(this.enemyBullets) ? this.enemyBullets : [],
                powerUps: Array.isArray(this.powerUps) ? this.powerUps : [],
                questionBoxes: this.backgroundSystem?.getTerrain()?.questionBoxes || []
            };
            
            const results = CollisionSystem.processAllCollisions(this.gameState, entities);
            
            if (!results) {
                console.error('❌ CollisionSystem.processAllCollisions returned null/undefined');
                return;
            }
            
            // プレイヤーヒット処理
            if (results.playerHit) {
                this.handlePlayerHit();
            }
            
            // 敵撃破処理（安全な配列チェック付き）
            if (Array.isArray(results.hitEnemies)) {
                for (const enemy of results.hitEnemies) {
                    if (enemy && typeof enemy.markForRemoval === 'function') {
                        // 敵ヒットSE
                        if (this.soundEffects) {
                            this.soundEffects.play('hit');
                        }
                        this.handleEnemyDefeat(enemy);
                    } else {
                        console.warn('⚠️ Invalid enemy in hitEnemies:', enemy);
                    }
                }
            }
            
            // ボスヒット処理（安全性チェック付き）
            if (results.hitBoss && results.hitBoss === this.boss) {
                this.handleBossHit();
            }
            
            // パワーアップ取得処理（安全な配列チェック付き）
            if (Array.isArray(results.collectedPowerUps)) {
                for (const powerUp of results.collectedPowerUps) {
                    if (powerUp && typeof powerUp.applyEffect === 'function') {
                        this.handlePowerUpCollection(powerUp);
                    } else {
                        console.warn('⚠️ Invalid powerUp in collectedPowerUps:', powerUp);
                    }
                }
            }
            
            // ？ボックス破壊処理（安全な配列チェック付き）
            if (Array.isArray(results.brokenQuestionBoxes)) {
                for (const questionBox of results.brokenQuestionBoxes) {
                    if (questionBox && typeof questionBox.shouldRemove !== 'undefined') {
                        this.handleQuestionBoxBreak(questionBox);
                    } else {
                        console.warn('⚠️ Invalid questionBox in brokenQuestionBoxes:', questionBox);
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Error in handleCollisions:', error);
            console.error('Entities state:', {
                player: !!this.player,
                enemies: this.enemies?.length,
                boss: !!this.boss,
                bullets: this.bullets?.length,
                enemyBullets: this.enemyBullets?.length,
                powerUps: this.powerUps?.length
            });
            
            // エラー時の緊急回避処理
            // 無効な弾丸を削除
            if (Array.isArray(this.bullets)) {
                this.bullets = this.bullets.filter(bullet => bullet && !bullet.shouldRemove);
            }
            if (Array.isArray(this.enemyBullets)) {
                this.enemyBullets = this.enemyBullets.filter(bullet => bullet && !bullet.shouldRemove);
            }
        }
    }

    /**
     * プレイヤーヒット処理
     */
    handlePlayerHit() {
        this.gameState.takeDamage(3); // 大幅緩和：20→3 (60HP ÷ 3 = 20発まで耐えられる)
        
        // WeaponSystemとの強制同期（武器レベルリセット）
        this.weaponSystem.currentLevel = this.gameState.weaponLevel;
        console.log(`🔫 Weapon synchronized after hit: GameState=${this.gameState.weaponLevel}, WeaponSystem=${this.weaponSystem.currentLevel}`);
        
        // ヒット音（フリーズ防止のため無効化）
        // this.audioManager.playSFX('hit');
        this.uiManager.startFlash(8);
        this.uiManager.startShake(8, 20);
        
        // ヒットエフェクト
        this.particleSystem.createExplosion(
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2,
            '#FF6600',
            8
        );
        
        if (this.gameState.hp <= 0) {
            // 死亡音（フリーズ防止のため無効化）
            // this.audioManager.playSFX('death');
            // 入力遅延を除去（Continue機能修正）
            // this.gameOverInputDelay = 15; // 死亡時に入力遅延を設定
            console.log('☠️ Player died - Continue screen will be immediately available');
        }
    }

    /**
     * 敵撃破処理
     * @param {Object} enemy - 敵オブジェクト
     */
    handleEnemyDefeat(enemy) {
        const points = enemy.maxHp * 10;
        this.gameState.addScore(points);
        // 敵死亡音（フリーズ防止のため無効化）
        // this.audioManager.playSFX('enemyDeath');
        
        // 特定の敵タイプ撃破時は近くの敵弾をクリア
        if (enemy.type === 'bomb_walker' || enemy.type === 'knight') {
            this.clearNearbyEnemyBullets(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 80);
        }
        
        // 爆発エフェクト（敵の種類に応じて調整）
        if (enemy.type === 'bomb_walker') {
            // BombWalkerは特別に派手な爆発
            this.particleSystem.createExplosion(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2,
                '#FF4500',
                18 // 通常の3倍のパーティクル数
            );
            // 追加の爆発エフェクト
            setTimeout(() => {
                this.particleSystem.createExplosion(
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height / 2,
                    '#FF6600',
                    12
                );
            }, 100);
        } else {
            // 通常敵の爆発
            this.particleSystem.createExplosion(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2,
                '#FF6600',
                6
            );
        }
        
        // パワーアップドロップ（無効化：？ボックスからのみ入手可能）
        // const powerUp = PowerUpFactory.createFromEnemyDeath(
        //     enemy.x + enemy.width / 2,
        //     enemy.y + enemy.height / 2
        // );
        // if (powerUp) {
        //     this.powerUps.push(powerUp);
        // }
        
        enemy.markForRemoval();
    }

    /**
     * ボスヒット処理
     */
    handleBossHit() {
        // 安全なボス存在チェック
        if (!this.boss || this.boss.shouldRemove) {
            console.warn('⚠️ handleBossHit called but boss is null or removed');
            return;
        }
        
        // ボス登場演出中は無敵（ダメージを受けない）
        if (this.bossIntroDisplay.isInvulnerabilityPeriod()) {
            console.log('🛡️ Boss is invulnerable during introduction sequence');
            return;
        }
        
        // 弾丸配列の安全性チェック
        if (!Array.isArray(this.bullets) || this.bullets.length === 0) {
            console.warn('⚠️ handleBossHit called but bullets array is invalid');
            return;
        }
        
        try {
            // ボスにヒットした弾丸を特定（安全性チェック付き）
            const hitBullets = CollisionSystem.checkBulletBossCollision(this.bullets, this.boss);
            
            // ヒット弾丸の検証
            if (!Array.isArray(hitBullets)) {
                console.error('❌ checkBulletBossCollision returned invalid result');
                return;
            }
            
            // 各ヒット弾丸に対してダメージ処理
            for (let i = 0; i < hitBullets.length; i++) {
                const bullet = hitBullets[i];
                
                // 弾丸の安全性チェック
                if (!bullet || bullet.shouldRemove) {
                    console.warn(`⚠️ Invalid bullet at index ${i} during boss hit processing`);
                    continue;
                }
                
                // 弾丸のプロパティ存在確認
                if (typeof bullet.x !== 'number' || typeof bullet.y !== 'number' || 
                    typeof bullet.width !== 'number' || typeof bullet.height !== 'number') {
                    console.error('❌ Bullet has invalid properties:', {
                        x: bullet.x, y: bullet.y, width: bullet.width, height: bullet.height
                    });
                    bullet.shouldRemove = true;
                    continue;
                }
                
                // ボスの安全性を再チェック（ループ中に変更される可能性）
                if (!this.boss || this.boss.shouldRemove) {
                    console.warn('⚠️ Boss became null during hit processing');
                    break;
                }
                
                // ダメージ量を決定（武器レベルに応じて）
                const damage = this.calculateBossDamage(bullet);
                
                // ボスにダメージを与える
                const isDefeated = this.boss.takeDamage(damage);
                
                // 弾丸を削除
                bullet.shouldRemove = true;
                
                // ヒットエフェクト（安全な座標計算）
                const effectX = bullet.x + (bullet.width / 2);
                const effectY = bullet.y + (bullet.height / 2);
                
                if (effectX >= 0 && effectY >= 0 && effectX <= 800 && effectY <= 600) {
                    this.particleSystem.createSparks(effectX, effectY, '#FFFF00', 4);
                }
                
                // ボス撃破チェック
                if (isDefeated) {
                    this.handleBossDefeat();
                    break;
                }
            }
            
            // UI効果
            if (hitBullets.length > 0) {
                this.uiManager.startShake(5, 10);
            }
            
        } catch (error) {
            console.error('❌ Error in handleBossHit:', error);
            console.error('Boss state:', this.boss ? 'exists' : 'null');
            console.error('Bullets count:', this.bullets.length);
            
            // エラー時の安全な処理
            if (this.boss && !this.boss.shouldRemove) {
                // 最低限のダメージ処理
                const isDefeated = this.boss.takeDamage(1);
                if (isDefeated) {
                    this.handleBossDefeat();
                }
            }
        }
        
        // 【緊急無効化】ボスヒット音を無効化
        // this.audioManager.playSFX('bossHit');
    }

    /**
     * ボスダメージ計算
     * @param {Object} bullet - 弾丸オブジェクト
     * @returns {number} ダメージ量
     */
    calculateBossDamage(bullet) {
        // 基本ダメージ
        let damage = bullet.damage || 10;
        
        // 武器レベルに応じてダメージ補正
        const weaponLevel = this.gameState.weaponLevel;
        
        // 弾丸の種類に応じてダメージ補正
        switch (bullet.type) {
            case 'laser':
                damage *= 3; // レーザーは3倍ダメージ
                break;
            case 'flame':
                damage *= 2; // 火炎弾は2倍ダメージ
                break;
            case 'thunder':
                damage *= 2.5; // 雷弾は2.5倍ダメージ
                break;
            case 'fireball':
                damage *= 4; // 火球は4倍ダメージ
                break;
            default:
                // 通常弾は武器レベルに応じて補正
                damage += weaponLevel * 2;
                break;
        }
        
        // レーザー残弾がある場合は追加ダメージ
        if (this.gameState.laserAmmo > 0 && bullet.type === 'laser') {
            damage += 20;
        }
        
        return Math.floor(damage);
    }

    /**
     * ボス撃破処理
     */
    handleBossDefeat() {
        try {
            // ボスの安全性チェック
            if (!this.boss) {
                console.warn('⚠️ handleBossDefeat called but boss is null');
                return;
            }
            
            const bonusPoints = 5000; // 10000 -> 5000に調整してレベルアップ抑制
            this.gameState.addScore(bonusPoints);
            // 【緊急無効化】ボス死亡音を無効化
            // this.audioManager.playSFX('bossDeath');
            this.uiManager.startShake(20, 60);
            
            // ✅ ボス撃破時に敵弾を全てクリア
            const clearedBullets = this.enemyBullets.length;
            this.enemyBullets = [];
            console.log(`🎯 Boss defeated! Cleared ${clearedBullets} enemy bullets`);
            
            // ボス弾クリアのエフェクト
            if (clearedBullets > 0) {
                this.particleSystem.createExplosion(400, 300, '#00FFFF', 20);
                console.log('✨ Enemy bullets cleared with visual effect');
            }
            
            // ボス座標の安全な取得
            const bossX = typeof this.boss.x === 'number' ? this.boss.x : 400;
            const bossY = typeof this.boss.y === 'number' ? this.boss.y : 300;
            const bossWidth = typeof this.boss.width === 'number' ? this.boss.width : 180;
            const bossHeight = typeof this.boss.height === 'number' ? this.boss.height : 180;
            
            // 大爆発エフェクト（安全な座標計算）
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    if (this.particleSystem && typeof this.particleSystem.createExplosion === 'function') {
                        const explosionX = bossX + Math.random() * bossWidth;
                        const explosionY = bossY + Math.random() * bossHeight;
                        
                        if (explosionX >= 0 && explosionY >= 0 && explosionX <= 800 && explosionY <= 600) {
                            this.particleSystem.createExplosion(explosionX, explosionY, '#FF4500', 12);
                        }
                    }
                }, i * 200);
            }
            
            // ボス報酬（安全な座標計算）
            const rewardX = bossX + bossWidth / 2;
            const rewardY = bossY + bossHeight / 2;
            
            if (rewardX >= 0 && rewardY >= 0 && rewardX <= 800 && rewardY <= 600) {
                const rewards = PowerUpFactory.createBossRewards(rewardX, rewardY);
                if (Array.isArray(rewards)) {
                    this.powerUps.push(...rewards);
                }
            }
            
            // ボス状態リセット（GameStateのdefeatBoss()メソッドを使用）
            this.boss = null;
            this.gameState.defeatBoss();
            
            // ボスモードの場合は勝利後にメニューに戻る
            if (this.gameState.isBossMode) {
                console.log('🏆 Boss Mode victory! Returning to menu...');
                setTimeout(() => {
                    this.currentScreen = 'menu';
                    this.gameScreens.transitionTo('menu');
                    this.gameState.isBossMode = false;
                }, 3000); // 3秒後にメニューに戻る
            } else {
                // 通常モードの場合はステージ変更処理
                const stageChanged = this.backgroundSystem.advanceToNextStage();
                if (stageChanged) {
                    console.log(`🎬 Stage advanced to ${this.gameState.currentStage} after boss defeat`);
                    // Zelda風ステージ名表示を開始
                    this.stageNameDisplay.showStageName(this.gameState.currentStage);
                } else {
                    console.log(`🏆 All stages completed! Game should show victory screen.`);
                }
            }
            
            console.log('✅ Boss defeated successfully');
            
        } catch (error) {
            console.error('❌ Error in handleBossDefeat:', error);
            console.error('Boss state:', this.boss);
            
            // エラー時の安全処理
            this.boss = null;
            this.gameState.isBossBattle = false;
            this.gameState.defeatBoss();
        }
    }

    /**
     * パワーアップ取得処理
     * @param {Object} powerUp - パワーアップオブジェクト
     */
    handlePowerUpCollection(powerUp) {
        powerUp.applyEffect(this.gameState, this.weaponSystem);
        // パワーアップ音（フリーズ防止のため無効化）
        // this.audioManager.playSFX('powerUp');
        
        // 取得エフェクト
        this.particleSystem.createPowerUpEffect(
            powerUp.x + powerUp.width / 2,
            powerUp.y + powerUp.height / 2,
            powerUp.baseColor
        );
        
        powerUp.markForRemoval();
    }

    /**
     * ？ボックス破壊処理
     * @param {Object} questionBox - ？ボックスオブジェクト
     */
    handleQuestionBoxBreak(questionBox) {
        // 【緊急無効化】爆発音を無効化
        // this.audioManager.playSFX('explosion');
        
        // 爆発エフェクト
        this.particleSystem.createExplosion(
            questionBox.x + questionBox.width / 2,
            questionBox.y + questionBox.height / 2,
            '#FFFF00',
            8
        );
        
        // パワーアップ生成
        const powerUp = PowerUpFactory.createFromQuestionBox(
            questionBox.x + questionBox.width / 2,
            questionBox.y + questionBox.height / 2
        );
        this.powerUps.push(powerUp);
        
        questionBox.shouldRemove = true;
    }

    /**
     * ゲームオーバー処理
     * @param {Object} input - 入力管理
     */
    handleGameOver(input) {
        // 入力遅延を完全に除去（Continue機能修正）
        // if (!this.gameOverInputDelay) this.gameOverInputDelay = 0;
        // if (this.gameOverInputDelay > 0) this.gameOverInputDelay--;
        
        // デバッグ：ゲーム状態を確認（Continue機能重要ログを頻繁に出力）
        if (this.frameCount % 30 === 0) { // 0.5秒間隔で状態確認
            console.log(`🎮 Continue State Debug: gameOver=${this.gameState.gameOver}, showingContinue=${this.gameState.showingContinue}, continueTimer=${this.gameState.continueTimer}, continueCount=${this.gameState.continueCount}/${GAME_CONFIG.GAMEPLAY.CONTINUE_LIMIT}, hp=${this.gameState.hp}`);
        }
        
        // より確実な入力検知 - 直接キー状態をチェック
        const cDown = input.isKeyDown('KeyC');
        const enterDown = input.isKeyDown('Enter');
        const rDown = input.isKeyDown('KeyR');
        const escDown = input.isKeyDown('Escape');
        
        // スペースキーも追加でサポート
        const spaceDown = input.isKeyDown('Space');
        
        // 入力フラグを管理（連続入力を防ぐ）
        if (!this.inputCooldown) this.inputCooldown = {};
        
        // Continue処理 - シンプルで確実な方法
        if (this.gameState.showingContinue && (cDown || enterDown || spaceDown)) {
            if (!this.inputCooldown.continue) {
                console.log('🔄 Continue key detected - PROCESSING');
                this.inputCooldown.continue = true;
                
                const continuedSuccessfully = this.gameState.continueGame();
                if (continuedSuccessfully) {
                    console.log(`✅ Continue successful: ${this.gameState.continueCount}/${GAME_CONFIG.GAMEPLAY.CONTINUE_LIMIT}`);
                    // ゲーム状態をリセットせずに継続
                    this.gameState.gameOver = false;
                    this.gameState.gameStarted = true;
                    
                    // プレイヤー位置リセット（Continue時は初期位置に戻す）
                    if (this.player) {
                        this.player.x = GAME_CONFIG.CANVAS_WIDTH / 2 - 24;
                        this.player.y = GAME_CONFIG.CANVAS_HEIGHT - 100;
                        this.player.hp = this.gameState.hp; // プレイヤーのHPも同期
                        console.log(`   - Player position and HP reset: (${this.player.x}, ${this.player.y}), HP=${this.player.hp}`);
                    }
                    
                    // WeaponSystemとの同期確保
                    this.weaponSystem.currentLevel = this.gameState.weaponLevel;
                    console.log(`   - Weapon level synchronized: ${this.weaponSystem.currentLevel}`);
                    
                    return; // Continue成功時は他の処理をスキップ
                } else {
                    console.log('❌ No more continues available');
                    this.gameState.showingContinue = false;
                    this.gameState.gameOver = true;
                }
            }
        }
        
        // Restart処理 - シンプルで確実な方法
        if (rDown) {
            if (!this.inputCooldown.restart) {
                console.log('🔄 Restart key detected - PROCESSING');
                this.inputCooldown.restart = true;
                this.startNewGame();
                return; // Restart時は他の処理をスキップ
            }
        }
        
        // ESC処理 - タイトル画面に戻る
        if (escDown) {
            if (!this.inputCooldown.escape) {
                console.log('🏠 Back to title screen (ESC) - PROCESSING');
                this.inputCooldown.escape = true;
                this.currentScreen = 'title';
                this.gameScreens.transitionTo('title');
                return;
            }
        }
        
        // 入力クールダウンをリセット（キーが離されたら）
        if (!cDown && !enterDown && !spaceDown) {
            this.inputCooldown.continue = false;
        }
        if (!rDown) {
            this.inputCooldown.restart = false;
        }
        if (!escDown) {
            this.inputCooldown.escape = false;
        }
    }

    /**
     * オーディオ更新
     */
    updateAudio() {
        if (this.bgmPlayer) {
            this.bgmPlayer.updateDynamicMusic(this.gameState);
        }
    }

    /**
     * 描画処理
     */
    render() {
        // 画面クリア
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        
        if (this.currentScreen === 'game') {
            this.renderGame();
        } else {
            this.gameScreens.draw(this.renderer);
        }
    }

    /**
     * ゲーム描画
     */
    renderGame() {
        // 背景描画（ボス状態を含む）
        const gameStateForBg = {
            boss: this.boss,
            currentStage: this.gameState.currentStage
        };
        this.backgroundSystem.draw(this.renderer, gameStateForBg);
        
        // パーティクル描画（背景層）
        this.particleSystem.draw(this.renderer);
        
        // 弾丸描画（プレイヤーより下のレイヤー）
        // if (this.bullets.length > 0) {
        //     console.log('🎯 Drawing bullets:', this.bullets.length);
        // }
        for (const bullet of this.bullets) {
            bullet.draw(this.renderer);
        }
        
        for (const bullet of this.enemyBullets) {
            bullet.draw(this.renderer);
        }
        
        // ゲームオブジェクト描画（プレイヤーを最後に描画してレーザーと重なる部分で上に表示）
        if (this.player) {
            this.player.draw(this.renderer, this.gameState);
        } else {
            console.log('⚠️ Player is null during render');
        }
        
        // 敵描画
        for (const enemy of this.enemies) {
            enemy.draw(this.renderer);
        }
        
        // ボス描画
        if (this.boss) {
            this.boss.draw(this.renderer);
        }
        
        // パワーアップ描画
        for (const powerUp of this.powerUps) {
            powerUp.draw(this.renderer);
        }
        
        // UI描画
        this.uiManager.draw(
            this.renderer, 
            this.gameState, 
            this.weaponSystem.getWeaponState(), 
            this.boss
        );
        
        // ステージ名表示（UI上に重ねる）
        this.stageNameDisplay.render(this.renderer);
        
        // ボス登場演出（UI最上位レイヤー）
        this.bossIntroDisplay.render(this.renderer);
    }

    /**
     * ウィンドウリサイズ処理
     */
    handleResize() {
        // 必要に応じてCanvas サイズ調整
        // 現在は固定サイズ使用
    }

    /**
     * エラー処理
     * @param {Error} error - エラーオブジェクト
     */
    handleError(error) {
        console.error('=== Game Error Details ===');
        console.error('Error:', error);
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        console.error('Name:', error.name);
        console.error('Current screen:', this.currentScreen);
        console.error('Game state:', this.gameState?.currentStage);
        console.error('Player position:', this.player?.x, this.player?.y);
        console.error('Entities count:', {
            enemies: this.enemies?.length,
            bullets: this.bullets?.length,
            powerUps: this.powerUps?.length
        });
        console.error('=========================');
        
        this.showError(`Error: ${error.message}`);
    }

    /**
     * エラー表示
     * @param {string} message - エラーメッセージ
     */
    showError(message) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ERROR', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 - 50);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(message, GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2);
        
        this.ctx.textAlign = 'start';
    }

    /**
     * ゲーム終了
     */
    exitGame() {
        if (confirm('Are you sure you want to exit?')) {
            this.cleanup();
            window.close();
        }
    }

    /**
     * リソース解放
     */
    cleanup() {
        this.stop();
        
        if (this.audioManager) {
            this.audioManager.dispose();
        }
        
        if (this.particleSystem) {
            this.particleSystem.clear();
        }
        
        console.log('Game cleaned up');
    }

    /**
     * 近くの敵弾をクリア
     * @param {number} x - 中心X座標
     * @param {number} y - 中心Y座標
     * @param {number} radius - クリア範囲
     */
    clearNearbyEnemyBullets(x, y, radius) {
        const initialCount = this.enemyBullets.length;
        
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            if (!bullet || typeof bullet.x !== 'number' || typeof bullet.y !== 'number') {
                return false; // 無効な弾丸は削除
            }
            
            const distance = Math.sqrt(
                Math.pow(bullet.x - x, 2) + Math.pow(bullet.y - y, 2)
            );
            
            return distance > radius; // 範囲外の弾丸のみ残す
        });
        
        const clearedCount = initialCount - this.enemyBullets.length;
        if (clearedCount > 0) {
            console.log(`🎯 Cleared ${clearedCount} nearby enemy bullets`);
            // 小さな爆発エフェクト
            this.particleSystem.createExplosion(x, y, '#FFFF00', 8);
        }
    }

    /**
     * デバッグ情報取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        return {
            frameCount: this.frameCount,
            deltaTime: this.deltaTime,
            currentScreen: this.currentScreen,
            gameState: this.gameState.getDebugInfo(),
            entities: {
                enemies: this.enemies.length,
                bullets: this.bullets.length,
                enemyBullets: this.enemyBullets.length,
                powerUps: this.powerUps.length,
                particles: this.particleSystem.getParticleCount()
            },
            audio: this.audioManager.getDebugInfo()
        };
    }
}

// ゲーム開始関数
function initializeGame() {
    try {
        console.log('魔城伝説 - Demon Castle Legend');
        console.log('Starting game initialization...');
        console.log('Document ready state:', document.readyState);
        
        // DOM要素の事前確認
        console.log('Pre-initialization DOM check...');
        const preCanvas = document.getElementById('gameCanvas');
        console.log('Canvas pre-check:', !!preCanvas, preCanvas?.tagName);
        
        if (!preCanvas) {
            console.warn('Canvas element not found during pre-check');
        }
        
        console.log('Canvas element validated, creating game instance...');
        const game = new Game();
        
        // デバッグ用にグローバルに公開
        window.game = game;
        
        console.log('Game instance created and attached to window.game');
        return true;
        
    } catch (error) {
        console.error('Failed to create game instance:', error);
        console.error('Error details:', error.stack);
        
        // エラー表示を試行
        showInitializationError(error);
        return false;
    }
}

// エラー表示関数
function showInitializationError(error) {
    try {
        let canvas = document.getElementById('gameCanvas');
        
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            canvas.id = 'gameCanvas';
            canvas.style.border = '2px solid red';
            
            const container = document.querySelector('.game-container') || document.body;
            container.appendChild(canvas);
        }
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#FF0000';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('INITIALIZATION ERROR', canvas.width / 2, canvas.height / 2 - 50);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '16px Arial';
            ctx.fillText(`${error.message}`, canvas.width / 2, canvas.height / 2);
            ctx.fillText('Check browser console for details', canvas.width / 2, canvas.height / 2 + 30);
        }
    } catch (drawError) {
        console.error('Failed to draw error message:', drawError);
    }
}

// より確実な初期化システム
function waitForCanvas(maxAttempts = 10, delay = 100) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        function checkCanvas() {
            attempts++;
            console.log(`Canvas check attempt ${attempts}/${maxAttempts}`);
            
            const canvas = document.getElementById('gameCanvas');
            console.log('Canvas found:', !!canvas);
            console.log('Canvas type:', canvas?.constructor?.name);
            console.log('Canvas has getContext:', typeof canvas?.getContext);
            
            if (canvas && canvas.tagName === 'CANVAS' && typeof canvas.getContext === 'function') {
                console.log('✅ Canvas ready!');
                resolve(canvas);
                return;
            }
            
            if (attempts >= maxAttempts) {
                reject(new Error(`Canvas not ready after ${maxAttempts} attempts`));
                return;
            }
            
            console.log(`Canvas not ready, retrying in ${delay}ms...`);
            setTimeout(checkCanvas, delay);
        }
        
        checkCanvas();
    });
}

// 非同期初期化システム
async function initializeGameAsync() {
    try {
        console.log('魔城伝説 - Demon Castle Legend');
        console.log('Starting async game initialization...');
        console.log('Document ready state:', document.readyState);
        
        // Canvasが利用可能になるまで待機
        console.log('Waiting for canvas to be ready...');
        await waitForCanvas(20, 200); // 最大20回、200ms間隔で試行
        
        console.log('Canvas confirmed ready, creating game instance...');
        const game = new Game();
        
        // デバッグ用にグローバルに公開
        window.game = game;
        
        console.log('✅ Game instance created and attached to window.game');
        return true;
        
    } catch (error) {
        console.error('❌ Failed to create game instance:', error);
        console.error('Error details:', error.stack);
        
        // エラー表示を試行
        showInitializationError(error);
        return false;
    }
}

// 複数の初期化タイミングを試行
function attemptInitialization() {
    console.log('Attempting game initialization...');
    
    if (document.readyState === 'loading') {
        console.log('DOM still loading, waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeGameAsync, 100);
        });
    } else {
        console.log('DOM already loaded, starting async initialization...');
        setTimeout(initializeGameAsync, 100);
    }
}

// 初期化試行
attemptInitialization();

export default Game;