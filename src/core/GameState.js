import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * ゲーム状態管理クラス
 * スコア、HP、レベル、武器レベル等の状態を管理
 */
export class GameState {
    constructor() {
        this.initializeState();
    }

    /**
     * 全ゲーム状態を初期化
     */
    initializeState() {
        // 基本状態
        this.score = 0;
        this.hp = GAME_CONFIG.PLAYER.INITIAL_HP;
        this.maxHp = GAME_CONFIG.PLAYER.INITIAL_HP; // 最大HPを追加
        console.log(`💚 GameState initialized with HP: ${this.hp}/${this.maxHp}`);
        this.level = 1;
        this.gameStarted = false;
        this.gameOver = false;
        this.gameCleared = false;

        // 進行状態
        this.scrollSpeed = GAME_CONFIG.GAMEPLAY.SCROLL_SPEED;
        this.enemySpawnRate = GAME_CONFIG.GAMEPLAY.ENEMY_SPAWN_RATE;
        this.backgroundOffset = 0;
        this.totalDistance = 0;

        // 戦闘状態
        this.weaponLevel = 1;
        this.laserAmmo = GAME_CONFIG.GAMEPLAY.LASER_AMMO_INITIAL
        this.shootCooldown = 0;

        // ボス戦状態
        this.isBossBattle = false;
        this.currentBoss = null;
        this.bossesDefeated = 0;
        this.currentStage = 0;
        this.isBossMode = false; // Boss Mode flag

        // 特殊状態
        this.continueCount = 0;
        this.continueTimer = 0;
        this.showingContinue = false;
        this.isPaused = false;

        // 高速モード
        this.isSpeedMode = false;
        this.speedModeTimer = 0;

        // 川・地形（判定はBackgroundSystem + Player.jsで処理）
        this.isInRiver = false;

        // 音楽・エフェクト状態
        this.musicState = {
            isStartMusic: false,
            isBossMusic: false,
            isVictoryMusic: false,
            currentBossMusic: 0, // 1, 2, 3
            startMusicTimer: 0
        };

        // ゲームタイマー
        this.gameTimer = 0;
        this.frameCount = 0;
    }

    /**
     * ゲーム開始
     */
    startGame() {
        this.gameStarted = true;
        this.gameOver = false;
        this.showingContinue = false; // Continue画面を強制的に非表示
        this.continueTimer = 0; // Continue タイマーをリセット
        this.musicState.isStartMusic = true;
        this.musicState.startMusicTimer = GAME_CONFIG.MUSIC.START_MUSIC_DURATION;
        console.log('Game started - Continue screen cleared');
    }

    /**
     * ゲーム更新（フレームごと）
     */
    update() {
        this.frameCount++;
        this.gameTimer++;

        // 開始音楽タイマー
        if (this.musicState.startMusicTimer > 0) {
            this.musicState.startMusicTimer--;
            if (this.musicState.startMusicTimer <= 0) {
                this.musicState.isStartMusic = false;
            }
        }

        // 高速モード更新
        if (this.isSpeedMode) {
            this.speedModeTimer--;
            if (this.speedModeTimer <= 0) {
                this.isSpeedMode = false;
            }
        }

        // 射撃クールダウン
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        // 背景スクロール
        this.backgroundOffset += this.scrollSpeed;
        this.totalDistance += this.scrollSpeed;

        // レベルによる敵出現率調整（上限制限付き）
        const levelMultiplier = Math.min((this.level - 1) * 0.001, 0.005); // 0.002 -> 0.001に削減、上限0.005
        this.enemySpawnRate = GAME_CONFIG.GAMEPLAY.ENEMY_SPAWN_RATE + levelMultiplier;

        // コンティニュータイマー
        if (this.showingContinue && this.continueTimer > 0) {
            this.continueTimer--;
            if (this.continueTimer <= 0) {
                // Continue時間切れの処理
                console.log('⏰ Continue timeout - Final game over');
                this.showingContinue = false;
                this.gameOver = true;
                this.gameStarted = false;
            }
        }
    }

    /**
     * スコア加算
     * @param {number} points - 加算するポイント
     */
    addScore(points) {
        this.score += points;
        
        // レベルアップ判定（スコアベース）
        const newLevel = Math.floor(this.score / 5000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            console.log(`Level up! Level ${this.level}`);
        }
    }

    /**
     * ダメージ処理
     * @param {number} damage - ダメージ量
     * @returns {boolean} 死亡したかどうか
     */
    takeDamage(damage) {
        const oldHp = this.hp;
        this.hp -= damage;
        console.log(`💔 Player took ${damage} damage: ${oldHp} -> ${this.hp}`);
        
        // 武器レベルリセット（1にダウン）
        this.weaponLevel = 1;
        
        if (this.hp <= 0) {
            this.hp = 0;
            console.log('☠️ Player died!');
            this.setGameOver();
            return true;
        }
        return false;
    }

    /**
     * 川に落ちた時の処理（無効化 - ゲームバランス調整のため）
     */
    fallIntoRiver() {
        // this.hp = 0;
        // this.setGameOver();
        console.log('Player in river - no damage (instant death disabled for game balance)');
    }

