document.addEventListener("DOMContentLoaded", () => 
  {
  const inputText    = document.querySelector(".search-input");
  const searchButton = document.querySelector(".search-icon");
  const filterButton = document.querySelector(".search-filter");

  searchButton.addEventListener("click", () => 
  {
    const city = inputText.value.trim();
    if (!city) return;
    window.location.href = `map.html?city=${encodeURIComponent(city)}`;
  });

  inputText.addEventListener("keypress", (e) => 
  {
    if (e.key === "Enter") searchButton.click();
  });

  filterButton.addEventListener("click", () => 
  {
    // QUI metti cosa succede quando si clicca sul bottone filtro.
    // Per esempio, mostrare/nascondere un pannello laterale:
    const filterPanel = document.querySelector(".filter-choices.hidden");
    if (filterPanel) 
    {
      filterPanel.classList.toggle("visible");
    }
  });
});
