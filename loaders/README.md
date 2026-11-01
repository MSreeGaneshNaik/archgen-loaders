# Archgen loader

The loading screen for [archgenlabs.com](https://archgenlabs.com): **Route, landing by retract**, about 2.75 seconds.

**See it:** https://msreeganeshnaik.github.io/archgen-loaders/

Pin one lights and the AG net routes out of it, net by net. The logo holds for a beat, then the nets
route back into pin one, last laid first out. The red pin rises on an arc to the header and writes
ARCHGEN LABS out of itself as it runs to the end of the name. A tap skips; visitors who ask for reduced
motion get the finished logo, then a fade.

Earlier rounds, kept for reference:
- All five loaders: https://msreeganeshnaik.github.io/archgen-loaders/options.html
- Three header landings for Route (1.2 s versions): https://msreeganeshnaik.github.io/archgen-loaders/route.html

## Putting it on the site

1. Copy `drop-in/archgen-loader.css` and `drop-in/archgen-loader-route.js` into the site's `assets/`.
2. In `<head>`: `<link rel="stylesheet" href="assets/css/archgen-loader.css">`
3. As the very first thing inside `<body>`: `<script src="assets/js/archgen-loader-route.js"></script>`

It lands on `.brand .lockup`, the header logo on archgenlabs.com, plays once per tab, and fires
`archgen:loaded` on `document.body` when the page is showing.