    /**
     * ゲームオーバー設定
     */
    setGameOver() {
        if (this.continueCount < GAME_CONFIG.GAMEPLAY.CONTINUE_LIMIT) {
            console.log(`💀 Player died - Showing Continue screen (${this.continueCount}/${GAME_CONFIG.GAMEPLAY.CONTINUE_LIMIT} used)`);
            this.showContinueScreen();
        } else {
            console.log('💀 Player died - No continues left, final game over');
            this.gameOver = true;
            this.gameStarted = false;
        }
    }

    /**
     * コンティニュー画面表示
     */
    showContinueScreen() {
        this.showingContinue = true;
        this.continueTimer = GAME_CONFIG.GAMEPLAY.CONTINUE_TIME; // 10秒
        this.gameOver = false; // Continue画面表示中はgameOverをfalseに
        this.gameStarted = false; // ゲームは一時停止状態
        console.log(`🔄 Continue screen shown: showingContinue=${this.showingContinue}, continueTimer=${this.continueTimer}, gameOver=${this.gameOver}, gameStarted=${this.gameStarted}`);
    }

    /**
     * コンティニュー実行
     */
    continueGame() {
        console.log(`🔄 GameState.continueGame() called: continueCount=${this.continueCount}, limit=${GAME_CONFIG.GAMEPLAY.CONTINUE_LIMIT}`);
        
        if (this.continueCount >= GAME_CONFIG.GAMEPLAY.CONTINUE_LIMIT) {
            console.log(`❌ Continue limit reached: ${this.continueCount}/${GAME_CONFIG.GAMEPLAY.CONTINUE_LIMIT}`);
            return false;
        }

        const oldCount = this.continueCount;
        const oldHp = this.hp;
        const oldWeaponLevel = this.weaponLevel;
        
        this.continueCount++;
        this.hp = GAME_CONFIG.PLAYER.INITIAL_HP;
        this.weaponLevel = 1;
        this.showingContinue = false;
        this.continueTimer = 0;
        
        console.log(`✅ Continue executed successfully:`);
        console.log(`   - Continue count: ${oldCount} -> ${this.continueCount}`);
        console.log(`   - HP: ${oldHp} -> ${this.hp}`);
        console.log(`   - Weapon level: ${oldWeaponLevel} -> ${this.weaponLevel}`);
        console.log(`   - showingContinue: true -> ${this.showingContinue}`);
        console.log(`   - continueTimer: reset to ${this.continueTimer}`);
        
        return true;
    }

    /**
     * 武器レベルアップ（強化版）
     */
    upgradeWeapon(weaponSystem = null) {
        if (this.weaponLevel < 9) {
            const oldLevel = this.weaponLevel;
            this.weaponLevel++;
            console.log(`🔫 GameState weapon upgraded: ${oldLevel} -> ${this.weaponLevel}`);
            
            // WeaponSystemとの完全同期（強制的に同期）
            if (weaponSystem) {
                weaponSystem.currentLevel = this.weaponLevel;
                weaponSystem.upgradeLevel = this.weaponLevel; // 追加の同期
                console.log(`🔫 WeaponSystem forcibly synchronized to level ${weaponSystem.currentLevel}`);
                
                // WeaponSystemのメソッドがある場合は呼び出し
                if (typeof weaponSystem.setLevel === 'function') {
                    weaponSystem.setLevel(this.weaponLevel);
                }
                if (typeof weaponSystem.upgrade === 'function') {
                    weaponSystem.upgrade();
                }
            }
            
            // デバッグ用：武器レベル確認
            console.log(`🔫 Weapon upgrade result: GameState=${this.weaponLevel}, WeaponSystem=${weaponSystem?.currentLevel || 'N/A'}`);
            return true;
        } else {
            console.log(`🔫 Weapon already at max level (${this.weaponLevel})`);
            return false;
        }
    }

    /**
     * 体力回復
     * @param {number} amount - 回復量
     */
    healHP(amount) {
        this.hp = Math.min(this.hp + amount, GAME_CONFIG.PLAYER.INITIAL_HP);
        console.log(`HP healed by ${amount}, current HP: ${this.hp}`);
    }

    /**
     * レーザー弾薬追加
     * @param {number} amount - 追加量
     */
    addLaserAmmo(amount) {
        this.laserAmmo += amount;
        console.log(`Laser ammo added: ${amount}, total: ${this.laserAmmo}`);
    }

    /**
     * 高速モード開始
     * @param {number} duration - 持続時間（フレーム）
     */
    activateSpeedMode(duration = GAME_CONFIG.GAMEPLAY.SPEED_MODE_DURATION) {
        this.isSpeedMode = true;
        this.speedModeTimer = duration;
        console.log(`Speed mode activated for ${duration} frames`);
    }

    /**
     * レーザー使用
     * @returns {boolean} 使用できたかどうか
     */
    useLaser() {
        if (this.weaponLevel === 6 && this.laserAmmo > 0) {
            this.laserAmmo--;
            return true;
        }
        return false;
    }

