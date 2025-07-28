document.addEventListener("DOMContentLoaded", () => 
{
  const filterButton    = document.querySelector(".search-filter");
  const filterPanel     = document.querySelector(".filter-choices");
  const searchBar       = document.querySelector(".search-bar");
  const applyFiltersBtn = document.getElementById("apply-filters");
  const clearFiltersBtn = document.getElementById("clear-filters");

  // Quando clicchi sull'icona dei filtri, mostra o nasconde il pannello dei filtri
  filterButton.addEventListener("click", (e) => 
  {
    e.stopPropagation();
    filterPanel.classList.toggle("visible");
  });

  // Quando clicchi dentro il popup dei filtri, evita che il clic si propaghi e lo chiuda
  filterPanel.addEventListener("click", (e) => 
  {
    e.stopPropagation();
  });

  // Chiude il pannello filtri se clicchi fuori dal popup
  document.addEventListener("click", (e) => 
  {
    if (!filterPanel.contains(e.target) && !filterButton.contains(e.target) && !searchBar.contains(e.target)) 
    {
      filterPanel.classList.remove("visible");
    }
  });

  // Quando clicchi su "Clear All" esegue questa routine
  clearFiltersBtn.addEventListener("click", () => 
  {
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

    // 4. Forza l'aggiornamento della mappa
    window.dispatchEvent(new CustomEvent("filter-map-view"));
  });

  // Quando clicchi su "Apply Filter", esegue la funzione che aggiorna la mappa con i filtri scelti
  applyFiltersBtn.addEventListener("click", () => 
  {
    applyFilters();
  });

  function applyFilters() 
  {
    // Legge i valori inseriti dall'utente nei campi dei filtri
    const city    = document.querySelector(".search-input").value.trim();
    const access  = document.getElementById("access-type").value;
    const surface = document.getElementById("surface-type").value;
    const free    = document.getElementById("free").checked;
    const paid    = document.getElementById("paid").checked;

    // Costruisce la query string con i parametrei dei filtri
    const params = new URLSearchParams();
    params.set("mode", "filter");
    if (city) params.append("city", city);
    if (access) params.append("access", access);
    if (surface) params.append("surface", surface);
    if (free) params.append("free", "yes");
    if (paid) params.append("paid", "yes");

    const pathname = window.location.pathname;

    // Se siamo nella homepage, reindirizza a map.html con i parametri dei filtri
    if (pathname === "/" || pathname.endsWith("/index.html")) 
    {
      window.location.href = `map.html?${params.toString()}`;
    }
    else 
    {
      // Altrimenti aggiorna l'URL corrente con i nuovi filtri
      const newUrl = new URL(window.location.href);
      newUrl.search = params.toString();
      window.history.pushState({}, "", newUrl);

      // Manda un evento per notificare la mappa che deve aggiornarsi
      window.dispatchEvent(new CustomEvent("filter-map-view"));

      // Svuota il campo di ricerca della città, se presente
      const inputText = document.querySelector(".search-input");
      if (inputText) 
      {
        inputText.value = "";
      }
    }

    // Chiude il pannello dei filtri
    document.querySelector(".filter-choices")?.classList.remove("visible");
  }
});
