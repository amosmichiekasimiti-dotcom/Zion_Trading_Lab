const { spawn } = require('child_process');
const express = require('express');
const app = express();

// 1. This starts your Python trading logic (nexus_protocol.py)
const pythonProcess = spawn('python3', ['nexus_protocol.py']);

pythonProcess.stdout.on('data', (data) => {
    console.log(`Python Signal: ${data}`);
});

// 2. This serves your JavaScript Dashboard (App.js)
app.use(express.static('build'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Zion Lab running on port ${PORT}`);
});
