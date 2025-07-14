// Configurazione mappa
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

/** * Classe principale per la gestione della mappa dei parcheggi.
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

    // Aggiungi i controlli di zoom in basso a destra
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    // Aggiungi il layer OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
    {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    return map;
  }

  /**
   * Ottiene il parametro 'mode' dalla query string dell'URL.
   * @returns {string|null} Il valore del parametro 'mode' o null se non presente.
   */
  getMode()
  {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mode');
  }

  /** Applica lo stile ai poligoni dei parcheggi in base alle loro proprietà.
   * @param {Object} feature - Il feature GeoJSON del parcheggio.
   * @returns {Object} Lo stile da applicare al poligono.
   */

  /** Ottiene i filtri dalla query string dell'URL.
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


  styleFeature(feature) 
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
 
  /** Restituisce l'icona appropriata per il marker del parcheggio in base alle sue proprietà.
   * @param {Object} props - Le proprietà del parcheggio.
   * @returns {L.Icon} L'icona da utilizzare per il marker.
   */
  getIcon(props) 
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

  /** Crea il contenuto del popup per il parcheggio.
   * @param {Object} properties - Le proprietà del parcheggio.
   * @returns {string} Il contenuto HTML del popup.
   */
  // Funzione migliorata per il popup - da sostituire nel file map.js
  createPopupContent(properties) 
  {
      const name    = properties.name || 'Nome non specificato';
      const access  = properties.access || 'n/a';
      const surface = properties.surface || 'n/a';
      const isFree  = properties.fee === 'no';
      
      // Mappatura icone per diversi tipi di accesso
      const accessIcons = 
      {
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
      const accessLabels = 
      {
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
      const surfaceLabels = 
      {
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
          </div>
      `;
  }

  /** Se ci troviamo in modalità 'delete', chiede conferma prima di eliminare il parcheggio.
   * @param {Object} feature - Il feature GeoJSON del parcheggio.
   */
  handleFeatureClick(feature) 
  {
    // Se non siamo in modalità 'delete', non fa nulla
    if (this.mode !== 'delete') return;

    const name = feature.properties.name || '';
    const confirmMessage = `Do you want to delete the parking "${name}"?`;
    
    // Mostra un messaggio di conferma prima di procedere con l'eliminazione
    // Se l'utente non conferma, non fa nulla
    if (!confirm(confirmMessage)) return;

    // Otteniamo l'ID del parcheggio da eliminare
    const idToDelete = feature.properties['@id'];
    
    this.deleteParkingSpot(idToDelete);
  }

  /** Effettua una richiesta DELETE per eliminare un parcheggio.
   * @param {string} id - L'ID del parcheggio da eliminare.
   */
  async deleteParkingSpot(id) 
  {
    try 
    {
      const response = await fetch(`/api/parcheggi/${encodeURIComponent(id)}`, 
      { 
        method: 'DELETE' 
      });
      
      if (!response.ok) {
        throw new Error('Error deleting parking');
      }
      
      alert('Parking successfully deleted');
      this.loadParkingData();
    } catch (error) 
    {
      alert(error.message);
    }
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
      filteredData.features = data.features.filter((f) => {
        const p = f.properties;

        if (this.filters.access && p.access !== this.filters.access) return false;
        if (this.filters.surface && p.surface !== this.filters.surface) return false;
        if (this.filters.free && p.fee !== 'no') return false;
        if (this.filters.paid && p.fee !== 'yes') return false;

        return true;
      });
    }

    this.updateParkingLayer(filteredData);
  } 
  catch (error) 
  {
    console.error('Error loading parkings:', error);
  }
}


  /**
   * Aggiorna il layer dei parcheggi sulla mappa.
   * @param {Object} data - I dati GeoJSON dei parcheggi.
   */
  updateParkingLayer(data) 
  {
    // Rimuovi il layer esistente se presente
    if (this.parkingLayer) {
      this.map.removeLayer(this.parkingLayer);
    }

    // Crea nuovo layer
    this.parkingLayer = L.geoJSON(data, 
    {
      style: (feature) => this.styleFeature(feature),
      // Crea i marker per ogni feature
      // usando l'icona appropriata in base alle proprietà del parcheggio
      pointToLayer: (feature, latlng) => 
      {
        return L.marker(latlng, 
        { 
          icon: this.getIcon(feature.properties) 
        });
      },
      // Aggiungi il popup a ogni feature
      // e gestisci il click per la modalità 'delete'
      onEachFeature: (feature, layer) => 
      {
        const popupContent = this.createPopupContent(feature.properties);
        layer.bindPopup(popupContent);
        
        if (this.mode === 'delete') 
        {
          layer.on('click', () => this.handleFeatureClick(feature));
        }
      }
    }).addTo(this.map);
  }

  /** Imposta la vista della mappa sulla città specificata nei parametri dell'URL o su quella predefinita. */
  async setCityView() 
  {
    const urlParams = new URLSearchParams(window.location.search);
    const city = urlParams.get('city') || CONFIG.DEFAULT_CITY;
    
    try 
    {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const { lat, lon } = data[0];
        this.map.setView([parseFloat(lat), parseFloat(lon)], CONFIG.DEFAULT_ZOOM);
      } else {
        alert('City not found.');
      }
    } 
    catch (error) 
    {
      console.error('Error during city search:', error);
      alert('Error during city search.');
    }
  }
}

// Inizializza la mappa
const parkingMap = new ParkingMap();