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

<style>

/* RESET */

*{
margin:0;
padding:0;
box-sizing:border-box;
font-family:system-ui;
}

body{
background:#020617;
color:#e5e7eb;
min-height:100vh;
overflow-x:hidden;
}

/* BACKGROUND GLOW */

body::before{
content:"";
position:fixed;
width:600px;
height:600px;
background:radial-gradient(circle,#4facfe33,transparent);
top:-200px;
left:-200px;
filter:blur(120px);
z-index:-2;
}

/* PARTICLES */

canvas{
position:fixed;
top:0;
left:0;
z-index:-1;
opacity:.4;
}

/* HEADER */

header{
text-align:center;
padding:40px 20px;
animation:fadeIn .8s ease;
}

header h1{
font-size:32px;
background:linear-gradient(90deg,#4facfe,#00f2fe);
-webkit-background-clip:text;
-webkit-text-fill-color:transparent;
}

header p{
opacity:.6;
margin-top:8px;
}

/* CONTAINER */

.container{
max-width:850px;
margin:auto;
padding:20px;
}

/* CARD */

.card{
background:rgba(255,255,255,0.04);
border:1px solid rgba(255,255,255,0.08);
border-radius:16px;
padding:20px;
margin-bottom:20px;

backdrop-filter:blur(20px);

transition:.25s ease;

animation:fadeUp .6s ease;
}

.card:hover{
transform:translateY(-4px);
border-color:#4facfe;
box-shadow:0 10px 30px #4facfe22;
}

/* INPUT */

.input-group{
margin-top:14px;
}

input,select{
width:100%;
padding:14px;
border-radius:10px;
border:1px solid transparent;
background:#020617;
color:white;
transition:.2s;
}

input:focus,select:focus{
border-color:#4facfe;
box-shadow:0 0 0 2px #4facfe33;
outline:none;
}

/* BUTTON */

button{
width:100%;
padding:14px;
margin-top:16px;
border-radius:10px;
border:none;
font-weight:bold;
cursor:pointer;

background:linear-gradient(90deg,#4facfe,#00f2fe);
color:#000;

transition:.2s;
}

button:hover{
transform:scale(1.03);
box-shadow:0 0 20px #4facfe55;
}

button:active{
transform:scale(.97);
}

/* COPY BTN */

.copy{
background:linear-gradient(90deg,#00ffb3,#00c8ff);
color:#000;
}

/* CODE */

pre{
background:#020617;
padding:16px;
border-radius:10px;
overflow:auto;
font-size:13px;
margin-top:10px;
border:1px solid rgba(255,255,255,0.05);
}

/* LOADING OVERLAY */

.overlay{
position:fixed;
inset:0;
background:#020617cc;
display:flex;
align-items:center;
justify-content:center;
z-index:999;
backdrop-filter:blur(10px);
display:none;
}

.loader{
width:50px;
height:50px;
border-radius:50%;
border:4px solid rgba(255,255,255,.1);
border-top:4px solid #4facfe;
animation:spin 1s linear infinite;
}

/* MODAL */

.modal{
position:fixed;
top:50%;
left:50%;
transform:translate(-50%,-50%) scale(.8);
background:#020617;
padding:20px;
border-radius:12px;
border:1px solid #4facfe33;
opacity:0;
pointer-events:none;
transition:.3s;
z-index:1000;
min-width:280px;
text-align:center;
}

.modal.active{
opacity:1;
transform:translate(-50%,-50%) scale(1);
pointer-events:all;
}

.modal button{
margin-top:12px;
}

/* FOOTER */

footer{
text-align:center;
padding:30px;
opacity:.5;
font-size:13px;
}

/* ANIMATIONS */

@keyframes spin{
to{transform:rotate(360deg)}
}

@keyframes fadeIn{
from{opacity:0}
to{opacity:1}
}

@keyframes fadeUp{
from{opacity:0; transform:translateY(10px)}
to{opacity:1; transform:translateY(0)}
}

</style>

</head>

<body>

<canvas id="particles"></canvas>

<div class="overlay" id="overlay">
<div class="loader"></div>
</div>

<div class="modal" id="modal">
<p id="modalText"></p>
<button onclick="fecharModal()">OK</button>
</div>

<header>
<h1>🚀 Astro Search</h1>
<p>Interface premium de testes</p>
</header>

<div class="container">

<div class="card">

<div class="input-group">
<label>Token</label>
<input id="token" placeholder="Digite seu token">
</div>

<div class="input-group">
<label>Endpoint</label>
<select id="endpoint">
${Object.keys(ENDPOINTS).map(e=>`<option>${e}</option>`).join("")}
</select>
</div>

<div class="input-group">
<label>Valor</label>
<input id="valor" placeholder="CPF / Nome / Telefone">
</div>

<button onclick="consultar()">Consultar</button>

</div>

<div class="card">

<h3>URL</h3>
<pre id="url"></pre>
<button class="copy" onclick="copiar('url')">Copiar</button>

</div>

<div class="card">

<h3>Resposta</h3>
<pre id="resposta"></pre>
<button class="copy" onclick="copiar('resposta')">Copiar</button>

</div>

</div>

<footer>
Astro Search API • UI v2
</footer>

<script>

/* PARTICLES */

const canvas=document.getElementById("particles")
const ctx=canvas.getContext("2d")

canvas.width=innerWidth
canvas.height=innerHeight

let particles=[]

for(let i=0;i<50;i++){
particles.push({
x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
r:Math.random()*1.5,
vx:(Math.random()-.5)*.3,
vy:(Math.random()-.5)*.3
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
ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
ctx.fillStyle="#4facfe"
ctx.fill()
})

requestAnimationFrame(draw)
}

draw()

/* MODAL */

function showModal(msg){
const m=document.getElementById("modal")
document.getElementById("modalText").innerText=msg
m.classList.add("active")
}

function fecharModal(){
document.getElementById("modal").classList.remove("active")
}

/* CONSULTA */

async function consultar(){

const token=tokenEl.value
const endpoint=endpointEl.value
const valor=valorEl.value

if(!token || !valor){
showModal("Preenche tudo direito aí 😒")
return
}

const param=endpoint.replace(/[0-9]/g,'')
const url="${base}/"+endpoint+"?token="+token+"&"+param+"="+encodeURIComponent(valor)

urlEl.innerText=url
respostaEl.innerText=""

overlay.style.display="flex"

try{

const r=await fetch(url)
const j=await r.json()

respostaEl.innerText=JSON.stringify(j,null,2)
showModal("Consulta concluída 🚀")

}catch{
respostaEl.innerText="Erro ao consultar API"
showModal("Deu ruim na API 💀")
}

overlay.style.display="none"

}

/* COPY */

function copiar(id){

const text=document.getElementById(id).innerText

navigator.clipboard.writeText(text)

showModal("Copiado ✔️")

}

/* SHORTCUTS */

const tokenEl=document.getElementById("token")
const endpointEl=document.getElementById("endpoint")
const valorEl=document.getElementById("valor")
const urlEl=document.getElementById("url")
const respostaEl=document.getElementById("resposta")
const overlay=document.getElementById("overlay")

</script>

</body>
</html>

`,{
headers:{
"content-type":"text/html;charset=UTF-8"
}
})

}