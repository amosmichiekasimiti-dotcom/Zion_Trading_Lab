const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API endpoint to provide safe tokens
app.get('/api/config', (req, res) => {
  res.json({
    app_id: process.env.APP_ID || "125403",
    demo_token: process.env.DEMO_TOKEN || "",
    real_token: process.env.REAL_TOKEN || "",
    ws_url: "wss://ws.binaryws.com/websockets/v3"
  });
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
