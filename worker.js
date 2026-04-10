export default {
async fetch(request, env, ctx){

const url = new URL(request.url)
let endpoint = url.pathname.replace("/","")

const ALIAS = {
  cpf2:"cpf",
  cpf3:"cpf",
  cpf4:"cpf",
  cpf5:"cpf",
  cpf6:"cpf"
}

if(ALIAS[endpoint]){
  endpoint = ALIAS[endpoint]
}

if(endpoint === "admin"){
  return new Response("OK")
}

return consultar(endpoint, request, url, ctx)

}
}

/* ================= CONFIG ================= */

const TOKENS = {
  "astropro": {
    plano: "VIP",
    credits: 999999,
    endpoints: ["cpf","telefone","placa","nome","parentes"]
  }
}

const ENDPOINTS = {
  placa: {
    query: "placa",
    url: "https://obitostore.shop/api/consulta/placa2",
    param: "placa"
  },
  parentes: {
    tipo: "interno",
    query: "cpf"
  },
  cpf: {
    query: "cpf",
    url: "https://obitostore.shop/api/consulta/cpf",
    param: "cpf"
  },
  telefone: {
    query: "telefone",
    url: "https://obitostore.shop/api/consulta/telefone",
    param: "telefone"
  },
  cnpj: {
    query: "query",
    url: "https://obitostore.shop/api/consulta/cnpj",
    param: "query"
  },
  cep: {
    query: "cep",
    url: "https://obitostore.shop/api/consulta/cep",
    param: "cep"
  }
}

/* ================= CONSULTA ================= */

async function consultar(endpoint, request, url, ctx){

if(request.method !== "GET"){
  return jsonErro("REQ_000","Método inválido")
}

const token = url.searchParams.get("token")
if(!token) return jsonErro("AUTH_002","Token obrigatório")

const tokenData = TOKENS[token]
if(!tokenData) return jsonErro("AUTH_001","Token inválido")

if(tokenData.endpoints && !tokenData.endpoints.includes(endpoint)){
  return jsonErro("AUTH_003","Endpoint não liberado")
}

if(tokenData.plano !== "VIP"){
  if(tokenData.credits <= 0){
    return jsonErro("LIMIT_001","Créditos esgotados")
  }
  tokenData.credits -= 1
}

const config = ENDPOINTS[endpoint]

/* ================= PARENTES ================= */

if(config.tipo === "interno" && endpoint === "parentes"){

  const cpf = url.searchParams.get("cpf")
  if(!cpf){
    return jsonErro("REQ_001","CPF obrigatório")
  }

  try{

    const apiURL = "https://astro.stherlionato.workers.dev/cpf?token=astropro&cpf=" + encodeURIComponent(cpf)

    const res = await fetch(apiURL)
    const buffer = await res.arrayBuffer()
    const text = new TextDecoder("utf-8").decode(buffer)

    let json
    try{
      json = JSON.parse(text)
    }catch{
      return jsonErro("API_002","Resposta inválida da API CPF", text.slice(0,200))
    }

    if(!json){
      return jsonErro("API_001","Erro ao buscar CPF base", json)
    }

    const lista = extrairParentes(json)

    return new Response(JSON.stringify({
      status: true,
      base: "Astro API",
      credits: "Astro Company | @puxardados5",
      result: {
        parentes: lista
      }
    }, null, 2), {
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      }
    })

  }catch(e){
    return jsonErro("API_500","Erro interno ao processar parentes", String(e))
  }
}

/* ================= OUTROS ================= */

const valor = url.searchParams.get(config.query)

if(!valor){
  return jsonErro("REQ_001","Parâmetro ausente")
}

