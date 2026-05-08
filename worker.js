export default {
async fetch(request, env, ctx){

const url = new URL(request.url)
let endpoint = url.pathname.replace("/","")

// 🔥 ALIAS
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
  const token = url.searchParams.get("token")
  if(token !== ADMIN_TOKEN){
    return jsonErro("AUTH_ADMIN","Acesso negado")
  }
  return adminPanel(request)
}

if(endpoint === "style.css"){
  return new Response(getCSS(), {
    headers: {
      "Content-Type": "text/css",
      "Cache-Control": "public, max-age=86400"
    }
  })
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

/* ================= CONFIG ================= */

const ADMIN_TOKEN = "dragonsubdono"
const BASE_SARA = "https://sara-api.xyz/api/consulta/"

/* ================= TOKENS (SEM KV) ================= */

const TOKENS = {
  ifnvipilimitado:{plano:"VITALICIO",credits:-1,endpoints:null},
  bocadass:{plano:"VITALICIO",credits:-1,endpoints:null},
  astrofree:{plano:"FREE",credits:100,endpoints:["cpf","nome"]},
  fxckbuscas:{plano:"VITALICIO",credits:500000,endpoints:null},
  douglasvip:{plano:"VITALICIO",credits:1000,endpoints:null},
  Zontra88:{plano:"VITALICIO",credits:1000,endpoints:null},
  astropro:{plano:"VITALICIO",credits:1000,endpoints:null},
  digapony:{plano:"VITALICIO",credits:1000,endpoints:null},
  santanavip:{plano:"VITALICIO",credits:1000,endpoints:null},
  // 🧪 PLANO DE TESTE (3 BUSCAS)
    santanateste:{ 
    plano:"TESTE",
    credits:5,
    endpoints:null
  }
}

/* ================= ENDPOINTS ================= */

const ENDPOINTS = {
  placa: {
    query: "placa",
    url: "https://obitostore.shop/api/consulta/placa2",
    param: "placa"
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

  nome: {
    query: "nome",
    url: "https://obitostore.shop/api/consulta/nome3",
    param: "nome"
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

// 🔒 BLOQUEIO
if(tokenData.endpoints && !tokenData.endpoints.includes(endpoint)){
  return jsonErro("AUTH_003","Endpoint não liberado")
}

// 💰 CRÉDITOS
if(tokenData.plano !== "VITALICIO"){
  if(tokenData.credits <= 0){
    return jsonErro("LIMIT_001","Créditos esgotados")
  }
  tokenData.credits -= 1
}

const config = ENDPOINTS[endpoint]
const valor = url.searchParams.get(config.query)

if(!valor){
  return jsonErro("REQ_001","Parâmetro ausente")
}

try{

const apikey = config.tipo === "sara" ? "bigmouthh" : "bigmouthh";

const apiURL = config.url + "?" +
  config.param + "=" + encodeURIComponent(valor) +
  "&apikey=" + apikey;

  const res = await fetch(apiURL,{
    headers:{
      "User-Agent":"Mozilla/5.0",
      "Accept":"application/json"
    }
  })

  const json = await res.json()

if(!json){
  return jsonErro("API_001","Erro na API")
}

  // 🔥 LIMPEZA PADRÃO ASTRO
// 🔥 LIMPEZA PADRÃO ASTRO
let dados = json

// 🔥 TRATAMENTO ESPECÍFICO SARA
if(config.tipo === "sara"){
  dados = tratarSara(dados)
}

delete dados.criador
delete dados.status

/* ==================== PADRONIZAR RESULTADO ==================== */
function formatarResultado(dados){
  if(!dados || !dados.resultado) return dados;

  // Limpeza básica
  let resultado = dados.resultado;

  if(typeof resultado === "string"){
resultado = resultado
  .replace(/©.*?(HydraCore|Karen Search).*/gi,"")
  .replace(/══════════════════════════/g,"")
  .replace(/\r/g,"")
  .replace(/\n{2,}/g,"\n\n")
  .trim();

    // Separar seções pelo título
    const seções = resultado.split(/\n\n(?=[A-ZÀ-Ú ]{3,}:)/g).map(sec => {
      const [titulo, ...conteudo] = sec.split("\n");
      return { titulo: titulo.trim(), conteudo: conteudo.join("\n").trim() };
    });

    dados.resultado = seções;
  }

  if(typeof resultado === "object" && !Array.isArray(resultado)){
    dados.resultado = normalizarDados(resultado);
  }

  return dados;
}

// Aplica a formatação antes de retornar
dados = formatarResultado(dados);

  return new Response(JSON.stringify({
    status:true,
    meta:{
      api:"Astro Ultra",
      plano: tokenData.plano,
      creditos_restantes: tokenData.plano === "VITALICIO" ? "ilimitado" : tokenData.credits,
      endpoint,
      timestamp:new Date().toISOString()
    },
    consulta:{[config.query]:valor},
    dados
  },null,2),{
    headers:{
      "Content-Type":"application/json;charset=UTF-8"
    }
  })

}catch(e){
  return jsonErro("API_500","Erro interno")
}

}

/* ================= TRATAR SARA ================= */

function tratarSara(api){
  if(!api) return api;

  // remove lixo
  delete api.criador;
  delete api.status;

  if(api.resultado){

    // pega o body direto
    if(api.resultado.body){
      return {
        resultado: normalizarDados(api.resultado.body)
      };
    }

    // fallback caso não tenha body
    return {
      resultado: normalizarDados(api.resultado)
    };
  }

  return api;
}

/* ================= LIMPAR ================= */

function limparRespostaAPI(data){
if(!data || typeof data !== "object") return data
delete data.creator
delete data.status
return data
}

/* ================= NORMALIZAR ================= */

function normalizarDados(data){
if(Array.isArray(data)){
  return data.map(normalizarDados)
}
if(data !== null && typeof data === "object"){
  const novo={}
  for(const k in data){
    novo[k]=normalizarDados(data[k])
  }
  return novo
}
return data
}

/* ================= ERRO ================= */

function jsonErro(code,msg,extra=null){
return new Response(JSON.stringify({
  status:false,
  erro:{code,msg,extra}
},null,2),{
  headers:{"Content-Type":"application/json"}
})
}

function getCSS(){
return `
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
 border:1px solid rgba(255,255,255,0.06);
 backdrop-filter:blur(14px);

 box-shadow:
   inset 0 1px 0 rgba(255,255,255,.05),
   0 10px 40px rgba(0,0,0,.6);

 transition:.3s;
}

.card:hover{
 transform:translateY(-4px) scale(1.01);
 border-color:rgba(59,130,246,.5);
 box-shadow:
   inset 0 1px 0 rgba(255,255,255,.08),
   0 20px 60px rgba(59,130,246,.15);
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

.badge.vitalicio{
 background:rgba(168,85,247,.15);
 color:#a855f7;
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
 z-index:0;
 pointer-events:none;
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

.plan.vip{
 position:relative;
 overflow:hidden;
}

.plan.vip::after{
 content:"";
 position:absolute;
 inset:-50%;
 background:radial-gradient(circle,#facc15 1px,transparent 1px);
 background-size:18px 18px;
 opacity:.15;
 animation:stars 6s linear infinite;
 pointer-events:none;
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

button{
 position:relative;
 overflow:hidden;
}

button::after{
 content:"";
 position:absolute;
 inset:0;
 background:linear-gradient(120deg,transparent,rgba(255,255,255,.4),transparent);
 transform:translateX(-100%);
}

button:hover::after{
 transform:translateX(100%);
 transition:.6s;
}

@keyframes ripple{
 to{
  transform:scale(2);
  opacity:0;
 }
}

.plans{
 display:flex;
 flex-direction:column;
 gap:10px;
 margin-top:10px;
}

/* CARD BASE */
.plan{
 position:relative;
 padding:12px 14px;
 border-radius:14px;
 border:1px solid rgba(255,255,255,.06);
 background:linear-gradient(145deg,rgba(255,255,255,.04),rgba(255,255,255,.01));
 cursor:pointer;
 transition:.25s;
}

/* HOVER LIMPO */
.plan:hover{
 transform:translateY(-2px);
 border-color:rgba(59,130,246,.4);
}

/* HEADER */
.plan-top{
 display:flex;
 justify-content:space-between;
 font-size:13px;
 font-weight:600;
}

/* INFO */
.plan-info{
 font-size:12px;
 opacity:.6;
 margin-top:4px;
}

/* PREÇO */
.price{
 opacity:.8;
 font-weight:500;
}

/* PRO DESTAQUE */
.plan.featured{
 border:1px solid rgba(59,130,246,.6);
 box-shadow:0 10px 25px rgba(59,130,246,.12);
}

/* BADGE */
.badge-plan{
 position:absolute;
 top:10px;
 right:10px;

 background:linear-gradient(135deg,#3b82f6,#2563eb);
 color:#fff;

 font-size:10px;
 font-weight:600;
 padding:4px 10px;
 border-radius:999px;

 box-shadow:
   0 4px 12px rgba(59,130,246,.3),
   inset 0 1px 0 rgba(255,255,255,.2);

 letter-spacing:.3px;
}

.plan.featured{
 border:1px solid rgba(59,130,246,.6);
 box-shadow:
   0 10px 30px rgba(59,130,246,.15),
   inset 0 0 0 1px rgba(255,255,255,.05);
 position:relative;
}

/* glow suave animado */
.plan.featured::before{
 content:"";
 position:absolute;
 inset:0;
 border-radius:inherit;
 background:linear-gradient(120deg,transparent,rgba(59,130,246,.2),transparent);
 opacity:.4;
 pointer-events:none;
}

.plan.featured .plan-top span:first-child{
 color:#3b82f6;
}

/* SELEÇÃO */
.plan.selected{
 border-color:#3b82f6;
 background:linear-gradient(145deg,rgba(59,130,246,.15),rgba(255,255,255,.02));
}

.plan[data-plan="VITALICIO"]{
 border:1px solid rgba(168,85,247,.5);
}

.plan[data-plan="VITALICIO"]:hover{
 box-shadow:0 10px 30px rgba(168,85,247,.2);
}

.plan[data-plan="VITALICIO"] .plan-top span:first-child{
 color:#a855f7;
}

/* ================= PIX PREMIUM ================= */

.pix-box{
  margin-top:18px;
  display:none;

  padding:18px;
  border-radius:18px;

  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.04),
      rgba(255,255,255,.01)
    );

  border:1px solid rgba(59,130,246,.18);

  animation:pixFade .5s ease;

  box-shadow:
    0 10px 40px rgba(0,0,0,.45),
    inset 0 1px 0 rgba(255,255,255,.05);

  position:relative;
  overflow:hidden;
}

/* glow */
.pix-box::before{
  content:"";
  position:absolute;
  inset:0;

  background:
    linear-gradient(
      120deg,
      transparent,
      rgba(59,130,246,.12),
      transparent
    );

  transform:translateX(-100%);
  animation:shine 4s linear infinite;
}

@keyframes shine{
  to{
    transform:translateX(100%);
  }
}

@keyframes pixFade{
  from{
    opacity:0;
    transform:translateY(15px) scale(.98);
  }
  to{
    opacity:1;
    transform:translateY(0) scale(1);
  }
}

.pix-header{
  display:flex;
  align-items:center;
  gap:14px;
}

.pix-icon{
  width:54px;
  height:54px;
  border-radius:16px;

  display:flex;
  align-items:center;
  justify-content:center;

  background:
    linear-gradient(
      135deg,
      #3b82f6,
      #2563eb
    );

  font-size:24px;

  box-shadow:
    0 10px 30px rgba(59,130,246,.3);

  animation:pulse 2s infinite;
}

@keyframes pulse{
  0%{
    transform:scale(1);
  }
  50%{
    transform:scale(1.05);
  }
  100%{
    transform:scale(1);
  }
}

.pix-title{
  font-size:15px;
  font-weight:700;
}

.pix-sub{
  font-size:12px;
  opacity:.65;
  margin-top:2px;
}

.pix-info{
  margin-top:18px;
}

.pix-label{
  font-size:12px;
  opacity:.7;
  margin-bottom:8px;
}

.pix-key{
  background:#0b1228;
  border:1px solid rgba(255,255,255,.05);

  padding:14px;
  border-radius:12px;

  font-size:12px;
  word-break:break-all;

  transition:.25s;
}

.pix-key:hover{
  transform:scale(1.01);
  border-color:rgba(59,130,246,.35);
}

.pix-valor{
  margin-top:14px;

  font-size:16px;
  font-weight:800;

  color:#22c55e;

  animation:valorGlow 2s infinite;
}

@keyframes valorGlow{
  0%{
    text-shadow:0 0 0 rgba(34,197,94,0);
  }
  50%{
    text-shadow:0 0 12px rgba(34,197,94,.5);
  }
  100%{
    text-shadow:0 0 0 rgba(34,197,94,0);
  }
}

.pix-alert{
  margin-top:16px;

  padding:14px;
  border-radius:12px;

  background:
    rgba(250,204,21,.08);

  border:
    1px solid rgba(250,204,21,.15);

  font-size:12px;
  line-height:1.6;

  color:#fde68a;
}

.telegram-box{
  margin-top:16px;

  display:flex;
  align-items:center;
  gap:14px;

  text-decoration:none;
  color:#fff;

  padding:14px;
  border-radius:14px;

  background:
    linear-gradient(
      145deg,
      rgba(59,130,246,.12),
      rgba(59,130,246,.03)
    );

  border:1px solid rgba(59,130,246,.2);

  transition:.25s;
}

.telegram-box:hover{
  transform:translateY(-2px) scale(1.01);

  box-shadow:
    0 10px 25px rgba(59,130,246,.15);
}

.telegram-icon{
  width:48px;
  height:48px;
  border-radius:14px;

  display:flex;
  align-items:center;
  justify-content:center;

  background:#3b82f6;

  font-size:22px;
}

.telegram-title{
  font-size:14px;
  font-weight:700;
}

.telegram-user{
  margin-top:2px;
  font-size:12px;
  opacity:.7;
}

.pix-buttons{
  display:flex;
  flex-direction:column;
  gap:10px;

  margin-top:18px;
}

.pix-copy{
  background:
    linear-gradient(
      90deg,
      #3b82f6,
      #2563eb
    );
}

.pix-send{
  background:
    linear-gradient(
      90deg,
      #22c55e,
      #16a34a
    );
}

`
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

<link rel="stylesheet" href="/style.css">

</head>

<body>

<canvas id="bg"></canvas>

<!-- MODAL MANUTENÇÃO -->
<div class="modal" id="maintenanceModal">
  <div class="modal-box">
    <h2 style="font-size:16px;margin-bottom:10px;">⚠️ Manutenção Finalizada!</h2>
    <p style="font-size:14px;opacity:.8;line-height:1.5;">
      Aproveite as consultas.
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

<h2 style="font-size:16px;margin-bottom:10px;">
🚀 CONSULTAS ILIMITADAS
</h2>

<p style="
font-size:13px;
opacity:.75;
line-height:1.6;
margin-bottom:15px;
">
✅ CPF, Telefone, Placa. etc...<br>
✅ Endereços completos<br>
✅ Score e renda<br>
✅ Veículos e laudos<br>
✅ Parentes e vínculos<br>
✅ Muito mais...
</p>

    <input id="tokenInput" placeholder="Digite seu token">

<button onclick="salvarTokenModal()">Entrar</button>

<div style="margin-top:15px;font-size:12px;opacity:.6;">
  Planos disponíveis:
</div>

<div class="plans">

  <div class="plan" onclick="selecionarPlano('diario','14,90', this)"
    <div class="plan-top">
      <span>📅 DIÁRIO</span>
      <span class="price">R$14,90</span>
    </div>

    <div class="plan-info">
      Acesso ilimitado por 24h
    </div>
  </div>

  <div class="plan" onclick="selecionarPlano('semanal','24,90', this)"
    <div class="plan-top">
      <span>📆 SEMANAL</span>
      <span class="price">R$24,90</span>
    </div>

    <div class="plan-info">
      Consultas ilimitadas por 7 dias
    </div>
  </div>

  <div class="plan featured" onclick="selecionarPlano('vitalicio','20,90', this)"
      <div class="badge-plan">🔥 MAIS VENDIDO</div>

    <div class="plan-top">
      <span>👑 VITALÍCIO</span>
      <span class="price">R$20,90</span>
    </div>

    <div class="plan-info">
      Acesso permanente + ilimitado
    </div>
  </div>

</div>

<!-- BOX PIX -->
<div id="pixBox" class="pix-box">

  <div class="pix-header">
    <div class="pix-icon">💳</div>

    <div>
      <div class="pix-title">
        Pagamento via PIX
      </div>

      <div class="pix-sub">
        Liberação rápida após envio do comprovante
      </div>
    </div>
  </div>

  <div class="pix-info">

    <div class="pix-label">
      🔑 Chave PIX
    </div>

    <div id="pixKey" class="pix-key">
      f0d0f3b1-8776-4f06-a254-b6ea3686f71a
    </div>

    <div id="pixValor" class="pix-valor">
      💰 Valor: R$ 0,00
    </div>

  </div>

  <div class="pix-alert">
    ⏳ Após o pagamento, envie o comprovante no Telegram.
    <br>
    Seu acesso será liberado em alguns minutos.
  </div>

  <a
    href="https://t.me/puxardados5"
    target="_blank"
    class="telegram-box"
  >
    <div class="telegram-icon">
      ✈️
    </div>

    <div>
      <div class="telegram-title">
        Enviar comprovante
      </div>

      <div class="telegram-user">
        Telegram: @puxardados5
      </div>
    </div>
  </a>

  <div class="pix-buttons">

    <button onclick="copiarPix()" class="pix-copy">
      📋 Copiar Chave PIX
    </button>

    <button
      onclick="window.open('https://t.me/puxardados5')"
      class="pix-send"
    >
      📄 Enviar Comprovante
    </button>

  </div>

</div>

<canvas id="bg"></canvas>

<script>
/* ===== TOKENS ===== */
const TOKENS = {
  omaigd: "VITALICIO",
  digapony: "VITALICIO",
  santanateste: "TESTE"
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
  const texto = plano.toUpperCase();

  el.innerHTML = '<div class="badge ' + classe + '">' + texto + '</div>';
}

/* ===== PREMIUM EFFECT ===== */
function efeitoPremium(token){
  const plano = TOKENS[token];
  const body = document.body;

if(plano === "VITALICIO"){
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

const CHAVE_PIX = "f0d0f3b1-8776-4f06-a254-b6ea3686f71a";

function selecionarPlano(plano, valor, el){

  document.querySelectorAll(".plan").forEach(p=>{
    p.classList.remove("selected");
  });

  el.classList.add("selected");

  const box = document.getElementById("pixBox");

  document.getElementById("pixValor").innerHTML =
    "💰 Valor: R$ " + valor;

  box.style.display = "block";

  mostrarToast(
    "Plano " + plano.toUpperCase() + " selecionado 🚀"
  );
}

function copiarPix(){

  navigator.clipboard.writeText(CHAVE_PIX);

  mostrarToast("Chave PIX copiada ✅");
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
resBox.innerHTML = "<pre id='resposta' style='opacity:0;transform:translateY(10px)'>"+JSON.stringify(j,null,2)+"</pre>";

setTimeout(()=>{
  const el = document.getElementById("resposta");
  el.style.transition=".4s";
  el.style.opacity="1";
  el.style.transform="translateY(0)";
},50);
    mostrarToast("Consulta feita com sucesso 🚀");
  } catch {
    resBox.innerHTML = "<pre>Erro ao consultar</pre>";
    mostrarToast("Erro na consulta ❌");
  }

  btn.disabled = false;
  btn.innerText = "Consultar";
}

document.querySelectorAll("button").forEach(btn=>{
  btn.addEventListener("click", e=>{
    const ripple = document.createElement("span");
    ripple.style.position="absolute";
    ripple.style.borderRadius="50%";
    ripple.style.background="rgba(255,255,255,.4)";
    ripple.style.transform="scale(0)";
    ripple.style.animation="ripple .6s linear";

    const rect = btn.getBoundingClientRect();
    ripple.style.width = ripple.style.height = rect.width + "px";
    ripple.style.left = e.clientX - rect.left - rect.width/2 + "px";
    ripple.style.top = e.clientY - rect.top - rect.width/2 + "px";

    btn.appendChild(ripple);

    setTimeout(()=>ripple.remove(),600);
  });
});

document.querySelectorAll(".plan").forEach(plan=>{
  plan.addEventListener("click", ()=>{

    document.querySelectorAll(".plan").forEach(p=>p.classList.remove("selected"));
    plan.classList.add("selected");

    // micro feedback
    plan.style.transform = "scale(.97)";
    setTimeout(()=>plan.style.transform="",100);

  });
});

/* ===== PARTICULAS DE FUNDO ===== */
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");
let particles = [];

function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

async function verificarPagamento(url){

  const payment_id = url.searchParams.get("payment_id")

  if(!payment_id){
    return jsonErro("REQ_001","payment_id obrigatório")
  }

const api = "https://promstpagamentos.discloud.app/verify_payment?payment_id=" + payment_id

  try{
    const res = await fetch(api)
    const json = await res.json()

    // 🔥 SE PAGAMENTO CONFIRMADO
    if(json.status_pagamento === "CONCLUIDA"){
const novoToken = "user_" + Math.random().toString(36).slice(2,10)

TOKENS[novoToken] = {
  plano:"PRO",
  credits:1000,
  endpoints:null
}
      return new Response(JSON.stringify({
        status:true,
        pago:true,
        liberar_token:true,
        dados: json
      },null,2),{
        headers:{ "Content-Type":"application/json" }
      })
    }

    return new Response(JSON.stringify({
      status:true,
      pago:false,
      dados: json
    },null,2),{
      headers:{ "Content-Type":"application/json" }
    })

  }catch(e){
    return jsonErro("PAY_002","Erro ao verificar pagamento")
  }
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
