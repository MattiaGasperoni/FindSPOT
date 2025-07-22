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

// Listener che gestisce l'evento di ricerca della città
window.addEventListener("search-city", () => 
{
  // legge la città dall'URL aggiornato
  parkingMap.setCityView(); 
});

/** 
 * Classe principale per la gestione della mappa e dei parcheggi.
 * Inizializza la mappa, carica i dati dei parcheggi e gestisce le interazioni.
 */
class ParkingMap
{
  constructor() 
  {
    this.map          = this.initializeMap();
    this.parkingLayer = null;
    this.mode         = this.getMode();
    this.filters      = this.getFilters(); 
    this.loadParkingData();
    this.setCityView();
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
   * -> 'edit' per la modalità di modifica parcheggio
   * -> 'filter' per la modalità di visualizzazione mappa con filtri.
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
      access:  urlParams.get('access'),
      surface: urlParams.get('surface'),
      free:    urlParams.get('free') === 'yes',
      paid:    urlParams.get('paid') === 'yes'
    };
  }

  /** Carica i dati dei parcheggi dal server e aggiorna il layer della mappa. */
  async loadParkingData() 
  {
    try 
    {
      const response = await fetch('/api/parcheggi');
      const data = await response.json();

      let filteredData = data;

      if (this.mode === 'filter') {
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
    
    try 
    {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`
      );
      const data = await response.json();
      
      if (data.length > 0) 
      {
        const { lat, lon } = data[0];
        this.map.setView([parseFloat(lat), parseFloat(lon)], CONFIG.DEFAULT_ZOOM);
      } 
      else
      {
        alert('City not found.');
      }
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
          if (this.mode === 'delete') 
          {
            // Siamo in modalità 'delete', non mostriamo il popup ma gestiamo il click per eliminare il parcheggio
            layer.on('click', () => this.requestDeleteParking(feature));
          } 
          else if (this.mode === 'edit') 
          {
            // Siamo in modalità 'edit', non mostriamo il popup ma gestiamo il click per modificare il parcheggio
            layer.on('click', () => this.requestEditParking(feature));
          }
          else 
          {
            let coordinates = null;

            if (feature.geometry && feature.geometry.type === 'Polygon') 
            {
              if (
                Array.isArray(feature.geometry.coordinates) &&
                feature.geometry.coordinates.length > 0 &&
                Array.isArray(feature.geometry.coordinates[0]) &&
                feature.geometry.coordinates[0].length > 0
              ) 
              {
                coordinates = feature.geometry.coordinates[0][0]; // Primo punto del primo anello
              }
            } 
            else if (feature.geometry && feature.geometry.type === 'Point') 
            {
              coordinates = feature.geometry.coordinates;
            }

            if (coordinates) 
            {
              const popupContent = this.createParkingPopUp(feature.properties, coordinates);
              layer.bindPopup(popupContent);
            }
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
    // Se non siamo in modalità 'delete', non fa nulla
    if (this.mode !== 'delete') return;

    console.log('Richiesta di eliminazione del parcheggio con id:', feature.properties['@id']);
    const name = feature.properties.name || 'Unnamed parking';
    
    // Quando l'utente conferma, procediamo con l'eliminazione
    this.deletePopupConfirm(`Do you really want to delete the parking <br>"${name}"?`, () => 
    {
      // Get the ID of the parking to delete
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



  /*** --- GESTIONE POP-UP PARCHEGGI --- ***/

  /** Crea il contenuto del popup per il parcheggio
   * @param {Object} properties - Le proprietà del parcheggio.
   * @param {Array} coordinates - Le coordinate del parcheggio [lon, lat].
   * @returns {string} Il contenuto HTML del popup.
   */
  createParkingPopUp(properties, coordinates) 
  {
    const name = properties.name || 'Nome non specificato';
    const access = properties.access || 'n/a';
    const surface = properties.surface || 'n/a';
    const isFree = properties.fee === 'no';
    
    // Mappatura icone per diversi tipi di accesso
    const accessIcons = {
        'yes': '🚗',
        'public': '🚗',
        'private': '🔒',
        'customers': '🛍️',
        'permissive': '✅',
        'destination': '🎯',
        'no': '⛔'
    };
    
    // Mappatura icone per diversi tipi di superficie
    const surfaceIcons = {
        'paved': '🏗️',
        'asphalt': '🛣️',
        'concrete': '🏢',
        'gravel': '🪨',
        'grass': '🌱',
        'dirt': '🌍',
        'paving_stones': '🧱'
    };
    
    // Mappatura etichette italiane per accesso
    const accessLabels = {
        'yes': 'Pubblico',
        'public': 'Pubblico',
        'private': 'Privato',
        'customers': 'Solo clienti',
        'permissive': 'Permissivo',
        'destination': 'Destinazione',
        'no': 'Vietato',
        'n/a': 'Non specificato'
    };
    
    // Mappatura etichette italiane per superficie
    const surfaceLabels = {
        'paved': 'Pavimentata',
        'asphalt': 'Asfaltata',
        'concrete': 'Calcestruzzo',
        'gravel': 'Ghiaia',
        'grass': 'Erba',
        'dirt': 'Terra',
        'paving_stones': 'Lastricato',
        'n/a': 'Non specificato'
    };
    
    const accessIcon = accessIcons[access.toLowerCase()] || '🚗';
    const surfaceIcon = surfaceIcons[surface.toLowerCase()] || '🏗️';
    const feeIcon = isFree ? '💰' : '💳';
    const feeClass = isFree ? 'free' : 'paid';
    const feeText = isFree ? 'Gratuito' : 'A pagamento';
    
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
                        <div class="detail-label">Accesso</div>
                        <div class="detail-value">${accessLabel}</div>
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-icon surface">${surfaceIcon}</div>
                    <div class="detail-content">
                        <div class="detail-label">Superficie</div>
                        <div class="detail-value">${surfaceLabel}</div>
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-icon fee ${feeClass}">${feeIcon}</div>
                    <div class="detail-content">
                        <div class="detail-label">Tariffa</div>
                        <div class="detail-value">
                            <span class="badge ${feeClass}">${feeText}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="parking-actions">
                <a href="${googleMapsUrl}" target="_blank" class="gmaps-button">
                    <span class="gmaps-icon">🗺️</span>
                    Naviga con Google Maps
                </a>
            </div>
        </div>
    `;
  }

  // Genera l'URL di Google Maps
  generateGoogleMapsUrl(coordinates, name) 
  {
    const lat = coordinates[1]; // Latitudine
    const lng = coordinates[0]; // Longitudine
    
    // URL per aprire direttamente la navigazione verso il punto
    const baseUrl = 'https://www.google.com/maps/dir/';
    const destination = `${lat},${lng}`;
    
    // Aggiungi il nome del parcheggio come query se disponibile
    const query = name !== 'Nome non specificato' ? encodeURIComponent(name) : '';
    
    return `${baseUrl}/${destination}${query ? '/' + query : ''}`;
  }
}

/*** --- INIZIALIZZO LA MAPPA --- ***/
const parkingMap = new ParkingMap();