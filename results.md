---
layout: default
title: Results
permalink: /results/
---

<h1>Results</h1>

{% assign tournaments = site.data.tournaments %}
{% assign games = site.data.games %}
{% assign countries = site.countries %}

<ul>
{% for t_id in tournaments %}
  {% assign t = t_id[1] %}
  {% assign game = games | where: "slug", t.game | first %}
  {% assign country = countries | where: "slug", t.country | first %}

  <li>
    <strong>{{ game.name }}</strong> —
    <a href="{{ country.url | relative_url }}">{{ country.name }}</a> —
    <a href="{{ t.bga_url }}" target="_blank">BGA tournament link</a>

    <br>
    Top 4:
    <ul>
      {% for p in t.top4 %}
        <li>{{ p.rank }} — {{ p.name }}</li>
      {% endfor %}
    </ul>
  </li>
{% endfor %}
</ul>
