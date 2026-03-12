const { JSDOM } = require("jsdom");
const fs = require("fs");
const yaml = require("yaml");

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
  
  // 1. IMPROVED STATUS DETECTION
  let status = "unknown";
  
  // Checking for explicit 'ended' signals in headers or the specific progress area
  const isFinished = pageText.includes("tournament has ended") || 
                     pageText.includes("this tournament is finished") ||
                     doc.querySelector(".bga-tournament-finished, .tournament_finished") !== null;

  const isOngoing = pageText.includes("in progress") || 
                    pageText.includes("waiting for") || 
                    pageText.includes("playing an encounter");

  if (isFinished) {
    status = "completed";
  } else if (isOngoing) {
    status = "ongoing";
  }

  // 2. RELIABLE PLAYER SCRAPING (Targeting the 'Tournament State' table)
  let top4 = null;
  if (status === "completed") {
    // We look for any table row that contains ranking identifiers
    const rows = [...doc.querySelectorAll("tr")].filter(row => 
      row.textContent.match(/1st|2nd|3rd|4th/i) && row.querySelector("a")
    );

    if (rows.length > 0) {
      top4 = rows.slice(0, 4).map((row, index) => {
        const nameEl = row.querySelector("a.playername, a[href*='player'], .player-name");
        const ranks = ["1st", "2nd", "3rd", "4th"];
        return {
          rank: ranks[index],
          name: nameEl ? nameEl.textContent.trim() : "Unknown"
        };
      });
    }
  }

  // 3. ROUND SCRAPING (Ongoing)
  let round = null;
  if (status === "ongoing") {
    const roundMatch = pageText.match(/round\s*(\d+)/i);
    round = roundMatch ? roundMatch[1] : "1";
  }

  return { status, top4, round };
}

async function main() {
  const existing = loadExisting();
  const ids = Object.keys(existing).map(Number);

  for (const id of ids) {
    try {
      console.log(`Checking Tournament ${id}...`);
      const scraped = await scrapeTournament(id);

      // PREVENT DUPLICATES: Force-clear volatile fields before re-assigning
      delete existing[id].status;
      delete existing[id].top4;
      delete existing[id].round;

      // Update with new data
      existing[id].status = scraped.status;
      
      if (scraped.status === "completed" && scraped.top4) {
        existing[id].top4 = scraped.top4;
      } else if (scraped.status === "ongoing") {
        existing[id].round = scraped.round;
      }

      console.log(` -> Status: ${scraped.status}`);
    } catch (err) {
      console.error(`Error on ${id}:`, err.message);
    }
  }

  // Clean sort and write
  const sorted = Object.fromEntries(
    Object.entries(existing).sort(([a], [b]) => Number(a) - Number(b))
  );

  fs.writeFileSync(FILE_PATH, yaml.stringify(sorted), "utf8");
  console.log("✓ All tournaments processed and saved to YAML.");
}

main();