try{

  const apiURL = config.url + "?" +
    config.param + "=" + encodeURIComponent(valor) +
    "&apikey=bigmouthh"

  const res = await fetch(apiURL,{
    headers:{
      "User-Agent":"Mozilla/5.0",
      "Accept":"application/json"
    }
  })

  const buffer = await res.arrayBuffer()
  const text = new TextDecoder("utf-8").decode(buffer)

  if(!text || text.trim() === ""){
    return jsonErro("API_002","API retornou vazio")
  }

  if(text.includes("error code")){
    return jsonErro("API_003","Erro na API externa", text)
  }

  let json
  try{
    json = JSON.parse(text)
  }catch{
    json = text
  }

  let parsed = parseUniversal(json)

  if(!parsed || Object.keys(parsed).length === 0){
    parsed = json
  }

  return new Response(JSON.stringify({
    status: true,
    base: "Astro API",
    credits: "Astro Company | @puxardados5",
    result: parsed
  }, null, 2), {
    headers: {
      "Content-Type": "application/json;charset=UTF-8"
    }
  })

}catch(e){
  return jsonErro("API_500","Erro interno", String(e))
}

}

/* ================= PARSER UNIVERSAL ================= */

function parseUniversal(apiResponse){

  if(!apiResponse) return null;

  if(typeof apiResponse === "object"){
    delete apiResponse.criador;
    delete apiResponse.creator;
    delete apiResponse.status;
  }

  let raw = "";

  if(typeof apiResponse === "string"){
    raw = apiResponse;
  }
  else if(apiResponse?.resultado && typeof apiResponse.resultado === "string"){
    raw = apiResponse.resultado;
  }
  else if(apiResponse?.dados?.resultado){
    raw = apiResponse.dados.resultado;
  }

  if(!raw){
    return apiResponse;
  }

  raw = raw
    .replace(/©.*HydraCore/gi,"")
    .replace(/═+/g,"")
    .replace(/[🔍📞🕵️]/g,"")
    .replace(/\r/g,"")
    .trim();

  try{
    raw = decodeURIComponent(escape(raw));
  }catch{}

  const linhas = raw.split("\n").map(l=>l.trim()).filter(Boolean);

  let resultado = {};
  let secaoAtual = null;
  let objetoAtual = {};

  function normalizarKey(k){
    return k
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9]+/g,"_")
      .replace(/^_|_$/g,"");
  }

  function salvarObjeto(){
    if(!secaoAtual || Object.keys(objetoAtual).length === 0) return;

    if(!resultado[secaoAtual]){
      resultado[secaoAtual] = [];
    }

    resultado[secaoAtual].push(objetoAtual);
    objetoAtual = {};
  }

  for(let linha of linhas){

    if(linha.match(/^REGISTRO\s+\d+/i)){
      salvarObjeto();
      secaoAtual = normalizarKey(linha);
      continue;
    }

    if(linha.includes("RESUMO DA CONSULTA")){
      salvarObjeto();
      secaoAtual = "resumo_da_consulta";
      continue;
    }

    if(linha.includes("RESULTADO DA CONSULTA")){
      secaoAtual = "_resultado_da_consulta_telefone_";
      resultado[secaoAtual] = [];
      continue;
    }

    if(linha.includes(":")){
      const [k,...v] = linha.split(":");
      let key = normalizarKey(k);
      let value = v.join(":").trim();

      if(!value || value.toLowerCase().includes("sem informa")){
        value = "[empty]";
      }

      objetoAtual[key] = value;
    }
    else{
      if(secaoAtual){
        objetoAtual["info_extra"] = linha;
      }
    }
  }

  salvarObjeto();

  return resultado;
}

/* ================= PARENTES ================= */

function extrairParentes(data){

  let lista = []

  function buscar(obj){
    if(typeof obj !== "object" || obj === null) return

    for(let k in obj){

      const v = obj[k]

      if(typeof v === "object"){
        buscar(v)
      }

      if(typeof v === "string"){
        if(k.toLowerCase().includes("nome") && v.length > 5){
          lista.push({
            nome: v
          })
        }
      }
    }
  }

  buscar(data)

  return lista
}

/* ================= ERRO ================= */

function jsonErro(code,msg,extra=null){
  return new Response(JSON.stringify({
    status:false,
    erro:{code,msg,extra}
  },null,2),{
    headers:{
      "Content-Type":"application/json;charset=UTF-8"
    }
  })
}

/*
|--------------------------------------------------------------------------
| HOME UI
|--------------------------------------------------------------------------
*/

