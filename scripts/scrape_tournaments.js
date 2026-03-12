const { JSDOM } = require("jsdom");
const fs = require("fs");
const yaml = require("yaml");

// Compatibility polyfill for fetch in older Node environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const FILE_PATH = "_data/tournaments.yml";

function loadExisting() {
  if (!fs.existsSync(FILE_PATH)) return {};
  const raw = fs.readFileSync(FILE_PATH, "utf8");
  return yaml.parse(raw) || {};
}

async function scrapeTournament(id) {
  const url = `https://boardgamearena.com/tournament?id=${id}`;
  const res = await fetch(url);
  const html = await res.text();
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const pageText = doc.body.textContent.toLowerCase();
  const progressBarText = doc.querySelector(".bga-progress-bar")?.textContent.toLowerCase() || "";

  // 1. SCRAPE PLAYERS FIRST (The most reliable indicator of completion)
  // We look for any table row that looks like a ranking podium
  const rows = [...doc.querySelectorAll("tr")].filter(row => 
    row.textContent.match(/1st|2nd|3rd|4th/i) && (row.querySelector("a") || row.querySelector(".player-name"))
  );

  let top4 = null;
  if (rows.length > 0) {
    top4 = rows.slice(0, 4).map((row, index) => {
      const nameEl = row.querySelector("a.playername, a[href*='player'], .player-name, .name");
      const ranks = ["1st", "2nd", "3rd", "4th"];
      return {
        rank: ranks[index],
        name: nameEl ? nameEl.textContent.trim() : "Unknown"
      };
    });
  }

  // 2. DETERMINE STATUS
  let status = "unknown";
  
  // If we found a podium/results, it MUST be completed
  if (top4 && top4.length > 0) {
    status = "completed";
  } else if (pageText.includes("tournament has ended") || progressBarText.includes("finished")) {
    status = "completed";
  } else if (pageText.includes("in progress") || progressBarText.includes("playing") || progressBarText.includes("waiting")) {
    status = "ongoing";
  }

  // 3. ROUND SCRAPING (Only if ongoing)
  let round = null;
  if (status === "ongoing") {
    const roundMatch = (progressBarText + pageText).match(/round\s*(\d+)/i);
    round = roundMatch ? roundMatch[1] : "1";
  }

  return { status, top4, round };
}

async function main() {
  const existing = loadExisting();
  const ids = Object.keys(existing).map(Number);

  for (const id of ids) {
    try {
      console.log(`Scraping ${id}...`);
      const scraped = await scrapeTournament(id);

      // Clean existing fields to prevent YAML duplicates
      delete existing[id].status;
      delete existing[id].top4;
      delete existing[id].round;

      existing[id].status = scraped.status;
      
      if (scraped.status === "completed") {
        existing[id].top4 = scraped.top4;
      } else if (scraped.status === "ongoing") {
        existing[id].round = scraped.round;
      }

      console.log(` -> Result: ${scraped.status} ${scraped.top4 ? '(with players)' : ''}`);
    } catch (err) {
      console.error(`Error on ${id}:`, err.message);
    }
  }

  const sorted = Object.fromEntries(
    Object.entries(existing).sort(([a], [b]) => Number(a) - Number(b))
  );

  fs.writeFileSync(FILE_PATH, yaml.stringify(sorted), "utf8");
  console.log("✓ Update complete.");
}

main();