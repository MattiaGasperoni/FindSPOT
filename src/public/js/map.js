/*
 * Sistema completo per la gestione della mappa interattiva dei parcheggi
 */

// Configurazione globale della mappa
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

/*
 * Classe principale per la gestione della mappa e dei parcheggi
 */
class ParkingMap
{
    constructor() 
    {
        if (this.map) 
        {
            this.map.remove(); // Rimuove istanza precedente
        }

        this.map = this.initializeMap();
        this.parkingLayer = null;
        this.mode = this.getMode();
        this.filters = this.getFilters(); 
        this.loadParkingData();
        this.setCityView();

        this.userMarker = null;
        this.accuracyCircle = null;    

        this.selectedCoordinates = { lat: null, lng: null };
        this.selectedMarker = null;    
    }

    // Inizializza la mappa Leaflet
    initializeMap() 
    {
        const map = L.map('map', 
        {
            center: CONFIG.DEFAULT_CENTER,
            zoom: CONFIG.DEFAULT_ZOOM,
            zoomControl: false,
        });

        // Controlli zoom in basso a destra
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Layer OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
        {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        return map;
    }

    // Ottiene la modalità corrente dall'URL
    getMode()
    {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('mode');
    }

    // Ottiene i filtri applicati dall'URL
    getFilters()
    {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            access:  urlParams.get('access') || "",
            surface: urlParams.get('surface') || "",
            fee:     urlParams.get('fee') || "",
        };
    }

