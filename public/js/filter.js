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

  applyFiltersBtn.addEventListener("click", () => {applyFilters()});

  clearFiltersBtn.addEventListener("click", () => {
    // 1. Svuota i campi input
    document.getElementById("access-type").value = "";
    document.getElementById("surface-type").value = "";
    document.getElementById("free").checked = false;
    document.getElementById("paid").checked = false;

    // 2. Aggiorna la URL mantenendo solo "mode=filter"
    const newParams = new URLSearchParams();
    newParams.set("mode", "filter");
    
    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.pushState({}, "", newUrl);

    // 3. Chiude il pannello filtri
    document.querySelector(".filter-choices")?.classList.remove("visible");

    // 4. Forza aggiornamento della mappa
    window.dispatchEvent(new CustomEvent("filter-map-view"));
  });

  function applyFilters() 
  {
    console.log("Bottone Apply Filter cliccato");
    const city    = document.querySelector(".search-input").value.trim();
    const access  = document.getElementById("access-type").value;
    const surface = document.getElementById("surface-type").value;
    const free    = document.getElementById("free").checked;
    const paid    = document.getElementById("paid").checked;

    const params = new URLSearchParams();
    params.set("mode", "filter");
    if (city) params.append("city", city);
    if (access) params.append("access", access);
    if (surface) params.append("surface", surface);
    if (free) params.append("free", "yes");
    if (paid) params.append("paid", "yes");


    const pathname = window.location.pathname;
    // Se siamo nella home (index.html)
    if (pathname === "/" || pathname.endsWith("/index.html")) 
    {
      console.log("Siamo in homepage andiamo in map.html");
      // Dalla home: vai su map.html con parametro city
      window.location.href = `map.html?${params.toString()}`;
    }
    else 
    {
      console.log("Ci troviamo in un pagina aggiorniamo la mappa");
      // Siamo in altre pagine (map.html, remove.html, etc.) aggiorniamo l'URL
      const newUrl = new URL(window.location.href);
      newUrl.search = params.toString();
      window.history.pushState({}, "", newUrl);

      // Emetti evento per far aggiornare la mappa
      window.dispatchEvent(new CustomEvent("filter-map-view"));
      
      // Pulisci l'input dopo la ricerca
      const inputText = document.querySelector(".search-input"); // Assicurati che questa variabile sia definita
        if (inputText) {
            inputText.value = "";
        }
    }

    // Chiude il pannello filtri
    document.querySelector(".filter-choices")?.classList.remove("visible");
  }
});
