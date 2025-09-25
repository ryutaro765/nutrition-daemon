import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * ゼルダ風ステージ名表示システム
 * 長時間表示されるエレガントなステージ名演出
 */
export class StageNameDisplay {
    constructor() {
        this.isVisible = false;
        this.currentStage = 0;
        this.displayTimer = 0;
        this.maxDisplayTime = 300; // 5秒間表示 (60fps * 5)
        
        // 表示フェーズ
        this.phases = {
            FADE_IN: 0,
            HOLD: 1,
            FADE_OUT: 2,
            HIDDEN: 3
        };
        
        this.currentPhase = this.phases.HIDDEN;
        this.fadeInDuration = 60;  // 1秒間フェードイン
        this.holdDuration = 180;   // 3秒間表示
        this.fadeOutDuration = 60; // 1秒間フェードアウト
        
        this.alpha = 0;
        this.titleAlpha = 0;
        this.subtitleAlpha = 0;
        
        // ステージ情報（Zelda風の詳細な説明付き）
        this.stageInfo = [
            {
                id: 0,
                title: "第一章",
                name: "緑なる草原",
                subtitle: "Verdant Meadows",
                description: "冒険の始まりの地。穏やかな風が吹く緑の大地を進め",
                color: "#228B22",
                titleColor: "#FFD700",
                subtitleColor: "#FFFFFF"
            },
            {
                id: 1,
                title: "第二章", 
                name: "荒涼たる荒野",
                subtitle: "Desolate Wastelands",
                description: "乾いた大地に魔物が潜む。試練の道のりが続く",
                color: "#8B4513",
                titleColor: "#DAA520",
                subtitleColor: "#F5DEB3"
            },
            {
                id: 2,
                title: "最終章",
                name: "魔王の城",
                subtitle: "Demon Lord's Castle",
                description: "暗黒に包まれた魔城。運命の戦いが今始まる",
                color: "#8B0000",
                titleColor: "#DC143C",
                subtitleColor: "#FF6B6B"
            }
        ];
        
        // アニメーション効果
        this.glowIntensity = 0;
        this.titleOffset = 0;
        this.particleEffects = [];
        
        console.log('🎭 StageNameDisplay system initialized');
    }

    /**
     * ステージ名表示を開始
     * @param {number} stageIndex - ステージインデックス
     */
    showStageName(stageIndex) {
        if (stageIndex < 0 || stageIndex >= this.stageInfo.length) {
            console.warn(`🎭 Invalid stage index: ${stageIndex}`);
            return;
        }

        this.currentStage = stageIndex;
        this.isVisible = true;
        this.displayTimer = 0;
        this.currentPhase = this.phases.FADE_IN;
        this.alpha = 0;
        this.titleAlpha = 0;
        this.subtitleAlpha = 0;
        this.glowIntensity = 0;
        this.titleOffset = 50;
        
        console.log(`🎭 Showing stage name: ${this.stageInfo[stageIndex].title} - ${this.stageInfo[stageIndex].name}`);
    }

    /**
     * ステージ名表示を強制終了
     */
    hideStageName() {
        this.isVisible = false;
        this.currentPhase = this.phases.HIDDEN;
        this.displayTimer = 0;
        this.alpha = 0;
        console.log('🎭 Stage name display hidden');
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
            this.hideStageName();
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
        const stage = this.stageInfo[this.currentStage];
        
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
     */
    render(renderer) {
        if (!this.isVisible || this.alpha <= 0) return;

        const ctx = renderer.ctx;
        const canvas = renderer.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        const stage = this.stageInfo[this.currentStage];
        
        // 背景オーバーレイ
        ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * this.alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // グラデーション背景
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300);
        gradient.addColorStop(0, `rgba(${this.hexToRgb(stage.color)}, ${0.3 * this.alpha})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        
        // 章番号（小さく上部に）
        if (this.titleAlpha > 0) {
            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * this.titleAlpha})`;
            ctx.textAlign = 'center';
            ctx.fillText(stage.title, centerX, centerY - 80 + this.titleOffset);
        }
        
        // メインタイトル（大きく中央に）
        if (this.titleAlpha > 0) {
            // グロー効果
            ctx.shadowColor = stage.titleColor;
            ctx.shadowBlur = 20 * this.glowIntensity * this.titleAlpha;
            
            ctx.font = 'bold 48px "Courier New", monospace';
            ctx.fillStyle = `rgba(${this.hexToRgb(stage.titleColor)}, ${this.titleAlpha})`;
            ctx.textAlign = 'center';
            ctx.fillText(stage.name, centerX, centerY + this.titleOffset);
            
            // 影効果
            ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * this.titleAlpha})`;
            ctx.fillText(stage.name, centerX + 2, centerY + 2 + this.titleOffset);
            
            // メインテキスト再描画
            ctx.fillStyle = `rgba(${this.hexToRgb(stage.titleColor)}, ${this.titleAlpha})`;
            ctx.fillText(stage.name, centerX, centerY + this.titleOffset);
        }
        
        // サブタイトル（英語名）
        if (this.subtitleAlpha > 0) {
            ctx.font = 'italic 20px "Courier New", monospace';
            ctx.fillStyle = `rgba(${this.hexToRgb(stage.subtitleColor)}, ${0.9 * this.subtitleAlpha})`;
            ctx.textAlign = 'center';
            ctx.fillText(stage.subtitle, centerX, centerY + 40);
        }
        
        // 説明文
        if (this.subtitleAlpha > 0.5) {
            ctx.font = '16px "Courier New", monospace';
            ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * this.subtitleAlpha})`;
            ctx.textAlign = 'center';
            ctx.fillText(stage.description, centerX, centerY + 80);
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
     * 現在の表示状態を取得
     * @returns {Object} 状態情報
     */
    getState() {
        return {
            isVisible: this.isVisible,
            currentStage: this.currentStage,
            phase: this.currentPhase,
            alpha: this.alpha,
            displayTimer: this.displayTimer,
            maxDisplayTime: this.maxDisplayTime
        };
    }

    /**
     * デバッグ情報出力
     */
    debugLog() {
        if (this.isVisible) {
            console.log('🎭 StageNameDisplay Debug:', this.getState());
        }
    }
}