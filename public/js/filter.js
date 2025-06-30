document.addEventListener("DOMContentLoaded", () => {
  const input           = document.querySelector(".search-input");
  const searchButton    = document.querySelector(".search-icon");
  const filterButton    = document.querySelector(".search-filter");
  const filterPanel     = document.querySelector(".filter-choices");
  const applyFiltersBtn = document.getElementById("apply-filters");
  const clearFiltersBtn = document.getElementById("clear-filters");

  filterButton.addEventListener("click", () => {
    filterPanel.classList.toggle("hidden");
  });

  searchButton.addEventListener("click", applyFilters);

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") applyFilters();
  });

  applyFiltersBtn.addEventListener("click", applyFilters);

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
    params.set("mode", "filter"); // ✅ questa riga è essenziale!
    if (city)    params.append("city", city);
    if (access)  params.append("access", access);
    if (surface) params.append("surface", surface);
    if (free)    params.append("free", "yes");
    if (paid)    params.append("paid", "yes");

    window.location.href = `map.html?${params.toString()}`;
  }
});
