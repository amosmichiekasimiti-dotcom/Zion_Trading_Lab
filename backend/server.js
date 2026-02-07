import express from "express";
import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

let ws;
let mode = "demo";

function token() {
  return mode === "real"
    ? process.env.REAL_TOKEN
    : process.env.DEMO_TOKEN;
}

function connectDeriv() {
  ws = new WebSocket(
    `wss://ws.derivws.com/websockets/v3?app_id=${process.env.APP_ID}`
  );

  ws.on("open", () => {
    ws.send(JSON.stringify({ authorize: token() }));
  });

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    console.log("DERIV:", data.msg_type);
  });

  ws.on("close", () => {
    setTimeout(connectDeriv, 3000);
  });
}

connectDeriv();

app.get("/", (req, res) => {
  res.send("ZION BACKEND RUNNING");
});

app.get("/mode/:type", (req, res) => {
  mode = req.params.type === "real" ? "real" : "demo";
  ws.close();
  res.json({ mode });
});

app.listen(PORT, () => {
  console.log("Server started");
});
