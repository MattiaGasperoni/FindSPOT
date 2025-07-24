// Elementi DOM
const chooseLocationBtn = document.getElementById('choose-location-btn');
const mapContainer = document.getElementById('map-container');
const closeMapBtn = document.getElementById('close-map-btn');
const confirmLocationBtn = document.getElementById('confirm-location-btn');
const locationDisplay = document.getElementById('location-display');
const addParkingForm = document.getElementById('addParkingForm');




// Apri la mappa quando clicchi il pulsante
chooseLocationBtn.addEventListener('click', async function(e) {
  e.preventDefault();
  e.stopPropagation();

  try {
    // 1. Mostra il contenitore prima
    mapContainer.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Forza modalità eliminazione
    const script = document.createElement('script');
    script.src = './js/map.js';
    document.body.appendChild(script);

    // Appende ?mode=select all'URL (solo per farlo leggere nel JS)
    if (!window.location.search.includes('mode=select')) 
    {
        console.log('La Mappa entra in modalità selezione coordinate');
        const url = new URL(window.location.href);
        url.searchParams.set('mode', 'select');
        window.history.replaceState({}, '', url.toString());
    }  
  } 
  catch (error) 
  {
    console.error('Error loading map:', error);
    alert('Error loading map. Please try again.');
  }
});






confirmLocationBtn.addEventListener('click', function () {
  if (window.parkingMap && window.parkingMap.getSelectedCoordinates) {
    const coordinates = window.parkingMap.getSelectedCoordinates();
    console.log('Selected coordinates:', coordinates);

    if (coordinates.lat && coordinates.lng) {
      // Aggiorna i campi nascosti del form
      document.getElementById('latitude').value = coordinates.lat;
      document.getElementById('longitude').value = coordinates.lng;

      // Aggiorna la visualizzazione nel form
      locationDisplay.textContent = `Location selected: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
      locationDisplay.classList.add('location-selected');

      // Nasconde la mappa
      mapContainer.style.display = 'none';
      document.body.style.overflow = 'auto';

      // Pulisce la query string (rimuove `?mode=select`)
      const url = new URL(window.location.href);
      url.search = ''; 
      window.history.replaceState({}, '', url.toString());

      // Non rimuovere la mappa Leaflet! Lascia che resti per riutilizzarla.
    } else {
      alert('Please select a location on the map first!');
    }

  } else {
    alert('Map not loaded correctly. Please try again.');
  }
});



// Gestione invio del form principale
addParkingForm.addEventListener('submit', function(e) {
  e.preventDefault();

  const lat = parseFloat(document.getElementById('latitude').value);
  const lng = parseFloat(document.getElementById('longitude').value);

  if (!lat || !lng) {
    alert('Please select a location on the map before adding the parking!');
    return;
  }

  const name = this.elements['name'].value;
  const access = document.getElementById('access-type').value;
  const fee = document.getElementById('fee-type').value;
  const surface = document.getElementById('surface-type').value;

  const newFeature = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lng, lat]
    },
    properties: {
      name: name,
      access: access || undefined,
      fee: fee || undefined,
      surface: surface || undefined,
      amenity: "parking"
    }
  };


  fetch('/api/parcheggi', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newFeature)
  })
  .then(res => {
    if (!res.ok) throw new Error("Errore nel salvataggio");
    return res.json();
  })
  .then(data => {
    console.log('Parcheggio salvato:', data);
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `<div style="color: #007A33; font-weight: bold; text-align: center; margin-top: 20px;">Parking spot added successfully! ID: ${data.id}</div>`;
  })
  .catch(err => {
    console.error('Errore:', err);
    alert('Errore durante l\'invio del parcheggio');
  });
});


// Gestione chiusura Popup per scegliere la posizione del parcheggio

// Chiudi la mappa con il tasto
closeMapBtn.addEventListener('click', function() 
{
  mapContainer.style.display = 'none';
  document.body.style.overflow = 'auto';
  
  // Pulisci l'istanza della mappa
  if (window.parkingMap && window.parkingMap.map) 
  {
    window.parkingMap.map.remove();
    window.parkingMap = null;
  }
  
  // Pulisce completamente la query string dall'URL corrente
  const url = new URL(window.location.href);
  url.search = ''; // Rimuove tutti i parametri
  window.history.replaceState({}, '', url.toString());
});

// Chiudi la mappa cliccando fuori dal wrapper
mapContainer.addEventListener('click', function(e) 
{
  if (e.target === mapContainer) 
  {
    mapContainer.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Pulisci l'istanza della mappa
    if (window.parkingMap && window.parkingMap.map) 
    {
      window.parkingMap.map.remove();
      window.parkingMap = null;
    }
    
    // Pulisce completamente la query string dall'URL corrente
    const url = new URL(window.location.href);
    url.search = ''; // Rimuove tutti i parametri
    window.history.replaceState({}, '', url.toString());
  }
});

// Chiudi la mappa con ESC
document.addEventListener('keydown', function(e) 
{
  if (e.key === 'Escape' && mapContainer.style.display === 'block') 
  {
    mapContainer.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Pulisci l'istanza della mappa
    if (window.parkingMap && window.parkingMap.map) 
    {
      window.parkingMap.map.remove();
      window.parkingMap = null;
    }
    
    // Pulisce completamente la query string dall'URL corrente
    const url = new URL(window.location.href);
    url.search = ''; // Rimuove tutti i parametri
    window.history.replaceState({}, '', url.toString());
  }
});