/*
 * Gestisce la ricerca della città nella barra di ricerca.
 */

document.addEventListener("DOMContentLoaded", () => 
{
  const inputText    = document.querySelector(".search-input");
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
      // Siamo in altre pagine (map.html, remove.html, etc.) aggiorniamo l'URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("city", city);
      window.history.pushState({}, "", newUrl);

      // Manda un evento per notificare la mappa che deve aggiornarsi
      window.dispatchEvent(new CustomEvent("search-city"));
      
      // Pulisci l'input dopo la ricerca
      if (inputText) 
      {
        inputText.value = "";
      }
    }
  });

  // Ricerca della città con tasto "Enter"
  inputText.addEventListener("keypress", (e) => 
  {
    if (e.key === "Enter") searchButton.click();
  });
});