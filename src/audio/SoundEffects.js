// Tone.js is loaded globally via CDN
const Tone = window.Tone || null;

/**
 * 効果音システム
 * ゲーム内の各種効果音を生成・再生
 */
export class SoundEffects {
    constructor() {
        this.isPlaying = false;
        this.voices = new Map(); // アクティブな音声管理
        this.isDisabled = false; // SEを有効化
        this.errorCount = 0; // エラーカウンター
        this.maxErrors = 10; // 最大エラー数
        this.lastErrorTime = 0; // 最後のエラー時刻
        this.contextCheckInterval = null; // コンテキスト状態チェックインターバル
        
        // Tone.jsが利用可能な場合のみ初期化
        if (!Tone) {
            console.warn('SoundEffects: Tone.js not available, audio disabled');
            this.isDisabled = true;
            return;
        }
        
        try {
            // 出力ノード
            this.output = new Tone.Gain(1);
        
        // 効果音用シンセサイザー
        this.synths = {
            // プレイヤー関連
            shoot: this.createShootSynth(),
            powerUp: this.createPowerUpSynth(),
            hit: this.createHitSynth(),
            death: this.createDeathSynth(),
            
            // 敵関連
            enemyShoot: this.createEnemyShootSynth(),
            enemyHit: this.createEnemyHitSynth(),
            enemyDeath: this.createEnemyDeathSynth(),
            
            // ボス関連
            bossShoot: this.createBossShootSynth(),
            bossHit: this.createBossHitSynth(),
            bossDeath: this.createBossDeathSynth(),
            bossWarning: this.createBossWarningSynth(),
            
            // UI関連
            menuSelect: this.createMenuSelectSynth(),
            menuConfirm: this.createMenuConfirmSynth(),
            menuCancel: this.createMenuCancelSynth(),
            
            // 特殊効果
            explosion: this.createExplosionSynth(),
            laser: this.createLaserSynth(),
            teleport: this.createTeleportSynth(),
            coin: this.createCoinSynth(),
            levelUp: this.createLevelUpSynth()
        };
        
        // エフェクト
        this.effects = {
            distortion: new Tone.Distortion(0.4).connect(this.output),
            bitCrusher: new Tone.BitCrusher(8).connect(this.output),
            reverb: new Tone.Reverb(0.5).connect(this.output),
            delay: new Tone.FeedbackDelay('8n', 0.2).connect(this.output)
        };
        
            // 各シンセをエフェクトに接続
            this.connectSynthsToEffects();
        } catch (error) {
            console.error('SoundEffects: Failed to initialize Tone.js components:', error);
            this.isDisabled = true;
        }
    }

    /**
     * シンセサイザーをエフェクトに接続
     */
    connectSynthsToEffects() {
        if (this.isDisabled || !Tone) return;
        
        try {
            // プレイヤー系は基本出力
            this.synths.shoot.connect(this.output);
        this.synths.powerUp.connect(this.effects.reverb);
        this.synths.hit.connect(this.effects.distortion);
        this.synths.death.connect(this.effects.reverb);
        
        // 敵系はビットクラッシュで8bit感
        this.synths.enemyShoot.connect(this.effects.bitCrusher);
        this.synths.enemyHit.connect(this.effects.bitCrusher);
        this.synths.enemyDeath.connect(this.effects.bitCrusher);
        
        // ボス系は迫力のあるエフェクト
        this.synths.bossShoot.connect(this.effects.distortion);
        this.synths.bossHit.connect(this.effects.distortion);
        this.synths.bossDeath.connect(this.effects.reverb);
        this.synths.bossWarning.connect(this.effects.delay);
        
        // UI系はクリアな音
        this.synths.menuSelect.connect(this.output);
        this.synths.menuConfirm.connect(this.output);
        this.synths.menuCancel.connect(this.output);
        
        // 特殊効果
        this.synths.explosion.connect(this.effects.distortion);
        this.synths.laser.connect(this.output);
        this.synths.teleport.connect(this.effects.delay);
        this.synths.coin.connect(this.output);
            this.synths.levelUp.connect(this.effects.reverb);
        } catch (error) {
            console.error('SoundEffects: Failed to connect synths to effects:', error);
            this.isDisabled = true;
        }
    }

