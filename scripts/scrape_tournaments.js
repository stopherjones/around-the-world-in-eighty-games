// CommonJS version — updated for 2026 layout status & YAML merging
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

  const pageContent = doc.body.textContent.toLowerCase();
  
  // 1. Status Detection (Broadened for reliability)
  let status = "unknown";
  
  // Check for "Finished" or "Ended" anywhere on the page
  const hasEnded = pageContent.includes("ended") || pageContent.includes("finished");
  // Check for active indicators
  const inProgress = pageContent.includes("in progress") || 
                     pageContent.includes("playing an encounter") || 
                     pageContent.includes("waiting for the next");

  if (hasEnded) status = "completed";
  else if (inProgress) status = "ongoing";

  // 2. Result Scraping (Completed)
  if (status === "completed") {
    // Target the Tournament State table rows
    const rows = [...doc.querySelectorAll("#tournament_ranking tr, table.ranking tr")].slice(1);
    const top4 = rows.slice(0, 4).map((row, index) => {
      const nameEl = row.querySelector("a.playername, .player-name");
      const name = nameEl ? nameEl.textContent.trim() : "Unknown";
      const ranks = ["1st", "2nd", "3rd", "4th"];
      return { rank: ranks[index], name: name };
    });

    return { status, top4: top4.length > 0 ? top4 : null };
  }

  // 3. Progress Scraping (Ongoing)
  if (status === "ongoing") {
    const roundMatch = pageContent.match(/round\s*(\d+)/i);
    return { status, round: roundMatch ? roundMatch[1] : "1" };
  }

  return { status: "unknown" };
}

async function main() {
  const existing = loadExisting();
  const ids = Object.keys(existing).map(Number);

  for (const id of ids) {
    try {
      console.log(`Scraping tournament ${id}...`);
      const scraped = await scrapeTournament(id);

      // FIX: Remove old volatile keys to prevent YAML duplication
      delete existing[id].status;
      delete existing[id].round;
      delete existing[id].top4;

      // Apply new data
      existing[id].status = scraped.status;
      if (scraped.status === "completed") {
        existing[id].top4 = scraped.top4;
      } else if (scraped.status === "ongoing") {
        existing[id].round = scraped.round;
      }
    } catch (err) {
      console.error(`Error scraping ${id}:`, err.message);
    }
  }

  const sorted = Object.fromEntries(
    Object.entries(existing).sort(([a], [b]) => Number(a) - Number(b))
  );

  fs.writeFileSync(FILE_PATH, yaml.stringify(sorted), "utf8");
  console.log("Update complete.");
}

main();