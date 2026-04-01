export default {

async fetch(request, env, ctx){

  const url = new URL(request.url)
  const endpoint = url.pathname.replace(/^\/|\/$/g,"").toLowerCase()

  if(endpoint === "admin"){
    const token = url.searchParams.get("token")
    if(token !== ADMIN_TOKEN){
      return jsonErro("AUTH_ADMIN","Acesso negado")
    }
    return adminPanel(request)
  }

  if(endpoint === ""){
    return home(request)
  }

  if(!ENDPOINTS[endpoint]){
    return jsonErro("ENDPOINT_404","Endpoint não encontrado")
  }

  return consultar(endpoint,request,url,ctx)
}

}

/* ===== TOKENS ===== */
const ADMIN_TOKEN = "dragonsubdono"

const TOKENS = {
  dragon:{plano:"VIP",limite:"unlimited"},
  IFNastro:{plano:"VIP",limite:"unlimited"},
  italoedu7:{plano:"VIP",limite:"unlimited"},
  astrofree:{plano:"FREE",limite:100},
  astropro:{plano:"PRO",limite:1000}
}

/* ===== CONFIG ===== */
const APIKEY = "bigmouth"

/* ===== ENDPOINTS ===== */
const ENDPOINTS = {
  cpf: { 
    url:"https://api.blackaut.shop/api/dados-pessoais/cpf", 
    param:"cpf", 
    query:"cpf",
    apiKey:"EbmScZ0ntHf61KJz3H" 
  },
  cpf2:{ url:"https://knowsapi.shop/api/consulta/cpf-v2", param:"code", query:"cpf" },
  cpf3:{ url:"https://knowsapi.shop/api/consultas/cpf", param:"cpf", query:"cpf" },
  cpf4:{ url:"https://knowsapi.shop/api/consulta/cpf-v3", param:"code", query:"cpf" },
  cpf5:{ url:"https://knowsapi.shop/api/consulta/cpf-v4", param:"code", query:"cpf" },
  cpf6:{ url:"https://knowsapi.shop/api/consulta/cpf-v5", param:"code", query:"cpf" },

  nome: { 
  url: "https://api.blackaut.shop/api/dados-pessoais/nome", 
  param: "nome", 
  query: "nome",
  apiKey: "EbmScZ0ntHf61KJz3H"
},
  nome2:{ url:"https://knowsapi.shop/api/consulta/nome-v1", param:"nome", query:"nome" },

renavam: { 
  url: "https://api.blackaut.shop/api/dados-pessoais/renavam", 
  param: "renavam", 
  query: "renavam",
  apiKey: "EbmScZ0ntHf61KJz3H"
},

nome3: { 
  url: "https://api.blackaut.shop/api/dados-pessoais/nome2", 
  param: "nome2", 
  query: "nome",
  apiKey: "EbmScZ0ntHf61KJz3H"
},

telefone3: { 
  url: "https://api.blackaut.shop/api/dados-pessoais/telefone2", 
  param: "telefone2", 
  query: "telefone",
  apiKey: "EbmScZ0ntHf61KJz3H"
},

parentes2: { 
  url: "https://api.blackaut.shop/api/dados-pessoais/parentes", 
  param: "parentes", 
  query: "cpf",
  apiKey: "EbmScZ0ntHf61KJz3H"
},

cnh: { 
  url: "https://api.blackaut.shop/api/dados-pessoais/cnh", 
  param: "cnh", 
  query: "cpf",
  apiKey: "EbmScZ0ntHf61KJz3H"
},

cnpj: { 
  url: "https://api.blackaut.shop/api/dados-pessoais/cnpj", 
  param: "cnpj", 
  query: "cnpj",
  apiKey: "EbmScZ0ntHf61KJz3H"
},

  telefone:{ url:"https://knowsapi.shop/api/consultas/telefone", param:"telefone", query:"telefone" },
  telefone2:{ url:"https://knowsapi.shop/api/consulta/telefone-v1", param:"telefone", query:"telefone" },
  operadora:{ url:"https://knowsapi.shop/api/consultas/operadora", param:"telefone", query:"telefone" },

  email:{ url:"https://knowsapi.shop/api/consultas/email", param:"email", query:"email" },

  cep:{ url:"https://knowsapi.shop/api/consultas/cep-v1", param:"cep", query:"cep" },
  cep2:{ url:"https://knowsapi.shop/api/consulta/cep-v1", param:"cep", query:"cep" },

  placa:{ url:"https://knowsapi.shop/api/consulta/placa-v1", param:"placa", query:"placa" },
  placa2:{ url:"https://knowsapi.shop/api/consulta/placa-v2", param:"placa", query:"placa" },

  rg:{ url:"https://knowsapi.shop/api/consultas/rg", param:"cpf", query:"cpf" },
  titulo:{ url:"https://knowsapi.shop/api/consultas/titulo", param:"cpf", query:"cpf" },
  pis:{ url:"https://knowsapi.shop/api/consultas/pis", param:"cpf", query:"cpf" },
  nis:{ url:"https://knowsapi.shop/api/consultas/nis", param:"cpf", query:"cpf" },

  parentes:{ url:"https://knowsapi.shop/api/consultas/parentes", param:"cpf", query:"cpf" },
  vizinhos:{ url:"https://knowsapi.shop/api/consultas/vizinhos", param:"cpf", query:"cpf" }
}

