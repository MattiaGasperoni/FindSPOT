const form = document.getElementById('addParkingForm');
  const messageDiv = document.getElementById('message');

  form.addEventListener('submit', e => {
    e.preventDefault();

    const formData = new FormData(form);
    let lat = formData.get('lat').replace(',', '.');
    let lon = formData.get('lon').replace(',', '.');
    lat = parseFloat(lat);
    lon = parseFloat(lon);

    if (isNaN(lat) || isNaN(lon)) {
      messageDiv.textContent = "Inserisci coordinate valide (numeri).";
      return;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      messageDiv.textContent = "Coordinate fuori dai limiti (lat: -90÷90, lon: -180÷180).";
      return;
    }

    const feature = {
      type: "Feature",
      properties: {
        name: formData.get('name'),
        access: formData.get('access'),
        fee: formData.get('fee'),
        surface: formData.get('surface'),
        amenity: "parking"
      },
      geometry: {
        type: "Point",
        coordinates: [lat, lon]
      }
    };

    fetch('/api/parcheggi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feature)
    })
    .then(res => {
      if (!res.ok) throw new Error('Errore durante l\'aggiunta');
      return res.text();
    })
    .then(text => {
      messageDiv.textContent = text;
      form.reset();
    })
    .catch(err => {
      messageDiv.textContent = err.message;
    });
  });