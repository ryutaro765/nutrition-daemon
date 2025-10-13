import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * ボス登場演出表示システム
 * StageNameDisplayと同じスタイルでボスの登場を演出
 */
export class BossIntroDisplay {
    constructor() {
        this.isVisible = false;
        this.currentBoss = 0;
        this.displayTimer = 0;
        this.maxDisplayTime = 180; // 3秒間表示 (60fps * 3)

        // 表示フェーズ
        this.phases = {
            FADE_IN: 0,
            HOLD: 1,
            FADE_OUT: 2,
            HIDDEN: 3
        };

        this.currentPhase = this.phases.HIDDEN;
        this.fadeInDuration = 30;  // 0.5秒間フェードイン
        this.holdDuration = 120;   // 2秒間表示（ボスBGMを聞かせる）
        this.fadeOutDuration = 30; // 0.5秒間フェードアウト
        
        this.alpha = 0;
        this.titleAlpha = 0;
        this.subtitleAlpha = 0;
        
        // ボス情報（各ステージのボス）
        this.bossInfo = [
            {
                id: 0,
                title: "第一の魔王",
                name: "ビタミンデーモン",
                subtitle: "Vitamin Demon, The Green Terror",
                description: "栄養の力を悪用する緑の悪魔。健康を破壊する恐ろしい敵",
                color: "#228B22",
                titleColor: "#32CD32",
                subtitleColor: "#90EE90",
                warningText: "警戒せよ！"
            },
            {
                id: 1,
                title: "第二の魔王",
                name: "ミネラルデーモン",
                subtitle: "Mineral Demon, The Purple Destroyer",
                description: "鉱物の力を操る紫の魔王。その攻撃は大地を揺るがす",
                color: "#9370DB",
                titleColor: "#DC143C",
                subtitleColor: "#FF69B4",
                warningText: "破壊注意！"
            },
            {
                id: 2,
                title: "第三の魔王",
                name: "ビタミンエンジェル",
                subtitle: "Vitamin Angel, The Holy Guardian",
                description: "光の力を纏う天使。栄養の守護者が敵として立ち塞がる",
                color: "#FFD700",
                titleColor: "#FF69B4",
                subtitleColor: "#87CEEB",
                warningText: "天使降臨！"
            },
            {
                id: 3,
                title: "最終魔王",
                name: "ヴァイスオメガ",
                subtitle: "Vise Omega, The Ultimate Demon",
                description: "二つの魔王が融合した究極の存在。すべてを支配する絶対的な力",
                color: "#8B0000",
                titleColor: "#FF0000",
                subtitleColor: "#FF69B4",
                warningText: "最終決戦！"
            }
        ];
        
        // アニメーション効果
        this.glowIntensity = 0;
        this.titleOffset = 0;
        this.warningPulse = 0;
        
        console.log('👹 BossIntroDisplay system initialized');
    }

    /**
     * ボス登場演出を開始
     * @param {number} bossIndex - ボスインデックス
     */
    showBossIntro(bossIndex) {
        if (bossIndex < 0 || bossIndex >= this.bossInfo.length) {
            console.warn(`👹 Invalid boss index: ${bossIndex}`);
            return;
        }

        this.currentBoss = bossIndex;
        this.isVisible = true;
        this.displayTimer = 0;
        this.currentPhase = this.phases.FADE_IN;
        this.alpha = 0;
        this.titleAlpha = 0;
        this.subtitleAlpha = 0;
        this.glowIntensity = 0;
        this.titleOffset = 50;
        this.warningPulse = 0;
        
        const boss = this.bossInfo[bossIndex];
        console.log(`👹 Showing boss intro: ${boss.title} - ${boss.name}`);
    }

    /**
     * ボス登場演出を強制終了
     */
    hideBossIntro() {
        this.isVisible = false;
        this.currentPhase = this.phases.HIDDEN;
        this.displayTimer = 0;
        this.alpha = 0;
        console.log('👹 Boss intro display hidden');
    }

    /**
     * 更新処理
     */
    update() {
        if (!this.isVisible) return;

        this.displayTimer++;
        this.updateAnimations();
        this.updatePhases();
        
        // 表示時間終了判定
        if (this.displayTimer >= this.maxDisplayTime) {
            this.hideBossIntro();
        }
    }

