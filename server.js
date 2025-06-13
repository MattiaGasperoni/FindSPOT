const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/api/parcheggi', (req, res) => 
  {
  res.sendFile(__dirname + '/data/parcheggi.geojson');
});

app.listen(port, () => 
{
  console.log(`Server avviato su http://localhost:${port}`);
});
