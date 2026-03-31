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

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
font-family:Inter,system-ui;
}

body{

background:#030712;
color:white;
min-height:100vh;
overflow-x:hidden;

}

/* PARTICLES */

canvas{
position:fixed;
top:0;
left:0;
z-index:-1;
}

/* HEADER */

header{
text-align:center;
padding:60px 20px 30px;
}

header h1{
font-size:34px;
font-weight:600;
background:linear-gradient(90deg,#4facfe,#00f2fe);
-webkit-background-clip:text;
-webkit-text-fill-color:transparent;
}

header p{
opacity:.6;
margin-top:10px;
font-size:14px;
}

/* CONTAINER */

.container{
max-width:900px;
margin:auto;
padding:20px;
}

/* CARD */

.card{

background:rgba(255,255,255,0.03);

backdrop-filter:blur(20px);

border:1px solid rgba(255,255,255,0.05);

border-radius:18px;

padding:22px;

margin-bottom:18px;

transition:.25s;

}

.card:hover{
border-color:#4facfe;
transform:translateY(-2px);
}

/* LABEL */

label{
font-size:13px;
opacity:.7;
}

/* INPUTS */

input,select{

width:100%;
padding:14px;

margin-top:8px;
margin-bottom:14px;

border-radius:10px;

border:1px solid rgba(255,255,255,0.05);

background:#020617;

color:white;

outline:none;

transition:.2s;

}

input:focus,select:focus{

border-color:#4facfe;
box-shadow:0 0 0 1px #4facfe55;

}

/* BUTTON */

button{

width:100%;

padding:14px;

border-radius:10px;

border:none;

font-weight:600;

cursor:pointer;

background:linear-gradient(90deg,#4facfe,#00f2fe);

transition:.2s;

}

button:hover{
transform:scale(1.03);
}

/* COPY BUTTON */

.copy{

margin-top:12px;

background:linear-gradient(90deg,#00ffa6,#00c3ff);

}

/* CODE */

pre{

background:#020617;

padding:16px;

border-radius:10px;

overflow:auto;

font-size:13px;

margin-top:12px;

border:1px solid rgba(255,255,255,0.05);

}

/* MODAL */

.modal{

position:fixed;

top:0;
left:0;

width:100%;
height:100%;

background:rgba(0,0,0,.6);

display:none;

align-items:center;
justify-content:center;

}

.modal-content{

background:#020617;

border:1px solid rgba(255,255,255,0.08);

padding:24px;

border-radius:16px;

width:90%;
max-width:700px;

animation:modal .3s ease;

}

@keyframes modal{

from{
opacity:0;
transform:translateY(20px);
}

to{
opacity:1;
transform:translateY(0);
}

}

/* LOADER */

.loader{

width:40px;
height:40px;

border-radius:50%;

border:4px solid rgba(255,255,255,.1);
border-top:4px solid #4facfe;

animation:spin 1s linear infinite;

margin:auto;

}

@keyframes spin{
to{transform:rotate(360deg)}
}

/* TOAST */

.toast{

position:fixed;

bottom:30px;
left:50%;

transform:translateX(-50%);

background:#020617;

padding:12px 20px;

border-radius:8px;

border:1px solid rgba(255,255,255,0.1);

opacity:0;

transition:.3s;

}

.toast.show{
opacity:1;
}

/* FOOTER */

footer{

text-align:center;

padding:40px;

font-size:13px;

opacity:.5;

}

</style>

</head>

<body>

<canvas id="particles"></canvas>

<header>

<h1>Astro Search API</h1>

<p>Painel interativo de testes da API</p>

</header>

<div class="container">

<div class="card">

<label>Token</label>
<input id="token" placeholder="Digite seu token">

<label>Endpoint</label>
<select id="endpoint">
${Object.keys(ENDPOINTS).map(e=>`<option>${e}</option>`).join("")}
</select>

<label>Valor da consulta</label>
<input id="valor" placeholder="CPF, nome ou telefone">

<button onclick="consultar()">Consultar API</button>

</div>

<div class="card">

<h3>URL gerada</h3>

<pre id="url"></pre>

<button class="copy" onclick="copiar('url')">Copiar URL</button>

</div>

</div>

<div class="modal" id="modal">

<div class="modal-content">

<h3>Resposta da API</h3>

<div id="loading" class="loader" style="display:none"></div>

<pre id="resposta"></pre>

<button class="copy" onclick="copiar('resposta')">Copiar resposta</button>

</div>

</div>

<div class="toast" id="toast">Copiado!</div>

<footer>

Astro Search API • Interface Premium

</footer>

<script>

/* PARTICLES CONSTELATION */

const canvas=document.getElementById("particles")

const ctx=canvas.getContext("2d")

canvas.width=innerWidth
canvas.height=innerHeight

let particles=[]

for(let i=0;i<100;i++){

particles.push({

x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
vx:(Math.random()-.5)*0.4,
vy:(Math.random()-.5)*0.4

})

}

function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height)

particles.forEach(p=>{

p.x+=p.vx
p.y+=p.vy

if(p.x<0||p.x>canvas.width)p.vx*=-1
if(p.y<0||p.y>canvas.height)p.vy*=-1

ctx.beginPath()
ctx.arc(p.x,p.y,1.8,0,Math.PI*2)
ctx.fillStyle="#4facfe"
ctx.fill()

particles.forEach(p2=>{

const dist=Math.hypot(p.x-p2.x,p.y-p2.y)

if(dist<100){

ctx.beginPath()

ctx.moveTo(p.x,p.y)
ctx.lineTo(p2.x,p2.y)

ctx.strokeStyle="rgba(79,172,254,.08)"
ctx.stroke()

}

})

})

requestAnimationFrame(draw)

}

draw()

/* CONSULTA */

async function consultar(){

const token=document.getElementById("token").value
const endpoint=document.getElementById("endpoint").value
const valor=document.getElementById("valor").value

const param=endpoint.replace(/[0-9]/g,'')

const url="${base}/"+endpoint+"?token="+token+"&"+param+"="+encodeURIComponent(valor)

document.getElementById("url").innerText=url

document.getElementById("modal").style.display="flex"

document.getElementById("loading").style.display="block"

document.getElementById("resposta").innerText=""

try{

const r=await fetch(url)

const j=await r.json()

document.getElementById("resposta").innerText=JSON.stringify(j,null,2)

}catch{

document.getElementById("resposta").innerText="Erro ao consultar API"

}

document.getElementById("loading").style.display="none"

}

/* COPY */

function copiar(id){

const text=document.getElementById(id).innerText

navigator.clipboard.writeText(text)

const toast=document.getElementById("toast")

toast.classList.add("show")

setTimeout(()=>toast.classList.remove("show"),2000)

}

/* FECHAR MODAL */

window.onclick=e=>{
if(e.target.id==="modal"){
document.getElementById("modal").style.display="none"
}
}

</script>

</body>
</html>

`,{
headers:{
"content-type":"text/html;charset=UTF-8"
}
})

}