---
layout: default
title: Countries
permalink: /countries/
---

<h1>Countries</h1>

{% assign continents = site.countries | map: "continent" | uniq | sort %}

{% for continent in continents %}
  <section class="continent-block">
    <h2>{{ continent }}</h2>

    {% assign countries_in_continent = site.countries | where: "continent", continent | sort: "order" %}

    <ul>
    {% for country in countries_in_continent %}
      <li>
        <a href="{{ country.url | relative_url }}">{{ country.name }}</a>
        {%- comment -%}
        Later: show tournaments / BGA links here
        {%- endcomment -%}
      </li>
    {% endfor %}
    </ul>
  </section>
{% endfor %}
