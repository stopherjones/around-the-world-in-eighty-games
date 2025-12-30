---
layout: default
title: Games
permalink: /games/
---

<h1>Games</h1>

{% assign games = site.data.games | sort: "name" %}

<ul>
{% for game in games %}
  {% for t in game.tournaments %}
    {% assign country = site.countries | where: "slug", t.country | first %}

    <li>
      {{ game.name }} –
      <a href="{{ country.url | relative_url }}">{{ country.name }}</a> –
      <a href="{{ t.bga_url }}" target="_blank">BGA tournament link</a>
    </li>

  {% endfor %}
{% endfor %}
</ul>
