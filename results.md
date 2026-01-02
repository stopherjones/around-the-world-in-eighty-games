---
layout: default
title: European Standings
permalink: /results/
---

<h1>European Standings - top 10</h1>

{% assign leaderboard = site.data.leaderboard 
     | sort: "points" 
     | reverse 
     | slice: 0, 10 %}

<table>
  <thead>
    <tr>
      <th>Player</th>
      <th>Stops</th>
      <th>Points</th>
      <th>Trophies</th>
    </tr>
  </thead>
  <tbody>
    {% for row in leaderboard %}
      <tr>
        <td>{{ row.player }}</td>
        <td>{{ row.stops }}</td>
        <td>{{ row.points }}</td>
        <td>{{ row.trophies }}</td>
      </tr>
    {% endfor %}
  </tbody>
</table>
