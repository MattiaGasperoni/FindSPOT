document.addEventListener("DOMContentLoaded", () => {
  const filterButton    = document.querySelector(".search-filter");
  const filterPanel     = document.querySelector(".filter-choices");
  const input           = document.querySelector(".search-input");
  const searchButton    = document.querySelector(".search-icon");
  const applyFiltersBtn = document.getElementById("apply-filters");
  const clearFiltersBtn = document.getElementById("clear-filters");

  // Toggle visibilità pannello filtri
  filterButton.addEventListener("click", () => {
    filterPanel.classList.toggle("visible");
  });

  // Chiudi pannello filtri se clicco fuori
  document.addEventListener("click", (e) => {
    if (!filterPanel.contains(e.target) && !filterButton.contains(e.target)) {
      filterPanel.classList.remove("visible");
    }
  });

  // Ricerca semplice (bottone e invio)
  searchButton.addEventListener("click", () => {
    const city = input.value.trim();
    if (!city) return;
    window.location.href = `map.html?city=${encodeURIComponent(city)}`;
  });

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchButton.click();
  });

  // Applica filtri con reload pagina
  applyFiltersBtn.addEventListener("click", applyFilters);

  // Pulisci filtri
  clearFiltersBtn.addEventListener("click", () => {
    document.getElementById("access-type").value = "";
    document.getElementById("surface-type").value = "";
    document.getElementById("free").checked = false;
    document.getElementById("paid").checked = false;
  });

  function applyFilters() {
    const city    = input.value.trim();
    const access  = document.getElementById("access-type").value;
    const surface = document.getElementById("surface-type").value;
    const free    = document.getElementById("free").checked;
    const paid    = document.getElementById("paid").checked;

    const params = new URLSearchParams();
    params.set("mode", "filter"); // importante
    if (city)    params.append("city", city);
    if (access)  params.append("access", access);
    if (surface) params.append("surface", surface);
    if (free)    params.append("free", "yes");
    if (paid)    params.append("paid", "yes");

    window.location.href = `map.html?${params.toString()}`;
  }
});
