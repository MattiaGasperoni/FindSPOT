// Inizializza la mappa centrata su Urbino
const map = L.map('map', {
    center: [43.727362, 12.636127],
    zoom: 14,
    zoomControl: false,
});
L.control.zoom({ position: 'bottomright' }).addTo(map);
// Aggiunge tile layer OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
{
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Carica i dati GeoJSON dei parcheggi da un endpoint locale
fetch('/api/parcheggi')
    .then(res => res.json())
    .then(data => {
    L.geoJSON(data, 
    {
        onEachFeature: (feature, layer) => 
        {
        const props = feature.properties;
        layer.bindPopup(`
            <strong>${props.name || "Parcheggio"}</strong><br>
            Accesso: ${props.access || "n.d."}
        `);
        }
    }).addTo(map);
    });

// Torna alla home quando clicchiamo il bottone
document.getElementById('btnHome').addEventListener('click', () => 
{
    window.location.href = 'index.html';
});

// Legge il parametro 'city' dall'URL
const urlParams = new URLSearchParams(window.location.search);
let city = urlParams.get("city");
if (!city) 
{
    city = "Urbino"; // Imposta Urbino come città predefinita
}
console.log("Mappa inizializzata a " + city);

if (city) 
{
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`)
    .then(res => res.json())
    .then(data => 
    {
        if (data.length > 0) 
        {
        const { lat, lon } = data[0];
        map.setView([parseFloat(lat), parseFloat(lon)], 14);
        } 
        else 
        {
        alert("City not found.");
        }
    })
    .catch(err => 
    {
        console.error("Geocoding error:", err);
        alert("Error during city search.");
    });
}