/*
 * Gestisce la ricerca della città nella barra di ricerca.
 */

document.addEventListener("DOMContentLoaded", () => 
  {
  const inputText = document.querySelector(".search-input");
  const searchButton = document.querySelector(".search-icon");

  searchButton.addEventListener("click", () => 
    {
    const city = inputText.value.trim();
    if (!city) return;
    
    const pathname = window.location.pathname;
    
    // Se siamo nella home (index.html)
    if (pathname === "/" || pathname.endsWith("/index.html")) 
      {
      // Dalla home: vai su map.html con parametro city
      window.location.href = `map.html?city=${encodeURIComponent(city)}`;
    } 
    else 
    {
      // Siamo in altre pagine: aggiorniamo l'URL corrente
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("city", city);
      window.history.pushState({}, "", newUrl);

      // Notifica la mappa del cambio di città
      window.dispatchEvent(new CustomEvent("search-city"));
      
      // Reset dell'input
      if (inputText) 
      {
        inputText.value = "";
      }
    }
  });

  // Ricerca con Enter
  inputText.addEventListener("keypress", (e) => 
  {
    if (e.key === "Enter") searchButton.click();
  });
});