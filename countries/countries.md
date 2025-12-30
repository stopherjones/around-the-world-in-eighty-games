---
layout: default
title: Countries
---

<ul>
  {% assign sorted = site.countries | sort: "order" %}
  {% for country in sorted %}
    <li>
      <a href="{{ country.url }}">{{ country.title }}</a>
      ({{ country.continent }})
    </li>
  {% endfor %}
</ul>
