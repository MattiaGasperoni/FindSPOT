/*
 * Gestisce il sistema di filtri per la ricerca dei parcheggi
 */

document.addEventListener("DOMContentLoaded", () => 
{
  const filterButton    = document.querySelector(".search-filter");
  const filterPanel     = document.querySelector(".filter-choices");
  const searchBar       = document.querySelector(".search-bar");
  const applyFiltersBtn = document.getElementById("apply-filters");
  const clearFiltersBtn = document.getElementById("clear-filters");

  // Toggle del pannello filtri
  filterButton.addEventListener("click", (e) => 
  {
    e.stopPropagation();
    filterPanel.classList.toggle("visible");
  });

  // Previene la chiusura del pannello quando si clicca all'interno
  filterPanel.addEventListener("click", (e) => 
  {
    e.stopPropagation();
  });

  // Chiude il pannello se si clicca fuori dall'area filtri
  document.addEventListener("click", (e) => 
  {
    if (!filterPanel.contains(e.target) && !filterButton.contains(e.target) && !searchBar.contains(e.target)) 
    {
      filterPanel.classList.remove("visible");
    }
  });

  // Reset completo dei filtri
  clearFiltersBtn.addEventListener("click", () => 
  {
    // Reset dei campi del form
    document.getElementById("access-type").value = "";
    document.getElementById("surface-type").value = "";
    document.getElementById("fee-type").value = "";

    // Aggiorna URL mantenendo solo la modalità filter
    const newParams = new URLSearchParams();
    newParams.set("mode", "filter");
    
    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.pushState({}, "", newUrl);

    // Chiude il pannello e aggiorna la mappa
    document.querySelector(".filter-choices")?.classList.remove("visible");
    window.dispatchEvent(new CustomEvent("filter-map-view"));
  });

  // Applica i filtri selezionati
  applyFiltersBtn.addEventListener("click", () => 
  {
    applyFilters();
  });

  function applyFilters() 
  {
    // Raccolta dei valori dai form di filtro
    const city    = document.querySelector(".search-input").value.trim();
    const access  = document.getElementById("access-type").value;
    const surface = document.getElementById("surface-type").value;
    const fee     = document.getElementById("fee-type").value;

    // Costruzione parametri URL
    const params = new URLSearchParams();
    params.set("mode", "filter");
    if (city) params.append("city", city);
    if (access) params.append("access", access);
    if (surface) params.append("surface", surface);
    if (fee) params.append("fee", fee);

    const pathname = window.location.pathname;

    // Gestione routing in base alla pagina corrente
    if (pathname === "/" || pathname.endsWith("/index.html")) 
    {
      // Dalla home: redirect a map.html con filtri
      window.location.href = `map.html?${params.toString()}`;
    }
    else 
    {
      // Aggiorna URL corrente e notifica la mappa
      const newUrl = new URL(window.location.href);
      newUrl.search = params.toString();
      window.history.pushState({}, "", newUrl);

      window.dispatchEvent(new CustomEvent("filter-map-view"));

      // Reset campo ricerca città
      const inputText = document.querySelector(".search-input");
      if (inputText) 
      {
        inputText.value = "";
      }
    }

    // Chiude il pannello filtri
    document.querySelector(".filter-choices")?.classList.remove("visible");
  }
});