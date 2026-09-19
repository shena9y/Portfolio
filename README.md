# 👨‍💻 Mohammed — Frontend Developer Portfolio

My personal portfolio site — a dark, minimalist single-page experience showcasing my work as a frontend developer building interfaces and the small tools underneath them (Electron apps, CLI utilities, and web builds with HTML, CSS, JavaScript and Node). Hand-crafted with vanilla HTML/CSS/JS, self-hosted fonts, and a custom animated canvas hero.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Performance](https://img.shields.io/badge/Performance-Optimized-brightgreen?style=flat)

## ✨ Features

- 🎨 **Animated canvas hero** — interactive dot-grid "wallpaper" that reacts to the mouse, with `prefers-reduced-motion` support
- ⚡ **Performance-first** — all entry points run after first paint (double `requestAnimationFrame`) to protect FCP/LCP; preloaded WOFF2 fonts
- 🔤 **Self-hosted fonts** — Space Grotesk, IBM Plex Sans & IBM Plex Mono (no third-party font requests)
- ♿ **Accessible** — skip-to-content link, semantic landmarks, content stays visible with JavaScript disabled (animations gated behind a `.js` class)
- 🌐 **SEO / social ready** — Open Graph + Twitter Card meta, canonical URL, custom OG image
- 🌑 **Dark theme** with a custom SVG animated logo glyph

## 🛠️ Tech Stack

- **HTML5** — semantic markup with ARIA labels
- **CSS3** — custom properties, reveal animations (`style.css` + `fonts.css`)
- **Vanilla JavaScript** — canvas animation engine (`app.js`)
- **Fonts** — self-hosted `.woff2` files

## 📂 Project Structure

```
Portfolio/
├── index.html         # Single-page site
├── style.css          # Layout & reveal animations
├── fonts.css          # @font-face declarations
├── app.js             # Canvas hero + interactions
├── fonts/             # Space Grotesk, IBM Plex (woff2)
├── favicon.svg / favicon-32.png / apple-touch-icon.png
└── og-image.png       # Social share image
```

## 🚀 Getting Started

Static site — no build step:

```bash
git clone https://github.com/shena9y/Portfolio.git
cd Portfolio
```

Open `index.html` in a browser, or serve it:

```bash
npx serve .
```

## 📝 License

This project is licensed under the MIT License.
