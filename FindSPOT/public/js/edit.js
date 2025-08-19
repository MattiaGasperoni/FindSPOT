/**
 * PARKING EDIT MANAGER
 * Gestisce la modalità di modifica dei parcheggi
 */

// ========================================
// CONFIGURAZIONE INIZIALE E STATO GLOBALE
// ========================================

// Variabile globale per tracciare il parcheggio selezionato
let selectedFeature = null;

// Flag per prevenire multiple chiamate API simultanee
let isProcessingRequest = false;

// ========================================
// INIZIALIZZAZIONE MODALITÀ EDIT
// ========================================

/**
 * Inizializza la modalità di modifica
 * Carica il file map.js e imposta l'URL con parametro mode=edit
 */
function initializeEditMode() 
{
    // Carica dinamicamente il file map.js
    const script = document.createElement('script');
    script.src = './js/map.js';
    document.body.appendChild(script);

    // Aggiunge il parametro mode=edit all'URL se non presente
    if (!window.location.search.includes('mode=edit')) 
    {
        const url = new URL(window.location.href);
        url.searchParams.set('mode', 'edit');
        window.history.replaceState({}, '', url.toString());
    }
}

// ========================================
// GESTIONE UI E VISIBILITÀ ELEMENTI
// ========================================

/**
 * Gestisce la visibilità degli elementi UI quando si mostra/nasconde il form di modifica
 * @param {boolean} showForm - true per mostrare il form (nascondere altri elementi), false per il contrario
 */
function toggleUIElements(showForm) 
{
    // Lista degli elementi da nascondere quando appare il form
    const elementsToHide = [
        document.getElementById('main-title'),
        document.getElementById('map-container'),
        document.querySelector('.search-bar'),
        document.querySelector('.filter-choices'),
        document.querySelector('.legend-box')
    ];

    // Itera su tutti gli elementi e cambia la visibilità
    elementsToHide.forEach(element => 
    {
      if (element) 
      {
        element.style.display = showForm ? 'none' : '';
      }
    });

    // Gestione speciale per il map-container (deve essere sempre block quando visibile)
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) 
    {
        mapContainer.style.display = showForm ? 'none' : 'block';
    }
}

/**
 * Mostra il form di modifica e nasconde gli altri elementi UI
 */
function showEditForm() 
{
    toggleUIElements(true);
    const editForm = document.getElementById('editForm');
    if (editForm) 
    {
        editForm.style.display = 'block';
    }
}

/**
 * Nasconde il form di modifica e mostra gli altri elementi UI
 */
function hideEditForm() 
{
    const editForm = document.getElementById('editForm');
    if (editForm)
    {
      editForm.style.display = 'none';
      editForm.reset(); // Pulisce i campi del form
    }
    toggleUIElements(false);
    selectedFeature = null; // Reset della selezione
}

// ========================================
// GESTIONE MODIFICA PARCHEGGI
// ========================================

/**
 * Trova un parcheggio nei layer della mappa tramite ID
 * @param {string} id - ID del parcheggio da cercare
 * @returns {Object|null} - Feature del parcheggio trovato o null
 */
function findParkingById(id) {
    // Verifica che la mappa e i layer siano disponibili
    if (!window.parkingMap || !window.parkingMap.parkingLayer) 
    {
      console.error('ParkingMap non è disponibile');
      return null;
    }

    let foundFeature = null;
    
    // Cerca il parcheggio nel layer
    window.parkingMap.parkingLayer.eachLayer(layer => 
    {
      if (layer.feature.properties['@id'] === id) 
      {
        foundFeature = layer.feature;
      }
    });

    return foundFeature;
}

/**
 * Popola i campi del form con i dati del parcheggio selezionato
 * @param {Object} feature - Feature del parcheggio
 */
function populateFormFields(feature) {
    const properties = feature.properties;
    
    // Mapping dei campi form con le proprietà del parcheggio
    const fieldMappings = {
        'parkingId': properties['@id'] || '',
        'name': properties.name || '',
        'access': properties.access || '',
        'fee': properties.fee || '',
        'surfaceType': properties.surface || ''
    };

    // Popola tutti i campi
    Object.entries(fieldMappings).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
        }
    });
}

/**
 * Funzione globale chiamata quando si clicca sul popup di un parcheggio in modalità edit
 * @param {string} id - ID del parcheggio da modificare
 */