    /**
     * フェーズ管理
     */
    updatePhases() {
        switch (this.currentPhase) {
            case this.phases.FADE_IN:
                if (this.displayTimer >= this.fadeInDuration) {
                    this.currentPhase = this.phases.HOLD;
                    this.alpha = 1.0;
                    this.titleAlpha = 1.0;
                    this.subtitleAlpha = 1.0;
                }
                break;
                
            case this.phases.HOLD:
                if (this.displayTimer >= this.fadeInDuration + this.holdDuration) {
                    this.currentPhase = this.phases.FADE_OUT;
                }
                break;
                
            case this.phases.FADE_OUT:
                if (this.displayTimer >= this.maxDisplayTime) {
                    this.currentPhase = this.phases.HIDDEN;
                    this.isVisible = false;
                }
                break;
        }
    }

    /**
     * アニメーション更新
     */
    updateAnimations() {
        const boss = this.bossInfo[this.currentBoss];
        
        // フェーズに応じたアルファ値計算
        switch (this.currentPhase) {
            case this.phases.FADE_IN:
                const fadeInProgress = this.displayTimer / this.fadeInDuration;
                this.alpha = this.easeOutCubic(fadeInProgress);
                this.titleAlpha = this.easeOutCubic(Math.max(0, fadeInProgress - 0.2));
                this.subtitleAlpha = this.easeOutCubic(Math.max(0, fadeInProgress - 0.4));
                this.titleOffset = 50 * (1 - this.easeOutCubic(fadeInProgress));
                break;
                
            case this.phases.HOLD:
                this.alpha = 1.0;
                this.titleAlpha = 1.0;
                this.subtitleAlpha = 1.0;
                this.titleOffset = 0;
                break;
                
            case this.phases.FADE_OUT:
                const fadeOutStart = this.fadeInDuration + this.holdDuration;
                const fadeOutProgress = (this.displayTimer - fadeOutStart) / this.fadeOutDuration;
                this.alpha = 1.0 - this.easeInCubic(fadeOutProgress);
                this.titleAlpha = 1.0 - this.easeInCubic(fadeOutProgress);
                this.subtitleAlpha = 1.0 - this.easeInCubic(Math.min(1, fadeOutProgress + 0.2));
                break;
        }
        
        // グロー効果
        this.glowIntensity = Math.sin(this.displayTimer * 0.1) * 0.3 + 0.7;
        
        // 警告パルス効果
        this.warningPulse = Math.sin(this.displayTimer * 0.2) * 0.5 + 0.5;
    }

    /**
     * イージング関数 - Ease Out Cubic
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * イージング関数 - Ease In Cubic
     */
    easeInCubic(t) {
        return t * t * t;
    }

    /**
     * 描画処理
     * @param {Object} renderer - レンダラー
     * @param {Object} bossEntity - ボスエンティティ（オプション）
     */
    render(renderer, bossEntity = null) {
        if (!this.isVisible || this.alpha <= 0) return;

        const ctx = renderer.ctx;
        const canvas = renderer.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const boss = this.bossInfo[this.currentBoss];
        
        // 背景オーバーレイ（より濃い）
        ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * this.alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // グラデーション背景（ボス色）
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 350);
        gradient.addColorStop(0, `rgba(${this.hexToRgb(boss.color)}, ${0.4 * this.alpha})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();

        // ボスのスプライト表示（画面中央に大きく）
        if (bossEntity && this.titleAlpha > 0.3) {
            ctx.save();
            ctx.globalAlpha = this.titleAlpha;

            // ボスを画面中央上部に配置（テキストの邪魔にならないように）
            const bossDisplayScale = 3.0; // 通常の3倍の大きさ
            const bossDisplayX = centerX;
            const bossDisplayY = centerY - 180; // 中央より上に配置

            ctx.translate(bossDisplayX, bossDisplayY);

            // ボススプライトの描画
            if (bossEntity.sprite) {
                // スプライトがある場合は描画
                const spriteWidth = bossEntity.width * bossDisplayScale;
                const spriteHeight = bossEntity.height * bossDisplayScale;

                // グロー効果
                ctx.shadowColor = boss.titleColor;
                ctx.shadowBlur = 20 * this.glowIntensity;

                // スプライトを中央に配置
                if (bossEntity.render) {
                    ctx.save();
                    ctx.scale(bossDisplayScale, bossDisplayScale);
                    ctx.translate(-bossEntity.width / 2, -bossEntity.height / 2);
                    bossEntity.render(renderer);
                    ctx.restore();
                } else {
                    // 簡易的な矩形表示
                    ctx.fillStyle = boss.color;
                    ctx.fillRect(-spriteWidth / 2, -spriteHeight / 2, spriteWidth, spriteHeight);
                }

                ctx.shadowBlur = 0;
            }

            ctx.restore();
        }

        // テキスト表示位置を調整（ボススプライトの下に配置）
        const textOffsetY = bossEntity ? 80 : 0; // ボスがいる場合はテキストを下にずらす

        // ボス称号（中央）
        if (this.titleAlpha > 0) {
            ctx.font = 'bold 28px "Courier New", monospace';
            ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * this.titleAlpha})`;
            ctx.textAlign = 'center';
            ctx.fillText(boss.title, centerX, centerY + textOffsetY - 60 + this.titleOffset);
        }

