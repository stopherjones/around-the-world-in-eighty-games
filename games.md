---
layout: default
title: Games
permalink: /games/
---

<h1>Games</h1>

{% assign games = site.data.games | sort: "name" %}
{% assign tournaments = site.data.tournaments %}

<ul>
{% for game in games %}

  {%- comment -%}
  Find the tournament for this game by scanning the tournaments hash
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
  Find the country page if the tournament has a country
  {%- endcomment -%}
  {% if t %}
    {% assign country = site.countries | where: "slug", t.country | first %}
  {% endif %}

  <li>
    {{ game.name }} –
    {% if country %}
      <a href="{{ country.url | relative_url }}">{{ country.name }}</a>
    {% else %}
      –
    {% endif %}
    –
    {% if t %}
      <a href="{{ t.bga_url }}" target="_blank">BGA tournament link</a>
    {% else %}
      –
    {% endif %}
  </li>

{% endfor %}
</ul>