function home(request){

const base = new URL(request.url).origin

return new Response(`

<!DOCTYPE html>
<html lang="pt-br">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">

<title>Astro Search API</title>

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">

<style>

:root{--blue:#3b82f6;}

*{
 margin:0;
 padding:0;
 box-sizing:border-box;
 font-family:'Inter',sans-serif;
}

body{
 background: radial-gradient(circle at 20% 20%, #0a0f2a, #02030a);
 color:#e2e8f0;
 padding:20px;
}

/* HEADER */
.header{
 text-align:center;
 margin-bottom:20px;
}

.header h1{
 font-size:22px;
 font-weight:800;
}

.header span{
 color:var(--blue);
}

/* CARD */
.card{
 margin-top:15px;
 padding:16px;
 border-radius:18px;
 background:rgba(255,255,255,0.03);
 border:1px solid rgba(255,255,255,0.05);
 backdrop-filter:blur(10px);
 transition:.3s;
}

.card:hover{
 transform:translateY(-3px);
 border-color:rgba(59,130,246,.4);
}

/* INPUT */
.input-group{
 margin-top:10px;
}

.label{
 font-size:11px;
 opacity:.6;
 margin-bottom:4px;
}

input,select{
 width:100%;
 padding:12px;
 border-radius:12px;
 border:none;
 background:#0b1228;
 color:#fff;
 outline:none;
}

input:focus,select:focus{
 box-shadow:0 0 0 2px rgba(59,130,246,.3);
}

/* BUTTON */
button{
 width:100%;
 padding:12px;
 margin-top:12px;
 border-radius:12px;
 border:none;
 font-weight:600;
 background:linear-gradient(90deg,#3b82f6,#2563eb);
 color:#fff;
 cursor:pointer;
 transition:.25s;
}

button:hover{
 transform:translateY(-2px);
 box-shadow:0 10px 25px rgba(59,130,246,.3);
}

button:active{
 transform:scale(.96);
}

/* BOX RESULT */
.box{
 margin-top:12px;
 background:#020617;
 padding:12px;
 border-radius:12px;
 font-size:12px;
 position:relative;
}

pre{
 white-space:pre-wrap;
 word-wrap:break-word;
}

/* COPY */
.copy{
 margin-top:10px;
 background:rgba(34,197,94,.2);
}

.copy:hover{
 box-shadow:0 0 15px rgba(34,197,94,.3);
}

/* LOADING */
.loader{
 height:40px;
 border-radius:10px;
 background:linear-gradient(90deg,#111 25%,#1a1a1a 50%,#111 75%);
 background-size:200%;
 animation:load 1s infinite;
}

@keyframes load{
 0%{background-position:200%}
 100%{background-position:-200%}
}

/* TOAST */
#toast{
 position:fixed;
 bottom:20px;
 left:50%;
 transform:translateX(-50%) translateY(100px);
 background:#111827;
 padding:10px 20px;
 border-radius:10px;
 font-size:12px;
 opacity:0;
 transition:.3s;
}

#toast.show{
 transform:translateX(-50%) translateY(0);
 opacity:1;
}

/* MODAL */
.modal{
 position:fixed;
 inset:0;
 background:rgba(0,0,0,.7);
 display:flex;
 align-items:center;
 justify-content:center;
 z-index:999;
 opacity:0;
 pointer-events:none;
 transition:.3s;
}

/* MODAIS SOBREPOSTOS */
#maintenanceModal {
  z-index: 900;  /* fica atrás */
}

#modal {
  z-index: 1000; /* fica na frente */
}

.modal.show{
 opacity:1;
 pointer-events:all;
}

.modal-box{
 width:100%;
 max-width:380px;
 background:#020617;
 border-radius:18px;
 padding:20px;
 transform:scale(.9);
 transition:.3s;
}

.modal.show .modal-box{
 transform:scale(1);
}

/* PLANOS */
.plan{
 padding:14px;
 border-radius:16px;
 margin-top:10px;
 border:1px solid rgba(255,255,255,.06);
 background:linear-gradient(145deg,rgba(255,255,255,.03),rgba(255,255,255,.01));
 transition:.3s;
 cursor:pointer;
 position:relative;
 overflow:hidden;
}

.plan:hover{
 transform:translateY(-4px) scale(1.02);
 border-color:rgba(59,130,246,.4);
}

/* glow */
.plan::after{
 content:"";
 position:absolute;
 inset:0;
 background:linear-gradient(120deg,transparent,rgba(255,255,255,.1),transparent);
 opacity:0;
 transition:.4s;
}

.plan:hover::after{
 opacity:1;
}

/* BADGE */
.badge{
 display:inline-flex;
 align-items:center;
 gap:6px;
 padding:6px 12px;
 border-radius:999px;
 font-size:11px;
 font-weight:600;
}

/* FREE */
.badge.free{
 background:rgba(34,197,94,.15);
 color:#22c55e;
}

/* PRO */
.badge.pro{
 background:rgba(59,130,246,.15);
 color:#3b82f6;
}

/* VIP */
.badge.vip{
 background:rgba(168,85,247,.15);
 color:#a855f7;
 position:relative;
 overflow:hidden;
}

/* PARTÍCULAS VIP */
/* FREE partículas leves */
.badge.free::after{
 content:"";
 position:absolute;
 inset:0;
 background:radial-gradient(circle,#22c55e 1px,transparent 1px);
 background-size:16px 16px;
 opacity:.15;
 animation:stars 10s linear infinite;
}

/* VIP mais forte */
.badge.vip::after{
 content:"";
 position:absolute;
 inset:-50%;
 background:radial-gradient(circle,#fff 1px,transparent 1px);
 background-size:18px 18px;
 opacity:.25;
 animation:stars 4s linear infinite;
}

@keyframes stars{
 from{transform:translateY(0)}
 to{transform:translateY(40px)}
}

@keyframes shake{
  0%{transform:translateX(0)}
  25%{transform:translateX(-5px)}
  50%{transform:translateX(5px)}
  75%{transform:translateX(-5px)}
  100%{transform:translateX(0)}
}

#bg{
 position:fixed;
 inset:0;
 z-index:-1;
}

/* BADGE */
.badge{
 display:inline-flex;
 align-items:center;
 gap:6px;
 padding:6px 12px;
 border-radius:999px;
 font-size:11px;
 font-weight:600;
}

/* Todas em amarelo */
.badge.free,
.badge.pro,
.badge.vip{
 background: rgba(250,204,21,.2);
 color: #facc15;
}

/* Partículas VIP */
.badge.vip::after{
 content:"";
 position:absolute;
 inset:-50%;
 background:radial-gradient(circle,#facc15 1px,transparent 1px);
 background-size:18px 18px;
 opacity:.25;
 animation:stars 4s linear infinite;
}

</style>

</head>

<body>

<!-- MODAL MANUTENÇÃO -->
<div class="modal" id="maintenanceModal">
  <div class="modal-box">
    <h2 style="font-size:16px;margin-bottom:10px;">⚠️ Sistema em Manutenção</h2>
    <p style="font-size:14px;opacity:.8;line-height:1.5;">
      O sistema está passando por atualizações e estará disponível novamente às <b>07:30</b>.<br>
      Estamos trabalhando o mais rápido possível, <b>3 pessoas</b> estão dedicadas para isso.
    </p>
    <button onclick="fecharMaintenanceModal()" style="margin-top:15px;">Fechar</button>
  </div>
</div>

<div class="header">
  <h1>🚀 Astro <span>Search</span></h1>
  <div id="badgeContainer" style="margin-top:8px;"></div>
</div>

<div class="card">

<div class="input-group">
<div class="label">Token</div>
<input id="token" placeholder="seu token">
</div>

<div class="input-group">
<div class="label">Endpoint</div>
<select id="endpoint">
${Object.keys(ENDPOINTS).map(e=>`<option>${e}</option>`).join("")}
</select>
</div>

<div class="input-group">
<div class="label">Valor</div>
<input id="valor" placeholder="valor da consulta">
</div>

<button id="btnConsultar" onclick="consultar()">Consultar</button>

</div>

<div class="card">

<div class="label">URL</div>
<div class="box"><pre id="url"></pre></div>

<button class="copy" onclick="copiar('url')">Copiar URL</button>

</div>

<div class="card">

<div class="label">Resposta</div>
<div class="box" id="resBox">
<pre id="resposta"></pre>
</div>

<button class="copy" onclick="copiar('resposta')">Copiar resposta</button>

</div>

<div id="toast">Copiado!</div>

<!-- MODAL TOKEN -->
<div class="modal" id="modal">
  <div class="modal-box">

    <h2 style="font-size:16px;margin-bottom:10px;">🔐 Acesso</h2>

    <input id="tokenInput" placeholder="Digite seu token">

<button onclick="salvarTokenModal()">Entrar</button>

    <div style="margin-top:15px;font-size:12px;opacity:.6;">
      Planos disponíveis:
    </div>

    <div class="plan">
      <b>FREE</b><br>
      100 consultas<br>
      <span style="opacity:.6;">Grátis</span>
    </div>

    <div class="plan">
      <b>PRO</b><br>
      1000 consultas<br>
      <span style="opacity:.6;">R$30 mensal</span>
    </div>

    <div class="plan">
      <b>VIP</b><br>
      Ilimitado<br>
      <span style="opacity:.6;">R$50 vitalício</span>
    </div>

    <div class="plan">
      <b>DIÁRIO</b><br>
      Acesso 24h<br>
      <span style="opacity:.6;">R$5</span>
    </div>

  </div>
</div>

<canvas id="bg"></canvas>

<script>
/* ===== TOKENS ===== */
const TOKENS = {
  dragon: "VIP",
  italoedu7: "VIP",
  IFNastro: "VIP",
  astrofree: "FREE",
  astropro: "PRO"
};

/* ===== MODAIS ===== */
function abrirModal(){
  document.getElementById("modal").classList.add("show");
}

function fecharModal(){
  document.getElementById("modal").classList.remove("show");
}

function fecharMaintenanceModal(){
  document.getElementById("maintenanceModal").classList.remove("show");
}

/* ===== BADGE ===== */
function renderBadge(plano){
  const el = document.getElementById("badgeContainer");
  const classe = plano.toLowerCase();
  const texto = plano.toUpperCase() + " • MANUTENÇÃO";
  el.innerHTML = '<div class="badge ' + classe + '" style="background:rgba(250,204,21,.2); color:#facc15;">' + texto + '</div>';
}

/* ===== PREMIUM EFFECT ===== */
function efeitoPremium(token){
  const plano = TOKENS[token];
  const body = document.body;

  if(plano === "VIP"){
    body.style.boxShadow = "inset 0 0 120px rgba(168,85,247,.3)";
  } else if(plano === "FREE"){
    body.style.boxShadow = "inset 0 0 80px rgba(34,197,94,.2)";
  }
}

/* ===== ERRO SHAKE ===== */
function efeitoErro(){
  const input = document.getElementById("token");
  input.style.animation = "shake .3s";
  setTimeout(()=>input.style.animation="",300);
}

/* ===== SALVAR TOKEN ===== */
function salvarToken(token){
  localStorage.setItem("astro_token", token);
  renderBadge(TOKENS[token]);
}

/* ===== SALVAR TOKEN PELO MODAL ===== */
function salvarTokenModal(){
  const input = document.getElementById("tokenInput");
  const token = input.value.trim();

  if(!TOKENS[token]){
    input.style.border = "1px solid red";
    efeitoErro();
    return;
  }

  document.getElementById("token").value = token;
  salvarToken(token);
  efeitoPremium(token);
  fecharModal();
}

/* ===== TOAST ===== */
function mostrarToast(msg){
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),3000);
}

/* ===== CONSULTAR ===== */
async function consultar(){
  const btn = document.getElementById("btnConsultar");
  btn.disabled = true;
  btn.innerText = "Consultando...";

  const token = document.getElementById("token").value.trim();
  const endpoint = document.getElementById("endpoint").value;
  const valor = document.getElementById("valor").value;

  if(!token){
    abrirModal();
    btn.disabled = false;
    btn.innerText = "Consultar";
    return;
  }

  if(!TOKENS[token]){
    abrirModal();
    efeitoErro();
    btn.disabled = false;
    btn.innerText = "Consultar";
    return;
  }

  salvarToken(token);
  efeitoPremium(token);

const PARAMS = {
  cpf:"cpf",
  nome:"nome",
  telefone:"telefone",
  telefone_full:"telefone",
  telefone_cpf:"cpf",
  placa:"placa",  
  ddd:"ddd",
  operadora:"telefone",
  rg:"rg",
  titulo:"titulo",
  pis:"pis",
  nis:"nis",
  parentes:"cpf",
  vizinhos:"cpf",
  cep:"cep",
  estado:"uf",
  email:"email",
  score:"cpf",
  renda:"valor",
  cbo:"cbo",
  foto_sp:"cpf",
  foto_ma:"cpf",
  foto_ro:"cpf",
  foto_all:"cpf"
}

const param = PARAMS[endpoint];
  const url = window.location.origin + "/" + endpoint +
              "?token=" + token + "&" + param + "=" + valor;

  document.getElementById("url").innerText = url;
  const resBox = document.getElementById("resBox");
  resBox.innerHTML = '<div class="loader"></div>';

  try{
    const r = await fetch(url);
    const j = await r.json();
    resBox.innerHTML = "<pre id='resposta'>"+JSON.stringify(j,null,2)+"</pre>";
    mostrarToast("Consulta feita com sucesso 🚀");
  } catch {
    resBox.innerHTML = "<pre>Erro ao consultar</pre>";
    mostrarToast("Erro na consulta ❌");
  }

  btn.disabled = false;
  btn.innerText = "Consultar";
}

/* ===== PARTICULAS DE FUNDO ===== */
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");
let particles = [];

function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticles(qtd=60){
  particles = [];
  for(let i=0;i<qtd;i++){
    particles.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      r: Math.random()*1.5,
      speed: Math.random()*0.5 + 0.2
    });
  }
}

function drawParticles(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{
    p.y += p.speed;
    if(p.y > canvas.height){
      p.y = 0;
      p.x = Math.random()*canvas.width;
    }
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle="rgba(255,255,255,0.6)";
    ctx.fill();
  });
  requestAnimationFrame(drawParticles);
}

/* ===== LOAD ===== */
window.addEventListener("load", ()=>{
  // Primeiro: mostrar modal de manutenção
  const maintenanceModal = document.getElementById("maintenanceModal");
  maintenanceModal.classList.add("show");

  // Checar se existe token válido no localStorage
  const token = localStorage.getItem("astro_token");
  if(token && TOKENS[token]){
    // Token válido: exibe badge e efeito premium
    document.getElementById("token").value = token;
    renderBadge(TOKENS[token]);
    efeitoPremium(token);
  } else {
    // Sem token ou inválido: abrir modal de token **por cima da manutenção**
    abrirModal(); // modal de token
  }

  // Partículas
  resizeCanvas();
  createParticles();
  drawParticles();
});

window.addEventListener("resize", resizeCanvas);
</script>

</body>
</html>

`,{
  headers: { 
    "content-type": "text/html",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
  }
})

}

