// Recupera il riferimento al form e al div per i messaggi
const form = document.getElementById('addParkingForm');
const messageDiv = document.getElementById('message');

// Aggiunge un listener per l'invio del form
form.addEventListener('submit', e => {
  e.preventDefault(); // Evita il comportamento di default (invio pagina)

  // Estrae i dati dal form
  const formData = new FormData(form);
  let lat = formData.get('lat').replace(',', '.'); // Converte eventuale virgola in punto
  let lon = formData.get('lon').replace(',', '.');

  // Converte le coordinate in numeri float
  lat = parseFloat(lat);
  lon = parseFloat(lon);

  // Validazione: controlla che siano numeri validi
  if (isNaN(lat) || isNaN(lon)) {
    messageDiv.textContent = "Inserisci coordinate valide (numeri).";
    return;
  }

  // Validazione: controlla che siano entro i limiti geografici reali
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    messageDiv.textContent = "Coordinate fuori dai limiti (lat: -90÷90, lon: -180÷180).";
    return;
  }

  // Crea l'oggetto GeoJSON da inviare al server
  const feature = {
    type: "Feature",
    properties: {
      name: formData.get('name'),         // Nome del parcheggio
      access: formData.get('access'),     // Accessibilità
      fee: formData.get('fee'),           // Pagamento
      surface: formData.get('surface'),   // Superficie
      amenity: "parking"                  // Specifica che è un parcheggio
    },
    geometry: {
      type: "Point",
      coordinates: [lat, lon]             // Coordinate [latitudine, longitudine]
    }
  };

  // Invia la richiesta POST al server per aggiungere il parcheggio
  fetch('/api/parcheggi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feature)
  })
  .then(res => {
    if (!res.ok) throw new Error('Errore durante l\'aggiunta'); // Gestione errori HTTP
    return res.text(); // Attende la risposta come testo
  })
  .then(text => {
    // Mostra messaggio di successo e resetta il form
    messageDiv.textContent = text;
    form.reset();
  })
  .catch(err => {
    // Mostra eventuali errori (es. di rete o validazione)
    messageDiv.textContent = err.message;
  });
});
