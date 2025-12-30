---
layout: default
title: Map
permalink: /map/
---

<h1>Route Map</h1>

<p>This is the planned route for the journey.</p>

<ol>
{% for stop in site.data.route.countries %}
  {% assign country = site.countries | where: "slug", stop.slug | first %}
  <li><a href="{{ country.url | relative_url }}">{{ country.name }}</a></li>
{% endfor %}
</ol>
