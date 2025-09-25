import { GAME_CONFIG, STAGES } from '../config/gameConfig.js';
import { drawSprite } from '../config/spriteData.js';

/**
 * 描画管理クラス
 * Canvas描画の統一管理とレンダリング処理
 */
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = GAME_CONFIG.CANVAS_WIDTH;
        this.canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
        
        // Canvas設定
        this.ctx.imageSmoothingEnabled = false; // ピクセルアート用
        
        // 描画オフセット
        this.cameraX = 0;
        this.cameraY = 0;
    }

    /**
     * 画面全体をクリア
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 背景描画（ステージ別のグラデーション）
     * @param {number} stageIndex - ステージインデックス
     * @param {number} offset - スクロールオフセット
     */
    drawBackground(stageIndex, offset = 0) {
        const stage = STAGES[stageIndex] || STAGES[0];
        
        // 空のグラデーション
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, stage.skyTop);
        gradient.addColorStop(1, stage.skyBottom);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 柱描画（左右端の装飾）
     */
    drawPillars() {
        // 左の柱
        this.ctx.fillStyle = '#A0A0A0';
        this.ctx.fillRect(0, 0, 40, this.canvas.height);
        this.ctx.fillStyle = '#778899';
        this.ctx.fillRect(8, 0, 24, this.canvas.height);
        
        // 柱の装飾
        for (let y = 20; y < this.canvas.height; y += 60) {
            this.ctx.fillStyle = '#696969';
            this.ctx.fillRect(4, y, 32, 20);
        }
        
        // 右の柱
        this.ctx.fillStyle = '#A0A0A0';
        this.ctx.fillRect(this.canvas.width - 40, 0, 40, this.canvas.height);
        this.ctx.fillStyle = '#778899';
        this.ctx.fillRect(this.canvas.width - 32, 0, 24, this.canvas.height);
        
        // 右柱の装飾
        for (let y = 20; y < this.canvas.height; y += 60) {
            this.ctx.fillStyle = '#696969';
            this.ctx.fillRect(this.canvas.width - 36, y, 32, 20);
        }
    }

    /**
     * 地形タイル描画（川、橋、草原）- 無効化（BackgroundSystemで処理）
     * @param {Array} tiles - タイル配列
     * @param {number} offset - スクロールオフセット
     */
    drawTerrain(tiles, offset) {
        // 古い地形描画システム - 無効化
        // BackgroundSystemで新しい地形描画を使用
        return;
    }

    /**
     * 水エフェクト描画
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {number} offset - アニメーション用オフセット
     */
    drawWaterEffect(x, y, width, height, offset) {
        const time = Date.now() * 0.005 + offset * 0.1;
        
        // 波のラインを描画
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            const waveY = y + (height / 4) * (i + 1);
            
            for (let px = x; px < x + width; px += 2) {
                const waveHeight = Math.sin((px - x) * 0.1 + time + i * 2) * 2;
                if (px === x) {
                    this.ctx.moveTo(px, waveY + waveHeight);
                } else {
                    this.ctx.lineTo(px, waveY + waveHeight);
                }
            }
            this.ctx.stroke();
        }
    }

    /**
     * 橋の詳細描画 - 無効化（BackgroundSystemで処理）
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} width - 幅
     * @param {number} height - 高さ
     */
    drawBridgeDetails(x, y, width, height) {
        // 古い橋描画システム - 無効化
        // BackgroundSystemで新しい橋描画を使用
        return;
    }

    /**
     * スプライト描画（spriteData.jsのdrawSprite関数を使用）
     * @param {string} spriteKey - スプライトキー
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} scale - スケール
     */
    drawSprite(spriteKey, x, y, scale = 2) {
        drawSprite(this.ctx, spriteKey, x - this.cameraX, y - this.cameraY, scale);
    }

    /**
     * 矩形描画
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {string} color - 色
     */
    drawRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - this.cameraX, y - this.cameraY, width, height);
    }

    /**
     * 円描画
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} radius - 半径
     * @param {string} color - 色
     */
    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x - this.cameraX, y - this.cameraY, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * テキスト描画
     * @param {string} text - テキスト
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} color - 色
     * @param {string} font - フォント
     * @param {string} align - 整列方式
     */
    drawText(text, x, y, color = '#ffffff', font = '18px Courier New', align = 'left') {
        this.ctx.fillStyle = color;
        this.ctx.font = font;
        this.ctx.textAlign = align;
        this.ctx.fillText(text, x, y);
    }

    /**
     * アウトライン付きテキスト描画
     * @param {string} text - テキスト
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} fillColor - 塗り色
     * @param {string} strokeColor - アウトライン色
     * @param {string} font - フォント
     * @param {string} align - 整列方式
     */
    drawOutlinedText(text, x, y, fillColor = '#ffffff', strokeColor = '#000000', font = '18px Courier New', align = 'left') {
        this.ctx.font = font;
        this.ctx.textAlign = align;
        this.ctx.lineWidth = 3;
        
        // アウトライン
        this.ctx.strokeStyle = strokeColor;
        this.ctx.strokeText(text, x, y);
        
        // 塗り
        this.ctx.fillStyle = fillColor;
        this.ctx.fillText(text, x, y);
    }

    /**
     * レーザーエフェクト描画
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} width - 幅
     * @param {number} height - 高さ
     */
    drawLaserEffect(x, y, width, height) {
        // メインレーザー
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillRect(x - this.cameraX, y - this.cameraY, width, height);
        
        // 内側の明るい部分
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x - this.cameraX + width * 0.3, y - this.cameraY, width * 0.4, height);
        
        // 光のエフェクト
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.fillRect(x - this.cameraX - 10, y - this.cameraY, width + 20, height);
    }

    /**
     * 爆発エフェクト描画
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} radius - 半径
     * @param {number} life - 残りライフ（0-1）
     * @param {string} color - 色
     */
    drawExplosion(x, y, radius, life, color = '#ff4400') {
        const alpha = life;
        const currentRadius = radius * (1 - life + 0.5);
        
        // 外側の円
        this.ctx.fillStyle = `rgba(255, 68, 0, ${alpha * 0.6})`;
        this.ctx.beginPath();
        this.ctx.arc(x - this.cameraX, y - this.cameraY, currentRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 内側の明るい円
        this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(x - this.cameraX, y - this.cameraY, currentRadius * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * 火炎パーティクル描画
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} life - 残りライフ（0-1）
     */
    drawFlameParticle(x, y, life) {
        const alpha = life;
        const size = 3 + (1 - life) * 5;
        
        // 炎の色（黄→オレンジ→赤）
        const colors = [
            `rgba(255, 255, 0, ${alpha})`,
            `rgba(255, 165, 0, ${alpha})`,
            `rgba(255, 0, 0, ${alpha})`
        ];
        
        const colorIndex = Math.floor((1 - life) * 2.99);
        
        this.ctx.fillStyle = colors[colorIndex];
        this.ctx.beginPath();
        this.ctx.arc(x - this.cameraX, y - this.cameraY, size, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * 高速モード残像エフェクト描画
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Array} trailPositions - 残像位置配列
     */
    drawSpeedTrail(player, trailPositions) {
        for (let i = 0; i < trailPositions.length; i++) {
            const pos = trailPositions[i];
            const alpha = (i + 1) / trailPositions.length * 0.5;
            
            this.ctx.globalAlpha = alpha;
            this.drawSprite('popolon_speed', pos.x, pos.y, 2.25);
        }
        this.ctx.globalAlpha = 1.0;
    }

    /**
     * ボス登場警告エフェクト
     * @param {string} bossName - ボス名
     * @param {number} warningTime - 警告時間
     */
    drawBossWarning(bossName, warningTime) {
        const alpha = Math.sin(warningTime * 0.1) * 0.5 + 0.5;
        
        // 背景
        this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.3})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 警告テキスト
        this.drawOutlinedText(
            'WARNING!',
            this.canvas.width / 2,
            this.canvas.height / 2 - 50,
            '#ffff00',
            '#ff0000',
            'bold 48px Courier New',
            'center'
        );
        
        this.drawOutlinedText(
            bossName,
            this.canvas.width / 2,
            this.canvas.height / 2 + 20,
            '#ffffff',
            '#000000',
            'bold 32px Courier New',
            'center'
        );
    }

    /**
     * カメラ位置設定
     * @param {number} x - X座標
     * @param {number} y - Y座標
     */
    setCamera(x, y) {
        this.cameraX = x;
        this.cameraY = y;
    }

    /**
     * 画面キャプチャ（デバッグ用）
     * @returns {string} データURL
     */
    capture() {
        return this.canvas.toDataURL();
    }

    /**
     * フルスクリーン切り替え
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.canvas.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Canvas情報取得（デバッグ用）
     * @returns {Object} Canvas情報
     */
    getCanvasInfo() {
        return {
            width: this.canvas.width,
            height: this.canvas.height,
            cameraX: this.cameraX,
            cameraY: this.cameraY,
            scale: window.devicePixelRatio || 1
        };
    }
}