import fs from "fs";
import path from "path";
import yaml from "yaml";
import { JSDOM } from "jsdom";

const FILE_PATH = "_data/tournaments.yml";
const BGA_URL = "https://boardgamearena.com/tournament?id=";

// ------------------------------------------------------------
// Load existing YAML
// ------------------------------------------------------------
function loadExisting() {
  if (!fs.existsSync(FILE_PATH)) return {};
  const raw = fs.readFileSync(FILE_PATH, "utf8");
  return yaml.parse(raw) || {};
}

// ------------------------------------------------------------
// Fetch tournament HTML
// ------------------------------------------------------------
async function fetchTournament(id) {
  const url = `${BGA_URL}${id}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.warn(`⚠️ Failed to fetch ${id}: ${res.status}`);
    return null;
  }

  const html = await res.text();
  return { id, html, url };
}

// ------------------------------------------------------------
// Parse tournament HTML into structured data
// ------------------------------------------------------------
function parseTournament({ id, html, url }) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Title
  const titleEl = doc.querySelector(".tournament_title, h1");
  const name = titleEl ? titleEl.textContent.trim() : `Tournament ${id}`;

  // Extract game + country from title pattern
  let country = null;
  let game = null;

  const match = name.match(/^(.*?) Tournament \((.*?)\)$/);
  if (match) {
    game = match[1]
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    country = match[2]
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
  }

  // Status
  let status = "ongoing";
  const statusEl = doc.querySelector(".tournament_status, .status");
  if (statusEl) {
    const text = statusEl.textContent.toLowerCase();
    if (text.includes("completed")) status = "completed";
  }

  // Round (if ongoing)
  let round = null;
  const roundEl = doc.querySelector(".tournament_round, .round");
  if (roundEl) {
    const m = roundEl.textContent.match(/Round\s+(\d+)/i);
    if (m) round = Number(m[1]);
  }

  // Top 4 (if completed)
  let top4 = null;
  if (status === "completed") {
    top4 = [];
    const rows = [...doc.querySelectorAll(".ranking_table tr")].slice(1, 5);

    rows.forEach((row) => {
      const cols = row.querySelectorAll("td");
      if (cols.length >= 2) {
        top4.push({
          rank: cols[0].textContent.trim(),
          name: cols[1].textContent.trim(),
        });
      }
    });

    if (top4.length === 0) top4 = null;
  }

  return {
    id,
    country,
    game,
    name,
    bga_url: url,
    status,
    ...(status === "completed" ? { top4 } : { round }),
  };
}

// ------------------------------------------------------------
// Main scraping routine
// ------------------------------------------------------------
async function scrape() {
  console.log("🔍 Loading existing tournaments...");
  const existing = loadExisting();

  const ids = Object.keys(existing).map(Number);
  console.log(`📡 Scraping ${ids.length} tournaments...`);

  for (const id of ids) {
    const fetched = await fetchTournament(id);
    if (!fetched) continue;

    const parsed = parseTournament(fetched);
    existing[id] = parsed;

    console.log(`✓ Updated ${id}`);
  }

  // Sort by numeric ID
  const sorted = Object.fromEntries(
    Object.entries(existing).sort(([a], [b]) => Number(a) - Number(b))
  );

  // Write YAML
  const output = yaml.stringify(sorted, { indent: 2 });
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, output, "utf8");

  console.log("🎉 tournaments.yml updated");
}

scrape().catch((err) => {
  console.error(err);
  process.exit(1);
});
