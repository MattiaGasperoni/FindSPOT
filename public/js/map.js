// Configurazione mappa
const CONFIG = 
{
  DEFAULT_CENTER: [43.727362, 12.636127],
  DEFAULT_ZOOM: 14,
  DEFAULT_CITY: 'Urbino',
  COLORS: 
  {
    FREE:      '#2ecc71',  // Verde per parcheggi gratuiti
    CUSTOMERS: '#f39c12',  // Arancione per solo clienti
    PAID:      '#e74c3c'   // Rosso per parcheggi a pagamento
  },
  ICONS: 
  {
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
  createPopupContent(properties) 
  {
    const name = properties.name || 'Name not specified';

    const access  = properties.access || 'n/a';
    const surface = properties.surface || 'n/a';
    const isFree  = properties.fee === 'no' ? 'Yes' : 'No / Not specified';

    return `
      <strong>${name}</strong><br>
      Access: ${access}<br>
      Surface: ${surface}<br>
      Free: ${isFree}
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
      
      this.updateParkingLayer(data);
    } catch (error) 
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