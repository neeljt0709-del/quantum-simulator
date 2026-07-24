# Q-SIM site

A small static site for your quantum simulator: a live, interactive 3D Bloch
sphere (driven by the same complex-amplitude gate math as your Python
`Statevector` class), an explanation of how the tensor-based gate application
works, an API reference, and a customizable About page.

## Files

```
index.html        Main page: hero demo, how-it-works, API reference
about.html         Customizable about/bio page
css/style.css       Shared styles
js/quantum.js       Complex-number single-qubit gate math (mirrors simulator.py)
js/bloch.js         three.js Bloch sphere renderer (drag to orbit, scroll to zoom)
js/main.js           Wires gate buttons to the math + renderer + readout panel
```

## Running it locally

No build step — it's plain HTML/CSS/JS. Easiest way to preview:

```bash
cd qsim-site
python3 -m http.server 8000
```

Then open `http://localhost:8000`. (Opening `index.html` directly by
double-clicking usually works too, but some browsers restrict local file
access in ways that can affect font loading — a local server avoids that.)

## Hosting for free

**GitHub Pages** is the simplest option since your simulator is already on
GitHub:
1. Push this `qsim-site` folder into your repo (or a `docs/` folder, or a
   separate `gh-pages` branch)
2. In your repo: Settings → Pages → set the source to that folder/branch
3. Your site will be live at `https://your-username.github.io/your-repo/`

## Customizing

- **`about.html`** has `<!-- EDIT: ... -->` comments marking every spot meant
  to be replaced — your name, bio, project description, timeline, and links.
- **GitHub link**: search both HTML files for `your-username/your-repo` and
  replace with your actual repo URL.
- **Colors/fonts**: everything is driven by CSS variables at the top of
  `css/style.css` (`--violet`, `--amber`, `--rose`, `--teal`, `--ink`,
  `--paper`) if you want to retheme it.
- **API reference table**: edit the `<table>` markup directly inside
  `index.html` under the `#api-reference` section if your simulator's methods
  change.

## Notes on the Bloch sphere demo

It only supports single-qubit circuits — this is intentional, not a
limitation of your actual simulator. A point on the Bloch sphere only
represents a well-defined single-qubit state when that qubit is unentangled
from the rest of the register; the moment you add a CNOT and entangle two
qubits, there's no longer a single point that represents either qubit alone.
The "How it works" section on the page explains this, and it's a good talking
point if it comes up in an interview.
