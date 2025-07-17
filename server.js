const express = require('express');
const fs = require('fs');
const path = require('path');

// =============================================
// CONFIGURAZIONE SERVER
// =============================================

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'parcheggi.geojson');

// =============================================
// MIDDLEWARE
// =============================================

// Serve i file statici dalla cartella 'public'
app.use(express.static('public'));

// Middleware per parsare il JSON nel body delle richieste
app.use(express.json());

// =============================================
// FUNZIONI DI UTILITÀ
// =============================================

/**
 * Legge il file GeoJSON e restituisce i dati parsati
 * @param {Function} callback - Callback con (err, geojson)
 */
function readGeoJSONFile(callback) {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      return callback(err, null);
    }

    try {
      const geojson = JSON.parse(data);
      callback(null, geojson);
    } catch (parseError) {
      callback(parseError, null);
    }
  });
}

/**
 * Scrive i dati GeoJSON nel file
 * @param {Object} geojson - Oggetto GeoJSON da salvare
 * @param {Function} callback - Callback con (err)
 */
function writeGeoJSONFile(geojson, callback) {
  const jsonString = JSON.stringify(geojson, null, 2);
  fs.writeFile(DATA_FILE, jsonString, callback);
}

/**
 * Genera un ID univoco basato sulle coordinate
 * @param {Array} coordinates - Array [longitude, latitude]
 * @returns {string} ID univoco nel formato "lon_lat"
 */
function generateParkingId(coordinates) {
  const [lon, lat] = coordinates;
  // Arrotonda a 6 decimali per evitare problemi di precisione
  const roundedLon = Number(lon).toFixed(6);
  const roundedLat = Number(lat).toFixed(6);
  return `${roundedLon}_${roundedLat}`;
}

/**
 * Valida una feature GeoJSON per un parcheggio
 * @param {Object} feature - Feature GeoJSON da validare
 * @returns {Object} { isValid: boolean, error: string }
 */
function validateParkingFeature(feature) {
  if (!feature.geometry || !feature.geometry.coordinates) {
    return { 
      isValid: false, 
      error: 'Feature con coordinate mancanti' 
    };
  }

  const coords = feature.geometry.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    return { 
      isValid: false, 
      error: 'Coordinate non valide' 
    };
  }

  return { isValid: true };
}

/** * Crea un errore con messaggio e status
 * @param {string} message - Messaggio di errore
 * @param {number} [status=500] - Codice di stato HTTP
 * @returns {Error} Errore con messaggio e status
 */
function creaErrore(message, status = 500) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// =============================================
// ENDPOINTS API
// =============================================

/**
 * GET /api/parcheggi
 * Restituisce i parcheggi dal file GeoJSON 
 */
app.get('/api/parcheggi', (req, res, next) => 
{
  readGeoJSONFile((err, geojson) => 
  {
    if (err) return next(creaErrore('Errore caricamento dati', 500));

    const filters = req.query;

    const filtered = geojson.features.filter(feature => 
    {
      // Se non ci sono filtri, restituisce tutte le feature
      return Object.entries(filters).every(([key, val]) => 
      {
        const props = feature.properties;

        return (
          Object.prototype.hasOwnProperty.call(props, key) &&
          String(props[key]).toLowerCase().trim() === String(val).toLowerCase().trim()
        );
      });
    });

    res.json({ type: geojson.type, features: filtered });
  });
});

/**
 * POST /api/parcheggi
 * Aggiunge un nuovo parcheggio al file GeoJSON
 */
app.post('/api/parcheggi', (req, res) => 
{
  const newFeature = req.body;

  // Inizializza le proprietà se non esistono
  if (!newFeature.properties) {
    newFeature.properties = {};
  }

  // Valida la feature
  const validation = validateParkingFeature(newFeature);
  if (!validation.isValid) 
  {
    return next(creaErrore(validation.error, 400));
  }

  // Genera un ID univoco basato sulle coordinate
  const parkingId = generateParkingId(newFeature.geometry.coordinates);
  newFeature.properties['@id'] = parkingId;

  // Legge il file GeoJSON esistente
  readGeoJSONFile((err, geojson) => 
  {
    if (err) 
    {
      console.error('Errore nella lettura del file GeoJSON:', err);
      return next(creaErrore('Errore nel leggere i dati esistenti', 500));
    }

    console.log('Aggiungendo parcheggio con ID:', parkingId);

    // Aggiunge la nuova feature
    geojson.features.push(newFeature);

    // Salva il file aggiornato
    writeGeoJSONFile(geojson, (writeErr) => 
    {
      if (writeErr) 
      {
        console.error('Errore nella scrittura del file GeoJSON:', writeErr);
        return next(creaErrore('Errore nel salvare il nuovo parcheggio', 500));
      }

      // Successo: restituisce conferma con l'ID generato
      res.status(201).json(
      { 
        message: 'Parcheggio aggiunto con successo', 
        id: parkingId 
      });
    });
  });
});

