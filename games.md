---
layout: default
title: Games
permalink: /games/
---

<h1>Games</h1>

<p>
  <button id="toggle-route">Sort by route</button>
  <button id="toggle-alpha">Sort A–Z</button>
</p>

<style>
  /* Hide alphabetical list by default */
  #games-alpha,
  #games-alpha-title {
    display: none;
  }

  /* Optional: make buttons look nicer */
  #toggle-route, #toggle-alpha {
    margin-right: 0.5rem;
    padding: 0.4rem 0.8rem;
    cursor: pointer;
  }
</style>

{% assign route = site.data.route %}
{% assign tournaments = site.data.tournaments %}

<!-- ========================= -->
<!-- ROUTE ORDERED LIST        -->
<!-- ========================= -->

<h2 id="games-route-title">Games by route</h2>
<div id="games-route">

<ul>
{% for stop in route.countries %}
  {% assign country = site.countries | where: "slug", stop.slug | first %}

  {% for game_slug in stop.games %}
    {% assign game = site.data.games | where: "slug", game_slug | first %}

    {% if game %}
      {%- comment -%}
      Find the tournament for this game in this country (if any)
      {%- endcomment -%}
      {% assign t = nil %}
      {% for t_hash in tournaments %}
        {% assign t_candidate = t_hash[1] %}
        {% if t_candidate.game == game.slug and t_candidate.country == stop.slug %}
          {% assign t = t_candidate %}
          {% break %}
        {% endif %}
      {% endfor %}

      <li>
        {{ game.name }} –
        {% if country %}
          <a href="{{ country.url | relative_url }}">{{ country.name }}</a>
        {% else %}
          {{ stop.slug | replace: "-", " " | capitalize }}
        {% endif %}
        –
        {% if t %}
          {% if t.bga_url %}
            <a href="{{ t.bga_url }}" target="_blank">BGA tournament link</a>
          {% else %}
            Tournament link coming soon
          {% endif %}
        {% else %}
          Tournament not yet created
        {% endif %}
      </li>
    {% endif %}
  {% endfor %}
{% endfor %}
</ul>

</div>

<!-- ========================= -->
<!-- ALPHABETICAL LIST         -->
<!-- ========================= -->

<h2 id="games-alpha-title">Games A–Z</h2>
<div id="games-alpha">

{% assign games_alpha = site.data.games | sort: "name" %}

<ul>
{% for game in games_alpha %}

  {%- comment -%}
  Find a tournament for this game (any country)
  {%- endcomment -%}
  {% assign t = nil %}
  {% for t_hash in tournaments %}
    {% assign t_candidate = t_hash[1] %}
    {% if t_candidate.game == game.slug %}
      {% assign t = t_candidate %}
      {% break %}
    {% endif %}
  {% endfor %}

  {%- comment -%}
  Determine the country slug:
  - If tournament exists → use tournament.country
  - Else → use first country in game.countries
  {%- endcomment -%}
  {% if t %}
    {% assign country_slug = t.country %}
  {% else %}
    {% assign country_slug = game.countries[0] %}
  {% endif %}

  {% assign country = site.countries | where: "slug", country_slug | first %}

  <li>
    {{ game.name }} –
    {% if country %}
      <a href="{{ country.url | relative_url }}">{{ country.name }}</a>
    {% else %}
      {{ country_slug | replace: "-", " " | capitalize }}
    {% endif %}
    –
    {% if t %}
      {% if t.bga_url %}
        <a href="{{ t.bga_url }}" target="_blank">BGA tournament link</a>
      {% else %}
        Tournament link coming soon
      {% endif %}
    {% else %}
      Tournament not yet created
    {% endif %}
  </li>

{% endfor %}
</ul>

</div>

<!-- ========================= -->
<!-- TOGGLE SCRIPT             -->
<!-- ========================= -->

<script>
  const routeList = document.getElementById('games-route');
  const alphaList = document.getElementById('games-alpha');
  const routeTitle = document.getElementById('games-route-title');
  const alphaTitle = document.getElementById('games-alpha-title');

  document.getElementById('toggle-route').addEventListener('click', () => {
    routeList.style.display = 'block';
    routeTitle.style.display = 'block';
    alphaList.style.display = 'none';
    alphaTitle.style.display = 'none';
  });

  document.getElementById('toggle-alpha').addEventListener('click', () => {
    routeList.style.display = 'none';
    routeTitle.style.display = 'none';
    alphaList.style.display = 'block';
    alphaTitle.style.display = 'block';
  });
</script>
