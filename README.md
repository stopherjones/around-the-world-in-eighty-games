# Around the World in Eighty Games

A Jekyll-based site for tracking an 'Around the world in 80 games' event on Board Game Arena. The project features a page for each country visited, giving an intro to that country and the game(s) played there; a full games list; and results for a results leaderboard for each continent.

## What this project does

- Presents destination pages for countries and locations in the journey.
- Displays upcoming stops and ongoing tournaments on the home page.
- Uses data files in `_data/` and `_countries/` to generate the site content.
- Includes helper scripts for scraping tournaments and generating leaderboard summaries.

## Project structure

- `index.html` — homepage and featured destination content
- `_countries/` — per-country destination pages
- `_data/` — tournament, route, and leaderboard data
- `_layouts/` — Jekyll layout templates
- `scripts/` — scraping utilities
- `tools/` — Python helpers for leaderboard generation and export
- `assets/` — CSS and JavaScript assets

## Local development

Requirements:

- Ruby
- Bundler
- Jekyll (installed via the Gemfile)

Install dependencies:

```bash
bundle install
```

Run the site locally:

```bash
bundle exec jekyll serve
```

Then open the local URL shown by Jekyll in your browser.

## Useful commands

To add a new tournament, add the tournament details from BGA to tournaments.yml:

"xxxxxx":
  id: xxxxxx
  country: xxxxxx
  game: xxxxxx
  name: xxxxxxTournament (xxxxxx)
  bga_url: https://boardgamearena.com/tournament?id=xxxxxx
  status: ongoing
  round: null

Then update the 'next tournament' info in index.html:

layout: default
title: Around the World in Eighty Games
next_locations:
  - slug: xxx
    games:
      - xxx
      - xxx

## Deployment

This project is set up for GitHub Pages-style deployment using Jekyll. After pushing changes to your repository, the site can be published through the standard GitHub Pages workflow.
