// CommonJS version — works on GitHub Actions without config
const { JSDOM } = require("jsdom");
const fs = require("fs");
const yaml = require("yaml");

// Path to your YAML file
const FILE_PATH = "_data/tournaments.yml";

// Load existing YAML
function loadExisting() {
  if (!fs.existsSync(FILE_PATH)) return {};
  const raw = fs.readFileSync(FILE_PATH, "utf8");
  return yaml.parse(raw) || {};
}

// Fetch + parse a single tournament
async function scrapeTournament(id) {
  const url = `https://boardgamearena.com/tournament?id=${id}`;
  const res = await fetch(url);
  const html = await res.text();
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const pageText = doc.body.textContent.toLowerCase();

  // Status Detection: New 2026 Layout
  // Check for the status text in the progress bar container you identified
  const progressBarText = doc.querySelector(".bga-progress-bar")?.textContent.toLowerCase() || "";
  
  const isCompleted = pageText.includes("this tournament has ended") || progressBarText.includes("finished");
  const isOngoing = pageText.includes("this tournament is in progress") || 
                    progressBarText.includes("playing an encounter") || 
                    progressBarText.includes("waiting for the next tournament step");

  // Completed tournament: Scrape the "Tournament State" table at the bottom
  if (isCompleted) {
    // The "Tournament State" table usually lists rankings under 1st, 2nd, etc.
    // We target rows in the ranking section.
    const rankingRows = [...doc.querySelectorAll("#tournament_ranking tr, .tournament_ranking tr")].slice(1); // Skip header

    const top4 = rankingRows.slice(0, 4).map(row => {
      // Find the player name link/text within the row
      const nameEl = row.querySelector("a.playername, .player-name");
      return nameEl ? nameEl.textContent.trim() : "Unknown";
    });

    return {
      id,
      status: "completed",
      top4: top4.length > 0 ? top4 : null
    };
  }

  // Ongoing tournament: Extract round info
  if (isOngoing) {
    // Round info is often in a "bga-tournament-round-info" class or similar status text
    const roundEl = doc.querySelector(".bga-tournament-round-info, .tournament_round");
    let round = roundEl ? roundEl.textContent.trim() : null;

    // Fallback: Try to find "Round X/Y" in the progress bar text
    if (!round && progressBarText.includes("round")) {
      const match = progressBarText.match(/round\s*(\d+)/i);
      if (match) round = match[0];
    }

    return {
      id,
      status: "ongoing",
      round
    };
  }

  // Fallback
  return {
    id,
    status: "unknown"
  };
}

// Main runner
async function main() {
  const existing = loadExisting();
  const ids = Object.keys(existing).map(Number);

  for (const id of ids) {
    try {
      console.log(`Scraping tournament ${id}...`);
      const scraped = await scrapeTournament(id);

      // Merge only scraper-controlled fields
      existing[id].status = scraped.status;
      if (scraped.status === "completed") {
        existing[id].top4 = scraped.top4;
        delete existing[id].round;
      } else if (scraped.status === "ongoing") {
        existing[id].round = scraped.round;
        delete existing[id].top4;
      }
    } catch (err) {
      console.error(`Error scraping ${id}:`, err.message);
      existing[id].status = "error";
      existing[id].error = err.message;
    }
  }

  // Sort by ID and save
  const sorted = Object.fromEntries(
    Object.entries(existing).sort(([a], [b]) => Number(a) - Number(b))
  );

  fs.writeFileSync(FILE_PATH, yaml.stringify(sorted), "utf8");
  console.log("Update complete.");
}

main();