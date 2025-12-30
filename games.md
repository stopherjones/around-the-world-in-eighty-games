---
layout: default
title: Games
permalink: /games/
---


<h1>Games</h1>

<ul>
{% for game_id in site.data.games %}
  {% assign game = game_id[1] %}
  {% assign country = site.countries | where: "country_code", game.country | first %}

  <li>
    <strong>{{ game.name }}</strong>
    —
    <a href="{{ site.baseurl }}{{ country.url }}">
      {{ country.title }}
    </a>
  </li>
{% endfor %}
</ul>

