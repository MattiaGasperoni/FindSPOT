# 🅿️ FindSPOT - Web App per la Visualizzazione dei Parcheggi

**FindSPOT** è una web app interattiva che consente di visualizzare i parcheggi delle marche su una mappa, filtrare i risultati in base a criteri personalizzati e interagire con i dati GeoJSON tramite un'interfaccia intuitiva.

## 🚀 Funzionalità

- 📍 Visualizzazione dei parcheggi su mappa interattiva (Leaflet)
- 🔍 Filtri di ricerca per città, accesso e tipo di parcheggio
- 🗺️ Colori dinamici dei poligoni in base alle proprietà del parcheggio
- 🧹 Modalità "delete" per rimuovere parcheggi direttamente dalla mappa
- ➕ Aggiunta di nuovi parcheggi con validazione automatica
- ✏️ Modifica delle proprietà dei parcheggi esistenti
- 🌐 Web service RESTful completo per la gestione dei dati

## 🧑‍💻 Tecnologie Utilizzate

- **Frontend:** HTML, CSS, JavaScript, Leaflet.js
- **Backend:** Node.js, Express.js
- **Dati:** GeoJSON (open data dei parcheggi)

## 📦 Struttura del Progetto

```
/data
└─ parcheggi.geojson
/public
├─ index.html
├─ add.html
├─ edit.html
├─ remove.html
├─ map.html
├─ /css
    ├─ style.css 
    ├─ add.css 
    ├─ edit.css 
    ├─ remove.css 
    ├─ map.css 
└─ /js          
    ├─ map.js 
    ├─ filter.js 
    ├─ search.js 
    ├─ add.js 
└─ /img
package.json
server.js
```

## ⚙️ Setup Locale

1. Clona il repository:
```bash
git clone https://github.com/MattiaGasperoni/Progetto-Tecnologie-WEB.git
cd Progetto-Tecnologie-WEB
```

2. Installa le dipendenze:
```bash
npm install
```

3. Avvia il server:
```bash
npm start
```

4. Visita `http://localhost:3000` nel browser.

## 🌐 API Endpoints

### **GET /api/parcheggi**
Restituisce tutti i parcheggi in formato GeoJSON.

**Risposta:**
```json
{
  "type": "FeatureCollection",
  "features": [...]
}
```

### **POST /api/parcheggi**
Aggiunge un nuovo parcheggio al sistema con un ID univoco  (formato: `longitude_latitude`).

**Body richiesta:**
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  },
  "properties": {
    "name": "Nome parcheggio",
    "access": "public|private",
    "fee": "yes|no",
    "surface": "asphalt|concrete|gravel"
  }
}
```

**Risposta:**
```json
{
  "message": "Parcheggio aggiunto con successo",
  "id": "12.345678_43.123456"
}
```

### **PUT /api/parcheggi/:id**
Aggiorna le proprietà di un parcheggio esistente.

**Parametri:**
- `id`: ID univoco del parcheggio 

**Body richiesta:**
```json
{
  "name": "Nuovo nome",
  "access": "public",
  "fee": "no",
  "surface": "asphalt"
}
```

**Risposta:**
```json
{
  "message": "Parcheggio aggiornato con successo",
  "id": "12.345678_43.123456"
}
```

### **DELETE /api/parcheggi/:id**
Elimina un parcheggio dal sistema.

**Parametri:**
- `id`: ID univoco del parcheggio da eliminare

**Risposta:**
```json
{
  "message": "Parcheggio eliminato con successo",
  "id": "12.345678_43.123456"
}
```

## 🔧 Proprietà dei Parcheggi

Le proprietà modificabili per ogni parcheggio sono:

- **name**: Nome del parcheggio
- **access**: Tipo di accesso (`public`, `private`)
- **fee**: Presenza di tariffe (`yes`, `no`)
- **surface**: Tipo di superficie (`asphalt`, `concrete`, `gravel`)

## 📝 Note Tecniche

- Gli ID dei parcheggi vengono generati automaticamente in base alle coordinate (formato: `longitude_latitude`)
- La validazione delle coordinate è obbligatoria per tutte le operazioni
- Il sistema utilizza un approccio whitelist per le proprietà modificabili
- Tutti gli endpoint includono una gestione degli errori appropriata

## 👤 Autori

**Mattia Gasperoni**  
Studente di Informatica @UniUrb

**Andrea Rossi**  
Studente di Informatica @UniUrb

---
