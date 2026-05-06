#!/usr/bin/env python3
"""
generate_leaderboards.py

Joins tournaments.yml (your curated metadata) with tournaments.json
(scraper output), filters to "TBA Around the World" tournaments only,
applies the scoring formula, and writes per-continent leaderboard YMLs
to _data/leaderboard/.

Scoring (dense / 1-2-2-3 ranking):
  1st  → 12 pts
  2nd  → 10 pts
  3rd  →  8 pts
  4th  →  6 pts
  5th  →  5 pts
  6th  →  4 pts
  7th  →  3 pts
  8th  →  2 pts
  9th+ →  1 pt  (minimum)

Usage:
  python generate_leaderboards.py

Expects (relative to working directory):
  _data/tournaments.yml   — metadata you maintain manually
  tournaments.json        — results from your scraper

Outputs:
  _data/leaderboard/<continent>.yml  for each continent found
"""

import json
import os
import urllib.request
import yaml

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

TOURNAMENTS_YML  = "_data/tournaments.yml"
TOURNAMENTS_JSON = "https://raw.githubusercontent.com/stopherjones/BGA-tournaments/main/data/tournaments.json"
OUTPUT_DIR       = "_data/leaderboard"
SERIES_FILTER    = "TBA Around the World"

# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def points_for_rank(rank: int) -> int:
    table = {1: 12, 2: 10, 3: 8, 4: 6}
    if rank in table:
        return table[rank]
    return max(1, 10 - rank)  # 5th=5, 6th=4 … 9th+=1

# ---------------------------------------------------------------------------
# Country → continent
# Mirrors the order in route.yml; extend as the journey continues.
# ---------------------------------------------------------------------------

CONTINENT_MAP: dict[str, str] = {
    # Europe
    "united-kingdom":   "europe",
    "netherlands":      "europe",
    "germany":          "europe",
    "denmark":          "europe",
    "sweden":           "europe",
    "norway":           "europe",
    "russia":           "europe",
    "greece":           "europe",
    "italy":            "europe",
    "switzerland":      "europe",
    "france":           "europe",
    "mallorca":         "europe",
    "spain":            "europe",
    "portugal":         "europe",
    # Africa
    "morocco":          "africa",
    "sahara-desert":    "africa",
    "botswana":         "africa",
    "south-africa":     "africa",
    "uganda":           "africa",
    "egypt":            "africa",
    "kenya":            "africa",
    # Asia
    "saudi-arabia":     "asia",
    "iraq":             "asia",
    "uzbekistan":       "asia",
    "pakistan-and-nepal": "asia",
    "india":            "asia",
    "china":            "asia",
    "thailand":         "asia",
    "vietnam":          "asia",
    "singapore":        "asia",
    "indonesia":        "asia",
    "japan":            "asia",
    # Americas
    "australia":        "americas",
    "hawaii":           "americas",
    "incan-america":    "americas",
    "bolivia":          "americas",
    "argentina":        "americas",
    "amazon":           "americas",
    "tobago":           "americas",
    "puerto-rico":      "americas",
    "bahamas":          "americas",
    "caribbean":        "americas",
    "guatemala":        "americas",
    "mexico":           "americas",
    "usa":              "americas",
    "canada":           "americas",
    "greenland":        "americas",
}

# ---------------------------------------------------------------------------
# Trophy emoji order for display
# ---------------------------------------------------------------------------

TROPHY_ORDER = {"🥇": 0, "🥈": 1, "🥉": 2}

def format_trophies(trophies: list[str]) -> str:
    return "".join(sorted(trophies, key=lambda t: TROPHY_ORDER.get(t, 9)))

# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------

def load_tournaments_yml(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}

def load_tournaments_json(url: str) -> dict:
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read().decode("utf-8"))

