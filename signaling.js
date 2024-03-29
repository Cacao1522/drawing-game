// ポート番号は必要に応じて変更してください。起動するにはコマンドプロンプト/ターミナルから、 次のコマンドを実行します。 
//npm install ws
// node signaling.js

"use strict";

let WebSocketServer = require("ws").Server;
let port = 3001;
let wsServer = new WebSocketServer({ port: port });
console.log("websocket server start. port=" + port);

wsServer.on("connection", function (ws) {
  console.log("-- websocket connected --");
  ws.on("message", function (message) {
    console.log("received message=" + message);
    wsServer.clients.forEach(function each(client) {
      if (isSame(ws, client)) {
        console.log("- skip sender -");
      } else {
        client.send(message);
        console.log("- send to client -");
      }
    });
  });
});

function isSame(ws1, ws2) {
  // -- compare object --
  return ws1 === ws2;
}