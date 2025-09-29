/**
 * Image Sprite Loading and Caching System
 * Handles loading, caching, and management of PNG/JPG sprite images
 */

export class ImageSpriteLoader {
    constructor() {
        this.imageCache = new Map();
        this.loadingPromises = new Map();
        this.loadedImages = new Set();
        this.failedImages = new Set();
    }

    /**
     * Load an image sprite
     * @param {string} imagePath - Path to the image file
     * @returns {Promise<HTMLImageElement>} - Promise that resolves to the loaded image
     */
    async loadImage(imagePath) {
        // Return cached image if already loaded
        if (this.imageCache.has(imagePath)) {
            return this.imageCache.get(imagePath);
        }

        // Return existing loading promise if already in progress
        if (this.loadingPromises.has(imagePath)) {
            return this.loadingPromises.get(imagePath);
        }

        // Check if this image previously failed to load
        if (this.failedImages.has(imagePath)) {
            throw new Error(`Image previously failed to load: ${imagePath}`);
        }

        // Create new loading promise
        const loadingPromise = this.createImageLoadPromise(imagePath);
        this.loadingPromises.set(imagePath, loadingPromise);

        try {
            const image = await loadingPromise;
            this.imageCache.set(imagePath, image);
            this.loadedImages.add(imagePath);
            this.loadingPromises.delete(imagePath);
            return image;
        } catch (error) {
            this.failedImages.add(imagePath);
            this.loadingPromises.delete(imagePath);
            throw error;
        }
    }

    /**
     * Create image loading promise
     * @param {string} imagePath - Path to the image file
     * @returns {Promise<HTMLImageElement>} - Promise that resolves to the loaded image
     */
    createImageLoadPromise(imagePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                console.log(`Successfully loaded image sprite: ${imagePath}`);
                resolve(img);
            };
            
            img.onerror = () => {
                const error = new Error(`Failed to load image sprite: ${imagePath}`);
                console.error(error.message);
                reject(error);
            };
            
            // Set src to start loading
            img.src = imagePath;
        });
    }

    /**
     * Preload multiple images
     * @param {Array<string>} imagePaths - Array of image paths to preload
     * @returns {Promise<Array<HTMLImageElement>>} - Promise that resolves when all images are loaded
     */
    async preloadImages(imagePaths) {
        const loadPromises = imagePaths.map(path => this.loadImage(path));
        
        try {
            const results = await Promise.allSettled(loadPromises);
            const loadedImages = [];
            const failedImages = [];
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    loadedImages.push(result.value);
                } else {
                    failedImages.push(imagePaths[index]);
                    console.warn(`Failed to preload image: ${imagePaths[index]}`, result.reason);
                }
            });
            
            console.log(`Preloaded ${loadedImages.length}/${imagePaths.length} images`);
            if (failedImages.length > 0) {
                console.warn(`Failed to load ${failedImages.length} images:`, failedImages);
            }
            
            return loadedImages;
        } catch (error) {
            console.error('Error during image preloading:', error);
            throw error;
        }
    }

    /**
     * Get cached image
     * @param {string} imagePath - Path to the image file
     * @returns {HTMLImageElement|null} - Cached image or null if not loaded
     */
    getCachedImage(imagePath) {
        return this.imageCache.get(imagePath) || null;
    }

    /**
     * Check if image is loaded
     * @param {string} imagePath - Path to the image file
     * @returns {boolean} - True if image is loaded and cached
     */
    isImageLoaded(imagePath) {
        return this.loadedImages.has(imagePath);
    }

    /**
     * Check if image loading failed
     * @param {string} imagePath - Path to the image file
     * @returns {boolean} - True if image failed to load
     */
    isImageFailed(imagePath) {
        return this.failedImages.has(imagePath);
    }

    /**
     * Clear cache for specific image
     * @param {string} imagePath - Path to the image file
     */
    clearImageCache(imagePath) {
        this.imageCache.delete(imagePath);
        this.loadedImages.delete(imagePath);
        this.failedImages.delete(imagePath);
        this.loadingPromises.delete(imagePath);
    }

    /**
     * Clear all caches
     */
    clearAllCaches() {
        this.imageCache.clear();
        this.loadedImages.clear();
        this.failedImages.clear();
        this.loadingPromises.clear();
    }

    /**
     * Get loading statistics
     * @returns {Object} - Loading statistics
     */
    getStats() {
        return {
            totalCached: this.imageCache.size,
            totalLoaded: this.loadedImages.size,
            totalFailed: this.failedImages.size,
            currentlyLoading: this.loadingPromises.size,
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    /**
     * Estimate memory usage of cached images
     * @returns {number} - Estimated memory usage in bytes
     */
    estimateMemoryUsage() {
        let totalBytes = 0;
        
        this.imageCache.forEach(image => {
            // Rough estimation: width * height * 4 bytes per pixel (RGBA)
            totalBytes += (image.width || 0) * (image.height || 0) * 4;
        });
        
        return totalBytes;
    }

    /**
     * Retry loading failed images
     * @returns {Promise<Array<HTMLImageElement>>} - Promise that resolves when retry is complete
     */
    async retryFailedImages() {
        const failedPaths = Array.from(this.failedImages);
        
        // Clear failed status to allow retry
        failedPaths.forEach(path => {
            this.failedImages.delete(path);
        });
        
        console.log(`Retrying ${failedPaths.length} failed images`);
        return this.preloadImages(failedPaths);
    }
}

// Create singleton instance
export const imageSpriteLoader = new ImageSpriteLoader();