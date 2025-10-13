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
        
        // 🎵 MP3サウンドエフェクト (優先的に使用)
        this.mp3Sounds = {
            explosion: new Audio('/audio/se/explosion.mp3'),
            muteki: new Audio('/audio/se/muteki.mp3'),
            boss_death: new Audio('/audio/se/boss_death.mp3'),
            item_get: new Audio('/audio/se/item_get.mp3'),
            enemy_death: new Audio('/audio/se/enemy_death.mp3'),
            boss_hit: new Audio('/audio/se/boss_hit.mp3'),
            question_box_hit: new Audio('/audio/se/question_box_hit.mp3'),
            spark_attack: new Audio('/audio/se/spark_attack.mp3')
        };
        
        // MP3音量設定 (BGMより小さく)
        Object.values(this.mp3Sounds).forEach(audio => {
            audio.volume = 0.3;
        });
        
        // Tone.jsが利用可能な場合のみ初期化
        if (!Tone) {
            console.warn('SoundEffects: Tone.js not available, audio disabled');
            this.isDisabled = true;
            return;
        }
        
        try {
            // 出力ノード（SE音量を0.05に設定 = 5%）
            this.output = new Tone.Gain(0.05);
        
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
            
            // 🎵 MP3サウンドマッピング（優先使用）
            const mp3Map = {
                'explosion': 'explosion',
                'bossDeath': 'boss_death',
                'enemyDeath': 'enemy_death',
                'bossHit': 'enemy_death',  // ボス着弾音
                'powerUp': 'item_get',
                'itemGet': 'item_get',
                'questionBoxHit': 'question_box_hit',
                'muteki': 'muteki',
                'sparkAttack': 'spark_attack',
                'hit': 'enemy_death'  // 敵着弾音
            };

            // MP3が存在する場合は再生
            if (mp3Map[soundName] && this.mp3Sounds && this.mp3Sounds[mp3Map[soundName]]) {
                try {
                    const audio = this.mp3Sounds[mp3Map[soundName]];
                    audio.currentTime = 0;
                    audio.play().catch(e => console.warn('MP3 playback failed:', e));
                    console.log(`✅ Playing MP3: ${mp3Map[soundName]}`);
                    return; // MP3再生成功したらTone.jsはスキップ
                } catch (error) {
                    console.warn('MP3 playback error, falling back to Tone.js:', error);
                }
            }
            
            // MP3がない場合はTone.jsで再生（フォールバック）
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
            // 任天堂風の気持ちいい効果音マッピング
            const soundMap = {
                'shoot': () => this.playNintendoSound('shoot'),
                'hit': () => this.playNintendoSound('hit'),
                'death': () => this.playNintendoSound('death'),
                'enemyDeath': () => this.playNintendoSound('enemyDeath'),
                'bossHit': () => this.playNintendoSound('bossHit'),
                'bossDeath': () => this.playNintendoSound('bossDeath'),
                'bossWarning': () => this.playNintendoSound('bossWarning'),
                'powerUp': () => this.playNintendoSound('powerUp'),
                'explosion': () => this.playNintendoSound('explosion'),
                'menuSelect': () => this.playNintendoSound('menuSelect'),
                'questionBoxHit': () => this.playNintendoSound('questionBoxHit'),
                'itemGet': () => this.playNintendoSound('itemGet'),
                'damage': () => this.playNintendoSound('damage')
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
     * 任天堂風SE再生（マリオ、ゼルダ風）
     * @param {string} soundType - 効果音タイプ
     */
    playNintendoSound(soundType) {
        try {
            if (Tone.context.state === 'suspended') {
                Tone.start().then(() => {
                    this.triggerNintendoSound(soundType);
                });
            } else {
                this.triggerNintendoSound(soundType);
            }
        } catch (error) {
            console.warn('Failed to play Nintendo sound:', error.message);
        }
    }

    /**
     * 任天堂風SE実行（マリオ、ゼルダ風の気持ちいい音）
     * @param {string} soundType - 効果音タイプ
     */
    triggerNintendoSound(soundType) {
        try {
            const now = Tone.now();

            switch(soundType) {
                case 'shoot': // レーザー発射音（柔らかいレーザー音）
                    this.playSingleNote('C6', '64n', 'sine', -98);
                    setTimeout(() => this.playSingleNote('E6', '64n', 'sine', -99), 20);
                    break;

                case 'hit': // プレイヤーダメージ（下降する衝撃音）
                    this.playSweepSound(400, 100, '16n', 'triangle', -96);
                    setTimeout(() => this.playNoiseSound('32n', 200, -98), 30);
                    break;

                case 'death': // プレイヤー死亡（下降メロディ）
                    this.playMelodicSound(['E5', 'D5', 'C5', 'G4', 'E4'], ['32n', '32n', '32n', '32n', '8n'], -95);
                    break;

                case 'enemyDeath': // 敵撃破（爽快な上昇音）
                    this.playMelodicSound(['C5', 'E5', 'G5'], ['64n', '64n', '32n'], -98);
                    break;

                case 'bossHit': // ボス被弾（重厚な衝撃音）
                    this.playNoiseSound('32n', 100, -96);
                    setTimeout(() => this.playSingleNote('C3', '16n', 'triangle', -95), 20);
                    break;

                case 'bossDeath': // ボス撃破（大爆発音）
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            this.playNoiseSound('8n', 100, -95);
                            this.playSweepSound(300 - i * 50, 50, '16n', 'sawtooth', -95);
                        }, i * 100);
                    }
                    break;

                case 'bossWarning': // 警告音（緊迫感のあるサイレン）
                    this.playSweepSound(600, 1000, '8n', 'square', -96);
                    setTimeout(() => this.playSweepSound(1000, 600, '8n', 'square', -96), 150);
                    break;

                case 'powerUp': // アイテム取得（キラキラ上昇音）
                    this.playMelodicSound(['C5', 'E5', 'G5', 'C6'], ['64n', '64n', '64n', '16n'], -96);
                    break;

                case 'explosion': // 爆発音（衝撃波）
                    this.playNoiseSound('16n', 150, -96);
                    setTimeout(() => this.playSweepSound(200, 50, '16n', 'triangle', -98), 30);
                    break;

                case 'menuSelect': // メニュー選択（心地よい音）
                    this.playSingleNote('C6', '64n', 'sine', -96);
                    setTimeout(() => this.playSingleNote('E6', '64n', 'sine', -98), 20);
                    break;

                case 'questionBoxHit': // コンコン（ボックス叩く）
                    this.playSingleNote('C5', '32n', 'triangle', -98);
                    setTimeout(() => this.playSingleNote('C6', '32n', 'triangle', -98), 50);
                    break;

                case 'itemGet': // チャリーン（アイテム取得）
                    this.playMelodicSound(['E5', 'G5', 'C6'], ['32n', '32n', '8n'], -98);
                    break;

                case 'sparkAttack': // ⚡ スパーク攻撃（全敵撃破）
                    // 派手な上昇音と爆発音の組み合わせ
                    this.playSweepSound(100, 1200, '16n', 'square', -95);
                    setTimeout(() => this.playNoiseSound('8n', 800, -96), 50);
                    setTimeout(() => this.playSingleNote('C6', '4n', 'sine', -95), 100);
                    break;

                default:
                    this.playSingleNote('C5', '16n', 'triangle', -10);
            }
        } catch (error) {
            console.warn('Failed to trigger Nintendo sound:', error.message);
        }
    }

    /**
     * スイープ音再生（周波数変化）
     */
    playSweepSound(startFreq, endFreq, duration, type = 'triangle', volume = -70) {
        const synth = new Tone.Synth({
            oscillator: { type: type },
            envelope: { attack: 0.001, decay: 0.1, sustain: 0.3, release: 0.1 }
        });

        const vol = new Tone.Volume(volume).toDestination();
        synth.connect(vol);

        synth.frequency.setValueAtTime(startFreq, Tone.now());
        synth.frequency.exponentialRampToValueAtTime(endFreq, Tone.now() + Tone.Time(duration).toSeconds());
        synth.triggerAttackRelease(duration, Tone.now());

        setTimeout(() => {
            synth.dispose();
            vol.dispose();
        }, Tone.Time(duration).toSeconds() * 1000 + 100);
    }

    /**
     * ノイズ音再生（爆発・衝撃音）
     */
    playNoiseSound(duration, filterFreq = 100, volume = -50) {
        const noise = new Tone.Noise('white').start();
        const filter = new Tone.Filter(filterFreq, 'lowpass');
        const envelope = new Tone.AmplitudeEnvelope({
            attack: 0.001,
            decay: 0.1,
            sustain: 0.1,
            release: 0.1
        });
        const vol = new Tone.Volume(volume).toDestination();

        noise.connect(filter);
        filter.connect(envelope);
        envelope.connect(vol);

        envelope.triggerAttackRelease(duration);

        setTimeout(() => {
            noise.stop();
            noise.dispose();
            filter.dispose();
            envelope.dispose();
            vol.dispose();
        }, Tone.Time(duration).toSeconds() * 1000 + 100);
    }

    /**
     * メロディック音再生（音階のシーケンス）
     */
    playMelodicSound(notes, durations, volume = -50) {
        notes.forEach((note, i) => {
            setTimeout(() => {
                this.playSingleNote(note, durations[i] || '16n', 'square', volume);
            }, i * 50);
        });
    }

    /**
     * 和音再生（コード）
     */
    playChordSound(notes, duration, volume = -48) {
        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.001, decay: 0.1, sustain: 0.2, release: 0.1 }
        });

        const vol = new Tone.Volume(volume).toDestination();
        synth.connect(vol);

        synth.triggerAttackRelease(notes, duration);

        setTimeout(() => {
            synth.dispose();
            vol.dispose();
        }, Tone.Time(duration).toSeconds() * 1000 + 100);
    }

    /**
     * 単音再生
     */
    playSingleNote(note, duration, type = 'triangle', volume = -60) {
        const synth = new Tone.Synth({
            oscillator: { type: type },
            envelope: { attack: 0.001, decay: 0.1, sustain: 0.3, release: 0.1 }
        });

        const vol = new Tone.Volume(volume).toDestination();
        synth.connect(vol);

        synth.triggerAttackRelease(note, duration);

        setTimeout(() => {
            synth.dispose();
            vol.dispose();
        }, Tone.Time(duration).toSeconds() * 1000 + 100);
    }

    /**
     * FM音源風SE再生実行（YM2612/YM2151風）
     * @param {string} note - 音程
     * @param {string} duration - 長さ
     * @param {string} type - 効果音タイプ
     */
    triggerSimpleSound(note, duration, type = 'default') {
        try {
            const now = Tone.now();

            // タイプ別にFM音源パラメータを設定
            let harmonicity = 3;
            let modulationIndex = 10;
            let envelopeSettings = { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 };
            let modEnvelopeSettings = { attack: 0.005, decay: 0.1, sustain: 0.5, release: 0.1 };
            let volumeDb = -12;

            switch(type) {
                case 'shoot': // 発射音：鋭いレーザー音（無効化済み）
                    harmonicity = 8;
                    modulationIndex = 20;
                    envelopeSettings = { attack: 0.001, decay: 0.05, sustain: 0.1, release: 0.05 };
                    modEnvelopeSettings = { attack: 0.001, decay: 0.03, sustain: 0.1, release: 0.03 };
                    volumeDb = -70;
                    break;

                case 'powerUp': // パワーアップ：キラキラした上昇音（必要最小限）
                    harmonicity = 5;
                    modulationIndex = 10;
                    envelopeSettings = { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.3 };
                    modEnvelopeSettings = { attack: 0.005, decay: 0.2, sustain: 0.5, release: 0.2 };
                    volumeDb = -50;
                    break;

                case 'damage': // ダメージ：重く歪んだ音（さらに控えめに）
                    harmonicity = 1.5;
                    modulationIndex = 15;
                    envelopeSettings = { attack: 0.001, decay: 0.08, sustain: 0.08, release: 0.06 };
                    modEnvelopeSettings = { attack: 0.001, decay: 0.06, sustain: 0.15, release: 0.06 };
                    volumeDb = -60;
                    break;

                case 'boss': // ボス関連：迫力ある重厚な音（必要最小限）
                    harmonicity = 2;
                    modulationIndex = 25;
                    envelopeSettings = { attack: 0.01, decay: 0.15, sustain: 0.4, release: 0.2 };
                    modEnvelopeSettings = { attack: 0.005, decay: 0.12, sustain: 0.5, release: 0.15 };
                    volumeDb = -45;
                    break;

                default: // デフォルト：柔らかいFM音
                    harmonicity = 3;
                    modulationIndex = 10;
                    envelopeSettings = { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 };
                    modEnvelopeSettings = { attack: 0.005, decay: 0.1, sustain: 0.5, release: 0.1 };
                    volumeDb = -55;
            }

            // FM音源シンセサイザー作成
            const synth = new Tone.FMSynth({
                harmonicity: harmonicity,
                modulationIndex: modulationIndex,
                oscillator: { type: 'sine' },
                envelope: envelopeSettings,
                modulation: { type: 'square' },
                modulationEnvelope: modEnvelopeSettings
            });

            // 音量調整
            const volume = new Tone.Volume(volumeDb).connect(Tone.Destination);
            synth.connect(volume);

            // 音を鳴らす
            synth.triggerAttackRelease(note, duration, now);

            // クリーンアップ
            setTimeout(() => {
                synth.dispose();
                volume.dispose();
            }, Tone.Time(duration).toSeconds() * 1000 + 100);

        } catch (error) {
            console.warn('Failed to trigger FM sound:', error.message);
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
    playSound(soundName, synth, options = {}) {
        // 🎵 MP3サウンドマッピング（優先使用）
        const mp3Map = {
            'explosion': 'explosion',
            'bossDeath': 'boss_death',
            'enemyDeath': 'enemy_death',
            'bossHit': 'boss_hit',
            'powerUp': 'item_get',
            'itemGet': 'item_get',
            'questionBoxHit': 'question_box_hit',
            'muteki': 'muteki',
            'sparkAttack': 'spark_attack'
        };

        // MP3が存在する場合は再生
        if (mp3Map[soundName] && this.mp3Sounds[mp3Map[soundName]]) {
            try {
                const audio = this.mp3Sounds[mp3Map[soundName]];
                audio.currentTime = 0;
                audio.play().catch(e => console.warn('MP3 playback failed:', e));
                return; // MP3再生成功したらTone.jsはスキップ
            } catch (error) {
                console.warn('MP3 playback error, falling back to Tone.js:', error);
            }
        }

        // MP3がない場合はTone.jsで再生（フォールバック）
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
     * メニュー確定シーケンス再生（シンプルな単音に変更）
     */
    playMenuConfirmSequence(synth, volume) {
        this.playSingleNote('C5', '16n', 'sine', -58);
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