        // メインタイトル（ボス名・大きく中央に）
        if (this.titleAlpha > 0) {
            // グロー効果
            ctx.shadowColor = boss.titleColor;
            ctx.shadowBlur = 25 * this.glowIntensity * this.titleAlpha;

            ctx.font = 'bold 56px "Courier New", monospace';
            ctx.fillStyle = `rgba(${this.hexToRgb(boss.titleColor)}, ${this.titleAlpha})`;
            ctx.textAlign = 'center';
            ctx.fillText(boss.name, centerX, centerY + textOffsetY + this.titleOffset);

            // 影効果
            ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * this.titleAlpha})`;
            ctx.fillText(boss.name, centerX + 3, centerY + textOffsetY + 3 + this.titleOffset);

            // メインテキスト再描画
            ctx.fillStyle = `rgba(${this.hexToRgb(boss.titleColor)}, ${this.titleAlpha})`;
            ctx.fillText(boss.name, centerX, centerY + textOffsetY + this.titleOffset);
        }

        // サブタイトル（英語名）
        if (this.subtitleAlpha > 0) {
            ctx.font = 'italic 22px "Courier New", monospace';
            ctx.fillStyle = `rgba(${this.hexToRgb(boss.subtitleColor)}, ${0.9 * this.subtitleAlpha})`;
            ctx.textAlign = 'center';
            ctx.fillText(boss.subtitle, centerX, centerY + textOffsetY + 50);
        }

        // 説明文
        if (this.subtitleAlpha > 0.5) {
            ctx.font = '16px "Courier New", monospace';
            ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * this.subtitleAlpha})`;
            ctx.textAlign = 'center';
            ctx.fillText(boss.description, centerX, centerY + textOffsetY + 90);
        }

        // 準備指示（下部）
        if (this.subtitleAlpha > 0.7) {
            ctx.font = 'bold 20px "Courier New", monospace';
            ctx.fillStyle = `rgba(255, 215, 0, ${this.warningPulse * this.subtitleAlpha})`;
            ctx.textAlign = 'center';
            ctx.fillText('戦闘準備せよ！', centerX, centerY + textOffsetY + 130);
        }

        // 警告テキスト（最上部に点滅）
        if (this.titleAlpha > 0) {
            ctx.font = 'bold 32px "Courier New", monospace';
            ctx.fillStyle = `rgba(255, 50, 50, ${this.warningPulse * this.titleAlpha})`;
            ctx.textAlign = 'center';
            ctx.fillText(boss.warningText, centerX, 80);
        }
        
        ctx.restore();
    }

    /**
     * 16進数カラーをRGB値に変換
     * @param {string} hex - 16進数カラー
     * @returns {string} RGB値文字列
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `${r}, ${g}, ${b}`;
        }
        return '255, 255, 255'; // デフォルトは白
    }

    /**
     * 表示が進行中かどうか
     * @returns {boolean} 表示中かどうか
     */
    isDisplaying() {
        return this.isVisible;
    }

    /**
     * 無敵期間中かどうか（表示中は無敵）
     * @returns {boolean} 無敵期間中かどうか
     */
    isInvulnerabilityPeriod() {
        return this.isVisible;
    }

    /**
     * 現在の表示状態を取得
     * @returns {Object} 状態情報
     */
    getState() {
        return {
            isVisible: this.isVisible,
            currentBoss: this.currentBoss,
            phase: this.currentPhase,
            alpha: this.alpha,
            displayTimer: this.displayTimer,
            maxDisplayTime: this.maxDisplayTime,
            isInvulnerable: this.isInvulnerabilityPeriod()
        };
    }

    /**
     * デバッグ情報出力
     */
    debugLog() {
        if (this.isVisible) {
            console.log('👹 BossIntroDisplay Debug:', this.getState());
        }
    }
}