---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults


layout: default
title: Around the World in Eighty Games
---

Welcome to Around the World in 80 Games!

We’re about to embark on a journey that takes us through exciting locations and cultures, all from the comfort of our virtual game table. Over the coming weeks, we’ll explore board games that represent different corners of the globe, offering a unique way to experience the world without leaving home.

<p>
  <strong>
    <a href="{{ site.baseurl }}/countries/united-kingdom/">
      Start here – United Kingdom
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

    <p>{{ next_country.intro }}</p>

<h4>Games we'll play there:</h4>

<ul>
{% for game_slug in next_stop.games %}
  {% assign game = site.data.games | where: "slug", game_slug | first %}

  {% if game %}
    {%- assign tournaments = site.data.tournaments | where: "game", game.slug | where: "country", next_stop.slug -%}
    {%- assign t = tournaments[0] -%}

    {% if t %}
      {% assign country = site.countries | where: "slug", t.country | first %}

      <li>
        {{ game.name }} –
        <a href="{{ country.url | relative_url }}">{{ country.name }}</a> –
        <a href="{{ t.bga_url }}" target="_blank">BGA tournament link</a>
      </li>
    {% endif %}
  {% endif %}
{% endfor %}

</ul>

  </div>

{% else %}
  <p>No next location yet — the journey hasn’t started!</p>
{% endif %}

