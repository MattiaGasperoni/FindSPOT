// Configurazione mappa e colori
const CONFIG = 
{
  DEFAULT_CENTER: [43.727362, 12.636127],
  DEFAULT_ZOOM: 14,
  DEFAULT_CITY: 'Urbino',
  COLORS: 
  {
    // Colori per i poligoni dei parcheggi
    FREE:      '#2ecc71',  // Verde per parcheggi gratuiti
    CUSTOMERS: '#f39c12',  // Arancione per solo clienti
    PAID:      '#e74c3c'   // Rosso per parcheggi a pagamento
  },
  ICONS: 
  {
    // Colori per le icone dei parcheggi
    GREEN:  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    YELLOW: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
    RED:    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    SHADOW: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png'
  }
};

/** 
 * Classe principale per la gestione della mappa e dei parcheggi.
 * Inizializza la mappa, carica i dati dei parcheggi e gestisce le interazioni.
 */
class ParkingMap
{
  constructor() 
  {
    if (this.map) 
    {
      this.map.remove(); // Rimuove l'istanza precedente, se esiste
    }

    this.map = this.initializeMap();
    console.log('Map initialized', this.map._leaflet_id);

    this.parkingLayer = null;
    this.mode         = this.getMode();
    this.filters      = this.getFilters(); 
    this.loadParkingData();
    this.setCityView();

    this.userMarker   = null; // Marker per la posizione dell'utente
    this.accuracyCircle = null;    

    this.selectedCoordinates = { lat: null, lng: null };
    this.selectedMarker = null;    
  }

  /*** --- INIZIALIZZAZIONE MAPPA --- ***/

  /**
   * Inizializza la mappa Leaflet con le impostazioni di base.
   * @returns {L.Map} L'istanza della mappa Leaflet.
   */
  initializeMap() 
  {
    const map = L.map('map', 
    {
      center: CONFIG.DEFAULT_CENTER,
      zoom: CONFIG.DEFAULT_ZOOM,
      zoomControl: false,
    });

    // Aggiungi i controlli per lo zoom in basso a destra
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Aggiungi il layer OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
    {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    return map;
  }

  /**
   * Ottiene il parametro 'mode' dalla query string dell'URL, fondamentale per capire cosa stiamo facendo.
   * -> 'delete' per la modalità di eliminazione parcheggio 
   * -> 'select' per la modalità di selezione coordinate
   * -> 'edit'   per la modalità di modifica parcheggio
   * -> 'filter' modalita di visione della mappa
   * Se non presente, restituisce null.
   * @returns {string|null} Il valore del parametro 'mode' o null se non presente.
   */
  getMode()
  {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mode');
  }

  /** 
   * Se ci troviamo in modalità 'filter', ottiene i filtri dalla query string dell'URL.
   * @returns {Object} Un oggetto contenente i filtri applicati.
   */
  getFilters()
  {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      access:  urlParams.get('access') || "",
      surface: urlParams.get('surface') || "",
      free:    urlParams.get('free') === 'yes',
      paid:    urlParams.get('paid') === 'yes'
    };
  }

  /** Carica i dati dei parcheggi dal server e aggiorna il layer della mappa. */
  async loadParkingData() 
  {
    try 
    {
      console.log("Modalità:", this.mode);
      console.log("Filtri attivi:", this.filters);

      const response = await fetch('/api/parcheggi');
      const data = await response.json();

      let filteredData = data;

      if (this.mode === 'filter')
      {
        filteredData.features = data.features.filter((f) => 
        {
          const p = f.properties;

          if (this.filters.access && p.access !== this.filters.access) return false;
          if (this.filters.surface && p.surface !== this.filters.surface) return false;
          if (this.filters.free && p.fee !== 'no') return false;
          if (this.filters.paid && p.fee !== 'yes') return false;

          return true;
        });
      }

      this.updateParkingMap(filteredData);
    } 
    catch (error) 
    {
      console.error('Error loading parkings:', error);
    }
  }

