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
  
  // Status detection using the text cues you identified
  let status = "unknown";
  if (pageText.includes("this tournament has ended") || pageText.includes("finished")) {
    status = "completed";
  } else if (pageText.includes("progress") || pageText.includes("encounter") || pageText.includes("waiting")) {
    status = "ongoing";
  }

  // Scrape results for completed tournaments
  if (status === "completed") {
    // Look for the "Tournament State" table. 
    // BGA often uses #tournament_ranking or general table structures in the new layout.
    const rows = [...doc.querySelectorAll("#tournament_ranking tr, .ranking_table tr, table tr")]
      .filter(row => row.textContent.match(/1st|2nd|3rd/i)); // Only rows with rank text

    const top4 = rows.slice(0, 4).map((row, index) => {
      // Find the first link (usually the player) or a player-name class
      const nameEl = row.querySelector("a[href*='player'], .player-name, .name");
      const ranks = ["1st", "2nd", "3rd", "4th"];
      return {
        rank: ranks[index],
        name: nameEl ? nameEl.textContent.trim() : "Unknown"
      };
    });

    return { status, top4: top4.length > 0 ? top4 : null };
  }

  if (status === "ongoing") {
    const roundMatch = pageText.match(/round\s*(\d+)/i);
    return { status, round: roundMatch ? roundMatch[1] : "1" };
  }

  return { status: "unknown" };
}

async function main() {
  const existing = loadExisting();
  const ids = Object.keys(existing).map(Number);

  for (const id of ids) {
    try {
      console.log(`Scraping ${id}...`);
      const scraped = await scrapeTournament(id);

      // CRITICAL: Explicitly clear old keys to prevent YAML duplicates
      delete existing[id].status;
      delete existing[id].top4;
      delete existing[id].round;

      // Assign new values
      existing[id].status = scraped.status;
      if (scraped.top4) existing[id].top4 = scraped.top4;
      if (scraped.round) existing[id].round = scraped.round;

    } catch (err) {
      console.error(`Error on ${id}:`, err.message);
    }
  }

  const sorted = Object.fromEntries(
    Object.entries(existing).sort(([a], [b]) => Number(a) - Number(b))
  );

  // Use a clean stringify to ensure no weird formatting
  fs.writeFileSync(FILE_PATH, yaml.stringify(sorted), "utf8");
  console.log("✓ tournaments.yml updated and cleaned.");
}

main();