    // Carica i dati dei parcheggi dal server
    async loadParkingData() 
    {
        try 
        {
            const response = await fetch('/api/parcheggi');
            const data = await response.json();

            let filteredData = data;

            // Applica filtri se in modalità filter
            if (this.mode === 'filter')
            {
                filteredData.features = data.features.filter((f) => 
                {
                    const p = f.properties;

                    if (this.filters.access && p.access !== this.filters.access) return false;
                    if (this.filters.surface && p.surface !== this.filters.surface) return false;
                    if (this.filters.fee && p.fee !== this.filters.fee) return false;

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

    // Imposta la vista sulla città specificata
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
        } 
        catch (error) 
        {
            console.error('Error during city search:', error);
            showError("Error during city search");
        }
    }

    // Imposta vista città solo se presente nell'URL
    async setCityViewIfCityInURL() 
    {
        const params = new URLSearchParams(window.location.search);
        const city = params.get("city");

        if (!city) 
        {
            return;
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
        } 
        catch (error) 
        {
            console.error('Error during city search:', error);
            showError("Error during city search");
        }
    }

    // Determina il colore dei poligoni parcheggio
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
 
    // Determina l'icona del marker parcheggio
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

    // Aggiorna i parcheggi sulla mappa
    updateParkingMap(data) 
    {
        // Rimuove layer esistente
        if (this.parkingLayer) 
        {
            this.map.removeLayer(this.parkingLayer);
        }

        // Gestisce listener per modalità select
        if (this.mode === 'select') 
        {
            this.map.off('click');
            this.map.on('click', (e) => this.selectLocation(e));
        } 
        else
        {
            this.map.off('click');
        }

        // Crea nuovo layer con gestione modalità
        this.parkingLayer = L.geoJSON(data, 
        {
            style: (feature) => this.getParkingPolygonColor(feature),
            pointToLayer: (feature, latlng) => 
            {
                return L.marker(latlng, 
                { 
                    icon: this.getParkingMarkerColor(feature.properties) 
                });
            },
            onEachFeature: (feature, layer) => 
            {
                // Modalità delete: richiede conferma eliminazione
                if (this.mode === 'delete') 
                {
                    layer.on('click', () => this.requestDeleteParking(feature));
                    return;
                }
                
                if (this.mode === 'select') 
                {
                    return;
                }
                
                // Modalità edit: mostra popup di modifica
                if (this.mode === 'edit') 
                {
                    layer.bindPopup(`
                        <div class="edit-popup-container">
                            <strong class="edit-popup-title">${feature.properties.name || ""}</strong>
                            <button onclick="editParking('${feature.properties['@id']}')" class="edit-popup-button">Edit</button>
                        </div>
                    `, { closeButton: false });

                    layer.on('click', () => 
                    {
                        layer.openPopup();
                    });

                    return;
                }
                
                // Modalità normale: popup informativo
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
 
    // Richiede conferma prima di eliminare un parcheggio
    requestDeleteParking(feature) 
    {
        if (this.mode !== 'delete') return;
        
        const name = feature.properties.name;

        const message = name
            ? `Do you really want to delete the parking <br>"${name}"?`
            : `Are you sure you want to delete this parking?`;

        this.deletePopupConfirm(message, () => 
        {
            const idToDelete = feature.properties['@id'];
            this.deleteParking(idToDelete);
        });
    }

    // Crea popup di conferma personalizzato
    deletePopupConfirm(message, onConfirm) 
    {
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

        const cancelBtn = modal.querySelector('.btn-cancel');
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
        
        // Chiude cliccando sull'overlay
        modal.querySelector('.modal-overlay').onclick = (e) => 
        {
            if (e.target === e.currentTarget) 
            {
                document.body.removeChild(modal);
            }
        };

        document.body.appendChild(modal);
    }

    // Mostra popup di successo
    showSuccessPopup(message)
    {
        const modal = document.createElement('div');
        modal.className = 'custom-success-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-message">${message}</div>
                    <button class="btn-close">Close</button>
                </div>
            </div>`;

        document.body.appendChild(modal);

        modal.querySelector('.btn-close').onclick = () => 
        {
            document.body.removeChild(modal);
            window.location.href = 'index.html';
        };

        modal.querySelector('.modal-overlay').onclick = (e) => 
        {
            if (e.target === e.currentTarget) 
            {
                document.body.removeChild(modal);
            }
        };
    }

    // Elimina un parcheggio tramite API
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
            
            this.showSuccessPopup('Parking successfully deleted!');
            this.loadParkingData();
        } 
        catch (error) 
        {
            showError("Error during deleting parking");
        }
    }

    // Gestisce la selezione di coordinate sulla mappa
    selectLocation(e) 
    {
        this.selectedCoordinates.lat = e.latlng.lat;
        this.selectedCoordinates.lng = e.latlng.lng;

        // Rimuove marker precedente
        if (this.selectedMarker != null) 
        {
            this.map.removeLayer(this.selectedMarker);
        }

        // Aggiunge nuovo marker personalizzato
        this.selectedMarker = L.marker([this.selectedCoordinates.lat, this.selectedCoordinates.lng], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: '<div style="background: #007A33; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 15px rgba(0, 122, 51, 0.4);"></div>',
                iconSize: [26, 26],
                iconAnchor: [13, 13]
            })
        }).addTo(this.map);
    }

    // Restituisce le coordinate selezionate
    getSelectedCoordinates() 
    {
        return this.selectedCoordinates;
    }

    // Geolocalizza l'utente
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
                    .bindPopup(`<span>You are in this area!</span>`, { closeButton: false })
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
                showError("Unable to get your location.");
            });
        } 
        else
        {
            showError("Geolocation is not supported by your browser.");
        }
    }

    // Aggiorna la vista della mappa con filtri
    async updateMapView() 
    {
        try 
        {
            this.mode = this.getMode();
            this.filters = this.getFilters(); 

            await this.setCityViewIfCityInURL();
            await this.loadParkingData();
        } 
        catch (error) 
        {
            console.error('Errore durante l\'aggiornamento della mappa:', error);
            showError('Errore durante l\'aggiornamento della visualizzazione della mappa.');
        }
    }

    // Crea il contenuto del popup informativo
    createParkingPopUp(properties, coordinates) 
    {
        const name = properties.name || 'Not specified';
        const access = properties.access || 'n/a';
        const surface = properties.surface || 'n/a';
        let feeText, feeIcon, feeClass;
       
        // Mapping icone per tipi di accesso
        const accessIcons = {
            'yes': '🚗',
            'public': '🚗',
            'private': '🔒',
            'customers': '🛍️',
            'permissive': '✅',
            'destination': '🎯',
            'no': '⛔'
        };
        
        // Mapping icone per tipi di superficie
        const surfaceIcons = {
            'paved': '🏗️',
            'asphalt': '🛣️',
            'concrete': '🏢',
            'gravel': '🪨',
            'grass': '🌱',
            'dirt': '🌍',
            'paving_stones': '🧱'
        };
        
        // Labels in inglese per accesso
        const accessLabels = {
            'yes': 'Public',
            'public': 'Public',
            'private': 'Private',
            'customers': 'Customers only',
            'permissive': 'Permissive',
            'destination': 'Destination',
            'no': 'Private',
            'n/a': 'Not specified'
        };
        
        // Labels in inglese per superficie
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
        
        // Gestione informazioni tariffe
        if (properties.fee === 'no') 
        {
            feeText = 'Free';
            feeIcon = '💰';
            feeClass = 'free';
        } 
        else if (properties.fee === 'yes') 
        {
            feeText = 'Paid';
            feeIcon = '💳';
            feeClass = 'paid';
        } 
        else 
        {
            feeText = 'Not specified';
            feeIcon = '?';
            feeClass = 'unknown';
        }
        
        const accessLabel = accessLabels[access.toLowerCase()] || access;
        const surfaceLabel = surfaceLabels[surface.toLowerCase()] || surface;
        
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

    // Genera URL per Google Maps
    generateGoogleMapsUrl(coordinates) 
    {
        const lat = coordinates[1];
        const lng = coordinates[0];

        const baseUrl = 'https://www.google.com/maps/dir/';
        const destination = `${lat},${lng}`;

        return `${baseUrl}/${destination}`;
    }
}

// Inizializzazione e setup globale
const parkingMapInstance = new ParkingMap();

if (parkingMapInstance.getMode() === 'select' || parkingMapInstance.getMode() === 'edit') 
{
    window.parkingMap = parkingMapInstance;
}

// Event listeners per aggiornamenti mappa
window.addEventListener("search-city", () => 
{
    parkingMapInstance.setCityView(); 
});

window.addEventListener("filter-map-view", () => 
{
    parkingMapInstance.updateMapView(); 
});

// Geolocalizzazione utente
document.getElementById('geoBtn').addEventListener('click', () => 
{ 
    parkingMapInstance.locateUser(); 
});