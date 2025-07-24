// Funzione per inizializzare la mappa in modalità selezione
function initializeMapForSelection() {
  // Aggiungi mode=select all'URL
  if (!window.location.search.includes('mode=select')) {
    console.log('La Mappa entra in modalità selezione');
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'select');
    window.history.replaceState({}, '', url.toString());
  }
  
  // Aspetta che il container sia visibile prima di inizializzare
  setTimeout(() => {
    if (typeof ParkingMap !== 'undefined') {
      if (parkingMapInstance && parkingMapInstance.map) 
      {
        parkingMapInstance.map.remove();
      }

      // Forza il reset del container DOM
      const mapContainer = L.DomUtil.get('map');
      if (mapContainer && mapContainer._leaflet_id) {
        mapContainer._leaflet_id = null;
      }

      parkingMapInstance = new ParkingMap('map');
      
      // Forza il ridimensionamento della mappa dopo l'inizializzazione
      setTimeout(() => {
        if (parkingMapInstance && parkingMapInstance.map) {
          parkingMapInstance.map.invalidateSize();
        }
      }, 200);
      
    } else {
      console.error('ParkingMap class not found');
    }
  }, 300);
}

// Variabili globali per la gestione della mappa
let parkingMapInstance = null;

// Elementi DOM
const chooseLocationBtn = document.getElementById('choose-location-btn');
const mapContainer = document.getElementById('map-container');
const closeMapBtn = document.getElementById('close-map-btn');
const confirmLocationBtn = document.getElementById('confirm-location-btn');
const locationDisplay = document.getElementById('location-display');
const addParkingForm = document.getElementById('addParkingForm');

// Carica il file map.js dinamicamente con callback
function loadMapScript() {
  return new Promise((resolve, reject) => {
    if (typeof ParkingMap !== 'undefined') {
      resolve();
      return;
    }
    
    if (!document.querySelector('script[src="./js/map.js"]')) {
      const script = document.createElement('script');
      script.src = './js/map.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load map.js'));
      document.body.appendChild(script);
    } else {
      // Script già presente, aspetta un po' per sicurezza
      setTimeout(resolve, 100);
    }
  });
}



// Apri la mappa quando clicchi il pulsante
chooseLocationBtn.addEventListener('click', async function(e) {
  e.preventDefault();
  e.stopPropagation();
  
  try {
    // Carica prima il script
    await loadMapScript();
    
    
    
    // Infine inizializza la mappa
    initializeMapForSelection();

    // Poi mostra il container
    mapContainer.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
  } catch (error) {
    console.error('Error loading map:', error);
    alert('Error loading map. Please try again.');
  }
});




// Conferma la posizione selezionata
confirmLocationBtn.addEventListener('click', function() 
{
  if (parkingMapInstance && parkingMapInstance.getSelectedCoordinates) 
  {
    const coordinates = parkingMapInstance.getSelectedCoordinates();
    console.log('Selected coordinates:', coordinates);
    if (coordinates.lat && coordinates.lng) 
    {
      // Aggiorna i campi nascosti del form
      document.getElementById('latitude').value  = coordinates.lat;
      document.getElementById('longitude').value = coordinates.lng;
      
      // Aggiorna la visualizzazione nel form
      locationDisplay.textContent = `Location selected: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
      locationDisplay.classList.add('location-selected');
      
      // Chiudi la mappa
      mapContainer.style.display = 'none';
      document.body.style.overflow = 'auto';
      
      // Pulisci l'istanza della mappa
      if (parkingMapInstance.map) 
      {
        parkingMapInstance.map.remove();
        parkingMapInstance = null;
      }
      
      // Pulisce completamente la query string dall'URL corrente
      const url = new URL(window.location.href);
      url.search = ''; // Rimuove tutti i parametri
      window.history.replaceState({}, '', url.toString());
    } 
    else
    {
      alert('Please select a location on the map first!');
    }
  } 
  else 
  {
    alert('Please select a location on the map first!');
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

  // Reset form (opzionale)
        // this.reset();
        // selectedCoordinates = { lat: null, lng: null };
        // locationDisplay.textContent = 'Click "Choose the location on the map" to select position';
        // locationDisplay.classList.remove('location-selected');

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
  if (parkingMapInstance && parkingMapInstance.map) 
  {
    parkingMapInstance.map.remove();
    parkingMapInstance = null;
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
    if (parkingMapInstance && parkingMapInstance.map)
     {
      parkingMapInstance.map.remove();
      parkingMapInstance = null;
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
    if (parkingMapInstance && parkingMapInstance.map) 
    {
      parkingMapInstance.map.remove();
      parkingMapInstance = null;
    }
    
    // Pulisce completamente la query string dall'URL corrente
    const url = new URL(window.location.href);
    url.search = ''; // Rimuove tutti i parametri
    window.history.replaceState({}, '', url.toString());
  }
});