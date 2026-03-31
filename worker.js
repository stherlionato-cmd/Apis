export default {

async fetch(request, env, ctx){

const url = new URL(request.url)
const endpoint = url.pathname.replace("/","")

if(endpoint === ""){
return home(request)
}

if(!ENDPOINTS[endpoint]){
return jsonErro("ENDPOINT_404","Endpoint não encontrado")
}

return consultar(endpoint,request,url,ctx)

}

}

/*
|--------------------------------------------------------------------------
| TOKENS
|--------------------------------------------------------------------------
*/

const TOKENS = {

dragon:{plano:"VIP",limite:"unlimited"},
IFNastro:{plano:"VIP",limite:"unlimited"},
astrofree:{plano:"FREE",limite:100},
astropro:{plano:"PRO",limite:1000}

}

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const APIKEY = "bigmouth"

/*
|--------------------------------------------------------------------------
| ENDPOINTS
|--------------------------------------------------------------------------
*/

const ENDPOINTS = {

cpf:{url:"https://knowsapi.shop/api/consulta/cpf",param:"code",query:"cpf"},
cpf2:{url:"https://knowsapi.shop/api/consulta/cpf-v2",param:"code",query:"cpf"},
cpf3:{url:"https://knowsapi.shop/api/consultas/cpf",param:"cpf",query:"cpf"},
cpf4:{url:"https://knowsapi.shop/api/consulta/cpf-v3",param:"code",query:"cpf"},
cpf5:{url:"https://knowsapi.shop/api/consulta/cpf-v4",param:"code",query:"cpf"},
cpf6:{url:"https://knowsapi.shop/api/consulta/cpf-v5",param:"code",query:"cpf"},

nome:{url:"https://knowsapi.shop/api/consultas/nome",param:"nome",query:"nome"},
nome2:{url:"https://knowsapi.shop/api/consulta/nome-v1",param:"nome",query:"nome"},

telefone:{url:"https://knowsapi.shop/api/consultas/telefone",param:"telefone",query:"telefone"},
telefone2:{url:"https://knowsapi.shop/api/consulta/telefone-v1",param:"telefone",query:"telefone"},
operadora:{url:"https://knowsapi.shop/api/consultas/operadora",param:"telefone",query:"telefone"},

email:{url:"https://knowsapi.shop/api/consultas/email",param:"email",query:"email"},

cep:{url:"https://knowsapi.shop/api/consultas/cep-v1",param:"cep",query:"cep"},
cep2:{url:"https://knowsapi.shop/api/consulta/cep-v1",param:"cep",query:"cep"},

placa:{url:"https://knowsapi.shop/api/consulta/placa-v1",param:"placa",query:"placa"},
placa2:{url:"https://knowsapi.shop/api/consulta/placa-v2",param:"placa",query:"placa"},

rg:{url:"https://knowsapi.shop/api/consultas/rg",param:"cpf",query:"cpf"},
titulo:{url:"https://knowsapi.shop/api/consultas/titulo",param:"cpf",query:"cpf"},
pis:{url:"https://knowsapi.shop/api/consultas/pis",param:"cpf",query:"cpf"},
nis:{url:"https://knowsapi.shop/api/consultas/nis",param:"cpf",query:"cpf"},

parentes:{url:"https://knowsapi.shop/api/consultas/parentes",param:"cpf",query:"cpf"},
vizinhos:{url:"https://knowsapi.shop/api/consultas/vizinhos",param:"cpf",query:"cpf"}

}

/*
|--------------------------------------------------------------------------
| CONSULTA UNIVERSAL
|--------------------------------------------------------------------------
*/

async function consultar(endpoint,request,url,ctx){

if(request.method !== "GET"){
return jsonErro("REQ_000","Método inválido")
}

const token = url.searchParams.get("token")

if(!token){
return jsonErro("AUTH_002","Token obrigatório")
}

if(!validarToken(token)){
return jsonErro("AUTH_001","Token inválido")
}

const config = ENDPOINTS[endpoint]
const valor = url.searchParams.get(config.query)

if(!valor){
return jsonErro("REQ_001","Parâmetro ausente")
}

const plano = obterPlanoToken(token)

/*
|--------------------------------------------------------------------------
| CACHE
|--------------------------------------------------------------------------
*/

const cacheKey = new Request(request.url,{method:"GET"})
const cache = caches.default

let response = await cache.match(cacheKey)

if(response){
return response
}

/*
|--------------------------------------------------------------------------
| URL FINAL
|--------------------------------------------------------------------------
*/

const apiURL =
config.url +
"?" +
config.param +
"=" +
encodeURIComponent(valor) +
"&apikey=" +
APIKEY

/*
|--------------------------------------------------------------------------
| FETCH
|--------------------------------------------------------------------------
*/

let api

try{

const res = await fetch(apiURL,{
headers:{
"User-Agent":"Mozilla/5.0",
"Accept":"application/json"
},
cf:{cacheTtl:0}
})

const text = await res.text()

try{
api = JSON.parse(text)
}catch{
return jsonErro("API_003","Resposta inválida da API",text)
}

}catch(e){
return jsonErro("API_001","Erro ao conectar API",e.toString())
}

/*
|--------------------------------------------------------------------------
| SEM RESULTADO
|--------------------------------------------------------------------------
*/

if(!api || Object.keys(api).length === 0){
return jsonErro("DATA_404","Nenhum dado encontrado")
}

/*
|--------------------------------------------------------------------------
| LIMPAR
|--------------------------------------------------------------------------
*/

let dados = limparRespostaAPI(api)
dados = normalizarDados(dados)

/*
|--------------------------------------------------------------------------
| RESPONSE PADRÃO
|--------------------------------------------------------------------------
*/

const finalResponse = {

status:true,

meta:{
api:"Astro Search API",
empresa:"Astro Company",
plano_token:plano,
endpoint:endpoint,
timestamp:new Date().toISOString()
},

consulta:{
[config.query]:valor
},

dados:dados

}

response = new Response(
JSON.stringify(finalResponse,null,2),
{
headers:{
"Content-Type":"application/json;charset=UTF-8",
"Cache-Control":"public,max-age=3600"
}
}
)

ctx.waitUntil(cache.put(cacheKey,response.clone()))

return response

}

