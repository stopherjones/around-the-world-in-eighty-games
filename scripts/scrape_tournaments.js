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

  const isCompleted = pageText.includes("this tournament has ended");
  const isOngoing = pageText.includes("this tournament is in progress");

  // Completed tournament
  if (isCompleted) {
    const playerBlocks = [
      ...doc.querySelectorAll(".tournaments-results-players__player")
    ];

    const top4 = playerBlocks.slice(0, 4).map(block => {
      const nameEl = block.querySelector(".tournaments-results-players__name");
      const rankEl = block.querySelector(".tournaments-results-players__rank");

      return {
        rank: rankEl ? rankEl.textContent.trim() : null,
        name: nameEl ? nameEl.textContent.trim() : null
      };
    });

    return {
      id,
      status: "completed",
      top4
    };
  }

  // Ongoing tournament
  if (isOngoing) {
    const roundEl = doc.querySelector(".tournament_round");
    const round = roundEl ? roundEl.textContent.trim() : null;

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

  // Sort by ID
  const sorted = Object.fromEntries(
    Object.entries(existing).sort(([a], [b]) => Number(a) - Number(b))
  );

  // Write YAML
  const output = yaml.stringify(sorted, { indent: 2 });
  fs.writeFileSync(FILE_PATH, output, "utf8");

  console.log("✓ tournaments.yml updated");
}

main().catch(err => {
  console.error("Scraper failed:", err);
  process.exit(0);
});
