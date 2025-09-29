# Hybrid Sprite System Documentation

## Overview

The hybrid sprite system allows the game to use both traditional pixel array sprites and high-quality PNG/JPG image files. This provides the best of both worlds - retro pixel art for effects and background elements, while enabling detailed images for important characters like Popolon, Aphrodite, and bosses.

## Features

- **Backward Compatibility**: All existing pixel array sprites continue to work unchanged
- **Image Support**: PNG/JPG files for main characters and bosses
- **Automatic Detection**: The `drawSprite()` function automatically detects sprite type
- **Preloading System**: Images are preloaded for smooth gameplay
- **Sprite Sheets**: Support for sprite sheet animations
- **Fallback System**: Placeholder rendering when images fail to load
- **Caching**: Efficient image caching to prevent re-loading

## File Structure

```
src/
├── assets/
│   └── sprites/
│       ├── characters/       # Main character sprites (Popolon, Aphrodite)
│       ├── enemies/          # Enemy sprites
│       ├── bosses/           # Boss sprites
│       └── effects/          # Effect and particle sprites
├── systems/
│   ├── ImageSpriteLoader.js  # Image loading and caching
│   └── SpritePreloader.js    # Preloading system
└── config/
    └── spriteData.js         # Enhanced sprite definitions
```

## Sprite Types

### 1. Pixel Array Sprites (Traditional)

```javascript
// Traditional 16x16 pixel array sprite
popolon: [
    [0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0],
    [0,0,0,4,4,18,18,4,4,18,18,4,4,0,0,0],
    // ... more rows
]
```

### 2. Image Sprites (New)

```javascript
// Simple image sprite
popolon_image: {
    type: 'image',
    src: './src/assets/sprites/characters/popolon.png',
    width: 32,
    height: 32
}
```

### 3. Sprite Sheet Images

```javascript
// Sprite sheet with frame definitions
enemy_animations: {
    type: 'image',
    src: './src/assets/sprites/enemies/enemy_sheet.png',
    width: 32,          // Display width
    height: 32,         // Display height
    frameX: 0,          // X position in sheet
    frameY: 0,          // Y position in sheet
    frameWidth: 32,     // Frame width in sheet
    frameHeight: 32     // Frame height in sheet
}
```

## Usage Examples

### Adding New Image Sprites

1. **Create image file**: Place your PNG/JPG in the appropriate sprites folder
2. **Add sprite definition**: Add to `SPRITE_DATA` in `spriteData.js`
3. **Use in game**: Call `drawSprite()` as normal - the system auto-detects type

```javascript
// Add to SPRITE_DATA
medusa_boss: {
    type: 'image',
    src: './src/assets/sprites/bosses/medusa.png',
    width: 64,
    height: 64
}

// Use in game code (same as before)
renderer.drawSprite('medusa_boss', x, y, scale);
```

### Converting Existing Sprites

To convert a pixel array sprite to an image sprite:

1. Create the image file
2. Add image sprite definition
3. Comment out or remove pixel array definition
4. Update any references if the key name changed

### Recommended Image Specifications

- **Format**: PNG (for transparency) or JPG (for smaller file size)
- **Character Sprites**: 32x32 to 64x64 pixels
- **Boss Sprites**: 64x64 to 128x128 pixels
- **Effect Sprites**: 16x16 to 32x32 pixels
- **Color Depth**: 24-bit or 32-bit (with alpha)

## System Architecture

### Components

1. **ImageSpriteLoader**: Handles loading and caching of image files
2. **SpritePreloader**: Manages preloading during game initialization
3. **Enhanced drawSprite()**: Auto-detects sprite type and renders accordingly

### Loading Process

1. **Game Initialization**: 
   - Extract image sprite paths from `SPRITE_DATA`
   - Preload all image sprites
   - Display loading progress

2. **Runtime Rendering**:
   - Check sprite type (array vs image)
   - For images: retrieve from cache or show placeholder
   - Render using appropriate method

### Error Handling

- **Missing Images**: Shows magenta placeholder with "?" symbol
- **Loading Failures**: Logged to console, game continues with placeholders
- **Retry System**: Failed images can be retried

## Performance Considerations

### Memory Usage
- Images use more memory than pixel arrays
- Use appropriate image sizes for your needs
- Monitor memory usage with `imageSpriteLoader.getStats()`

### Loading Time
- Preloading prevents runtime delays
- Large images increase initialization time
- Consider using sprite sheets for animations

### Rendering Performance
- Image sprites render faster than pixel arrays during gameplay
- Canvas drawImage() is optimized by browsers
- Caching prevents repeated image loading

## Best Practices

### When to Use Image Sprites
- **Main characters** (Popolon, Aphrodite)
- **Boss characters** (detailed artwork needed)
- **Important UI elements**
- **High-detail sprites** where pixel art limitations are apparent

### When to Keep Pixel Arrays
- **Simple effects** (explosions, particles)
- **Small enemies** where pixel art fits the style
- **UI elements** that match the retro aesthetic
- **Performance-critical elements** (if memory is constrained)

### Organization
- Use descriptive file names
- Group by sprite type in folders
- Keep image dimensions consistent within categories
- Use sprite sheets for related animations

## Debugging

### Console Commands
```javascript
// Check loading stats
imageSpriteLoader.getStats()

// Check preloader status
spritePreloader.getProgress()

// List image sprites
spritePreloader.getImageSprites()

// Retry failed loads
spritePreloader.retryFailedPreloads()
```

### Common Issues

1. **Magenta Placeholders**: Image file not found or failed to load
2. **Console Errors**: Check file paths and permissions
3. **Slow Loading**: Large images or too many sprites
4. **Memory Issues**: Too many large images loaded

## Migration Guide

To migrate from pure pixel art to hybrid system:

1. **Identify Priority Sprites**: Choose which sprites benefit most from high-quality images
2. **Create Image Assets**: Design or source appropriate images
3. **Update Sprite Definitions**: Add image sprite definitions
4. **Test System**: Verify loading and rendering works correctly
5. **Optimize**: Adjust image sizes and formats for best performance

## API Reference

### ImageSpriteLoader Methods
- `loadImage(path)`: Load single image
- `preloadImages(paths)`: Load multiple images
- `getCachedImage(path)`: Get cached image
- `isImageLoaded(path)`: Check if loaded
- `getStats()`: Get loading statistics

### SpritePreloader Methods
- `preloadSprites(callback)`: Preload all image sprites
- `getProgress()`: Get preloading progress
- `isComplete()`: Check if preloading complete
- `retryFailedPreloads()`: Retry failed loads

### Enhanced drawSprite()
```javascript
drawSprite(ctx, spriteKey, x, y, scale, options)
```
- `options.tint`: Apply color tint to image sprites
- `options.alpha`: Alpha transparency (set `ctx.globalAlpha`)

## Future Enhancements

Potential future improvements:
- Animation frame management for sprite sheets
- Automatic sprite atlas generation
- WebP format support for better compression
- Lazy loading for non-critical sprites
- Sprite scaling optimization
- Color palette swapping for image sprites