/*
|--------------------------------------------------------------------------
| TOKENS
|--------------------------------------------------------------------------
*/

function validarToken(token){
return TOKENS.hasOwnProperty(token)
}

function obterPlanoToken(token){
return TOKENS[token]?.plano || "FREE"
}

/*
|--------------------------------------------------------------------------
| LIMPAR API
|--------------------------------------------------------------------------
*/

function limparRespostaAPI(data){

if(!data || typeof data !== "object") return data

const blacklist=[
"status",
"creator",
"api",
"criador",
"credits",
"creditos",
"mensagem",
"message"
]

for(const campo of blacklist){
delete data[campo]
}

if(data.resultado){
return data.resultado
}

return data

}

/*
|--------------------------------------------------------------------------
| NORMALIZAR
|--------------------------------------------------------------------------
*/

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

if(typeof data === "string"){

try{
return new TextDecoder().decode(new TextEncoder().encode(data))
}catch{
return data
}

}

return data

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
<html lang="pt-BR">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

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
overflow-x:hidden;
}

/* HEADER */
.header{
padding:25px;
text-align:center;
font-size:22px;
font-weight:800;
}
.header span{color:var(--blue);}

/* CONTAINER */
.container{
max-width:900px;
margin:auto;
padding:15px;
}

/* CARD */
.card{
margin-top:12px;
padding:16px;
border-radius:16px;
background:rgba(255,255,255,0.02);
transition:.3s;
cursor:pointer;
position:relative;
overflow:hidden;
}

.card::before{
content:"";
position:absolute;
inset:0;
background:radial-gradient(circle at var(--x,50%) var(--y,50%), rgba(59,130,246,.25), transparent 60%);
opacity:0;
transition:.2s;
}

.card:hover::before{opacity:1;}

.card:hover{
transform:translateY(-6px) scale(1.02);
box-shadow:0 10px 40px rgba(59,130,246,.25);
}

/* INPUT */
.input-group{
margin-top:10px;
}
.input-label{
font-size:11px;
opacity:.6;
}
.input{
width:100%;
padding:12px;
margin-top:5px;
border-radius:10px;
border:none;
background:#0b1228;
color:#fff;
}

/* BUTTON */
.btn{
margin-top:12px;
width:100%;
padding:12px;
border-radius:10px;
border:none;
background:rgba(59,130,246,0.2);
border:1px solid rgba(59,130,246,0.3);
color:#fff;
cursor:pointer;
transition:.2s;
}
.btn:hover{
background:rgba(59,130,246,0.3);
}

/* MODAL */
.modal{
position:fixed;
inset:0;
display:none;
justify-content:center;
align-items:center;
background:rgba(0,0,0,.6);
backdrop-filter:blur(10px);
z-index:999;
}

.modal-box{
width:92%;
max-width:500px;
background:#020617;
padding:20px;
border-radius:20px;
border:1px solid rgba(255,255,255,0.05);
animation:fade .3s ease;
position:relative;
}

@keyframes fade{
from{opacity:0; transform:translateY(20px)}
to{opacity:1}
}

/* ROUTE */
.route-box{
margin-top:10px;
background:#020617;
padding:10px;
border-radius:10px;
font-size:11px;
display:flex;
justify-content:space-between;
align-items:center;
}

/* RESULT */
.result-box{
margin-top:12px;
}

/* ITEM */
.item{
font-size:12px;
display:flex;
justify-content:space-between;
padding:8px;
border-radius:8px;
margin-top:6px;
background:rgba(255,255,255,0.02);
}

/* SECTION */
.section{
margin-top:10px;
background:rgba(255,255,255,0.015);
padding:10px;
border-radius:12px;
border:1px solid rgba(255,255,255,0.05);
}