function adminPanel(request){
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const valid = token === ADMIN_TOKEN;

  return new Response(`

<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Admin Panel</title>

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">

<style>
:root{--blue:#3b82f6;}

*{
 margin:0;
 padding:0;
 box-sizing:border-box;
 font-family:'Inter',sans-serif;
}

body{
 background: radial-gradient(circle at 20% 20%, #0a0f2a, #02030a);
 color:#e2e8f0;
 padding:20px;
 min-height:100vh;
}

/* HEADER */
.header{
 text-align:center;
 margin-bottom:20px;
}

.header h1{
 font-size:22px;
 font-weight:800;
}

.header span{
 color:var(--blue);
}

/* CARD */
.card{
 margin-top:15px;
 padding:16px;
 border-radius:18px;
 background:rgba(255,255,255,0.03);
 border:1px solid rgba(255,255,255,0.05);
 backdrop-filter:blur(10px);
 transition:.3s;
}

.card:hover{
 transform:translateY(-3px);
 border-color:rgba(59,130,246,.4);
}

/* INPUT */
.input-group{
 margin-top:10px;
}

.label{
 font-size:11px;
 opacity:.6;
 margin-bottom:4px;
}

input,select{
 width:100%;
 padding:12px;
 border-radius:12px;
 border:none;
 background:#0b1228;
 color:#fff;
 outline:none;
}

input:focus,select:focus{
 box-shadow:0 0 0 2px rgba(59,130,246,.3);
}

/* BUTTON */
button{
 width:100%;
 padding:12px;
 margin-top:12px;
 border-radius:12px;
 border:none;
 font-weight:600;
 background:linear-gradient(90deg,#3b82f6,#2563eb);
 color:#fff;
 cursor:pointer;
 transition:.25s;
}

button:hover{
 transform:translateY(-2px);
 box-shadow:0 10px 25px rgba(59,130,246,.3);
}

button:active{
 transform:scale(.96);
}

/* BOX RESULT */
.box{
 margin-top:12px;
 background:#020617;
 padding:12px;
 border-radius:12px;
 font-size:12px;
 position:relative;
}

pre{
 white-space:pre-wrap;
 word-wrap:break-word;
}

/* COPY */
.copy{
 margin-top:10px;
 background:rgba(34,197,94,.2);
}

.copy:hover{
 box-shadow:0 0 15px rgba(34,197,94,.3);
}

/* LOADING */
.loader{
 height:40px;
 border-radius:10px;
 background:linear-gradient(90deg,#111 25%,#1a1a1a 50%,#111 75%);
 background-size:200%;
 animation:load 1s infinite;
}

@keyframes load{
 0%{background-position:200%}
 100%{background-position:-200%}
}

/* TOAST */
#toast{
 position:fixed;
 bottom:20px;
 left:50%;
 transform:translateX(-50%) translateY(100px);
 background:#111827;
 padding:10px 20px;
 border-radius:10px;
 font-size:12px;
 opacity:0;
 transition:.3s;
}

#toast.show{
 transform:translateX(-50%) translateY(0);
 opacity:1;
}

/* MODAL */
.modal{
 position:fixed;
 inset:0;
 background:rgba(0,0,0,.7);
 display:flex;
 align-items:center;
 justify-content:center;
 z-index:999;
 opacity:0;
 pointer-events:none;
 transition:.3s;
}

.modal.show{
 opacity:1;
 pointer-events:all;
}

.modal-box{
 width:100%;
 max-width:380px;
 background:#020617;
 border-radius:18px;
 padding:20px;
 transform:scale(.9);
 transition:.3s;
}

.modal.show .modal-box{
 transform:scale(1);
}

/* PLANOS */
.plan{
 padding:14px;
 border-radius:16px;
 margin-top:10px;
 border:1px solid rgba(255,255,255,.06);
 background:linear-gradient(145deg,rgba(255,255,255,.03),rgba(255,255,255,.01));
 transition:.3s;
 cursor:pointer;
 position:relative;
 overflow:hidden;
}

.plan:hover{
 transform:translateY(-4px) scale(1.02);
 border-color:rgba(59,130,246,.4);
}

/* glow */
.plan::after{
 content:"";
 position:absolute;
 inset:0;
 background:linear-gradient(120deg,transparent,rgba(255,255,255,.1),transparent);
 opacity:0;
 transition:.4s;
}

.plan:hover::after{
 opacity:1;
}

/* BADGE */
.badge{
 display:inline-flex;
 align-items:center;
 gap:6px;
 padding:6px 12px;
 border-radius:999px;
 font-size:11px;
 font-weight:600;
 background: rgba(250,204,21,.2);
 color: #facc15;
 position:relative;
 overflow:hidden;
}

.badge.vip::after{
 content:"";
 position:absolute;
 inset:-50%;
 background:radial-gradient(circle,#facc15 1px,transparent 1px);
 background-size:18px 18px;
 opacity:.25;
 animation:stars 4s linear infinite;
}

@keyframes stars{
 from{transform:translateY(0)}
 to{transform:translateY(40px)}
}

/* SHAKE */
@keyframes shake{
 0%{transform:translateX(0)}
 25%{transform:translateX(-5px)}
 50%{transform:translateX(5px)}
 75%{transform:translateX(-5px)}
 100%{transform:translateX(0)}
}

#bg{
 position:fixed;
 inset:0;
 z-index:-1;
}
</style>

</head>
<body>

<div class="header">
  <h1>🔐 Admin <span>Panel</span></h1>
  <div id="badgeContainer"></div>
</div>

<!-- LOGIN MODAL -->
<div class="modal show" id="loginModal">
  <div class="modal-box">
    <h2 style="font-size:16px;margin-bottom:10px;">🔑 Acesso Admin</h2>
    <input id="adminToken" placeholder="Digite token">
    <button onclick="login()">Entrar</button>
  </div>
</div>

<div id="panel" style="display:${valid ? "block" : "none"}">

<div class="card">
<h3>🎟️ Gerar Token</h3>
<input id="nome" placeholder="Nome do cliente">
<select id="plano">
<option value="FREE">FREE</option>
<option value="PRO">PRO</option>
<option value="VIP">VIP</option>
</select>
<h4 style="margin-top:10px;font-size:13px;opacity:.7;">Endpoints liberados</h4>
<div id="endpoints"></div>
<button onclick="gerar()">Gerar Token</button>
<div class="token-box" id="resultado"></div>
</div>

</div>

<canvas id="bg"></canvas>

<script>
const ADMIN = "` + ADMIN_TOKEN + `";
const ENDPOINTS = ${JSON.stringify(Object.keys(ENDPOINTS))};

function login(){
 const val = document.getElementById("adminToken").value;
 if(val !== ADMIN){
  alert("Token inválido");
  return;
 }
 document.getElementById("loginModal").classList.remove("show");
 document.getElementById("panel").style.display="block";
 renderEndpoints();
 renderBadge("VIP");
}

// Renderiza endpoints
function renderEndpoints(){
  const div = document.getElementById("endpoints");
  div.innerHTML = ENDPOINTS.map(e =>
    '<label style="display:flex;gap:8px;margin-top:6px;font-size:12px;">' +
      '<input type="checkbox" value="' + e + '" checked>' +
      e +
    '</label>'
  ).join('');
}

// Gerar token
function gerar(){
  const nome = document.getElementById("nome").value || "user";
  const plano = document.getElementById("plano").value;
  const checks = [...document.querySelectorAll("#endpoints input:checked")];
  const perms = checks.map(c=>c.value);
  const token = nome + "_" + Math.random().toString(36).slice(2,10);

  // Atualiza TOKENS em memória
  TOKENS[token] = plano;

  // Salva no localStorage
  let todosTokens = JSON.parse(localStorage.getItem("astro_tokens") || "{}");
  todosTokens[token] = { plano, endpoints: perms };
  localStorage.setItem("astro_tokens", JSON.stringify(todosTokens));

  let limite = "100 consultas";
  if(plano === "PRO") limite = "1000 consultas";
  if(plano === "VIP") limite = "Ilimitado";

  const mensagem = 
    "🎉 TOKEN GERADO COM SUCESSO!\\n\\n" +
    "🔑 • Token: " + token + "\\n" +
    "💎 • Plano: " + plano + "\\n" +
    "♾️ • Limite: " + limite + "\\n\\n" +
    "⚠️ Endpoints liberados: " + perms.join(", ");

  document.getElementById("resultado").innerText = mensagem;
}

// PARTICULAS DE FUNDO
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");
let particles = [];

function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticles(qtd=60){
  particles = [];
  for(let i=0;i<qtd;i++){
    particles.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      r: Math.random()*1.5,
      speed: Math.random()*0.5 + 0.2
    });
  }
}

function drawParticles(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{
    p.y += p.speed;
    if(p.y > canvas.height){
      p.y = 0;
      p.x = Math.random()*canvas.width;
    }
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle="rgba(255,255,255,0.6)";
    ctx.fill();
  });
  requestAnimationFrame(drawParticles);
}

window.addEventListener("load", ()=>{
  resizeCanvas();
  createParticles();
  drawParticles();
});

window.addEventListener("resize", resizeCanvas);
</script>

</body>
</html>

`,{
    headers: { 
      "content-type": "text/html",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
    }
  })
}