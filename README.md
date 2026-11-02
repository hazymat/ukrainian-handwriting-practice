# Ukrainian Handwriting Practice

**Use it here: <https://hazymat.github.io/ukrainian-handwriting-practice/>**

A browser-only copybook (прописи) for learning Ukrainian cursive, designed for iPad + Apple Pencil.

- Slanted ruling (65°) with dashed, x-height and baseline lines, like a Ukrainian school copybook
- Each element has a demonstration box with a start point and direction arrow, then three rows: trace solid guides, trace dotted guides, then write freely from one model
- Each row is scored when you lift the pencil (ink vs. model shape)
- Pencil draws, fingers scroll (tick **Finger** to draw with a finger or mouse)
- Work is saved in your browser only — no accounts, tracking, adverts or installs

Open it at the GitHub Pages URL, or add it to your iPad home screen from Safari's Share menu.

## Structure
- `elements.js` — stroke shapes (SVG paths in x-height units, upright; slant is applied at draw time) and the lesson order
- `app.js` — ruling, rendering, pencil input, scoring

## Roadmap
- Full lowercase and capital alphabet, then joined words
- Stroke order and direction checking

MIT licensed.
