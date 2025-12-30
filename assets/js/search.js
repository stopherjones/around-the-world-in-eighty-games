async function initSearch() {
  const input = document.getElementById("country-search");
  const results = document.getElementById("search-results");

  const response = await fetch("/around-the-world-in-eighty-games/countries.json");
  const countries = await response.json();

  input.addEventListener("input", () => {
    const query = input.value.toLowerCase();
    results.innerHTML = "";

    if (!query) return;

    const matches = countries.filter(c =>
      c.name.toLowerCase().includes(query)
    );

    matches.forEach(c => {
      const div = document.createElement("div");
      div.innerHTML = `<a href="${c.url}">${c.name}</a>`;
      results.appendChild(div);
    });
  });
}

initSearch();
