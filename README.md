# SWOT Tank Water Tracker: website

**Live site: https://swot-tank-tracker.netlify.app**

A small website for our IS4990 project "SWOT Tank Water Tracker for Sri Lanka" (Group 6, JARVIS, University of Moratuwa). It explains the project and shows real SWOT data for our five study reservoirs.

## Pages

| Page | What it shows |
|---|---|
| `index.html` | Why the project matters, the problem we solve, how it works, the study area and who does what |
| `explainer.html` | An interactive model tank: how water height and water area add up to volume |
| `data.html` | Three years of SWOT water levels and stored water for the five reservoirs, with a table of every reading |
| `costs.html` | A calculator: what loggers, a sonar or paid images would cost to check the village tanks more often |

It is plain HTML, CSS and JavaScript, with no build step and no outside libraries. The pages also work when opened straight from the disk.

## Update the SWOT data

```
python tools/prep_data.py
```

This gets the latest best-quality readings from NASA's Hydrocron service (no login) and rewrites `site/data/reservoirs.json` and `site/data/reservoirs.js`. It needs only the Python standard library.

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