/* ===== CONSULTA UNIVERSAL ===== */
async function consultar(endpoint,request,url,ctx){
  if(request.method !== "GET") return jsonErro("REQ_000","Método inválido")

  const token = url.searchParams.get("token")
  if(!token) return jsonErro("AUTH_002","Token obrigatório")
  if(!validarToken(token)) return jsonErro("AUTH_001","Token inválido")

  const config = ENDPOINTS[endpoint]
  const valor = url.searchParams.get(config.query)
  if(!valor) return jsonErro("REQ_001","Parâmetro ausente")

  const plano = obterPlanoToken(token)

  /* CACHE */
  const cacheKey = new Request(request.url,{method:"GET"})
  const cache = caches.default
  let response = await cache.match(cacheKey)
  if(response) return response

  /* URL FINAL */
  const keyToUse = config.apiKey || APIKEY; // se endpoint tiver apiKey, usa; senão, usa global
  const apiURL = `${config.url}?${config.param}=${encodeURIComponent(valor)}&apikey=${keyToUse}`;
  /* FETCH */
  let api
  try{
    const res = await fetch(apiURL,{ headers:{ "User-Agent":"Mozilla/5.0","Accept":"application/json" }, cf:{cacheTtl:0} })
    const text = await res.text()
    api = JSON.parse(text)
  }catch(e){
    return jsonErro("API_001","Erro ao conectar API",e.toString())
  }

  if(!api || Object.keys(api).length===0) return jsonErro("DATA_404","Nenhum dado encontrado")

  /* LIMPAR E NORMALIZAR */
  let dados = limparRespostaAPI(api)
  dados = normalizarDados(dados)

  /* RESPONSE PADRÃO */
  const finalResponse = {
    status:true,
    meta:{
      api:"Astro Search API",
      empresa:"Astro Company",
      plano_token:plano,
      endpoint:endpoint,
      timestamp:new Date().toISOString()
    },
    consulta:{ [config.query]:valor },
    dados:dados
  }

  response = new Response(JSON.stringify(finalResponse,null,2),{
    headers:{ "Content-Type":"application/json;charset=UTF-8", "Cache-Control":"public,max-age=3600" }
  })

  ctx.waitUntil(cache.put(cacheKey,response.clone()))
  return response
}

/* ===== FUNÇÕES AUX ===== */
function validarToken(token){ return TOKENS.hasOwnProperty(token) }
function obterPlanoToken(token){ return TOKENS[token]?.plano || "FREE" }

