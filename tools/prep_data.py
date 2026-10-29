"""Make site/data/reservoirs.json: SWOT readings and official capacities for the five study reservoirs.

    python tools/prep_data.py

Only the Python standard library is used. SWOT data come from NASA PO.DAAC's Hydrocron service (no login).
Best-quality readings: quality_f 0, xovr_cal_q 0 or 1, dark_frac 0.1 or less (Köhn and Nielsen, 2026). They give the
line, the storage and the key numbers. The other readings SWOT does not call bad (quality_f 0 or 1) are kept apart as
"suspect", for hollow dots on the level chart, unless their height lies more than 1 m outside the best readings' range.
"""
import csv
import io
import json
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "site" / "data" / "reservoirs.json"
HYDROCRON = "https://soto.podaac.earthdatacloud.nasa.gov/hydrocron/v1/timeseries"
FIELDS = "lake_id,time_str,wse,area_total,quality_f,xovr_cal_q,dark_frac,ds1_l"
ACRE_FT = 1233.48  # m³ per acre-foot

# Irrigation Department "Reservoir Status" sheet, 25 Oct 2026: gross capacity and dead storage (acre-feet),
# full supply depth (feet on the gauge).
RESERVOIRS = [
    {"name": "Hurulu Wewa", "lake_id": "4580013372", "official_name": "Huruluwewa", "gross_acft": 54966, "dead_acft": 2000, "fsd_ft": 27.50},
    {"name": "Mahakanadarawa", "lake_id": "4580006192", "official_name": "Mahakandarawa", "gross_acft": 38420, "dead_acft": 3800, "fsd_ft": 20.67},
    {"name": "Nachchaduwa", "lake_id": "4580051323", "official_name": "Nachchaduwa", "gross_acft": 45157, "dead_acft": 100, "fsd_ft": 25.00},
    {"name": "Nuwara Wewa", "lake_id": "4580009523", "official_name": "Nuwara Wewa", "gross_acft": 36077, "dead_acft": 1000, "fsd_ft": 23.00},
    {"name": "Manankattiya", "lake_id": "4580013332", "official_name": "Manankattiya", "gross_acft": 4864, "dead_acft": 300, "fsd_ft": 18.08},
]
DITWAH = ("2025-11-26", "2025-12-20")  # last reading on or before, first reading on or after


def fetch(lake_id):
    params = {"feature": "PriorLake", "feature_id": lake_id, "start_time": "2023-07-01T00:00:00Z",
              "end_time": date.today().isoformat() + "T00:00:00Z", "output": "csv", "fields": FIELDS}
    req = urllib.request.Request(HYDROCRON + "?" + urllib.parse.urlencode(params),
                                 headers={"User-Agent": "swot-tank-tracker website (student project)"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return list(csv.DictReader(io.StringIO(json.load(r)["results"]["csv"])))


def is_best(r):
    return r["quality_f"] == "0" and float(r["xovr_cal_q"]) <= 1 and float(r["dark_frac"]) <= 0.1


def best(rows):
    out = {}
    for r in rows:
        if r["time_str"] == "no_data" or float(r["wse"]) < -1e10 or not is_best(r):
            continue
        day = r["time_str"][:10]
        ds = float(r["ds1_l"])
        out[day] = {"date": day, "wse": round(float(r["wse"]), 2), "area_km2": round(float(r["area_total"]), 2),
                    "ds1_mcm": None if ds < -1e10 else ds * 1000}  # km³ to million m³
    return [out[d] for d in sorted(out)]


def suspect(rows, readings):
    """Readings SWOT marks suspect (or with too much dark water) on days with no best-quality reading."""
    lo, hi = min(r["wse"] for r in readings) - 1, max(r["wse"] for r in readings) + 1
    taken = {r["date"] for r in readings}
    out = {}
    for r in rows:
        if r["time_str"] == "no_data" or float(r["wse"]) < -1e10 or is_best(r) or r["quality_f"] not in ("0", "1"):
            continue
        day = r["time_str"][:10]
        if day in taken or not lo <= float(r["wse"]) <= hi:
            continue
        out[day] = {"date": day, "wse": round(float(r["wse"]), 2), "area_km2": round(float(r["area_total"]), 2)}
    return [out[d] for d in sorted(out)]


def main():
    result = []
    for res in RESERVOIRS:
        rows = fetch(res["lake_id"])
        readings = best(rows)
        doubtful = suspect(rows, readings)
        stored = [r["ds1_mcm"] for r in readings if r["ds1_mcm"] is not None]
        low = min(stored) if stored else None
        for r in readings:  # storage above the lowest best-quality reading
            r["stored_mcm"] = None if r["ds1_mcm"] is None else round(r["ds1_mcm"] - low, 2)
            del r["ds1_mcm"]
        before = [r for r in readings if r["date"] <= DITWAH[0]]
        after = [r for r in readings if r["date"] >= DITWAH[1]]
        ditwah = None
        if before and after:
            a, b = before[-1], after[0]
            ditwah = {"from": a["date"], "to": b["date"], "rise_m": round(b["wse"] - a["wse"], 2),
                      "gain_mcm": None if None in (a["stored_mcm"], b["stored_mcm"]) else round(b["stored_mcm"] - a["stored_mcm"], 1)}
        result.append({
            "name": res["name"], "lake_id": res["lake_id"], "official_name": res["official_name"],
            "gross_capacity_mcm": round(res["gross_acft"] * ACRE_FT / 1e6, 1),
            "dead_storage_mcm": round(res["dead_acft"] * ACRE_FT / 1e6, 1),
            "full_supply_depth_ft": res["fsd_ft"],
            "ditwah": ditwah,
            "readings": readings,
            "suspect": doubtful,
        })
        print(f"{res['name']}: {len(readings)} best-quality and {len(doubtful)} suspect readings, Ditwah {ditwah}")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps({"made": date.today().isoformat(), "source": "NASA PO.DAAC Hydrocron, SWOT LakeSP version D",
                       "reservoirs": result}, separators=(",", ":"))
    OUT.write_text(text, encoding="utf-8")
    # the same data as a script, so the pages also work when opened straight from the disk
    OUT.with_suffix(".js").write_text("window.SWOT_DATA = " + text + ";\n", encoding="utf-8")
    print("wrote", OUT.relative_to(ROOT), "and", OUT.with_suffix(".js").name, OUT.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