def build_leaderboards(meta: dict, json_data: dict) -> dict[str, dict]:
    """
    Returns { continent: { player_name: row_dict } }
    """
    # Build id → metadata lookup (ids stored as strings in both files)
    meta_by_id = {str(v["id"]): v for v in meta.values()}

    leaderboards: dict[str, dict] = {}
    skipped: list[str] = []

    for t in json_data["tournaments"]:
        # Series filter
        if t.get("title") != SERIES_FILTER:
            continue

        # Only count finished tournaments
        if t.get("status") != "finished":
            continue

        tid = str(t["id"])
        meta_entry = meta_by_id.get(tid)
        if not meta_entry:
            skipped.append(f"  ⚠  Tournament {tid} ({t.get('game_name', '?')}) "
                           "is in JSON but missing from tournaments.yml — skipped")
            continue

        country   = meta_entry.get("country", "")
        continent = CONTINENT_MAP.get(country)
        if not continent:
            skipped.append(f"  ⚠  Country '{country}' has no continent mapping — "
                           f"tournament {tid} skipped")
            continue

        board = leaderboards.setdefault(continent, {})

        for p in t["participants"]:
            rank = p.get("rank")
            name = p.get("name", "").strip()
            if rank is None or not name:
                continue

            pts = points_for_rank(rank)

            if name not in board:
                board[name] = {
                    "player":   name,
                    "stops":    0,
                    "points":   0,
                    "trophies": [],
                }

            board[name]["stops"]  += 1
            board[name]["points"] += pts

            if rank == 1:
                board[name]["trophies"].append("🥇")
            elif rank == 2:
                board[name]["trophies"].append("🥈")
            elif rank == 3:
                board[name]["trophies"].append("🥉")

    if skipped:
        print("\n".join(skipped))

    return leaderboards


ORDINALS = {1: "1st", 2: "2nd", 3: "3rd", 4: "4th"}

def update_tournaments_yml(meta: dict, json_data: dict) -> None:
    """
    Writes top4 finishers back into tournaments.yml for finished tournaments.
    Includes all participants with rank <= 4 (handles joint 2nds, joint 3rds).
    """
    meta_by_id = {str(v["id"]): v for v in meta.values()}
    changed = False

    for t in json_data["tournaments"]:
        if t.get("title") != SERIES_FILTER:
            continue
        if t.get("status") != "finished":
            continue

        tid = str(t["id"])
        meta_entry = meta_by_id.get(tid)
        if not meta_entry:
            continue

        top4 = [
            {"rank": ORDINALS[p["rank"]], "name": p["name"]}
            for p in t["participants"]
            if p.get("rank") is not None and p["rank"] <= 4
        ]
        top4.sort(key=lambda p: list(ORDINALS.values()).index(p["rank"]))

        if meta_entry.get("top4") != top4:
            meta_entry["top4"] = top4
            meta_entry["status"] = "completed"
            meta_entry.pop("round", None)
            changed = True

    if changed:
        output = yaml.dump(meta, allow_unicode=True, sort_keys=False,
                           default_flow_style=False)
        with open(TOURNAMENTS_YML, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"✓  {TOURNAMENTS_YML}  (top4 updated)")
    else:
        print(f"–  {TOURNAMENTS_YML}  (no changes)")


def write_leaderboards(leaderboards: dict[str, dict]) -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for continent, board in leaderboards.items():
        rows = sorted(
            board.values(),
            key=lambda r: (-r["points"], r["player"].lower()),
        )

        # Serialise trophies list → emoji string
        for row in rows:
            row["trophies"] = format_trophies(row["trophies"])

        path = os.path.join(OUTPUT_DIR, f"{continent}.yml")
        with open(path, "w", encoding="utf-8") as f:
            yaml.dump(rows, f, allow_unicode=True, sort_keys=False,
                      default_flow_style=False)

        print(f"✓  {path}  ({len(rows)} players)")


def main() -> None:
    print(f"Loading {TOURNAMENTS_YML}...")
    meta = load_tournaments_yml(TOURNAMENTS_YML)

    print(f"Fetching {TOURNAMENTS_JSON}...")
    json_data = load_tournaments_json(TOURNAMENTS_JSON)

    print(f"Building leaderboards (series: '{SERIES_FILTER}')...\n")
    leaderboards = build_leaderboards(meta, json_data)

    write_leaderboards(leaderboards)
    update_tournaments_yml(meta, json_data)
    print("\nDone.")


if __name__ == "__main__":
    main()