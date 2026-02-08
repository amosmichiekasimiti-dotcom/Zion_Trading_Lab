const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const DerivAPIBasic = require('@deriv/deriv-api/dist/DerivAPIBasic');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT |

| 10000;

// Use your tokens from Render Environment Variables
const APP_ID = process.env.DERIV_APP_ID;
const TOKEN = process.env.DERIV_TOKEN;

const connection = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
const api = new DerivAPIBasic({ connection });

app.use(express.static('public'));

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

connection.on('open', async () => {
    await api.authorize(TOKEN);
    // Subscribe to major markets:Plain and 1s indices
   .forEach(s => api.subscribe({ ticks: s }));
    setInterval(() => api.ping(), 30000); 
});

// Broadcast ticks to the frontend
const wss = new WebSocket.Server({ server });
connection.on('message', (data) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) client.send(data);
    });
});
