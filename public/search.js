// search.js – gestisce la barra in index.html
document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector(".search-input");
  const button = document.querySelector(".search-icon");

  button.addEventListener("click", () => {
    const city = input.value.trim();
    if (!city) return;

    // Porta l'utente a map.html con la città come parametro
    window.location.href = `map.html?city=${encodeURIComponent(city)}`;
  });

  // Supporta anche "Invio" nella search bar
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") button.click();
  });
});