  /* Imposta la vista della mappa sulla città specificata nei parametri dell'URL, su quella predefinita */
  async setCityView() 
  {
    const city = new URLSearchParams(window.location.search).get("city") || CONFIG.DEFAULT_CITY;
    
    if (!city) 
    {
      console.warn("Parametro city non trovato. Uso città predefinita.");
    }
    try 
    {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`
      );

      const data = await response.json();
      
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      if (!isNaN(lat) && !isNaN(lon)) 
      {
        this.map.setView([lat, lon], CONFIG.DEFAULT_ZOOM);
      } 
      else 
      {
        console.error("Coordinate non valide:", data[0]);
      }

      console.log("Citta da URL:", city);
      console.log("Risposta Nominatim:", data);

    } 
    catch (error) 
    {
      console.error('Error during city search:', error);
      alert('Error during city search.');
    }
  }

/*** --- GESTIONE COLORI PARCHEGGI  --- ***/

  /** Applica il colore ai poligoni dei parcheggi in base alle loro proprietà.
   * @param {Object} feature - Il feature GeoJSON del parcheggio.
   * @returns {Object} Lo stile da applicare al poligono.
   */
  getParkingPolygonColor(feature) 
  {
    const props = feature.properties;
    const style = { fillOpacity: 0.6 };

    if (props.fee === 'no') 
    {
      style.color = CONFIG.COLORS.FREE;
    } 
    else if (props.access === 'customers') 
    {
      style.color = CONFIG.COLORS.CUSTOMERS;
    } 
    else 
    {
      style.color = CONFIG.COLORS.PAID;
    }

    return style;
  }
 
  /** Restituisce l'icona del colore appropriato per il marker del parcheggio in base alle sue proprietà.
   * @param {Object} props - Le proprietà del parcheggio.
   * @returns {L.Icon} L'icona da utilizzare per il marker.
   */
  getParkingMarkerColor(props) 
  {
    let iconUrl;

    if (props.fee === 'no') 
    {
      iconUrl = CONFIG.ICONS.GREEN;
    } 
    else if (props.access === 'customers') 
    {
      iconUrl = CONFIG.ICONS.YELLOW;
    } 
    else 
    {
      iconUrl = CONFIG.ICONS.RED;
    }

    return L.icon(
    {
      iconUrl,
      shadowUrl: CONFIG.ICONS.SHADOW,
      iconSize:    [25, 41],
      iconAnchor:  [12, 41],
      popupAnchor: [1, -34],
      shadowSize:  [41, 41],
    });
  }

  /*** --- GESTIONE MAPPA  --- ***/

  /** Aggiorna i parcheggi sulla mappa.
   * @param {Object} data - I dati GeoJSON dei parcheggi.
   */
  updateParkingMap(data) 
  {
    // Rimuovi il layer esistente se presente
    if (this.parkingLayer) 
    {
      this.map.removeLayer(this.parkingLayer);
    }


    //Modalità 'select' -> aggiungi l'actionListener ai parcheggi
    if (this.mode === 'select') 
    {
      this.map.off('click');  // rimuovi eventuali listener precedenti
      this.map.on('click', (e) => this.selectLocation(e));
    } 
    else
    {
      this.map.off('click'); // rimuovi listener se non in select
    }

    // Crea nuovo layer
    this.parkingLayer = L.geoJSON(data, 
    {
      style: (feature) => this.getParkingPolygonColor(feature),
      // Crea i marker per ogni feature
      // usando l'icona appropriata in base alle proprietà del parcheggio
      pointToLayer: (feature, latlng) => 
      {
        return L.marker(latlng, 
        { 
          icon: this.getParkingMarkerColor(feature.properties) 
        });
      },
      //Gestisce che cosa accade quando clicchiamo su un parcheggio
      onEachFeature: (feature, layer) => 
      {
        // Modalità 'delete' → non fa uscire il popup ma chiede conferma prima di eliminare il parcheggio
        if (this.mode === 'delete') 
        {
          layer.on('click', () => this.requestDeleteParking(feature));
          return;
        }
        if (this.mode === 'select') 
        {
          return;
        }
        if (this.mode === 'edit') {
          layer.bindPopup(`
            <div class="edit-popup-container">
              <strong class="edit-popup-title">${feature.properties.name || ""}</strong>
              <button onclick="editParking('${feature.properties['@id']}')" class="edit-popup-button">Modify</button>
            </div>
          `);

          layer.on('click', () => {
            layer.openPopup();
          });

          return;
        }
        // Modalità normale → mostra popup
        let coordinates = null;

        if (feature.geometry?.type === 'Polygon') 
        {
          const poly = feature.geometry.coordinates?.[0]?.[0];
          if (poly) coordinates = poly;
        } 
        else if (feature.geometry?.type === 'Point') 
        {
          coordinates = feature.geometry.coordinates;
        }

        if (coordinates) 
        {
          const popupContent = this.createParkingPopUp(feature.properties, coordinates);
          layer.bindPopup(popupContent, { closeButton: false });
        }
      }
    }).addTo(this.map);
  }
 
  /*** --- GESTIONE MODALITA ELIMINAZIONE PARCHEGGI  --- ***/

  /** Se ci troviamo in modalità 'delete', chiede conferma prima di eliminare il parcheggio.
   * @param {Object} feature - Il feature GeoJSON del parcheggio.
   */
  requestDeleteParking(feature) 
  {
    if (this.mode !== 'delete') return;

    console.log('Richiesta di eliminazione del parcheggio con id:', feature.properties['@id']);
    
    const name = feature.properties.name;

    // Costruisci il messaggio in base alla presenza del nome
    const message = name
      ? `Do you really want to delete the parking <br>"${name}"?`
      : `Are you sure you want to delete this parking?`;

    // Mostra il popup di conferma
    this.deletePopupConfirm(message, () => 
    {
      const idToDelete = feature.properties['@id'];
      this.deleteParking(idToDelete);
    });
  }

  // Metodo per creare un popup personalizzato
  deletePopupConfirm(message, onConfirm) 
  {
    // Crea il popup
    const modal = document.createElement('div');
    modal.className = 'custom-confirm-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <p>${message}</p>
                <div class="modal-buttons">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-confirm">Delete</button>
                </div>
            </div>
        </div>`;

    // Aggiungi gli event listeners
    const cancelBtn  = modal.querySelector('.btn-cancel');
    const confirmBtn = modal.querySelector('.btn-confirm');
    
    cancelBtn.onclick = () => 
    {
      document.body.removeChild(modal);
    };
    
    confirmBtn.onclick = () => 
    {
      document.body.removeChild(modal);
      onConfirm();
    };
    
    // Chiudi cliccando sull'overlay
    modal.querySelector('.modal-overlay').onclick = (e) => 
    {
      if (e.target === e.currentTarget) 
      {
        document.body.removeChild(modal);
      }
    };

    document.body.appendChild(modal);
  }

  showSuccessPopup(message)
  {
    // Crea il popup di successo
    const modal = document.createElement('div');
    modal.className = 'custom-success-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-message">${message}</div>
          <button class="btn-close">Close</button>
        </div>
      </div>`;

    // Aggiungi al body
    document.body.appendChild(modal);

    // Aggiungi l'event listener per chiudere il popup
    modal.querySelector('.btn-close').onclick = () => {
      document.body.removeChild(modal);
    };

    // Chiudi cliccando sull'overlay
    modal.querySelector('.modal-overlay').onclick = (e) => {
      if (e.target === e.currentTarget) {
        document.body.removeChild(modal);
      }
    };
  }

  /** Effettua una richiesta DELETE al server per eliminare un parcheggio.
   * @param {string} id - L'ID del parcheggio da eliminare.
   */
  async deleteParking(id) 
  {
    try 
    {
      const response = await fetch(`/api/parcheggi/${encodeURIComponent(id)}`, 
      { 
        method: 'DELETE' 
      });
      
      if (!response.ok) 
      {
        console.error('Error deleting parking:', response.statusText);
        throw new Error('Error deleting parking');
      }
      console.log('Richiesta di eliminazione eseguita per il parcheggio con ID:', id);

      this.showSuccessPopup('Parking successfully deleted!');
      this.loadParkingData();
    } 
    catch (error) 
    {
      alert(error.message);
    }
  }

  /*** --- GESTIONE MODALITA SELEZIONE COORDINATE PARCHEGGIO --- ***/

  selectLocation(e) 
  {
    this.selectedCoordinates.lat = e.latlng.lat;
    this.selectedCoordinates.lng = e.latlng.lng;

    // Rimuovi marker precedente
    if (this.selectedMarker != null) {
      this.map.removeLayer(this.selectedMarker);
    }

    // Aggiungi nuovo marker
    this.selectedMarker = L.marker([this.selectedCoordinates.lat, this.selectedCoordinates.lng], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: '<div style="background: #007A33; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 15px rgba(0, 122, 51, 0.4);"></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      })
    }).addTo(this.map);
  }


  
  getSelectedCoordinates() {
    return this.selectedCoordinates;
  }

  /*** --- GESTIONE GEOLOCALIZZAZIONE --- ***/

  locateUser()
  {
    console.log("Richiesta di geolocalizzazione dell'utente...");
  
    if (navigator.geolocation) 
      {
      navigator.geolocation.getCurrentPosition(position => 
      {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        this.map.setView([lat, lon], 15);

        if (this.userMarker) this.map.removeLayer(this.userMarker);
        if (this.accuracyCircle) this.map.removeLayer(this.accuracyCircle);

 
        this.userMarker = L.marker([lat, lon]).addTo(this.map)
          .bindPopup(`<span>You are in this area!</span>` , { closeButton: false })
          .openPopup();


        this.accuracyCircle = L.circle([lat, lon], 
        {
          radius: accuracy,
          color: 'blue',
          fillColor: '#30f',
          fillOpacity: 0.2
        }).addTo(this.map);
      }, () => 
      {
        alert("Unable to get your location.");
      });
    } 
    else
    {
      alert("Geolocation is not supported by your browser.");
    }
  }

  /*** --- GESTIONE VISTA CON FILTRI --- ***/
async updateMapView() 
{
   
  try 
  {
    this.mode    = this.getMode();
    this.filters = this.getFilters(); 

    // Vista sulla città
    await this.setCityView();
    console.log("Città centrata sulla mappa");

    // Carica dati filtrati
    await this.loadParkingData();
    console.log("Dati parcheggi aggiornati con filtri:", this.filters);
  } 
  catch (error) 
  {
    console.error('Errore durante l\'aggiornamento della mappa:', error);
    alert('Errore durante l\'aggiornamento della visualizzazione della mappa.');
  }
}

  /*** --- GESTIONE POP-UP PARCHEGGI --- ***/

  /** Crea il contenuto del popup per il parcheggio
   * @param {Object} properties - Le proprietà del parcheggio.
   * @param {Array} coordinates - Le coordinate del parcheggio [lon, lat].
   * @returns {string} Il contenuto HTML del popup.
   */
  createParkingPopUp(properties, coordinates) 
  {
    const name = properties.name || 'Not specified';
    const access = properties.access || 'n/a';
    const surface = properties.surface || 'n/a';
    const isFree = properties.fee === 'no';
    
    // Icon mapping for different access types
    const accessIcons = {
      'yes': '🚗',
      'public': '🚗',
      'private': '🔒',
      'customers': '🛍️',
      'permissive': '✅',
      'destination': '🎯',
      'no': '⛔'
    };
    
    // Icon mapping for different surface types
    const surfaceIcons = {
      'paved': '🏗️',
      'asphalt': '🛣️',
      'concrete': '🏢',
      'gravel': '🪨',
      'grass': '🌱',
      'dirt': '🌍',
      'paving_stones': '🧱'
    };
    
    // English labels mapping for access
    const accessLabels = {
      'yes': 'Public',
      'public': 'Public',
      'private': 'Private',
      'customers': 'Customers only',
      'permissive': 'Permissive',
      'destination': 'Destination',
      'no': 'Forbidden',
      'n/a': 'Not specified'
    };
    
    // English labels mapping for surface
    const surfaceLabels = {
      'paved': 'Paved',
      'asphalt': 'Asphalt',
      'concrete': 'Concrete',
      'gravel': 'Gravel',
      'grass': 'Grass',
      'dirt': 'Dirt',
      'paving_stones': 'Paving stones',
      'n/a': 'Not specified'
    };
    
    const accessIcon = accessIcons[access.toLowerCase()] || '🚗';
    const surfaceIcon = surfaceIcons[surface.toLowerCase()] || '🏗️';
    const feeIcon = isFree ? '💰' : '💳';
    const feeClass = isFree ? 'free' : 'paid';
    const feeText = isFree ? 'free' : 'paid';
    
    const accessLabel = accessLabels[access.toLowerCase()] || access;
    const surfaceLabel = surfaceLabels[surface.toLowerCase()] || surface;
    
    // Genera l'URL per Google Maps
    const googleMapsUrl = this.generateGoogleMapsUrl(coordinates, name);
    
    return `
      <div class="parking-popup">
        <div class="parking-title">
            <div class="parking-icon">P</div>
            ${name}
        </div>
        
        <div class="parking-details">
            <div class="detail-row">
                <div class="detail-icon access">${accessIcon}</div>
                <div class="detail-content">
                    <div class="detail-label">Access</div>
                    <div class="detail-value">${accessLabel}</div>
                </div>
            </div>
            
            <div class="detail-row">
                <div class="detail-icon surface">${surfaceIcon}</div>
                <div class="detail-content">
                    <div class="detail-label">Surface</div>
                    <div class="detail-value">${surfaceLabel}</div>
                </div>
            </div>
            
            <div class="detail-row">
                <div class="detail-icon fee ${feeClass}">${feeIcon}</div>
                <div class="detail-content">
                    <div class="detail-label">Fee</div>
                    <div class="detail-value">
                        <span class="badge ${feeClass}">${feeText}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="parking-actions">
            <a href="${googleMapsUrl}" target="_blank" class="gmaps-button">
        <span class="gmaps-icon">
            <svg xmlns="http://www.w3.org/2000/svg" aria-label="Google Maps" role="img" viewBox="0 0 512 512" fill="#000000">
                <rect width="512" height="512" rx="15%" fill="#ffffff"/>
                <g clip-path="url(#clip)">
                    <path fill="#35a85b" d="M0 512V0h512z"/>
                    <path fill="#5881ca" d="M256 288L32 512h448z"/>
                    <path fill="#c1c0be" d="M288 256L512 32v448z"/>
                    <path stroke="#fadb2a" stroke-width="71" d="M0 512L512 0"/>
                    <path fill="none" stroke="#f2f2f2" stroke-width="22" d="M175 173h50a50 54 0 1 1-15-41"/>
                    <path fill="#de3738" d="M353 85a70 70 0 0 1 140 0c0 70-70 70-70 157 0-87-70-87-70-157"/>
                    <circle cx="423" cy="89" r="25" fill="#7d2426"/>
                </g>
            </svg>
        </span>
        Navigate with Google Maps
    </a>
</div>

        </div>
    `;
  }

  // Genera l'URL di Google Maps
  generateGoogleMapsUrl(coordinates) 
  {
    const lat = coordinates[1]; // Latitudine
    const lng = coordinates[0]; // Longitudine

    // URL diretto alla destinazione
    const baseUrl = 'https://www.google.com/maps/dir/';
    const destination = `${lat},${lng}`;

    return `${baseUrl}/${destination}`;
  }

}

/*** --- INIZIALIZZO LA MAPPA --- ***/
const parkingMapInstance = new ParkingMap();

if (parkingMapInstance.getMode() === 'select' || parkingMapInstance.getMode() === 'edit') {
  window.parkingMap = parkingMapInstance;
}

// Listener che gestisce l'evento di ricerca della città
window.addEventListener("search-city", () => 
{
  // legge la città dall'URL aggiornato
  parkingMapInstance.setCityView(); 
});

// Listener che gestisce l'evento di visualizzazione della mappa con filtri
window.addEventListener("filter-map-view", () => 
{
  console.log("Richiesta Aggiornamento mappa ricevuta");

  // legge l'URL e aggiorna la mappa con i filtri
  parkingMapInstance.updateMapView(); 
});

// Collega il pulsante alla funzione locateUser()
document.getElementById('geoBtn').addEventListener('click', () => 
{ 
  parkingMapInstance.locateUser(); 
});
