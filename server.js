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
function validateParkingFeature(feature) 
{
  if (!feature.geometry || !feature.geometry.coordinates) 
  {
    return { 
      isValid: false, 
      error: 'Feature con coordinate mancanti' 
    };
  }

  const coords = feature.geometry.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) 
  {
    return { 
      isValid: false, 
      error: 'Coordinate non valide' 
    };
  }

  const [lng, lat] = coords;
  if (typeof lng !== 'number' || typeof lat !== 'number') 
  {
    return {
      isValid: false,
      error: 'Le coordinate devono essere numeri'
    };
  }

  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) 
  {
    return {
      isValid: false,
      error: 'Coordinate fuori range valido'
    };
  }

  return { isValid: true };
}
/** * Crea un errore con messaggio e status
 * @param {string} message - Messaggio di errore
 * @param {number} [status=500] - Codice di stato HTTP
 * @returns {Error} Errore con messaggio e status
 */
function creaErrore(message, status = 500) 
{
  const err = new Error(message);
  err.status = status;
  err.statusCode = status;
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
    if (err) 
    {
      // 500 - Internal Server Error (errore I/O del server)
      return next(creaErrore('Errore caricamento dati', 500));
    }

    if (!geojson || !Array.isArray(geojson.features)) 
    {
      // 500 - Internal Server Error (problema con i dati del server)
      return next(creaErrore('Formato GeoJSON non valido', 500));
    }

    const filters = req.query;
    const allProperties = geojson.features.flatMap(f => Object.keys(f.properties || {}));
    const uniquePropertyKeys = [...new Set(allProperties)];

    const unknownKeys = Object.keys(filters).filter(key => !uniquePropertyKeys.includes(key));

    if (unknownKeys.length > 0) 
    {
      // 400 - Bad Request (parametri query invalidi)
      return next(creaErrore(`Filtri non validi: ${unknownKeys.join(', ')}`, 400));
    }

    const filtered = geojson.features.filter(feature => 
    {
      return Object.entries(filters).every(([key, val]) => 
      {
        const props = feature.properties || {};
        return (Object.prototype.hasOwnProperty.call(props, key) && String(props[key]).toLowerCase().trim() === String(val).toLowerCase().trim());
      });
    });

    if (filtered.length === 0) 
    {
      // 200 - OK (risposta valida anche se vuota)  
      return res.status(200).json(
      {
        message: 'Nessun parcheggio trovato con i filtri forniti',
        features: []
      });
    }

    // 200 - OK (dati trovati e restituiti)
    res.status(200).json({ type: geojson.type, features: filtered });
  });
});

/**
 * POST /api/parcheggi
 * Aggiunge un nuovo parcheggio al file GeoJSON
 */
