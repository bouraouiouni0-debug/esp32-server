const http = require("http");

const recus = [];
const aEnvoyer = [];

const HTML = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>ESP32 Serveur</title>
<style>
 body{font-family:sans-serif;max-width:600px;margin:30px auto;padding:0 10px}
 input{width:70%;padding:8px} button{padding:8px 14px}
 #log{border:1px solid #ccc;height:250px;overflow:auto;padding:8px;margin-top:15px;background:#fafafa}
</style></head><body>
<h2>Communication avec ESP32</h2>
<input id="msg" placeholder="Message pour l'ESP32">
<button onclick="envoyer()">Envoyer</button>
<h3>Reçu de l'ESP32 :</h3>
<div id="log"></div>
<script>
async function envoyer(){
  const i=document.getElementById('msg');
  if(!i.value) return;
  await fetch('/send',{method:'POST',body:i.value});
  i.value='';
}
async function maj(){
  const r=await fetch('/messages'); const d=await r.json();
  const log=document.getElementById('log'); log.textContent='';
  d.forEach(m=>{const p=document.createElement('div'); p.textContent='['+m.t+'] '+m.msg; log.appendChild(p);});
  log.scrollTop=log.scrollHeight;
}
setInterval(maj,1000);
</script></body></html>`;

function rep(res, code, body, type = "text/plain; charset=utf-8") {
  res.writeHead(code, { "Content-Type": type });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const path = req.url.split("?")[0];

  if (req.method === "GET") {
    if (path === "/") return rep(res, 200, HTML, "text/html; charset=utf-8");
    if (path === "/messages")
      return rep(res, 200, JSON.stringify(recus.slice(-100)), "application/json");
    if (path === "/esp32/poll")
      return rep(res, 200, aEnvoyer.length ? aEnvoyer.shift() : "");
    return rep(res, 404, "introuvable");
  }

  if (req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (path === "/send") {
        aEnvoyer.push(body);
        return rep(res, 200, "ok");
      }
      if (path === "/esp32/data") {
        const t = new Date().toLocaleTimeString("fr-FR");
        recus.push({ t, msg: body });
        console.log("Reçu de l'ESP32 :", body);
        return rep(res, 200, "ok");
      }
      rep(res, 404, "introuvable");
    });
    return;
  }

  rep(res, 405, "méthode non permise");
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Serveur démarré sur le port " + PORT);
});
