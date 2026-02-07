# FinTrend Favicon & Branding

## 🎨 Favicon Design

The FinTrend favicon features a modern, minimalist design representing financial growth and market trends.

### Design Elements:
- **Background**: Blue gradient (#1e3a8a to #3b82f6) - Professional, trustworthy
- **Icon**: Upward trending chart line in cyan (#06b6d4) - Growth, positive trends
- **Style**: Clean, geometric, data-focused
- **Format**: SVG (scalable vector graphics) for crisp display at any size

### Files Included:

```
public/
├── favicon.svg              # Main SVG favicon (recommended)
├── favicon.png              # PNG fallback (512x512)
├── favicon-192.png          # PWA icon (192x192)
├── favicon-512.png          # PWA icon (512x512)
├── apple-touch-icon.png     # iOS home screen icon
├── manifest.json            # PWA manifest
└── generate-favicon.html    # Favicon generator tool
```

## 🖼️ Generating PNG Favicons

If you need to generate PNG versions:

1. Open `http://localhost:5173/generate-favicon.html` in your browser
2. Click "Download favicon.png"
3. Save to `public/` folder
4. Resize as needed for different sizes

## 📱 PWA Support

The `manifest.json` file enables Progressive Web App features:
- Add to home screen on mobile
- Standalone app mode
- Custom theme color
- App name and description

## 🎨 Brand Colors

```css
/* Primary Blue */
--primary-dark: #1e3a8a;
--primary: #3b82f6;
--primary-light: #60a5fa;

/* Accent Cyan */
--accent: #06b6d4;
--accent-light: #0ea5e9;

/* Sentiment Colors */
--bullish: #10b981;  /* Green */
--neutral: #6b7280;  /* Gray */
--bearish: #ef4444;  /* Red */
```

## 📝 SEO & Meta Tags

The `index.html` includes comprehensive meta tags for:
- Search engine optimization (SEO)
- Social media sharing (Open Graph)
- Twitter cards
- Mobile optimization
- PWA support

## 🔄 Updating the Favicon

To update the favicon:

1. Edit `public/favicon.svg`
2. Regenerate PNG versions using `generate-favicon.html`
3. Update `manifest.json` if needed
4. Clear browser cache to see changes

## 📊 Browser Support

- ✅ Chrome/Edge: SVG + PNG
- ✅ Firefox: SVG + PNG
- ✅ Safari: SVG + PNG + Apple Touch Icon
- ✅ Mobile browsers: PWA manifest icons

---

**Created**: 2026-02-07  
**Version**: 1.0.0
