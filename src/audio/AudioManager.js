// Tone.js is loaded globally via CDN
const Tone = window.Tone || null;

/**
 * オーディオマネージャー
 * Tone.jsを使用した音響システムの管理
 */
export class AudioManager {
    constructor() {
        this.isInitialized = false;
        this.isMuted = false;
        this.isDisabled = true; // 音響システム完全無効化
        this.masterVolume = 0;
        this.bgmVolume = 0;
        this.sfxVolume = 0;
        
        // オーディオコンテキスト状態
        this.audioContextState = 'suspended';
        
        // マスターゲイン
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        
        // BGMプレイヤー
        this.bgmPlayer = null;
        
        // 効果音プレイヤー
        this.sfxPlayers = new Map();
        
        // 初期化フラグ
        this.initializationPromise = null;
    }

    /**
     * オーディオシステム初期化
     * @returns {Promise} 初期化プロミス
     */
    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._performInitialization();
        return this.initializationPromise;
    }

    /**
     * 初期化実行
     * @private
     */
    async _performInitialization() {
        try {
            // 音響システムを復旧
            console.log('🎵 AudioManager: Starting audio system initialization...');
            
            // Tone.jsの可用性チェック
            if (!Tone) {
                console.warn('AudioManager: Tone.js not available, audio will be disabled');
                return false;
            }

            // Tone.jsの開始（ユーザーインタラクション後に実行される）
            if (Tone.context.state === 'suspended') {
                console.log('AudioManager: AudioContext is suspended, waiting for user interaction...');
                // suspendedでも初期化は続行（ユーザークリック後に有効化される）
            }

            // AudioContextが停止中でも基本的な準備は行う
            if (Tone.context.state !== 'running') {
                console.log('AudioManager: Attempting to start AudioContext...');
                try {
                    await Tone.start();
                    console.log('AudioManager: AudioContext started successfully');
                } catch (startError) {
                    console.warn('AudioManager: Could not start AudioContext yet:', startError.message);
                    // ユーザーインタラクション待ちでも初期化は続行
                }
            }
            
            // マスターゲイン設定
            this.masterGain = new Tone.Gain(this.masterVolume).toDestination();
            this.bgmGain = new Tone.Gain(this.bgmVolume).connect(this.masterGain);
            this.sfxGain = new Tone.Gain(this.sfxVolume).connect(this.masterGain);
            
            this.audioContextState = Tone.context.state;
            this.isInitialized = true;
            
            console.log('AudioManager: Initialized successfully');
            return true;
        } catch (error) {
            console.warn('AudioManager: Initialization failed:', error.message || error);
            // エラーが発生してもゲームは続行可能
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * ユーザーインタラクション後の初期化（緊急修正版）
     * @returns {Promise<boolean>} 初期化成功フラグ
     */
    async initializeAfterUserInteraction() {
        console.log('🚫 AudioManager: User interaction initialization disabled');
        return false;
    }

    /**
     * 緊急初期化実行
     * @private
     */
    async _performEmergencyInitialization() {
        try {
            console.log('🚨 AudioManager: Performing emergency initialization...');
            
            // Tone.jsの状態確認
            if (!Tone) {
                throw new Error('Tone.js not available');
            }
            
            console.log('AudioManager: Tone.js version:', Tone.version);
            console.log('AudioManager: AudioContext state:', Tone.context.state);
            
            // マスターゲイン設定（強制）
            if (this.masterGain) {
                this.masterGain.dispose();
            }
            this.masterGain = new Tone.Gain(this.masterVolume).toDestination();
            console.log('AudioManager: Master gain created');
            
            if (this.bgmGain) {
                this.bgmGain.dispose();
            }
            this.bgmGain = new Tone.Gain(this.bgmVolume).connect(this.masterGain);
            console.log('AudioManager: BGM gain created');
            
            if (this.sfxGain) {
                this.sfxGain.dispose();
            }
            this.sfxGain = new Tone.Gain(this.sfxVolume).connect(this.masterGain);
            console.log('AudioManager: SFX gain created');
            
            this.audioContextState = Tone.context.state;
            this.isInitialized = true;
            
            console.log('✅ AudioManager: Emergency initialization successful');
            
        } catch (error) {
            console.error('❌ AudioManager: Emergency initialization failed:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    /**
     * BGMプレイヤー設定（緊急修正版）
     * @param {Object} bgmPlayer - BGMプレイヤーインスタンス
     */
    setBGMPlayer(bgmPlayer) {
        try {
            console.log('🎵 AudioManager: Setting BGM player...');
            this.bgmPlayer = bgmPlayer;
            
            // 接続を強制実行
            this._forceBGMConnection();
            
            console.log('✅ AudioManager: BGM player set successfully');
        } catch (error) {
            console.error('❌ AudioManager: Failed to set BGM player:', error);
        }
    }

    /**
     * 効果音プレイヤー追加（緊急修正版）
     * @param {string} name - プレイヤー名
     * @param {Object} player - プレイヤーインスタンス
     */
    addSFXPlayer(name, player) {
        try {
            console.log(`🔊 AudioManager: Adding SFX player "${name}"...`);
            this.sfxPlayers.set(name, player);
            
            // 接続を強制実行
            this._forceSFXConnection(name, player);
            
            console.log(`✅ AudioManager: SFX player "${name}" added successfully`);
        } catch (error) {
            console.error(`❌ AudioManager: Failed to add SFX player "${name}":`, error);
        }
    }

    /**
     * 接続確認・修復
     * @private
     */
    _ensureConnections() {
        try {
            console.log('AudioManager: Ensuring all connections are active...');
            
            // BGM接続確認
            if (this.bgmPlayer && this.bgmGain) {
                this._forceBGMConnection();
            }
            
            // SFX接続確認
            for (const [name, player] of this.sfxPlayers.entries()) {
                this._forceSFXConnection(name, player);
            }
            
            console.log('AudioManager: Connection check completed');
        } catch (error) {
            console.error('AudioManager: Error ensuring connections:', error);
        }
    }

    /**
     * BGMプレイヤーの強制接続
     * @private
     */
    _forceBGMConnection() {
        if (this.bgmPlayer && this.bgmPlayer.output && this.bgmGain) {
            try {
                this.bgmPlayer.output.connect(this.bgmGain);
                console.log('✅ AudioManager: BGM player connected to gain');
            } catch (error) {
                console.warn('AudioManager: BGM connection failed, retrying after initialization:', error);
                // 初期化後に再試行する仕組みを追加
                setTimeout(() => {
                    if (this.isInitialized && this.bgmPlayer && this.bgmPlayer.output && this.bgmGain) {
                        try {
                            this.bgmPlayer.output.connect(this.bgmGain);
                            console.log('✅ AudioManager: BGM player connected on retry');
                        } catch (retryError) {
                            console.error('❌ AudioManager: BGM connection retry failed:', retryError);
                        }
                    }
                }, 500);
            }
        }
    }

    /**
     * SFXプレイヤーの強制接続
     * @private
     */
    _forceSFXConnection(name, player) {
        if (player && player.output && this.sfxGain) {
            try {
                player.output.connect(this.sfxGain);
                console.log(`✅ AudioManager: SFX player "${name}" connected to gain`);
            } catch (error) {
                console.warn(`AudioManager: SFX "${name}" connection failed, retrying after initialization:`, error);
                // 初期化後に再試行する仕組みを追加
                setTimeout(() => {
                    if (this.isInitialized && player && player.output && this.sfxGain) {
                        try {
                            player.output.connect(this.sfxGain);
                            console.log(`✅ AudioManager: SFX player "${name}" connected on retry`);
                        } catch (retryError) {
                            console.error(`❌ AudioManager: SFX "${name}" connection retry failed:`, retryError);
                        }
                    }
                }, 500);
            }
        }
    }

    /**
     * マスターボリューム設定
     * @param {number} volume - ボリューム (0-1)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.rampTo(this.masterVolume, 0.1);
        }
    }

    /**
     * BGMボリューム設定
     * @param {number} volume - ボリューム (0-1)
     */
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.bgmGain) {
            this.bgmGain.gain.rampTo(this.bgmVolume, 0.1);
        }
    }

    /**
     * 効果音ボリューム設定
     * @param {number} volume - ボリューム (0-1)
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.rampTo(this.sfxVolume, 0.1);
        }
    }

    /**
     * ミュート切り替え
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        const volume = this.isMuted ? 0 : this.masterVolume;
        
        if (this.masterGain) {
            this.masterGain.gain.rampTo(volume, 0.1);
        }
    }

    /**
     * BGM再生（無効化版）
     * @param {string} trackName - トラック名
     * @param {boolean} loop - ループ再生フラグ
     */
    playBGM(trackName, loop = true) {
        console.log(`🚫 AudioManager: BGM "${trackName}" not played (system disabled)`);
        return;
    }

    /**
     * BGM停止
     */
    stopBGM() {
        if (this.bgmPlayer) {
            this.bgmPlayer.stop();
        }
    }

    /**
     * BGM一時停止
     */
    pauseBGM() {
        if (this.bgmPlayer) {
            this.bgmPlayer.pause();
        }
    }

    /**
     * BGM再開
     */
    resumeBGM() {
        if (this.bgmPlayer) {
            this.bgmPlayer.resume();
        }
    }

    /**
     * 効果音再生（SE有効化版）
     * @param {string} soundName - 効果音名
     * @param {Object} options - 再生オプション
     */
    playSFX(soundName, options = {}) {
        try {
            console.log(`🔊 AudioManager: Playing SFX "${soundName}"`);
            
            if (this.isDisabled) {
                console.warn(`AudioManager: Cannot play SFX ${soundName} - system disabled`);
                return;
            }

            const player = this.sfxPlayers.get('main');
            if (player) {
                player.play(soundName, options);
            } else {
                console.warn(`AudioManager: SFX player not found`);
            }
        } catch (error) {
            console.warn(`AudioManager: Failed to play SFX ${soundName}:`, error.message || error);
            // エラーが発生してもゲームは続行
        }
    }

    /**
     * 効果音停止
     * @param {string} soundName - 効果音名
     */
    stopSFX(soundName) {
        const player = this.sfxPlayers.get('main');
        if (player) {
            player.stop(soundName);
        }
    }

    /**
     * すべての効果音停止
     */
    stopAllSFX() {
        for (const player of this.sfxPlayers.values()) {
            if (player.stopAll) {
                player.stopAll();
            }
        }
    }

    /**
     * フェードイン
     * @param {number} duration - フェード時間（秒）
     */
    fadeIn(duration = 1) {
        if (this.masterGain) {
            this.masterGain.gain.rampTo(this.masterVolume, duration);
        }
    }

    /**
     * フェードアウト
     * @param {number} duration - フェード時間（秒）
     */
    fadeOut(duration = 1) {
        if (this.masterGain) {
            this.masterGain.gain.rampTo(0, duration);
        }
    }

    /**
     * クロスフェード
     * @param {string} newTrack - 新しいトラック名
     * @param {number} duration - フェード時間（秒）
     */
    crossfade(newTrack, duration = 2) {
        if (!this.bgmPlayer) return;

        // 現在のBGMをフェードアウト
        if (this.bgmGain) {
            this.bgmGain.gain.rampTo(0, duration / 2);
        }

        // 新しいBGMを準備してフェードイン
        setTimeout(() => {
            this.playBGM(newTrack);
            if (this.bgmGain) {
                this.bgmGain.gain.rampTo(this.bgmVolume, duration / 2);
            }
        }, (duration / 2) * 1000);
    }

    /**
     * オーディオコンテキスト状態チェック
     * @returns {string} コンテキスト状態
     */
    getAudioContextState() {
        return Tone.context.state;
    }

    /**
     * システム状態取得
     * @returns {Object} システム状態
     */
    getSystemState() {
        return {
            isInitialized: this.isInitialized,
            isMuted: this.isMuted,
            masterVolume: this.masterVolume,
            bgmVolume: this.bgmVolume,
            sfxVolume: this.sfxVolume,
            audioContextState: this.getAudioContextState(),
            bgmPlayerLoaded: !!this.bgmPlayer,
            sfxPlayersCount: this.sfxPlayers.size
        };
    }

    /**
     * デバッグ情報取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        const state = this.getSystemState();
        return {
            ...state,
            toneVersion: Tone.version,
            sampleRate: Tone.context.sampleRate,
            baseLatency: Tone.context.baseLatency,
            outputLatency: Tone.context.outputLatency,
            sfxPlayers: Array.from(this.sfxPlayers.keys())
        };
    }

    /**
     * リソース解放
     */
    dispose() {
        try {
            // BGMプレイヤー解放
            if (this.bgmPlayer) {
                this.bgmPlayer.dispose();
                this.bgmPlayer = null;
            }

            // 効果音プレイヤー解放
            for (const player of this.sfxPlayers.values()) {
                if (player.dispose) {
                    player.dispose();
                }
            }
            this.sfxPlayers.clear();

            // ゲインノード解放
            if (this.masterGain) {
                this.masterGain.dispose();
                this.masterGain = null;
            }
            
            if (this.bgmGain) {
                this.bgmGain.dispose();
                this.bgmGain = null;
            }
            
            if (this.sfxGain) {
                this.sfxGain.dispose();
                this.sfxGain = null;
            }

            this.isInitialized = false;
            console.log('AudioManager: Disposed successfully');
        } catch (error) {
            console.error('AudioManager: Error during disposal:', error);
        }
    }

    /**
     * 緊急停止（すべての音声を即座に停止）
     */
    emergencyStop() {
        try {
            this.stopBGM();
            this.stopAllSFX();
            
            if (this.masterGain) {
                this.masterGain.gain.cancelScheduledValues(Tone.now());
                this.masterGain.gain.value = 0;
            }
            
            console.log('AudioManager: Emergency stop executed');
        } catch (error) {
            console.error('AudioManager: Error during emergency stop:', error);
        }
    }

    /**
     * パフォーマンス統計取得
     * @returns {Object} パフォーマンス統計
     */
    getPerformanceStats() {
        if (!this.isInitialized) {
            return { error: 'Not initialized' };
        }

        return {
            currentTime: Tone.now(),
            lookAhead: Tone.context.lookAhead,
            updateInterval: Tone.context.updateInterval,
            clockSource: Tone.Transport.state,
            activeVoices: this.getActiveVoicesCount()
        };
    }

    /**
     * アクティブな音声数取得
     * @private
     * @returns {number} アクティブな音声数
     */
    getActiveVoicesCount() {
        let count = 0;
        
        if (this.bgmPlayer && this.bgmPlayer.isPlaying) {
            count += this.bgmPlayer.getActiveVoices();
        }
        
        for (const player of this.sfxPlayers.values()) {
            if (player.isPlaying && player.getActiveVoices) {
                count += player.getActiveVoices();
            }
        }
        
        return count;
    }
}