/* LOADING */
.loader{
margin-top:10px;
height:40px;
border-radius:10px;
background:linear-gradient(90deg,#111,#1a1a1a,#111);
background-size:200%;
animation:load 1s infinite;
}
@keyframes load{
0%{background-position:200%}
100%{background-position:-200%}
}

/* SCAN */
.scan{
position:absolute;
inset:0;
background:linear-gradient(transparent,rgba(59,130,246,.15),transparent);
animation:scan 1.4s infinite;
border-radius:20px;
}
@keyframes scan{
0%{transform:translateY(-100%)}
100%{transform:translateY(100%)}
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

</style>

</head>

<body>

<div class="header">Astro <span>Search</span></div>

<div class="container">

${Object.keys(ENDPOINTS).map(e=>`
<div class="card" onclick="openModal('${e}')">
<strong>${e}</strong>
<div style="font-size:12px;opacity:.6;">Consulta ${e}</div>
</div>
`).join("")}

</div>

<!-- MODAL -->
<div class="modal" id="modal">
<div class="modal-box">

<div style="display:flex;justify-content:space-between;margin-bottom:10px;">
<strong id="title"></strong>
<span onclick="closeModal()" style="cursor:pointer;">✕</span>
</div>

<div class="input-group">
<div class="input-label">Token</div>
<input id="token" class="input">
</div>

<div class="input-group">
<div class="input-label">Valor</div>
<input id="valor" class="input">
</div>

<div class="route-box">
<span id="url"></span>
<button onclick="copy()">📋</button>
</div>

<button class="btn" onclick="consultar()">Consultar</button>

<div id="loading"></div>
<div id="resposta" class="result-box"></div>

</div>
</div>

<div id="toast"></div>

<script>

let endpoint=""

function openModal(e){
endpoint=e
modal.style.display="flex"
title.innerText="Consulta "+e
resposta.innerHTML=""
loading.innerHTML=""
updateUrl()
}

function closeModal(){
modal.style.display="none"
}

function updateUrl(){

let t=token.value||"TOKEN"
let v=valor.value||"VALOR"

const param=endpoint.replace(/[0-9]/g,'')

url.innerText="${base}/"+endpoint+"?token="+t+"&"+param+"="+encodeURIComponent(v)
}

token.oninput=updateUrl
valor.oninput=updateUrl

async function consultar(){

let t=token.value
let v=valor.value

if(!t||!v){
toast("Preenche tudo")
return
}

loading.innerHTML=\`
<div class="loader"></div>
<div class="scan"></div>
\`

resposta.innerHTML=""

try{

const param=endpoint.replace(/[0-9]/g,'')

const r=await fetch("${base}/"+endpoint+"?token="+t+"&"+param+"="+encodeURIComponent(v))
const data=await r.json()

loading.innerHTML=""

if(!data.status){
resposta.innerHTML="<div class='item'>Erro: "+(data.message||"Falha")+"</div>"
return
}

const res = {
meta: data.meta,
consulta: data.consulta,
dados: data.dados
}

const temp = document.createElement("div")
temp.innerHTML = render(res)

for(let el of temp.children){
await new Promise(r=>setTimeout(r,50))
resposta.appendChild(el)
}

}catch{

loading.innerHTML=""
resposta.innerHTML="<div class='item'>Erro na API</div>"

}

}

/* 🔥 RENDER DECENTE */
function render(obj){

let html=""

for(let key in obj){

let value = obj[key]

// null
if(value === null || value === undefined){
html += `<div class="item"><span>${key}</span><span>null</span></div>`
continue
}

// ARRAY
if(Array.isArray(value)){

html += `
<div class="section">
<div style="font-size:11px;opacity:.6;margin-bottom:6px;">${key} (${value.length})</div>
`

value.forEach((v,i)=>{

if(typeof v === "object"){
html += `<div class="section" style="margin-top:6px;">${render(v)}</div>`
}else{
html += `<div class="item">${v}</div>`
}

})

html += `</div>`
continue
}

// OBJETO
if(typeof value === "object"){

html += `
<div class="section">
<div style="font-size:11px;opacity:.6;margin-bottom:6px;">${key}</div>
${render(value)}
</div>
`

continue
}

// VALOR NORMAL
html += `
<div class="item">
<span>${key}</span>
<span>${value}</span>
</div>
`

}

return html
}

function copy(){
navigator.clipboard.writeText(url.innerText)
toast("Copiado")
}

function toast(msg){
toastEl.innerText=msg
toastEl.classList.add("show")
setTimeout(()=>toastEl.classList.remove("show"),2000)
}

const toastEl=document.getElementById("toast")

document.querySelectorAll(".card").forEach(card=>{
card.addEventListener("mousemove", e=>{
const rect=card.getBoundingClientRect()
card.style.setProperty("--x",(e.clientX-rect.left)+"px")
card.style.setProperty("--y",(e.clientY-rect.top)+"px")
})
})

</script>

</body>
</html>

`,{
headers:{
"content-type":"text/html;charset=UTF-8"
}
})

}