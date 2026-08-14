---
layout: default
title: Map
permalink: /map/
---

<!-- Leaflet CSS & JS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>

<style>
  #route-map {
    height: 480px;
    width: 100%;
    border-radius: 8px;
    margin-bottom: 2rem;
    border: 1px solid var(--border-light);
    z-index: 1;
  }

  /* Scoped Leaflet Popup Styles */
  .leaflet-popup-content {
    font-family: system-ui, sans-serif;
    min-width: 160px;
  }

  .leaflet-popup-content strong {
    font-size: 0.95rem;
    color: var(--nav-bg);
  }

  .leaflet-popup-content ul {
    list-style: disc;
    padding-left: 1.1rem;
    margin: 0.4rem 0 0.8rem 0;
  }

  .leaflet-popup-content li {
    position: static;
    margin: 0.25rem 0;
    padding-left: 0;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-dark);
  }

  /* Remove global site chevron pseudo-element */
  .leaflet-popup-content li::before {
    content: none;
  }
</style>

<h1>Route Map</h1>

<p>This is the planned route for the journey and the games played at each stop.</p>

<!-- Map Container -->
<div id="route-map"></div>

<script>
document.addEventListener("DOMContentLoaded", function() {
  const map = L.map('route-map').setView([20, 0], 2);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }).addTo(map);

  const routePoints = [];
  let lngOffset = 0;

  {% for stop in site.data.route.countries %}
    {% if stop.lat and stop.lng %}
      {% assign country = site.countries | where: "slug", stop.slug | first %}

      {% capture popup_html %}
        <div>
          <strong>
            {% if country %}{{ country.name }}{% else %}{{ stop.slug | replace: '-', ' ' | capitalize }}{% endif %}
          </strong>

          <ul>
            {% assign stop_has_tournaments = false %}
            {% for tournament_entry in site.data.tournaments %}
              {% assign t = tournament_entry[1] %}
              {% if t.country == stop.slug %}
                {% assign stop_has_tournaments = true %}
                <li>
                  {{ t.game | replace: "-", " " | capitalize }}
                  {% if t.status == "completed" %}
                    <span style="color: #2e7d32;" title="Completed">&#10003;</span>
                  {% elsif t.status == "ongoing" %}
                    <span style="color: #ed6c02;" title="Ongoing">&#9203;</span>
                  {% endif %}
                </li>
              {% endif %}
            {% endfor %}

            {% if stop_has_tournaments == false and stop.games %}
              {% for g in stop.games %}
                <li>{{ g | replace: "-", " " | capitalize }}</li>
              {% endfor %}
            {% endif %}
          </ul>

          <a href="{% if country %}{{ country.url | relative_url }}{% else %}#stop-{{ stop.slug }}{% endif %}">
            View Stop Details &rarr;
          </a>
        </div>
      {% endcapture %}

      var rawLat = {{ stop.lat }};
      var rawLng = {{ stop.lng }};

      // Handle crossing the International Date Line travelling East
      if (routePoints.length > 0) {
        var prevLng = routePoints[routePoints.length - 1][1];
        while (rawLng + lngOffset - prevLng < -180) {
          lngOffset += 360;
        }
      }

      var adjustedLng = rawLng + lngOffset;

      routePoints.push([rawLat, adjustedLng]);

      // Place marker at adjusted longitude on world wrapping layer
      var marker = L.marker([rawLat, adjustedLng]).addTo(map);
      marker.bindPopup({{ popup_html | jsonify }});
    {% endif %}
  {% endfor %}

  if (routePoints.length > 1) {
    const polyline = L.polyline(routePoints, {
      color: '#A06A4E',
      weight: 3,
      opacity: 0.8,
      dashArray: '6, 6'
    }).addTo(map);

    map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
  }
});
</script>