app.post('/api/parcheggi', (req, res, next) => 
{
  // 400 - Bad Request (dati malformati/invalidi)
  if (!req.body || typeof req.body !== 'object') 
  {
    return next(creaErrore('Corpo della richiesta non valido o mancante', 400));
  }

  const newFeature = req.body;

  // 400 - Bad Request (dati mancanti/invalidi)
  if (!newFeature.geometry || !newFeature.geometry.coordinates) 
  {
    return next(creaErrore('Geometria mancante nella feature', 400));
  }

  if (!newFeature.properties) 
  {
    newFeature.properties = {};
  }

  const validation = validateParkingFeature(newFeature);
  if (!validation.isValid) 
  {
    // 400 - Bad Request (validazione fallita)
    return next(creaErrore(validation.error, 400));
  }

  const parkingId = generateParkingId(newFeature.geometry.coordinates);
  newFeature.properties['@id'] = parkingId;

  readGeoJSONFile((err, geojson) => 
  {
    if (err) 
    {
      console.error('Errore nella lettura del file GeoJSON:', err);
      // 500 - Internal Server Error (errore del server)
      return next(creaErrore('Errore nel leggere i dati esistenti', 500));
    }
    
    if (!Array.isArray(geojson.features)) 
    {
      // 500 - Internal Server Error (problema con i dati del server)
      return next(creaErrore('Il file GeoJSON non contiene un array di feature valido', 500));
    }

    
    const existingFeature = geojson.features.find(f => 
      f.properties && f.properties['@id'] === parkingId
    );
    
    if (existingFeature) 
    {
      // 409 - Conflict (risorsa già esistente)
      return next(creaErrore('Parcheggio già esistente in questa posizione', 409));
    }

    console.log('Aggiungendo parcheggio con ID:', parkingId);
    geojson.features.push(newFeature);

    writeGeoJSONFile(geojson, (writeErr) => 
    {
      if (writeErr) 
      {
        console.error('Errore nella scrittura del file GeoJSON:', writeErr);
        // 500 - Internal Server Error (errore del server)
        return next(creaErrore('Errore nel salvare il nuovo parcheggio', 500));
      }

      // 201 - Created (risorsa creata con successo)
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
app.put('/api/parcheggi/:id', (req, res, next) => 
{
  const idToUpdate = req.params.id;
  const updatedProps = req.body;
  
  if (!updatedProps || typeof updatedProps !== 'object') 
  {
    // 400 - Bad Request (corpo richiesta invalido)
    return next(creaErrore('Corpo della richiesta non valido o mancante', 400));
  }

  // Lista proprietà
  const allowedProperties = ['name', 'access', 'fee', 'surface'];

  const keysToUpdate = allowedProperties.filter(prop => prop in updatedProps);

  if (keysToUpdate.length === 0) 
  {
    // 400 - Bad Request (nessun dato valido da aggiornare)
    return next(creaErrore('Nessuna proprietà aggiornata valida fornita', 400));
  }

  // Legge il file GeoJSON
  readGeoJSONFile((err, geojson) => 
  {
    if (err) 
    {
      console.error('Errore nella lettura del file GeoJSON:', err);
      //500 - Internal Server Error (errore I/O del server)
      return next(creaErrore('Errore nel leggere i dati', 500));
    }

    if (!geojson || !Array.isArray(geojson.features)) 
    {
      //500 - Internal Server Error (problema con i dati del server)
      return next(creaErrore('Formato GeoJSON non valido', 500));
    }

    // Trova la feature da aggiornare
    const feature = geojson.features.find(f => f.properties['@id'] === idToUpdate);
    
    if (!feature) 
    {
      // 404 - Not Found (risorsa non esistente)
      return next(creaErrore('Parcheggio non trovato', 404));
    }

    // Aggiorna le proprietà consentite
    keysToUpdate.forEach(prop => 
    {
      feature.properties[prop] = updatedProps[prop];
    });

    console.log('Aggiornando parcheggio con ID:', idToUpdate);

    // Salva le modifiche
    writeGeoJSONFile(geojson, (writeErr) => 
    {
      if (writeErr) 
      {
        console.error('Errore nella scrittura del file GeoJSON:', writeErr);
        // 500 - Internal Server Error (errore I/O del server)
        return next(creaErrore('Errore nel salvare le modifiche', 500));
      }

      // 200 - OK (aggiornamento riuscito)
      res.status(200).json(
      {
        message: 'Parcheggio aggiornato con successo',
        id: idToUpdate,
        updatedProperties: keysToUpdate.reduce((obj, key) => 
        {
          obj[key] = feature.properties[key];
          return obj;
        }, {})
      });
    });
  });
});

/**
 * DELETE /api/parcheggi/:id
 * Rimuove un parcheggio dal file GeoJSON
 */
app.delete('/api/parcheggi/:id', (req, res, next) => 
{
  const idToDelete = req.params.id;

  // Legge il file GeoJSON
  readGeoJSONFile((err, geojson) => 
  {
    if (err) 
    {
      console.error('Errore nella lettura del file GeoJSON:', err);
      // 500 - Internal Server Error (errore I/O del server)
      return next(creaErrore('Errore nel leggere i dati', 500));
    }

    if (!geojson || !Array.isArray(geojson.features)) 
    {
      // 500 - Internal Server Error (problema con i dati del server)
      return next(creaErrore('Formato GeoJSON non valido', 500));
    }

    // Conta le feature prima della rimozione
    const featuresBefore = geojson.features.length;
    
    // Filtra rimuovendo la feature con l'ID specificato
    geojson.features = geojson.features.filter(f => f.properties['@id'] !== idToDelete);

    // Controlla se è stata effettivamente rimossa una feature
    if (geojson.features.length === featuresBefore) 
    {
      // 404 - Not Found (risorsa da eliminare non esiste)
      return next(creaErrore('Parcheggio non trovato', 404));
    }

    console.log('Rimuovendo parcheggio con ID:', idToDelete);

    // Salva il file aggiornato
    writeGeoJSONFile(geojson, (writeErr) => 
    {
      if (writeErr) 
      {
        console.error('Errore nella scrittura del file GeoJSON:', writeErr);
        // 500 - Internal Server Error (errore I/O del server)
        return next(creaErrore('Errore nel salvare le modifiche', 500));
      }
      // 200 - OK (eliminazione riuscita)
      res.status(200).json(
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
  const response = {error: err.message || 'Errore interno del server',};
  res.status(err.status || 500).json(response);
});

/**
 * Middleware per gestire rotte non trovate
 */
app.use((req, res) => 
{
  res.status(404).json(
  {
    error: 'Endpoint non trovato',
    path: req.originalUrl,
    suggestion: 'Verifica l\'URL o consulta la documentazione dell\'API.'
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
