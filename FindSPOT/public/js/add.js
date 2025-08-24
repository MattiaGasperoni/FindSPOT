/*
 * Gestisce l'aggiunta di nuovi parcheggi tramite selezione su mappa
 */

// Elementi DOM principali
const chooseLocationBtn  = document.getElementById('choose-location-btn');
const mapContainer       = document.getElementById('map-container');
const closeMapBtn        = document.getElementById('close-map-btn');
const confirmLocationBtn = document.getElementById('confirm-location-btn');
const locationDisplay    = document.getElementById('location-display');
const addParkingForm     = document.getElementById('addParkingForm');

// Gestisce l'apertura della mappa per selezione posizione
chooseLocationBtn.addEventListener('click', async function(e) 
{
    e.preventDefault();       
    e.stopPropagation();       

    try 
    {
        // Mostra mappa e blocca scroll della pagina
        mapContainer.style.display   = 'block';
        document.body.style.overflow = 'hidden';

        // Carica dinamicamente il modulo mappa se necessario
        if (!document.querySelector('script[src="./js/map.js"]')) 
        {
            const script = document.createElement('script');
            script.src = './js/map.js';
            document.body.appendChild(script);
        }

        // Imposta modalità selezione nell'URL
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

// Conferma la posizione selezionata sulla mappa
confirmLocationBtn.addEventListener('click', function () 
{
    // Verifica disponibilità dell'oggetto mappa
    if (window.parkingMap && window.parkingMap.getSelectedCoordinates) 
    {
        const coordinates = window.parkingMap.getSelectedCoordinates();

        // Valida le coordinate ottenute
        if (typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number') 
        {
            // Aggiorna i campi nascosti del form
            document.getElementById('latitude').value  = coordinates.lat;
            document.getElementById('longitude').value = coordinates.lng;

            // Mostra conferma visiva della selezione
            locationDisplay.textContent = `Location selected: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
            locationDisplay.classList.add('location-selected');

            closeMap();
        } 
        else 
        {
            // Mostra popup errore per coordinate non valide
            document.getElementById('map-error-popup').classList.remove('hidden');
        }
    } 
    else 
    {
        showError('Map not loaded correctly. Please try again.');
    }
});

// Gestisce il submit del form per aggiungere il parcheggio
addParkingForm.addEventListener('submit', function(e) 
{
    e.preventDefault();

    // Valida le coordinate
    const lat = parseFloat(document.getElementById('latitude').value);
    const lng = parseFloat(document.getElementById('longitude').value);

    if (isNaN(lat) || isNaN(lng)) 
    {
        showError('Please select a location on the map before adding the parking!');
        return;
    }

    // Raccoglie i dati del form
    const name    = this.elements['name'].value;
    const access  = document.getElementById('access-type').value;
    const fee     = document.getElementById('fee-type').value;
    const surface = document.getElementById('surface-type').value;

    // Costruisce l'oggetto GeoJSON
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

    // Invia al server
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

// Gestione chiusura mappa
closeMapBtn.addEventListener('click', closeMap);

// Chiude mappa cliccando sull'overlay
mapContainer.addEventListener('click', (e) => 
{
    if (e.target === mapContainer) closeMap();
});

// Chiude mappa con tasto ESC
document.addEventListener('keydown', (e) => 
{
    if (e.key === 'Escape' && mapContainer.style.display === 'block') closeMap();
});

// Chiude il popup di successo e reindirizza
function closeSuccessPopup() 
{
    document.getElementById('success-popup').classList.add('hidden');
    window.location.href = 'index.html';
}

// Chiude la mappa e ripristina lo stato della pagina
function closeMap() 
{
    mapContainer.style.display   = 'none';
    document.body.style.overflow = 'auto';

    // Pulisce i parametri URL
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, '', url.toString());
}