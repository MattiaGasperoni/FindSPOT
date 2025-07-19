// Recupera il riferimento al form e al div per i messaggi
const form = document.getElementById('addParkingForm');
const messageDiv = document.getElementById('message');

// Aggiunge un listener per l'invio del form
form.addEventListener('submit', e => 
{
  // Previene l'invio del form in modo tradizionale
  e.preventDefault();

  // Estrae i dati dal form
  const formData = new FormData(form);

  // Converte eventuale virgola in punto
  let lat = formData.get('lat').replace(',', '.'); 
  let lon = formData.get('lon').replace(',', '.');
  // Converte le coordinate in numeri float
  lat = parseFloat(lat);
  lon = parseFloat(lon);

  // Validazione: controlla che siano numeri validi
  if (isNaN(lat) || isNaN(lon)) 
  {
    messageDiv.textContent = "Inserisci coordinate valide (numeri).";
    return;
  }

  // Validazione: controlla che siano entro i limiti geografici reali
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) 
  {
    messageDiv.textContent = "Coordinate fuori dai limiti (lat: -90÷90, lon: -180÷180).";
    return;
  }

  // Crea l'oggetto GeoJSON da inviare al server
  const feature = 
  {
    type: "Feature",
    properties: 
    {
      name:    formData.get('name'),      // Nome del parcheggio
      access:  formData.get('access'),    // Accessibilità
      fee:     formData.get('fee'),       // Pagamento
      surface: formData.get('surface'),   // Superficie
      amenity: "parking"                  // Specifica che è un parcheggio
    },
    geometry: 
    {
      type: "Point",                      // Tipo di parcheggio
      coordinates: [lon, lat]             // Coordinate [longitudine, latitudine]
    }
  };

  // Invia la richiesta POST al server per aggiungere il parcheggio
  fetch('/api/parcheggi', 
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feature)
  })
  .then(res => 
  {
    // Gestione errori HTTP
    if (!res.ok) throw new Error('Errore durante l\'aggiunta'); 
    // Risposta JSON
    return res.json();
  })
  .then(data => 
  {
    // Mostra messaggio di successo
    messageDiv.textContent = data.message || 'Parcheggio aggiunto con successo';
    // Resetta il form
    form.reset();
  })
  .catch(err => 
  {
    // Mostra eventuali errori di rete o validazione
    messageDiv.textContent = err.message;
  });
});