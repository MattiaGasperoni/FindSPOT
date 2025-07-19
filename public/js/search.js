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

    // Se siamo nella home (index.html)
    if (window.location.pathname.includes("index.html")) 
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

      // Emetti evento per far aggiornare la mappa
      window.dispatchEvent(new CustomEvent("search-city"));
      
      // Pulisci l'input dopo la ricerca
      inputText.value = "";
    }
  });

  // Ricerca della città con tasto "Enter"
  inputText.addEventListener("keypress", (e) => 
  {
    if (e.key === "Enter") searchButton.click();
  });
});