/**
 * Sprite Preloading System
 * Manages preloading of image sprites for smooth gameplay
 */

import { SPRITE_DATA } from '../config/spriteData.js';
import { imageSpriteLoader } from './ImageSpriteLoader.js';

export class SpritePreloader {
    constructor() {
        this.preloadPromise = null;
        this.isPreloading = false;
        this.preloadComplete = false;
        this.imageSprites = [];
        this.preloadStats = {
            total: 0,
            loaded: 0,
            failed: 0
        };
    }

    /**
     * Extract image sprite paths from SPRITE_DATA
     * @returns {Array<string>} Array of image paths
     */
    extractImageSpritePaths() {
        const imagePaths = [];
        
        Object.entries(SPRITE_DATA).forEach(([key, sprite]) => {
            if (sprite && sprite.type === 'image' && sprite.src) {
                imagePaths.push(sprite.src);
                this.imageSprites.push({
                    key,
                    path: sprite.src,
                    width: sprite.width,
                    height: sprite.height
                });
            }
        });
        
        return imagePaths;
    }

    /**
     * Preload all image sprites
     * @param {Function} progressCallback - Optional progress callback
     * @returns {Promise} Promise that resolves when preloading is complete
     */
    async preloadSprites(progressCallback = null) {
        if (this.isPreloading) {
            return this.preloadPromise;
        }

        if (this.preloadComplete) {
            return Promise.resolve();
        }

        this.isPreloading = true;
        this.preloadComplete = false;
        this.imageSprites = [];
        
        const imagePaths = this.extractImageSpritePaths();
        this.preloadStats.total = imagePaths.length;
        this.preloadStats.loaded = 0;
        this.preloadStats.failed = 0;

        console.log(`Starting sprite preload: ${imagePaths.length} image sprites found`);

        if (imagePaths.length === 0) {
            console.log('No image sprites to preload, using pixel array sprites only');
            this.isPreloading = false;
            this.preloadComplete = true;
            return Promise.resolve();
        }

        this.preloadPromise = this.performPreload(imagePaths, progressCallback);
        
        try {
            await this.preloadPromise;
            this.preloadComplete = true;
            console.log('Sprite preloading completed successfully');
        } catch (error) {
            console.error('Sprite preloading failed:', error);
        } finally {
            this.isPreloading = false;
        }

        return this.preloadPromise;
    }

    /**
     * Perform the actual preloading
     * @param {Array<string>} imagePaths - Image paths to preload
     * @param {Function} progressCallback - Progress callback
     * @returns {Promise} Preload promise
     */
    async performPreload(imagePaths, progressCallback) {
        const loadPromises = imagePaths.map(async (path, index) => {
            try {
                await imageSpriteLoader.loadImage(path);
                this.preloadStats.loaded++;
                
                if (progressCallback) {
                    progressCallback({
                        current: this.preloadStats.loaded + this.preloadStats.failed,
                        total: this.preloadStats.total,
                        loaded: this.preloadStats.loaded,
                        failed: this.preloadStats.failed,
                        currentPath: path,
                        progress: (this.preloadStats.loaded + this.preloadStats.failed) / this.preloadStats.total
                    });
                }
                
                console.log(`Loaded sprite: ${path} (${this.preloadStats.loaded}/${this.preloadStats.total})`);
                return { success: true, path };
            } catch (error) {
                this.preloadStats.failed++;
                
                if (progressCallback) {
                    progressCallback({
                        current: this.preloadStats.loaded + this.preloadStats.failed,
                        total: this.preloadStats.total,
                        loaded: this.preloadStats.loaded,
                        failed: this.preloadStats.failed,
                        currentPath: path,
                        progress: (this.preloadStats.loaded + this.preloadStats.failed) / this.preloadStats.total,
                        error: error.message
                    });
                }
                
                console.warn(`Failed to load sprite: ${path}`, error);
                return { success: false, path, error };
            }
        });

        const results = await Promise.allSettled(loadPromises);
        
        console.log(`Preload complete: ${this.preloadStats.loaded} loaded, ${this.preloadStats.failed} failed`);
        
        return results;
    }

    /**
     * Get preload progress
     * @returns {Object} Progress information
     */
    getProgress() {
        if (this.preloadStats.total === 0) {
            return { progress: 1.0, loaded: 0, failed: 0, total: 0, complete: true };
        }

        return {
            progress: (this.preloadStats.loaded + this.preloadStats.failed) / this.preloadStats.total,
            loaded: this.preloadStats.loaded,
            failed: this.preloadStats.failed,
            total: this.preloadStats.total,
            complete: this.preloadComplete
        };
    }

    /**
     * Check if preloading is complete
     * @returns {boolean} True if preloading is complete
     */
    isComplete() {
        return this.preloadComplete;
    }

    /**
     * Check if currently preloading
     * @returns {boolean} True if currently preloading
     */
    isPreloadingActive() {
        return this.isPreloading;
    }

    /**
     * Get list of image sprites
     * @returns {Array} Array of image sprite info
     */
    getImageSprites() {
        return [...this.imageSprites];
    }

    /**
     * Force retry failed preloads
     * @returns {Promise} Promise that resolves when retry is complete
     */
    async retryFailedPreloads() {
        if (this.preloadStats.failed === 0) {
            console.log('No failed preloads to retry');
            return Promise.resolve();
        }

        console.log(`Retrying ${this.preloadStats.failed} failed preloads`);
        
        // Reset preload state
        this.preloadComplete = false;
        this.preloadStats.failed = 0;
        
        // Retry loading failed images through the image loader
        try {
            await imageSpriteLoader.retryFailedImages();
            console.log('Retry completed successfully');
        } catch (error) {
            console.error('Retry failed:', error);
        }
    }

    /**
     * Clear preload state
     */
    reset() {
        this.isPreloading = false;
        this.preloadComplete = false;
        this.preloadPromise = null;
        this.imageSprites = [];
        this.preloadStats = {
            total: 0,
            loaded: 0,
            failed: 0
        };
    }
}

// Create singleton instance
export const spritePreloader = new SpritePreloader();