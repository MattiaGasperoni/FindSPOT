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
        // Imposta il colore dei parcheggi poligonali in base al tipo di parcheggio
        style: (feature) =>  
        {
            const properties = feature.properties;

            // Controlla le proprietà per determinare il colore
            if (properties.fee === "no") 
            {
                return { color: "#2ecc71", fillOpacity: 0.6 }; // verde = gratuito
            }
            else if (properties.access === "customers")
            {
                return { color: "#f39c12", fillOpacity: 0.6 }; // giallo = clienti
            }
            else
            {
                return { color: "#e74c3c", fillOpacity: 0.6 }; // rosso = sconosciuto o altro
            }
        },
        // Imposta il colore dei marker in base al tipo di parcheggio
        pointToLayer: (feature, latlng) => 
        {
            const props = feature.properties;
            let iconUrl;

            if (props.fee === "no") {
                iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png";
            } else if (props.access === "customers") {
                iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png";
            } else {
                iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png";
            }

            const customIcon = L.icon({
                iconUrl: iconUrl,
                shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
            });

            return L.marker(latlng, { icon: customIcon });
        },
        // Popup con le informazioni sui parcheggi
        onEachFeature: (feature, layer) => {
            const properties = feature.properties;
            layer.bindPopup(`
            <strong>${properties.name || "Parcheggio"}</strong><br>
            Accesso: ${properties.access || "n.d."}<br>
            Superficie: ${properties.surface || "n.d."}<br>
            Gratuito: ${properties.fee === "no" ? "Sì" : "No / Non specificato"}
            `);
        }
    }).addTo(map);
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