window.editParking = function(id) {
    // Cerca il parcheggio selezionato
    const foundFeature = findParkingById(id);
    
    if (!foundFeature) {
        console.error('Parcheggio non trovato con ID:', id);
        return;
    }

    // Salva la feature selezionata globalmente
    selectedFeature = foundFeature;

    // Mostra il form e popola i campi
    showEditForm();
    populateFormFields(foundFeature);
};

/**
 * Funzione globale per annullare la modifica
 * Nasconde il form e resetta tutto lo stato
 */
window.cancelEdit = function() {
    hideEditForm();
};

// ========================================
// GESTIONE RICHIESTE API E FORM
// ========================================

/**
 * Raccoglie e valida i dati del form
 * @returns {Object|null} - Dati validati o null se non validi
 */
function collectFormData() {
    if (!selectedFeature) {
        showError('Seleziona un parcheggio prima');
        return null;
    }

    // Raccoglie i dati dai campi del form
    const formData = {
        name: document.getElementById('name')?.value.trim() || '',
        access: document.getElementById('access')?.value || '',
        fee: document.getElementById('fee')?.value || '',
        surface: document.getElementById('surfaceType')?.value || ''
    };

    return formData;
}

/**
 * Invia la richiesta di aggiornamento al server
 * @param {string} id - ID del parcheggio
 * @param {Object} data - Dati da aggiornare
 * @returns {Promise} - Promise della richiesta fetch
 */
function updateParkingOnServer(id, data) {
    return fetch(`/api/parcheggi/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

/**
 * Mostra il popup di successo
 * @param {string} message - Messaggio da mostrare
 */
function showSuccessPopup(message = 'Parking spot updated successfully!') {
    const popup = document.getElementById('success-edit-popup');
    if (popup) {
        const messageElement = popup.querySelector('p');
        if (messageElement) {
            messageElement.textContent = message;
        }
        popup.classList.remove('hidden');
    }
}

/**
 * Gestisce il submit del form di modifica
 * @param {Event} e - Evento di submit
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Previene multiple chiamate simultanee
    if (isProcessingRequest) {
        return;
    }

    // Raccoglie e valida i dati del form
    const formData = collectFormData();
    if (!formData) return;

    // Ottiene l'ID del parcheggio
    const parkingId = document.getElementById('parkingId')?.value;
    if (!parkingId) {
        showError('ID parcheggio non trovato');
        return;
    }

    // Imposta il flag di processing
    isProcessingRequest = true;

    // Invia la richiesta di aggiornamento
    updateParkingOnServer(parkingId, formData)
        .then(response => {
            if (!response.ok) {
                throw new Error('Errore durante l\'aggiornamento del parcheggio');
            }
            return response.json();
        })
        .then(data => {            
            // Reset del form e mostra popup di successo
            document.getElementById('editForm')?.reset();
            showSuccessPopup();
        })
        .catch(error => {
            console.error('Errore durante l\'aggiornamento:', error);
            showError('Errore durante l\'aggiornamento del parcheggio');
        })
        .finally(() => {
            // Reset del flag di processing
            isProcessingRequest = false;
        });
}

/**
 * Gestisce la chiusura del popup di successo e reindirizza alla home
 */
function handleClosePopup() {
    // Nasconde il popup
    const popup = document.getElementById('success-edit-popup');
    if (popup) {
        popup.classList.add('hidden');
    }
    
    // Reindirizza alla pagina principale
    window.location.href = 'index.html';
}

// ========================================
// INIZIALIZZAZIONE EVENT LISTENERS
// ========================================

/**
 * Rimuove event listeners esistenti per evitare duplicati
 */
function removeExistingListeners() {
    const editForm = document.getElementById('editForm');
    const closeBtn = document.getElementById('close-popup-btn');

    if (editForm) {
        editForm.removeEventListener('submit', handleFormSubmit);
    }
    if (closeBtn) {
        closeBtn.removeEventListener('click', handleClosePopup);
    }
}

/**
 * Aggiunge gli event listeners necessari
 */
function addEventListeners() {
    const editForm = document.getElementById('editForm');
    const closeBtn = document.getElementById('close-popup-btn');

    if (editForm) {
        editForm.addEventListener('submit', handleFormSubmit);
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', handleClosePopup);
    }
}

/**
 * Inizializza tutti gli event listeners
 * Rimuove quelli esistenti e aggiunge quelli nuovi per evitare duplicati
 */
function initializeEventListeners() {
    removeExistingListeners();
    addEventListeners();
}

// ========================================
// AVVIO APPLICAZIONE
// ========================================

// Inizializza la modalità di modifica
initializeEditMode();

// Inizializza gli event listeners
initializeEventListeners();