    /**
     * プレイヤー射撃音シンセ作成
     */
    createShootSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.Synth({
            oscillator: {
                type: 'square'
            },
            envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0,
                release: 0.1
            }
        });
    }

    /**
     * パワーアップ音シンセ作成
     */
    createPowerUpSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: 'triangle'
            },
            envelope: {
                attack: 0.02,
                decay: 0.3,
                sustain: 0.2,
                release: 0.8
            }
        });
    }

    /**
     * プレイヤーヒット音シンセ作成
     */
    createHitSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.NoiseSynth({
            noise: {
                type: 'pink'
            },
            envelope: {
                attack: 0,
                decay: 0.2,
                sustain: 0,
                release: 0.2
            }
        });
    }

    /**
     * プレイヤー死亡音シンセ作成
     */
    createDeathSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.Synth({
            oscillator: {
                type: 'sawtooth'
            },
            envelope: {
                attack: 0.1,
                decay: 1.0,
                sustain: 0,
                release: 1.0
            }
        });
    }

    /**
     * 敵射撃音シンセ作成
     */
    createEnemyShootSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.Synth({
            oscillator: {
                type: 'pulse',
                width: 0.3
            },
            envelope: {
                attack: 0.01,
                decay: 0.08,
                sustain: 0,
                release: 0.08
            }
        });
    }

    /**
     * 敵ヒット音シンセ作成
     */
    createEnemyHitSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.MetalSynth({
            frequency: 200,
            envelope: {
                attack: 0.001,
                decay: 0.1,
                release: 0.2
            },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
        });
    }

    /**
     * 敵死亡音シンセ作成
     */
    createEnemyDeathSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.FMSynth({
            harmonicity: 3,
            modulationIndex: 10,
            detune: 0,
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.01,
                decay: 0.3,
                sustain: 0,
                release: 0.5
            },
            modulation: {
                type: 'square'
            },
            modulationEnvelope: {
                attack: 0.5,
                decay: 0,
                sustain: 1,
                release: 0.5
            }
        });
    }

    /**
     * ボス射撃音シンセ作成
     */
    createBossShootSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.Synth({
            oscillator: {
                type: 'fatsawtooth'
            },
            envelope: {
                attack: 0.03,
                decay: 0.2,
                sustain: 0.1,
                release: 0.3
            }
        });
    }

    /**
     * ボスヒット音シンセ作成
     */
    createBossHitSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.MetalSynth({
            frequency: 150,
            envelope: {
                attack: 0.001,
                decay: 0.15,
                release: 0.3
            },
            harmonicity: 3.1,
            modulationIndex: 64,
            resonance: 6000,
            octaves: 2
        });
    }

    /**
     * ボス死亡音シンセ作成
     */
    createBossDeathSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.FMSynth({
            harmonicity: 1,
            modulationIndex: 30,
            oscillator: {
                type: 'sawtooth'
            },
            envelope: {
                attack: 0.1,
                decay: 2.0,
                sustain: 0,
                release: 3.0
            },
            modulation: {
                type: 'sine'
            },
            modulationEnvelope: {
                attack: 2.0,
                decay: 0,
                sustain: 1,
                release: 2.0
            }
        });
    }

    /**
     * ボス警告音シンセ作成
     */
    createBossWarningSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.Oscillator({
            frequency: 100,
            type: 'sawtooth'
        });
    }

    /**
     * メニュー選択音シンセ作成
     */
    createMenuSelectSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.Synth({
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0,
                release: 0.1
            }
        });
    }

    /**
     * メニュー確定音シンセ作成
     */
    createMenuConfirmSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: 'triangle'
            },
            envelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.1,
                release: 0.3
            }
        });
    }

    /**
     * メニューキャンセル音シンセ作成
     */
    createMenuCancelSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.Synth({
            oscillator: {
                type: 'square'
            },
            envelope: {
                attack: 0.01,
                decay: 0.15,
                sustain: 0,
                release: 0.15
            }
        });
    }

    /**
     * 爆発音シンセ作成
     */
    createExplosionSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.NoiseSynth({
            noise: {
                type: 'brown'
            },
            envelope: {
                attack: 0.001,
                decay: 0.3,
                sustain: 0,
                release: 0.4
            }
        });
    }

    /**
     * レーザー音シンセ作成
     */
    createLaserSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.Synth({
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.001,
                decay: 0.2,
                sustain: 0.1,
                release: 0.3
            }
        });
    }

    /**
     * テレポート音シンセ作成
     */
    createTeleportSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.FMSynth({
            harmonicity: 8,
            modulationIndex: 25,
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.01,
                decay: 0.8,
                sustain: 0,
                release: 1.0
            },
            modulation: {
                type: 'square'
            }
        });
    }

    /**
     * コイン音シンセ作成
     */
    createCoinSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: 'triangle'
            },
            envelope: {
                attack: 0.01,
                decay: 0.15,
                sustain: 0,
                release: 0.2
            }
        });
    }

    /**
     * レベルアップ音シンセ作成
     */
    createLevelUpSynth() {
        if (this.isDisabled || !Tone) return null;
        return new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: 'triangle'
            },
            envelope: {
                attack: 0.02,
                decay: 0.4,
                sustain: 0.3,
                release: 1.0
            }
        });
    }

    /**
     * 効果音再生（超軽量版）
     * @param {string} soundName - 効果音名
     * @param {Object} options - 再生オプション
     */
    play(soundName, options = {}) {
        try {
            console.log(`🔊 SoundEffects: Simple play attempt for "${soundName}"`);
            
            if (this.isDisabled || !Tone) {
                console.warn('SoundEffects: Cannot play - audio disabled');
                return;
            }
            
            // 超軽量：基本的な効果音のみサポート
            this.playSimpleSound(soundName);
            
        } catch (error) {
            console.error(`❌ SoundEffects: Error playing "${soundName}":`, error.message || error);
            // エラーでもゲームは続行
        }
    }

    /**
     * 軽量効果音再生
     * @param {string} soundName - 効果音名
     */
    playSimpleSound(soundName) {
        if (!Tone || this.isDisabled) return;
        
        try {
            // 超シンプルな効果音マッピング
            const soundMap = {
                'shoot': () => this.playSimpleTone('C5', '8n'),
                'hit': () => this.playSimpleTone('C3', '16n'),
                'enemyDeath': () => this.playSimpleTone('G3', '4n'),
                'powerUp': () => this.playSimpleTone('C4', '2n'),
                'menuSelect': () => this.playSimpleTone('A4', '8n'),
                'questionBoxHit': () => this.playSimpleTone('F4', '16n'),
                'itemGet': () => this.playSimpleTone('E5', '4n'),
                'damage': () => this.playSimpleTone('C2', '8n')
            };
            
            const playFunction = soundMap[soundName];
            if (playFunction) {
                playFunction();
                console.log(`✅ SoundEffects: Played simple "${soundName}"`);
            } else {
                console.log(`SoundEffects: Unknown sound "${soundName}"`);
            }
        } catch (error) {
            console.warn(`SoundEffects: Failed to play simple sound "${soundName}":`, error.message);
        }
    }

    /**
     * 最小限のトーン再生
     * @param {string} note - 音程
     * @param {string} duration - 長さ
     */
    playSimpleTone(note, duration) {
        try {
            if (!this.simpleOsc) {
                // 軽量シンセサイザー作成（初回のみ）
                this.simpleOsc = new Tone.Oscillator().toDestination();
            }
            
            if (Tone.context.state === 'suspended') {
                Tone.start().then(() => {
                    this.triggerSimpleSound(note, duration);
                });
            } else {
                this.triggerSimpleSound(note, duration);
            }
        } catch (error) {
            console.warn('Failed to play simple tone:', error.message);
        }
    }

    /**
     * シンプル音再生実行
     * @param {string} note - 音程
     * @param {string} duration - 長さ
     */
    triggerSimpleSound(note, duration) {
        try {
            const osc = new Tone.Oscillator(note, 'sine').toDestination();
            osc.start();
            osc.stop(Tone.now() + Tone.Time(duration).toSeconds());
        } catch (error) {
            console.warn('Failed to trigger simple sound:', error.message);
        }
    }

    /**
     * 緊急用音響再生可能チェック
     * @param {Object} synth - チェック対象のシンセサイザー
     * @returns {boolean} 再生可能かどうか
     */
    canPlaySoundEmergency(synth) {
        // 基本的な可用性チェック
        if (this.isDisabled || !Tone) {
            console.warn('SoundEffects: Audio disabled or Tone.js not available');
            return false;
        }
        
        // オーディオコンテキスト状態チェック
        if (Tone.context.state !== 'running') {
            console.warn('SoundEffects: AudioContext not running');
            return false;
        }
        
        // シンセサイザーの有効性チェック
        if (!synth) {
            console.warn('SoundEffects: Synth is null');
            return false;
        }
        
        // Dispose状態チェック
        if (synth.disposed === true) {
            console.warn('SoundEffects: Synth is disposed');
            return false;
        }
        
        // triggerAttackReleaseメソッドの存在チェック
        if (typeof synth.triggerAttackRelease !== 'function') {
            console.warn('SoundEffects: Synth does not have triggerAttackRelease method');
            console.log('SoundEffects: Synth type:', synth.constructor?.name);
            console.log('SoundEffects: Synth methods:', Object.getOwnPropertyNames(synth));
            return false;
        }
        
        return true;
    }

    /**
     * 個別効果音再生処理
     * @param {string} soundName - 効果音名
     * @param {Object} synth - シンセサイザー
     * @param {Object} options - 再生オプション
     */
    playSound(soundName, synth, options) {
        const {
            note = this.getDefaultNote(soundName),
            duration = this.getDefaultDuration(soundName),
            volume = 1,
            pitch = 1,
            delay = 0
        } = options;

        const time = Tone.now() + delay;
        const actualNote = this.applyPitch(note, pitch);
        const actualVolume = Math.max(0, Math.min(1, volume));

        // ボリューム調整
        if (synth.volume) {
            synth.volume.value = Tone.gainToDb(actualVolume);
        }

        // 特殊な効果音の処理
        switch (soundName) {
            case 'powerUp':
                this.playPowerUpSequence(synth, actualVolume);
                break;
            case 'levelUp':
                this.playLevelUpSequence(synth, actualVolume);
                break;
            case 'menuConfirm':
                this.playMenuConfirmSequence(synth, actualVolume);
                break;
            case 'bossWarning':
                this.playBossWarningSequence(synth, actualVolume);
                break;
            case 'teleport':
                this.playTeleportSequence(synth, actualVolume);
                break;
            case 'coin':
                this.playCoinSequence(synth, actualVolume);
                break;
            default:
                // 通常の効果音 - 安全な実行
                this.safeTriggerAttackRelease(synth, actualNote, duration, time);
                break;
        }
    }

    /**
     * パワーアップシーケンス再生
     */
    playPowerUpSequence(synth, volume) {
        const notes = ['C4', 'E4', 'G4', 'C5'];
        notes.forEach((note, index) => {
            setTimeout(() => {
                this.safeTriggerAttackRelease(synth, note, '8n');
            }, index * 100);
        });
    }

    /**
     * レベルアップシーケンス再生
     */
    playLevelUpSequence(synth, volume) {
        const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        notes.forEach((note, index) => {
            setTimeout(() => {
                this.safeTriggerAttackRelease(synth, note, '16n');
            }, index * 80);
        });
    }

    /**
     * メニュー確定シーケンス再生
     */
    playMenuConfirmSequence(synth, volume) {
        const chord = ['C4', 'E4', 'G4'];
        this.safeTriggerAttackRelease(synth, chord, '4n');
    }

    /**
     * ボス警告シーケンス再生
     */
    playBossWarningSequence(synth, volume) {
        // 低音の警告音を断続的に再生
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.safeTriggerAttackRelease(synth, 'A2', '8n');
            }, i * 200);
        }
    }

    /**
     * テレポートシーケンス再生
     */
    playTeleportSequence(synth, volume) {
        try {
            if (!this.canPlaySound(synth)) return;
            
            // 上昇→下降のピッチベンド効果
            synth.triggerAttack('C4', Tone.now());
            
            // ピッチを上昇させてから下降
            if (synth.frequency && synth.frequency.rampTo) {
                synth.frequency.rampTo('C6', 0.3);
                setTimeout(() => {
                    if (synth.frequency && synth.frequency.rampTo) {
                        synth.frequency.rampTo('C2', 0.5);
                        setTimeout(() => {
                            if (synth.triggerRelease && !synth.disposed) {
                                synth.triggerRelease();
                            }
                        }, 500);
                    }
                }, 300);
            }
        } catch (error) {
            console.warn('SoundEffects: Teleport sequence failed:', error);
        }
    }

    /**
     * コインシーケンス再生
     */
    playCoinSequence(synth, volume) {
        const notes = ['E5', 'B5'];
        notes.forEach((note, index) => {
            setTimeout(() => {
                this.safeTriggerAttackRelease(synth, note, '16n');
            }, index * 50);
        });
    }

    /**
     * デフォルト音程取得
     * @param {string} soundName - 効果音名
     * @returns {string} デフォルト音程
     */
    getDefaultNote(soundName) {
        const defaultNotes = {
            shoot: 'C5',
            powerUp: 'C4',
            hit: 'C3',
            death: 'C2',
            enemyShoot: 'G4',
            enemyHit: 'F3',
            enemyDeath: 'D3',
            bossShoot: 'A2',
            bossHit: 'E2',
            bossDeath: 'C1',
            bossWarning: 'A2',
            menuSelect: 'A4',
            menuConfirm: 'C5',
            menuCancel: 'F4',
            explosion: 'C2',
            laser: 'B4',
            teleport: 'C4',
            coin: 'E5',
            levelUp: 'C4'
        };
        
        return defaultNotes[soundName] || 'C4';
    }

    /**
     * デフォルト再生時間取得
     * @param {string} soundName - 効果音名
     * @returns {string} デフォルト再生時間
     */
    getDefaultDuration(soundName) {
        const defaultDurations = {
            shoot: '16n',
            powerUp: '4n',
            hit: '16n',
            death: '2n',
            enemyShoot: '16n',
            enemyHit: '8n',
            enemyDeath: '4n',
            bossShoot: '8n',
            bossHit: '4n',
            bossDeath: '1n',
            bossWarning: '2n',
            menuSelect: '16n',
            menuConfirm: '4n',
            menuCancel: '8n',
            explosion: '4n',
            laser: '8n',
            teleport: '2n',
            coin: '16n',
            levelUp: '2n'
        };
        
        return defaultDurations[soundName] || '8n';
    }

    /**
     * ピッチ調整適用
     * @param {string} note - 元の音程
     * @param {number} pitch - ピッチ倍率
     * @returns {string} 調整後の音程
     */
    applyPitch(note, pitch) {
        if (pitch === 1) return note;
        
        // 簡易的なピッチ調整（実際のアプリケーションではより高度な処理が必要）
        const noteMap = {
            'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
            'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
        };
        
        const reverseMap = Object.keys(noteMap);
        
        // 基本的なピッチシフト（octave単位）
        if (pitch > 1.5) return note.replace(/\d/, (octave) => Math.min(8, parseInt(octave) + 1));
        if (pitch < 0.7) return note.replace(/\d/, (octave) => Math.max(0, parseInt(octave) - 1));
        
        return note;
    }

    /**
     * 効果音停止
     * @param {string} soundName - 効果音名
     */
    stop(soundName) {
        const synth = this.synths[soundName];
        if (synth && synth.triggerRelease) {
            synth.triggerRelease();
        }
    }

    /**
     * すべての効果音停止
     */
    stopAll() {
        for (const synth of Object.values(this.synths)) {
            if (synth && synth.triggerRelease) {
                synth.triggerRelease();
            }
        }
    }

    /**
     * アクティブな音声数取得
     * @returns {number} アクティブな音声数
     */
    getActiveVoices() {
        let count = 0;
        for (const synth of Object.values(this.synths)) {
            if (synth && synth.activeVoices !== undefined) {
                count += synth.activeVoices;
            }
        }
        return count;
    }

    /**
     * 安全なtriggerAttackRelease実行
     * @param {Object} synth - シンセサイザー
     * @param {string|Array} note - 音符
     * @param {string|number} duration - 持続時間
     * @param {number} time - 再生時間
     */
    safeTriggerAttackRelease(synth, note, duration, time = Tone.now()) {
        try {
            // 再生前の最終チェック
            if (!this.canPlaySound(synth)) {
                return;
            }
            
            // パラメータ検証
            if (!note || !duration) {
                console.warn('SoundEffects: Invalid note or duration for triggerAttackRelease');
                return;
            }
            
            // 配列とスカラーの分岐処理
            if (Array.isArray(note)) {
                synth.triggerAttackRelease(note, duration, time);
            } else {
                synth.triggerAttackRelease(note, duration, time);
            }
        } catch (error) {
            // triggerAttackReleaseの実行エラーをキャッチ
            console.warn('SoundEffects: triggerAttackRelease failed:', error.message || error);
            this.incrementErrorCount();
            
            // エラー情報をより詳細に記録
            console.warn('SoundEffects: Failed parameters:', {
                note,
                duration,
                time,
                synthState: synth ? {
                    disposed: synth.disposed,
                    type: synth.constructor.name
                } : 'null synth'
            });
        }
    }
    
    /**
     * 音響再生可能チェック（修正版）
     * @param {Object} synth - チェック対象のシンセサイザー
     * @returns {boolean} 再生可能かどうか
     */
    canPlaySound(synth) {
        // 基本的な可用性チェック
        if (this.isDisabled || !Tone) {
            return false;
        }
        
        // シンセサイザーの存在チェック
        if (!synth) {
            return false;
        }
        
        // AudioContextの状態チェックを緩和（suspendedでも可）
        if (Tone.context.state === 'closed') {
            console.warn('SoundEffects: AudioContext is closed');
            return false;
        }
        
        // シンセサイザーの有効性チェック
        if (!synth) {
            return false;
        }
        
        // Dispose状態チェック
        if (synth.disposed === true) {
            console.warn('SoundEffects: Synth is disposed, cannot play sound');
            return false;
        }
        
        // triggerAttackReleaseメソッドの存在チェック
        if (typeof synth.triggerAttackRelease !== 'function') {
            console.warn('SoundEffects: Synth does not have triggerAttackRelease method');
            return false;
        }
        
        return true;
    }
    
    /**
     * エラーカウンター増加
     */
    incrementErrorCount() {
        this.errorCount++;
        this.lastErrorTime = Date.now();
        
        if (this.errorCount >= this.maxErrors) {
            console.warn(`SoundEffects: Maximum errors (${this.maxErrors}) reached, disabling audio`);
            this.disableAudioDueToErrors();
        }
    }
    
    /**
     * エラーによる音声無効化判定
     * @returns {boolean} 音声を無効化すべきか
     */
    shouldDisableAudio() {
        return this.errorCount >= this.maxErrors;
    }
    
    /**
     * エラーによる音声システム無効化
     */
    disableAudioDueToErrors() {
        this.isDisabled = true;
        console.warn('SoundEffects: Audio system disabled due to excessive errors');
        
        // コンテキスト監視停止
        if (this.contextCheckInterval) {
            clearInterval(this.contextCheckInterval);
            this.contextCheckInterval = null;
        }
    }
    
    /**
     * 音声システムの状態情報取得
     * @returns {Object} 状態情報
     */
    getStatus() {
        return {
            isDisabled: this.isDisabled,
            errorCount: this.errorCount,
            maxErrors: this.maxErrors,
            contextState: Tone?.context?.state || 'unknown',
            timeSinceLastError: this.lastErrorTime > 0 ? Date.now() - this.lastErrorTime : 0
        };
    }
    
    /**
     * 音響エラーハンドリング
     * @param {string} soundName - 効果音名
     * @param {Error} error - エラーオブジェクト
     */
    handleAudioError(soundName, error) {
        console.warn(`SoundEffects: Failed to play "${soundName}":`, error.message || error);
        
        // 特定のエラーに対する対処
        if (error.message && error.message.includes('disposed')) {
            console.warn(`SoundEffects: Synth for "${soundName}" was disposed, attempting recovery`);
            this.attemptSynthRecovery(soundName);
        } else if (error.message && error.message.includes('context')) {
            console.warn('SoundEffects: Audio context issue detected');
            // AudioContextの復旧は AudioManager に委任
        }
    }
    
    /**
     * シンセサイザー復旧試行
     * @param {string} soundName - 効果音名
     */
    attemptSynthRecovery(soundName) {
        try {
            // 該当するシンセサイザーの再生成を試みる
            if (this.synths[soundName] && this.synths[soundName].disposed) {
                console.log(`SoundEffects: Attempting to recreate synth for "${soundName}"`);
                
                // 既存のシンセを削除
                this.synths[soundName] = null;
                
                // 新しいシンセを生成（既存の生成メソッドを使用）
                const createMethod = `create${soundName.charAt(0).toUpperCase() + soundName.slice(1)}Synth`;
                if (typeof this[createMethod] === 'function') {
                    this.synths[soundName] = this[createMethod]();
                    console.log(`SoundEffects: Successfully recreated synth for "${soundName}"`);
                }
            }
        } catch (recoveryError) {
            console.warn(`SoundEffects: Failed to recover synth for "${soundName}":`, recoveryError);
        }
    }

    /**
     * リソース解放
     */
    dispose() {
        // コンテキスト監視停止
        if (this.contextCheckInterval) {
            clearInterval(this.contextCheckInterval);
            this.contextCheckInterval = null;
        }
        
        this.stopAll();
        
        // シンセサイザー解放
        for (const synth of Object.values(this.synths)) {
            if (synth && synth.dispose) {
                synth.dispose();
            }
        }
        
        // エフェクト解放
        for (const effect of Object.values(this.effects)) {
            if (effect && effect.dispose) {
                effect.dispose();
            }
        }
        
        // 出力ノード解放
        if (this.output) {
            this.output.dispose();
        }
        
        console.log('SoundEffects: Disposed');
    }
}