    /**
     * ボス出現判定
     * @returns {boolean} ボスを出現させるべきか
     */
    shouldSpawnBoss() {
        const bossDistance = GAME_CONFIG.GAMEPLAY.BOSS_SPAWN_DISTANCE;
        const expectedBoss = Math.floor(this.totalDistance / bossDistance);
        return expectedBoss > this.bossesDefeated && expectedBoss <= 3;
    }

    /**
     * ボス戦開始
     * @param {number} bossType - ボスタイプ（1-3）
     */
    startBossBattle(bossType) {
        this.isBossBattle = true;
        this.currentBoss = bossType;
        this.musicState.isBossMusic = true;
        this.musicState.currentBossMusic = bossType;
        console.log(`Boss battle ${bossType} started!`);
    }

    /**
     * ボス撃破
     */
    defeatBoss() {
        if (!this.isBossBattle) return;

        this.bossesDefeated++;
        this.isBossBattle = false;
        this.currentBoss = null;
        this.currentStage++;
        this.musicState.isBossMusic = false;
        this.musicState.currentBossMusic = 0;

        // 最終ボス撃破でゲームクリア
        if (this.bossesDefeated >= 3) {
            this.gameCleared = true;
            this.musicState.isVictoryMusic = true;
            console.log('Game Cleared!');
        }

        console.log(`Boss defeated! Bosses defeated: ${this.bossesDefeated}`);
    }

    /**
     * ステージ進行処理（ボス撃破後用）
     */
    advanceStage() {
        this.defeatBoss();
        console.log('Stage advanced successfully');
    }

    /**
     * ゲーム完全リスタート
     */
    restartGame() {
        this.initializeState();
        console.log('Game restarted');
    }

    /**
     * 川判定設定
     * @param {boolean} inRiver - 川にいるかどうか
     */
    setInRiver(inRiver) {
        this.isInRiver = inRiver;
    }

    /**
     * UI表示用状態サマリー取得
     * @returns {Object} 状態サマリー
     */
    getStateSummary() {
        return {
            score: this.score,
            hp: this.hp,
            maxHP: GAME_CONFIG.PLAYER.INITIAL_HP,
            level: this.level,
            weaponLevel: this.weaponLevel,
            laserAmmo: this.laserAmmo,
            continueCount: this.continueCount,
            maxContinue: GAME_CONFIG.GAMEPLAY.CONTINUE_LIMIT,
            currentStage: this.currentStage,
            bossesDefeated: this.bossesDefeated,
            isSpeedMode: this.isSpeedMode,
            speedModeTimer: this.speedModeTimer,
            isBossBattle: this.isBossBattle,
            gameStarted: this.gameStarted,
            gameOver: this.gameOver,
            gameCleared: this.gameCleared,
            showingContinue: this.showingContinue,
            continueTimer: this.continueTimer
        };
    }

    /**
     * セーブデータ取得
     * @returns {Object} セーブデータ
     */
    getSaveData() {
        return {
            score: this.score,
            hp: this.hp,
            level: this.level,
            weaponLevel: this.weaponLevel,
            laserAmmo: this.laserAmmo,
            continueCount: this.continueCount,
            currentStage: this.currentStage,
            bossesDefeated: this.bossesDefeated,
            totalDistance: this.totalDistance
        };
    }

    /**
     * セーブデータ読み込み
     * @param {Object} saveData - セーブデータ
     */
    loadSaveData(saveData) {
        if (!saveData) return;

        this.score = saveData.score || 0;
        this.hp = saveData.hp || GAME_CONFIG.PLAYER.INITIAL_HP;
        this.level = saveData.level || 1;
        this.weaponLevel = saveData.weaponLevel || 1;
        this.laserAmmo = saveData.laserAmmo || GAME_CONFIG.GAMEPLAY.LASER_AMMO_INITIAL;
        this.continueCount = saveData.continueCount || 0;
        this.currentStage = saveData.currentStage || 0;
        this.bossesDefeated = saveData.bossesDefeated || 0;
        this.totalDistance = saveData.totalDistance || 0;

        console.log('Save data loaded');
    }

    /**
     * デバッグ用状態出力
     */
    debugLog() {
        console.log('=== Game State Debug ===');
        console.log('Score:', this.score);
        console.log('HP:', this.hp);
        console.log('Level:', this.level);
        console.log('Weapon Level:', this.weaponLevel);
        console.log('Laser Ammo:', this.laserAmmo);
        console.log('Continue Count:', this.continueCount);
        console.log('Boss Defeated:', this.bossesDefeated);
        console.log('Current Stage:', this.currentStage);
        console.log('Total Distance:', this.totalDistance);
        console.log('Is Boss Battle:', this.isBossBattle);
        console.log('Is Speed Mode:', this.isSpeedMode);
        console.log('Game Started:', this.gameStarted);
        console.log('Game Over:', this.gameOver);
        console.log('Game Cleared:', this.gameCleared);
        console.log('=====================');
    }

    /**
     * ポーズ状態の切り替え
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        console.log('Game paused:', this.isPaused);
    }

    /**
     * ポーズ状態を設定
     * @param {boolean} paused - ポーズ状態
     */
    setPause(paused) {
        this.isPaused = paused;
    }
}