# Archgen loaders

Five loading screens for [archgenlabs.com](https://archgenlabs.com), each gone within 1.2 seconds of the page starting.

**View them:** https://msreeganeshnaik.github.io/archgen-loaders/

| Loader | What happens |
| --- | --- |
| Route | Pin one lights, the AG net routes out of it, the page lifts away. |
| Place | The hero's eight macros legalise into the home page floorplan, then the die becomes the page. |
| Stack | The Tape-out Hairline figure closes: package, die and net, pin one marked. |
| Close | CORE2's worst slack climbs from −0.185 to +0.003 ns, then the screen closes into the red pin. |
| Expose | A wafer is exposed die by die, one die is marked, and the page opens out of it. |

Each loader skips on a tap or key, and shows a still frame then fades for visitors who ask for reduced motion.
Full-screen demos: `01-route.html` to `05-expose.html`.

## Putting one on the site

1. Copy `drop-in/archgen-loader.css` and one `drop-in/archgen-loader-<name>.js` into the site's `assets/`.
2. In `<head>`: `<link rel="stylesheet" href="assets/css/archgen-loader.css">`
3. As the very first thing inside `<body>`: `<script src="assets/js/archgen-loader-route.js"></script>`

It plays once per tab and fires `archgen:loaded` on `document.body` when the page is showing.
