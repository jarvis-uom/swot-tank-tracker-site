# SWOT Tank Water Tracker: website

**Live site: https://swot.mehara.work** (also at https://swot-tank-tracker.netlify.app)

A small website for our IS4990 project "SWOT Tank Water Tracker for Sri Lanka" (Group 6, JARVIS, University of Moratuwa). It explains the project and shows real SWOT data for our five study reservoirs.

## Pages

| Page | What it shows |
|---|---|
| `index.html` | Why the project matters, the problem we solve, how it works, the study area and who does what |
| `explainer.html` | An interactive model tank: how water height and water area add up to volume |
| `shapes.html` | Five tank bank shapes with round numbers: when top, bottom or average area × height gives the right amount of water |
| `steps.html` | One worked example on real satellite days: where each height and area comes from, the function A(h), the layers (the integral) and the checks |
| `calendar.html` | Satellite calendar: real days with data from each satellite since NISAR started (June 2026) and expected days to March 2027, from `assets/calendar-data.js` (made by `temp/calendar/build_calendar_data.py` in the project folder) |
| `data.html` | Three years of SWOT water levels and stored water for the five reservoirs, with a table of every reading |
| `presentation.html` | Our 17-slide proposal talk in a slide viewer, with the PDF (opens in a new tab) and the PowerPoint to download |

It is plain HTML, CSS and JavaScript, with no build step and no outside libraries. The pages also work when opened straight from the disk.

## Update the SWOT data

```
python tools/prep_data.py
```

This gets the latest best-quality readings from NASA's Hydrocron service (no login) and rewrites `site/data/reservoirs.json` and `site/data/reservoirs.js`. It needs only the Python standard library.

## Update the slides

1. Copy the PowerPoint without its speaker notes (the website copy has none; the deck with notes is not changed):
   ```
   python tools/strip_notes.py "<deck with notes>.pptx" site/assets/docs/swot-tank-tracker-proposal-talk.pptx
   ```
2. Replace the PDF, `site/assets/docs/swot-tank-tracker-proposal-talk.pdf`, with a slides-only PDF (no notes pages).
3. Export each slide as a 1280 × 720 JPG to `site/assets/slides/slide-01.jpg`, `slide-02.jpg` and so on, and a 320 × 180 copy as `thumb-01.jpg` and so on.
4. If the number of slides or their titles change, update the title list near the end of `presentation.html`, and the date under the buttons.

## Put it on Netlify

- **Linked to this repo (updates on every push):**
  1. In Netlify, choose **Add new site** → **Import an existing project** → GitHub, and pick this repo.
  2. Leave the build command empty. The publish folder (`site`) is already set in `netlify.toml`.
  3. Click **Deploy**.
- **Without a repo:** drag the `site` folder onto https://app.netlify.com/drop.

## Credits

- SWOT: NASA/JPL and CNES, Lake Single-Pass product version D, through NASA PO.DAAC's Hydrocron.
- Sentinel-1 and Sentinel-2: contains modified Copernicus Sentinel data 2023–2026.
- Reservoir capacities: Irrigation Department of Sri Lanka, Reservoir Status.
- Tank outlines: © OpenStreetMap contributors.
