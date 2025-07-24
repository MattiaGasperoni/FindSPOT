// Forza modalità di modifica
const script = document.createElement('script');
script.src = './js/map.js';
document.body.appendChild(script);

// Appende ?mode=edit all'URL (solo per farlo leggere nel JS)
if (!window.location.search.includes('mode=edit')) 
{
    console.log('La Mappa entra in modalità modifica');
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'edit');
    window.history.replaceState({}, '', url.toString());
}


let selectedFeature = null;



// Funzione per mostrare/nascondere elementi quando appare il form
function toggleUIElements(showForm) {
    const elementsToHide = [
    document.getElementById('main-title'),
    document.getElementById('map-container'),
    document.querySelector('.search-bar'),
    document.querySelector('.filter-choices'),
    document.querySelector('.legend-box')
    ];

    elementsToHide.forEach(element => {
    if (element) {
        element.style.display = showForm ? 'none' : '';
    }
    });

    // Per il map-container dobbiamo gestire il display diversamente
    if (showForm) {
    document.getElementById('map-container').style.display = 'none';
    } else {
    document.getElementById('map-container').style.display = 'block';
    }
}

window.editParking = function(id) 
{
  // Controllo per verificare l'esistenza della mappa e dei layer
  if (!window.parkingMap || !window.parkingMap.parkingLayer) 
  {
    console.err('ParkingMap non è disponibile');
    return;
  }

  // Cerca il parcheggio selezionato all'interno dei layer
  let found = null;
  window.parkingMap.parkingLayer.eachLayer(layer => 
  {
    if (layer.feature.properties['@id'] === id) 
    {
      found = layer.feature;
    }
  });

  if (!found) {
    console.err('Parcheggio non trovato');
    return;
  }

  // Salva la feature selezionata
  selectedFeature = found;

  // Mostra il form e nascondi gli altri elementi UI
  toggleUIElements(true);
  document.getElementById('editForm').style.display = 'block';

  // Compila i campi del form
  document.getElementById('parkingId').value = found.properties['@id'] || '';
  document.getElementById('name').value = found.properties.name || '';
  document.getElementById('access').value = found.properties.access || '';
  document.getElementById('fee').value = found.properties.fee || '';
  document.getElementById('surface').value = found.properties.surface || '';
  document.getElementById('message').textContent = '';
};


window.cancelEdit = function() 
{
    // Nascondi il form e mostra di nuovo tutti gli elementi UI
    document.getElementById('editForm').style.display = 'none';
    toggleUIElements(false);
    
    // Reset del form
    document.getElementById('editForm').reset();
    document.getElementById('message').textContent = '';
    selectedFeature = null;
};

document.getElementById('editForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!selectedFeature) {
    alert('Seleziona un parcheggio prima');
    return;
    }
    const id = document.getElementById('parkingId').value;
    const updatedData = {
    name: document.getElementById('name').value.trim(),
    access: document.getElementById('access').value,
    fee: document.getElementById('fee').value,
    surface: document.getElementById('surface').value.trim(),
    };

    fetch(`/api/parcheggi/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedData)
    })
    .then(res => {
    if (!res.ok) throw new Error('Errore durante l\'aggiornamento');
    return res.json();
    })
    .then(data => {
    const messageEl = document.getElementById('message');
    messageEl.style.color = 'green';
    messageEl.style.background = '#d4edda';
    messageEl.style.border = '1px solid #c3e6cb';
    messageEl.textContent = '✅ ' + (data.message || 'Parcheggio aggiornato con successo!');
    
    // Ricarica i parcheggi sulla mappa
    loadParkings();
    
    // Nascondi form dopo salvataggio e mostra UI
    setTimeout(() => {
        cancelEdit();
    }, 2000);
    })
    .catch(err => {
    const messageEl = document.getElementById('message');
    messageEl.style.color = 'red';
    messageEl.style.background = '#f8d7da';
    messageEl.style.border = '1px solid #f5c6cb';
    messageEl.textContent = '❌ ' + err.message;
    });
});