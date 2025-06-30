const map = L.map('map', {
  center: [43.727362, 12.636127],
  zoom: 14,
  zoomControl: false,
});
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let parkingLayer;  // Variabile globale per layer parcheggi

function styleFeature(feature) {
  const props = feature.properties;
  if (props.fee === "no") return { color: "#2ecc71", fillOpacity: 0.6 };
  if (props.access === "customers") return { color: "#f39c12", fillOpacity: 0.6 };
  return { color: "#e74c3c", fillOpacity: 0.6 };
}

function getIcon(props) {
  let iconUrl;
  if (props.fee === "no") iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png";
  else if (props.access === "customers") iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png";
  else iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png";

  return L.icon({
    iconUrl: iconUrl,
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

function loadParkingData() {
  fetch('/api/parcheggi')
    .then(res => res.json())
    .then(data => {
      if (parkingLayer) {
        map.removeLayer(parkingLayer);
      }
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');

      parkingLayer = L.geoJSON(data, {
        style: styleFeature,
        pointToLayer: (feature, latlng) => L.marker(latlng, { icon: getIcon(feature.properties) }),
        onEachFeature: (feature, layer) => {
          if (mode === 'delete') {
            layer.bindPopup(`
              <strong>${feature.properties.name || "Parcheggio"}</strong><br>
              Click to delete this parking.
            `);
            layer.on('click', () => {
              if (confirm(`Vuoi eliminare il parcheggio "${feature.properties.name || ''}"?`)) {
                const idToDelete = feature.properties['@id'];
                fetch(`/api/parcheggi/${encodeURIComponent(idToDelete)}`, { method: 'DELETE' })
                  .then(res => {
                    if (!res.ok) throw new Error('Errore nella cancellazione');
                    alert('Parcheggio eliminato con successo');
                    loadParkingData(); // Ricarica i dati sulla mappa
                  })
                  .catch(err => alert(err.message));
              }
            });
          } else {
            layer.bindPopup(`
              <strong>${feature.properties.name || "Parcheggio"}</strong><br>
              Accesso: ${feature.properties.access || "n.d."}<br>
              Superficie: ${feature.properties.surface || "n.d."}<br>
              Gratuito: ${feature.properties.fee === "no" ? "Sì" : "No / Non specificato"}
            `);
          }
        }
      }).addTo(map);
    });
}

loadParkingData();

// Facoltativo: gestione parametro 'city' per centrare mappa
const urlParams = new URLSearchParams(window.location.search);
let city = urlParams.get("city") || "Urbino";
fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`)
  .then(res => res.json())
  .then(data => {
    if (data.length > 0) {
      const { lat, lon } = data[0];
      map.setView([parseFloat(lat), parseFloat(lon)], 14);
    } else {
      alert("City not found.");
    }
  })
  .catch(() => alert("Error during city search."));
