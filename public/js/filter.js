document.addEventListener("DOMContentLoaded", () => {
  const filterButton = document.querySelector(".search-filter");
  const filterPanel = document.querySelector(".filter-choices");
  const searchBar = document.querySelector(".search-bar");
  const applyFiltersBtn = document.getElementById("apply-filters");
  const clearFiltersBtn = document.getElementById("clear-filters");

  filterButton.addEventListener("click", (e) => {
    e.stopPropagation();
    filterPanel.classList.toggle("visible");
  });

  filterPanel.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  document.addEventListener("click", (e) => {
    if (
      !filterPanel.contains(e.target) &&
      !filterButton.contains(e.target) &&
      !searchBar.contains(e.target)
    ) {
      filterPanel.classList.remove("visible");
    }
  });

  applyFiltersBtn.addEventListener("click", applyFilters);

  clearFiltersBtn.addEventListener("click", () => {
    document.getElementById("access-type").value = "";
    document.getElementById("surface-type").value = "";
    document.getElementById("free").checked = false;
    document.getElementById("paid").checked = false;
  });

  function applyFilters() {
    const city = document.querySelector(".search-input").value.trim();
    const access = document.getElementById("access-type").value;
    const surface = document.getElementById("surface-type").value;
    const free = document.getElementById("free").checked;
    const paid = document.getElementById("paid").checked;

    const params = new URLSearchParams();
    params.set("mode", "filter");
    if (city) params.append("city", city);
    if (access) params.append("access", access);
    if (surface) params.append("surface", surface);
    if (free) params.append("free", "yes");
    if (paid) params.append("paid", "yes");

    window.location.href = `map.html?${params.toString()}`;
  }
});