/**
 * PUT /api/parcheggi/:id
 * Aggiorna le proprietà di un parcheggio esistente
 */
app.put('/api/parcheggi/:id', (req, res) => 
{
  const idToUpdate = req.params.id;
  const updatedProps = req.body;

  // Legge il file GeoJSON
  readGeoJSONFile((err, geojson) => 
  {
    if (err) 
    {
      console.error('Errore nella lettura del file GeoJSON:', err);
      return next(creaErrore('Errore nel leggere i dati', 500));
    }

    // Trova la feature da aggiornare
    const feature = geojson.features.find(f => f.properties['@id'] === idToUpdate);
    
    if (!feature) 
    {
      return next(creaErrore('Parcheggio non trovato', 404));
    }

    // Aggiorna solo le proprietà consentite (whitelist approach)
    const allowedProperties = ['name', 'access', 'fee', 'surface'];
    
    allowedProperties.forEach(prop => 
    {
      if (updatedProps[prop] !== undefined)
      {
        feature.properties[prop] = updatedProps[prop];
      }
    });

    console.log('Aggiornando parcheggio con ID:', idToUpdate);

    // Salva le modifiche
    writeGeoJSONFile(geojson, (writeErr) => 
    {
      if (writeErr) 
      {
        console.error('Errore nella scrittura del file GeoJSON:', writeErr);
        return next(creaErrore('Errore nel salvare le modifiche', 500));
      }

      res.json(
      { 
        message: 'Parcheggio aggiornato con successo',
        id: idToUpdate
      });
    });
  });
});

/**
 * DELETE /api/parcheggi/:id
 * Rimuove un parcheggio dal file GeoJSON
 */
app.delete('/api/parcheggi/:id', (req, res) => 
{
  const idToDelete = req.params.id;

  // Legge il file GeoJSON
  readGeoJSONFile((err, geojson) => 
  {
    if (err) 
    {
      console.error('Errore nella lettura del file GeoJSON:', err);
      return next(creaErrore('Errore nel leggere i dati', 500));
    }

    // Conta le feature prima della rimozione
    const featuresBefore = geojson.features.length;
    
    // Filtra rimuovendo la feature con l'ID specificato
    geojson.features = geojson.features.filter(f => f.properties['@id'] !== idToDelete);

    // Controlla se è stata effettivamente rimossa una feature
    if (geojson.features.length === featuresBefore) 
    {
      return next(creaErrore('Parcheggio non trovato', 404));
    }

    console.log('Rimuovendo parcheggio con ID:', idToDelete);

    // Salva il file aggiornato
    writeGeoJSONFile(geojson, (writeErr) => 
    {
      if (writeErr) 
      {
        console.error('Errore nella scrittura del file GeoJSON:', writeErr);
        return next(creaErrore('Errore nel salvare le modifiche', 500));
      }

      res.json(
      { 
        message: 'Parcheggio eliminato con successo',
        id: idToDelete
      });
    });
  });
});

// =============================================
// GESTIONE ERRORI GLOBALE
// =============================================

/**
 * Middleware per gestire errori non catturati
 */
app.use((err, req, res, next) => 
{
  console.error(`[${new Date().toISOString()}] ERRORE: ${err.message}`);
  res.status(err.status || 500).json(
  {
    error: err.message || 'Errore interno del server',
  });
});

/**
 * Middleware per gestire rotte non trovate
 */
app.use((req, res) => {
  res.status(404).json(
  {
    error: 'Endpoint non trovato',
    path: req.originalUrl

  });
});

// =============================================
// AVVIO SERVER
// =============================================

/**
 * Avvia il server Express
 */
app.listen(PORT, () => {
  console.log(`\nServer parcheggi avviato su http://localhost:${PORT}\n`);
  console.log(`\nFile dati: ${DATA_FILE}\n`);
  console.log('\nAPI disponibili:');
  console.log('   GET    /api/parcheggi     - Lista tutti i parcheggi o filtra con query (es. ?fee=yes&access=yes)');
  console.log('   POST   /api/parcheggi     - Aggiunge un nuovo parcheggio');
  console.log('   PUT    /api/parcheggi/:id - Aggiorna un parcheggio');
  console.log('   DELETE /api/parcheggi/:id - Elimina un parcheggio');
});

// =============================================
// GESTIONE CHIUSURA APPLICAZIONE
// =============================================

/**
 * Gestisce la chiusura pulita dell'applicazione
 */
function shutdown(signal) 
{
  console.log(`\n🛑 Segnale ricevuto: ${signal} - chiusura server`);
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
