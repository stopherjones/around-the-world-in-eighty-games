---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults


layout: default
title: Around the World in Eighty Games
---

<h1>Welcome to Around the World in 80 Games!</h1>

We’re about to embark on a journey that takes us through exciting locations and cultures, all from the comfort of our virtual game table. 

Over the coming weeks, we’ll explore board games that represent different corners of the globe, offering a unique way to experience the world without leaving home.

<p>
  <strong>
    <a href="{{ site.baseurl }}/countries/united-kingdom/">
      First stop: United Kingdom
    </a>
  </strong>
</p>


<h2>Next Location and game(s)</h2>

{% assign route = site.data.route %}
{% assign current_index = route.current_index %}
{% assign next_index = current_index | plus: 1 %}
{% assign next_stop = route.countries[next_index] %}

{% if next_stop %}
  {% assign next_country = site.countries | where: "slug", next_stop.slug | first %}

<div class="next-location">
<h3>{{ next_country.name }}</h3>

<h4>Games we'll play there:</h4>

<ul>
{% assign tournaments = site.data.tournaments %}

{% for game_slug in next_stop.games %}
  {% assign game = site.data.games | where: "slug", game_slug | first %}

  {% if game %}
    {%- comment -%}
    Find the tournament for this game in this specific next_stop country (if any)
    {%- endcomment -%}
    {% assign t = nil %}
    {% for t_hash in tournaments %}
      {% assign t_candidate = t_hash[1] %}
      {% if t_candidate.game == game.slug and t_candidate.country == next_stop.slug %}
        {% assign t = t_candidate %}
        {% break %}
      {% endif %}
    {% endfor %}

    {% assign country = site.countries | where: "slug", next_stop.slug | first %}

    <li>
      {{ game.name }}
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
</ul>


  </div>

{% else %}
  <p>No next location yet — the journey hasn’t started!</p>
{% endif %}

<h2>Ongoing Tournaments</h2>

{% assign tournaments = site.data.tournaments %}
{% assign any_ongoing = false %}

<ul>
{% for t_hash in tournaments %}
  {% assign t = t_hash[1] %}

  {% if t.status == "ongoing" %}
    {% assign any_ongoing = true %}

    {% assign game = site.data.games | where: "slug", t.game | first %}
    {% assign country = site.countries | where: "slug", t.country | first %}

    <li>
      {%- comment -%} Game name {%- endcomment -%}
      {% if game %}
        {{ game.name }}
      {% else %}
        {{ t.game | replace: "-", " " | capitalize }}
      {% endif %}

      –
      {%- comment -%} Country name + link {%- endcomment -%}
      {% if country %}
        <a href="{{ country.url | relative_url }}">{{ country.name }}</a>
      {% else %}
        {{ t.country | replace: "-", " " | capitalize }}
      {% endif %}

      –
      {%- comment -%} Tournament link {%- endcomment -%}
      {% if t.bga_url %}
        <a href="{{ t.bga_url }}" target="_blank">BGA tournament link</a>
      {% else %}
        Tournament link coming soon
      {% endif %}
    </li>

  {% endif %}
{% endfor %}
</ul>

{% unless any_ongoing %}
  <p>No tournaments are currently in progress.</p>
{% endunless %}
