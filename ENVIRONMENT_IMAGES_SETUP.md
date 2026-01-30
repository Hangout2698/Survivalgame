# Environment Images Setup Guide

## What This Does

This update replaces the gradient backgrounds in the scenario display with **real stock photos** of each environment (rocky coastline, mountains, desert, forest, tundra, urban edge). This gives players a much clearer visual understanding of where they are.

## What Changed

✅ **Updated**: `src/services/imageService.ts`
- Modified `getFallbackImage()` to return stock image paths instead of CSS gradients
- Now points to `/images/environments/{environment}.jpg`

✅ **Created**: `public/images/environments/` folder
- This is where you'll place the 6 stock images

## How to Complete the Setup

### Step 1: Get Stock Images

Visit the links below and download suitable free images:

1. **coast.jpg** - Rocky coastline with waves
   - Search: https://unsplash.com/s/photos/rocky-coastline

2. **mountains.jpg** - Mountain wilderness
   - Search: https://unsplash.com/s/photos/mountain-wilderness

3. **desert.jpg** - Desert landscape
   - Search: https://unsplash.com/s/photos/desert-landscape

4. **forest.jpg** - Dense forest
   - Search: https://unsplash.com/s/photos/dense-forest

5. **tundra.jpg** - Arctic tundra
   - Search: https://unsplash.com/s/photos/arctic-tundra

6. **urban-edge.jpg** - Abandoned urban area
   - Search: https://unsplash.com/s/photos/abandoned-urban

### Step 2: Prepare Images

- **Download** each image (choose landscape photos with 2:1 or similar aspect ratio)
- **Resize** to approximately 1200x600px (optional but recommended for performance)
- **Rename** to match the exact filenames above
- **Format**: Keep as JPG (or convert PNG to JPG)

### Step 3: Place Images

Copy all 6 images into:
```
public/images/environments/
```

Your folder should look like:
```
public/images/environments/
├── coast.jpg
├── desert.jpg
├── forest.jpg
├── mountains.jpg
├── tundra.jpg
├── urban-edge.jpg
└── README.md
```

### Step 4: Test

1. Run `npm run dev`
2. Start a new game
3. The scenario hero image at the top should now show a real photo instead of a gradient

## Image Requirements

- **Format**: JPG or PNG
- **Size**: Under 500KB each (optimize if needed)
- **Dimensions**: ~1200x600px (landscape orientation)
- **License**: Free to use (CC0 or similar from Unsplash/Pexels)

## Troubleshooting

**Images not showing?**
- Check file names match exactly (case-sensitive on some systems)
- Check files are in `public/images/environments/` not `src/`
- Clear browser cache and reload
- Check browser console for 404 errors

**Images too large?**
- Use an image optimizer: https://tinypng.com
- Or resize in your image editor to 1200x600px

## Reverting

If you want to go back to gradient backgrounds:

Edit `src/services/imageService.ts` line 208-220 and restore the original gradient fallbacks.

---

**Note**: This implementation uses stock images as the immediate fallback. If you later implement AI image generation, those AI images will take priority and these stock images will only show if AI generation fails.
