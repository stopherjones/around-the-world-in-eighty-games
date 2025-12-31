---
layout: default
title: Countries
permalink: /countries/
---

<h1>Countries</h1>

{% assign continent_order = "Europe,Africa,Asia,South America,North America" | split: "," %}

{% for continent in continent_order %}
  <section class="continent-block">
    <h2>{{ continent }}</h2>

    {% assign countries_in_continent = site.countries | where: "continent", continent | sort: "order" %}

    <ul>
    {% for country in countries_in_continent %}
      <li>
        <a href="{{ country.url | relative_url }}">{{ country.name }}</a>
      </li>
    {% endfor %}
    </ul>
  </section>
{% endfor %}

