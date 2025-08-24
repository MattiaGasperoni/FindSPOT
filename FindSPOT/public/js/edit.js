/*
 * Gestisce la modalità di modifica dei parcheggi
 */

// Stato globale
let selectedFeature = null;
let isProcessingRequest = false;

// Inizializza la modalità edit
function initializeEditMode() 
{
    // Carica dinamicamente il modulo mappa
    const script = document.createElement('script');
    script.src = './js/map.js';
    document.body.appendChild(script);

    // Imposta parametro URL per modalità edit
    if (!window.location.search.includes('mode=edit')) 
    {
        const url = new URL(window.location.href);
        url.searchParams.set('mode', 'edit');
        window.history.replaceState({}, '', url.toString());
    }
}

// Gestisce la visibilità degli elementi UI
function toggleUIElements(showForm) 
{
    const elementsToHide = [
        document.getElementById('main-title'),
        document.getElementById('map-container'),
        document.querySelector('.search-bar'),
        document.querySelector('.filter-choices'),
        document.querySelector('.legend-box')
    ];

    elementsToHide.forEach(element => 
    {
        if (element) 
        {
            element.style.display = showForm ? 'none' : '';
        }
    });

    // Gestione speciale per il container mappa
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) 
    {
        mapContainer.style.display = showForm ? 'none' : 'block';
    }
}

// Mostra il form di modifica
function showEditForm() 
{
    toggleUIElements(true);
    const editForm = document.getElementById('editForm');
    if (editForm) 
    {
        editForm.style.display = 'block';
    }
}

// Nasconde il form e resetta lo stato
function hideEditForm() 
{
    const editForm = document.getElementById('editForm');
    if (editForm)
    {
        editForm.style.display = 'none';
        editForm.reset();
    }
    toggleUIElements(false);
    selectedFeature = null;
}

// Cerca un parcheggio per ID nei layer della mappa
function findParkingById(id) 
{
    if (!window.parkingMap || !window.parkingMap.parkingLayer) 
    {
        console.error('ParkingMap non è disponibile');
        return null;
    }

    let foundFeature = null;
    
    window.parkingMap.parkingLayer.eachLayer(layer => 
    {
        if (layer.feature.properties['@id'] === id) 
        {
            foundFeature = layer.feature;
        }
    });

    return foundFeature;
}

// Popola i campi del form con i dati del parcheggio
function populateFormFields(feature) 
{
    const properties = feature.properties;
    
    const fieldMappings = {
        'parkingId': properties['@id'] || '',
        'name': properties.name || '',
        'access': properties.access || '',
        'fee': properties.fee || '',
        'surfaceType': properties.surface || ''
    };

    Object.entries(fieldMappings).forEach(([fieldId, value]) => 
    {
        const field = document.getElementById(fieldId);
        if (field) 
        {
            field.value = value;
        }
    });
}

// Gestisce la selezione di un parcheggio per la modifica
window.editParking = function(id) 
{
    const foundFeature = findParkingById(id);
    
    if (!foundFeature) 
    {
        console.error('Parcheggio non trovato con ID:', id);
        return;
    }

    selectedFeature = foundFeature;
    showEditForm();
    populateFormFields(foundFeature);
};

// Annulla la modifica corrente
window.cancelEdit = function() 
{
    hideEditForm();
};

// Raccoglie e valida i dati del form
function collectFormData() 
{
    if (!selectedFeature) 
    {
        showError('Seleziona un parcheggio prima');
        return null;
    }

    const formData = {
        name: document.getElementById('name')?.value.trim() || '',
        access: document.getElementById('access')?.value || '',
        fee: document.getElementById('fee')?.value || '',
        surface: document.getElementById('surfaceType')?.value || ''
    };

    return formData;
}

// Invia i dati aggiornati al server
function updateParkingOnServer(id, data) 
{
    return fetch(`/api/parcheggi/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

// Mostra popup di successo
function showSuccessPopup(message = 'Parking spot updated successfully!') 
{
    const popup = document.getElementById('success-edit-popup');
    if (popup) 
    {
        const messageElement = popup.querySelector('p');
        if (messageElement) 
        {
            messageElement.textContent = message;
        }
        popup.classList.remove('hidden');
    }
}

// Gestisce il submit del form
function handleFormSubmit(e) 
{
    e.preventDefault();
    
    if (isProcessingRequest) 
    {
        return;
    }

    const formData = collectFormData();
    if (!formData) return;

    const parkingId = document.getElementById('parkingId')?.value;
    if (!parkingId) 
    {
        showError('ID parcheggio non trovato');
        return;
    }

    isProcessingRequest = true;

    updateParkingOnServer(parkingId, formData)
        .then(response => 
        {
            if (!response.ok) 
            {
                throw new Error('Errore durante l\'aggiornamento del parcheggio');
            }
            return response.json();
        })
        .then(data => 
        {            
            document.getElementById('editForm')?.reset();
            showSuccessPopup();
        })
        .catch(error => 
        {
            console.error('Errore durante l\'aggiornamento:', error);
            showError('Errore durante l\'aggiornamento del parcheggio');
        })
        .finally(() => 
        {
            isProcessingRequest = false;
        });
}

// Chiude il popup e reindirizza alla home
function handleClosePopup() 
{
    const popup = document.getElementById('success-edit-popup');
    if (popup) 
    {
        popup.classList.add('hidden');
    }
    
    window.location.href = 'index.html';
}

// Rimuove event listeners esistenti
function removeExistingListeners() 
{
    const editForm = document.getElementById('editForm');
    const closeBtn = document.getElementById('close-popup-btn');

    if (editForm) 
    {
        editForm.removeEventListener('submit', handleFormSubmit);
    }
    if (closeBtn) 
    {
        closeBtn.removeEventListener('click', handleClosePopup);
    }
}

// Aggiunge gli event listeners
function addEventListeners() 
{
    const editForm = document.getElementById('editForm');
    const closeBtn = document.getElementById('close-popup-btn');

    if (editForm) 
    {
        editForm.addEventListener('submit', handleFormSubmit);
    }
    if (closeBtn) 
    {
        closeBtn.addEventListener('click', handleClosePopup);
    }
}

// Inizializza gli event listeners
function initializeEventListeners() 
{
    removeExistingListeners();
    addEventListeners();
}

// Avvio del modulo
initializeEditMode();
initializeEventListeners();