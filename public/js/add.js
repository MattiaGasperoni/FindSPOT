// Elementi DOM principali
const chooseLocationBtn  = document.getElementById('choose-location-btn');
const mapContainer       = document.getElementById('map-container');
const closeMapBtn        = document.getElementById('close-map-btn');
const confirmLocationBtn = document.getElementById('confirm-location-btn');
const locationDisplay    = document.getElementById('location-display');
const addParkingForm     = document.getElementById('addParkingForm');

// Gestione click sul bottone per scegliere la posizione su mappa
chooseLocationBtn.addEventListener('click', async function(e) 
{
  e.preventDefault();       
  e.stopPropagation();       

  try 
  {
    // Mostra il contenitore della mappa e blocca lo scroll della pagina
    mapContainer.style.display   = 'block';
    document.body.style.overflow = 'hidden';

    // Carica dinamicamente lo script della mappa se non è già presente
    if (!document.querySelector('script[src="./js/map.js"]')) 
    {
      const script = document.createElement('script');
      script.src = './js/map.js';
      document.body.appendChild(script);
    }

    // Aggiunge ?mode=select all'URL per informare lo script della modalità selezione
    if (!window.location.search.includes('mode=select')) 
    {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', 'select');
      window.history.replaceState({}, '', url.toString());
    }  
  } 
  catch (error) 
  {
    showError('Error loading map. Please try again.');
  }
});

// Gestione conferma della posizione scelta
confirmLocationBtn.addEventListener('click', function () 
{
  // Verifica che l'oggetto parkingMap sia disponibile e contenga il metodo previsto
  if (window.parkingMap && window.parkingMap.getSelectedCoordinates) 
  {
    const coordinates = window.parkingMap.getSelectedCoordinates();

    // Controlla che le coordinate siano numeri validi
    if (typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number') 
    {
      // Aggiorna i campi nascosti del form con latitudine e longitudine
      document.getElementById('latitude').value  = coordinates.lat;
      document.getElementById('longitude').value = coordinates.lng;

      // Mostra visivamente la posizione selezionata all'utente
      locationDisplay.textContent = `Location selected: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
      locationDisplay.classList.add('location-selected');

      closeMap();
    } 
    else 
    {
      // Mostra messaggio di errore se coordinate non valide
      document.getElementById('map-error-popup').classList.remove('hidden');
    }
  } 
  else 
  {
    showError('Map not loaded correctly. Please try again.');
  }
});

// Gestione invio del form principale per aggiungere un parcheggio
addParkingForm.addEventListener('submit', function(e) 
{
  e.preventDefault(); // Evita il submit classico

  // Recupera e valida latitudine e longitudine
  const lat = parseFloat(document.getElementById('latitude').value);
  const lng = parseFloat(document.getElementById('longitude').value);

  if (isNaN(lat) || isNaN(lng)) 
  {
    showError('Please select a location on the map before adding the parking!');
    return;
  }

  // Recupera gli altri dati dal form
  const name    = this.elements['name'].value;
  const access  = document.getElementById('access-type').value;
  const fee     = document.getElementById('fee-type').value;
  const surface = document.getElementById('surface-type').value;

  // Crea l’oggetto GeoJSON da inviare al server
  const newFeature = 
  {
    type: "Feature",
    geometry: 
    {
      type: "Point",
      coordinates: [lng, lat]
    },
    properties: 
    {
      name: name,
      access: access || undefined,
      fee: fee || undefined,
      surface: surface || undefined,
      amenity: "parking"
    }
  };

  // Invia i dati al backend tramite POST
  fetch('/api/parcheggi', 
  {
    method: 'POST',
    headers: 
    {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newFeature)
  })
  .then(res => 
  {
    if (!res.ok) throw new Error("Errore nel salvataggio");
    return res.json();
  })
  .then(data => 
  {
    // Mostra popup di successo
    const popup = document.getElementById('success-popup');
    popup.querySelector('p').textContent = `Parking spot added successfully!`;
    popup.classList.remove('hidden');
  })
  .catch(err => 
  {
    showError('Errore durante l\'invio del parcheggio');
  });
});

// GESTIONE CHIUSURA MAPPA

// Chiude la mappa cliccando il bottone 
closeMapBtn.addEventListener('click', closeMap);

// Chiude la mappa cliccando fuori dal contenuto (overlay)
mapContainer.addEventListener('click', (e) => 
{
  if (e.target === mapContainer) closeMap();
});

// Chiude la mappa premendo ESC
document.addEventListener('keydown', (e) => 
{
  if (e.key === 'Escape' && mapContainer.style.display === 'block') closeMap();
});

// Chiude il popup di successo e reindirizza alla homepage
function closeSuccessPopup() 
{
  document.getElementById('success-popup').classList.add('hidden');
  window.location.href = 'index.html';
}

// Funzione per chiudere la mappa e ripristinare la pagina
function closeMap() 
{
  mapContainer.style.display   = 'none';
  document.body.style.overflow = 'auto';

  // Rimuove parametri dalla query string
  const url = new URL(window.location.href);
  url.search = '';
  window.history.replaceState({}, '', url.toString());
}
