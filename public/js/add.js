// Variabili globali per la gestione della mappa
      let selectedCoordinates = { lat: null, lng: null };
      let map;
      let selectedMarker;
      
      // Elementi DOM
      const chooseLocationBtn = document.getElementById('choose-location-btn');
      const mapContainer = document.getElementById('map-container');
      const closeMapBtn = document.getElementById('close-map-btn');
      const mapDiv = document.getElementById('map');
      const filterBtn = document.getElementById('filter-btn');
      const filterPopup = document.getElementById('filterPopup');
      const confirmLocationBtn = document.getElementById('confirm-location-btn');
      const selectedLocationText = document.getElementById('selected-location');
      const locationDisplay = document.getElementById('location-display');
      const addParkingForm = document.getElementById('addParkingForm');
      
      // Inizializza la mappa Leaflet
      function initializeMap() {
        if (map) {
          map.remove(); // Rimuovi mappa esistente se presente
        }
        
        // Inizializza la mappa (centrata su Roma di default)
        map = L.map('map').setView([41.9028, 12.4964], 13);

        // Aggiungi tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Forza modalità aggiunta parcheggio (simile al tuo approccio)
        if (!window.location.search.includes('mode=add')) {
          console.log('La Mappa entra in modalità aggiunta parcheggio');
          const url = new URL(window.location.href);
          url.searchParams.set('mode', 'add');
          window.history.replaceState({}, '', url.toString());
        }

        // Event listener per click sulla mappa
        map.on('click', function(e) {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          
          selectedCoordinates.lat = lat;
          selectedCoordinates.lng = lng;
          
          // Rimuovi marker precedente
          if (selectedMarker) {
            map.removeLayer(selectedMarker);
          }
          
          // Aggiungi nuovo marker
          selectedMarker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'custom-marker',
              html: '<div style="background: #007A33; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 15px rgba(0, 122, 51, 0.4);"></div>',
              iconSize: [26, 26],
              iconAnchor: [13, 13]
            })
          }).addTo(map);
          
          selectedLocationText.textContent = `Selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        });

        // Carica il tuo script map.js se esiste
        if (!document.querySelector('script[src="./js/map.js"]')) {
          const script = document.createElement('script');
          script.src = './js/map.js';
          script.onerror = function() {
            console.log('map.js non trovato, usando implementazione di base');
          };
          document.body.appendChild(script);
        }
      }
      
      // Apri la mappa quando clicchi il pulsante
      chooseLocationBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        mapContainer.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Inizializza la mappa quando si apre
        setTimeout(() => {
          initializeMap();
        }, 100);
      });
      
      // Chiudi la mappa
      closeMapBtn.addEventListener('click', function() {
        mapContainer.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Rimuovi parametro mode dall'URL
        const url = new URL(window.location.href);
        url.searchParams.delete('mode');
        window.history.replaceState({}, '', url.toString());
      });
      
      // Chiudi la mappa cliccando fuori dal wrapper
      mapContainer.addEventListener('click', function(e) {
        if (e.target === mapContainer) {
          mapContainer.style.display = 'none';
          document.body.style.overflow = 'auto';
          
          // Rimuovi parametro mode dall'URL
          const url = new URL(window.location.href);
          url.searchParams.delete('mode');
          window.history.replaceState({}, '', url.toString());
        }
      });
      
      // Toggle filtri
      filterBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        filterPopup.classList.toggle('active');
      });
      
      // Chiudi filtri cliccando fuori
      document.addEventListener('click', function(e) {
        if (!filterPopup.contains(e.target) && !filterBtn.contains(e.target)) {
          filterPopup.classList.remove('active');
        }
      });
      
      // Conferma la posizione selezionata
      confirmLocationBtn.addEventListener('click', function() {
        if (selectedCoordinates.lat && selectedCoordinates.lng) {
          // Aggiorna i campi nascosti del form
          document.getElementById('latitude').value = selectedCoordinates.lat;
          document.getElementById('longitude').value = selectedCoordinates.lng;
          
          // Aggiorna la visualizzazione nel form
          locationDisplay.textContent = `Location selected: ${selectedCoordinates.lat.toFixed(6)}, ${selectedCoordinates.lng.toFixed(6)}`;
          locationDisplay.classList.add('location-selected');
          
          // Chiudi la mappa
          mapContainer.style.display = 'none';
          document.body.style.overflow = 'auto';
          
          // Rimuovi parametro mode dall'URL
          const url = new URL(window.location.href);
          url.searchParams.delete('mode');
          window.history.replaceState({}, '', url.toString());
        } else {
          alert('Please select a location on the map first!');
        }
      });
      
      // Gestione invio form principale
      addParkingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!selectedCoordinates.lat || !selectedCoordinates.lng) {
          alert('Please select a location on the map before adding the parking!');
          return;
        }
        
        // Qui puoi inviare i dati al server
        const formData = new FormData(this);
        console.log('Parking data:', Object.fromEntries(formData));
        
        // Mostra messaggio di successo
        const messageDiv = document.getElementById('message');
        messageDiv.innerHTML = '<div style="color: #007A33; font-weight: bold; text-align: center; margin-top: 20px;">Parking spot added successfully!</div>';
        
        // Reset form (opzionale)
        // this.reset();
        // selectedCoordinates = { lat: null, lng: null };
        // locationDisplay.textContent = 'Click "Choose the location on the map" to select position';
        // locationDisplay.classList.remove('location-selected');
      });
      
      // Gestione filtri nella mappa
      document.getElementById('apply-filters').addEventListener('click', function() {
        const accessType = document.getElementById('map-access-type').value;
        const free = document.getElementById('free').checked;
        const paid = document.getElementById('paid').checked;
        const surfaceType = document.getElementById('map-surface-type').value;
        
        console.log('Filters applied:', { accessType, free, paid, surfaceType });
        filterPopup.classList.remove('active');
      });
      
      document.getElementById('clear-filters').addEventListener('click', function() {
        document.getElementById('map-access-type').value = '';
        document.getElementById('free').checked = false;
        document.getElementById('paid').checked = false;
        document.getElementById('map-surface-type').value = '';
        filterPopup.classList.remove('active');
      });
      
      // Chiudi la mappa con ESC
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mapContainer.style.display === 'block') {
          mapContainer.style.display = 'none';
          document.body.style.overflow = 'auto';
          
          // Rimuovi parametro mode dall'URL
          const url = new URL(window.location.href);
          url.searchParams.delete('mode');
          window.history.replaceState({}, '', url.toString());
        }
      });