function limparRespostaAPI(data){
  if(!data || typeof data!=="object") return data
  const blacklist=["status","creator","criador","api","credits","creditos","mensagem","message","meta_turbo","CRIADOR"]
  for(const campo of blacklist) delete data[campo]
  if(data.resultado) return data.resultado
  return data
}

function normalizarDados(data){
  if(Array.isArray(data)) return data.map(normalizarDados)
  if(data!==null && typeof data==="object"){
    const novo={}
    for(const k in data) novo[k]=normalizarDados(data[k])
    return novo
  }
  if(typeof data==="string"){
    try{ return new TextDecoder().decode(new TextEncoder().encode(data)) }catch{ return data }
  }
  return data
}

function jsonErro(code,msg,extra=null){
  return new Response(JSON.stringify({
    status:false,
    erro:{ codigo:code, mensagem:msg },
    suporte:"@puxardados5",
    extra:extra
  },null,2),{
    status:400,
    headers:{ "Content-Type":"application/json" }
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
      O sistema está passando por atualizações e estará disponível novamente às <b>08:30</b>.<br>
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
    <option value="cpf">cpf</option>
    <option value="nome">nome</option>
    <option value="nome3">nome3</option>
    <option value="renavam">renavam</option>
    <option value="telefone3">telefone3</option>
    <option value="parentes2">parentes2</option>
    <option value="cnh">cnh</option>
    <option value="cnpj">cnpj</option>
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

  const config = ENDPOINTS[endpoint];
if(!config){
  alert("Endpoint inválido");
  return;
}

const url = window.location.origin + "/" + endpoint +
            "?token=" + token + "&" + config.param + "=" + encodeURIComponent(valor);

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

return new Response(`

<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Admin Panel</title>

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">

<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:Inter;}
body{
 background:radial-gradient(circle at 30% 20%,#0a0f2a,#02030a);
 color:#fff;padding:20px;
}

.card{
 background:rgba(255,255,255,.04);
 border:1px solid rgba(255,255,255,.08);
 padding:16px;
 border-radius:16px;
 margin-top:15px;
 backdrop-filter:blur(10px);
 animation:fade .5s ease;
}

@keyframes fade{
 from{opacity:0;transform:translateY(10px)}
 to{opacity:1}
}

input,select{
 width:100%;padding:12px;margin-top:8px;
 border-radius:10px;border:none;
 background:#0b1228;color:#fff;
}

button{
 width:100%;padding:12px;margin-top:12px;
 border:none;border-radius:12px;
 background:linear-gradient(90deg,#3b82f6,#2563eb);
 color:#fff;font-weight:600;
}

button:hover{
 transform:translateY(-2px);
 box-shadow:0 10px 20px rgba(59,130,246,.3);
}

.token-box{
 margin-top:10px;
 background:#020617;
 padding:10px;
 border-radius:10px;
 font-size:12px;
 word-break:break-all;
}

.badge{
 padding:4px 10px;border-radius:999px;font-size:11px;
}

.vip{background:#a855f7}
.pro{background:#3b82f6}
.free{background:#22c55e}
</style>

</head>
<body>

<h2>🔐 Painel Admin</h2>

<div class="card" id="loginBox">
<input id="adminToken" placeholder="Token admin">
<button onclick="login()">Entrar</button>
</div>

<div id="panel" style="display:none">

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

<script>

const ADMIN = "${ADMIN_TOKEN}"
const ENDPOINTS = ${JSON.stringify(Object.keys(ENDPOINTS))}

/* LOGIN */
function login(){
 const val = document.getElementById("adminToken").value

 if(val !== ADMIN){
  alert("Token inválido")
  return
 }

 document.getElementById("loginBox").style.display="none"
 document.getElementById("panel").style.display="block"
 renderEndpoints()
}

/* CHECKBOX */
function renderEndpoints(){
 const div = document.getElementById("endpoints")

 div.innerHTML = ENDPOINTS.map(e =>
  '<label style="display:flex;gap:8px;margin-top:6px;font-size:12px;">' +
    '<input type="checkbox" value="' + e + '" checked>' +
    e +
  '</label>'
).join('')

/* GERAR TOKEN */
/* GERAR TOKEN */
function gerar(){

 const nome = document.getElementById("nome").value || "user"
 const plano = document.getElementById("plano").value

 const checks = [...document.querySelectorAll("#endpoints input:checked")]
 const perms = checks.map(c=>c.value)

 const token = nome + "_" + Math.random().toString(36).slice(2,10)

 let limite = "100 consultas"
 if(plano === "PRO") limite = "1000 consultas"
 if(plano === "VIP") limite = "Ilimitado"

 const base = "https://astro.stherlionato.workers.dev"

 const mensagem = 
  "🎉 TOKEN GERADO COM SUCESSO!\n\n" +
  "🔑 • Token: " + token + "\n" +
  "💎 • Plano: " + plano + "\n" +
  "♾️ • Limite: " + limite + "\n\n" +
  "⚠️ ATENÇÃO:\n" +
  "Seu token é privado e intransferível.\n" +
  "NÃO compartilhe com ninguém.\n\n" +
  "━━━━━━━━━━━━━━━━━━\n\n" +
  "🌐 • BASE DA API:\n" +
  "👉 • " + base + "\n\n" +
  "━━━━━━━━━━━━━━━━━━\n\n" +
  "🚀 EXEMPLOS PRONTOS:\n\n" +
  "👤 CPF\n" + base + "/cpf?token=" + token + "&cpf=00000000000\n" +
  "👤 CPF v2\n" + base + "/cpf2?token=" + token + "&cpf=00000000000\n" +
  "👤 CPF v3\n" + base + "/cpf3?token=" + token + "&cpf=00000000000\n" +
  "📛 Nome\n" + base + "/nome?token=" + token + "&nome=Joao\n" +
  "📛 Nome v2\n" + base + "/nome2?token=" + token + "&nome=Joao\n" +
  "📞 Telefone\n" + base + "/telefone?token=" + token + "&telefone=31999999999\n" +
  "📞 Telefone v2\n" + base + "/telefone2?token=" + token + "&telefone=31999999999\n" +
  "📡 Operadora\n" + base + "/operadora?token=" + token + "&telefone=31999999999\n" +
  "📧 Email\n" + base + "/email?token=" + token + "&email=teste@gmail.com\n" +
  "📍 CEP\n" + base + "/cep?token=" + token + "&cep=00000000\n" +
  "📍 CEP v2\n" + base + "/cep2?token=" + token + "&cep=00000000\n" +
  "🚗 Placa\n" + base + "/placa?token=" + token + "&placa=ABC1234\n" +
  "🚗 Placa v2\n" + base + "/placa2?token=" + token + "&placa=ABC1234\n" +
  "🪪 RG\n" + base + "/rg?token=" + token + "&cpf=00000000000\n" +
  "🗳️ Título\n" + base + "/titulo?token=" + token + "&cpf=00000000000\n" +
  "💼 PIS\n" + base + "/pis?token=" + token + "&cpf=00000000000\n" +
  "📊 NIS\n" + base + "/nis?token=" + token + "&cpf=00000000000\n" +
  "👨‍👩‍👧 Parentes\n" + base + "/parentes?token=" + token + "&cpf=00000000000\n" +
  "🏘️ Vizinhos\n" + base + "/vizinhos?token=" + token + "&cpf=00000000000\n\n" +
  "━━━━━━━━━━━━━━━━━━\n\n" +
  "🚀 Pronto! Só substituir os dados e começar a usar.";

 document.getElementById("resultado").innerText = mensagem
}

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
