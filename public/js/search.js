document.addEventListener("DOMContentLoaded", () => 
  {
  const inputText    = document.querySelector(".search-input");
  const searchButton = document.querySelector(".search-icon");

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

});
