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
<html>
<head>

<meta name="viewport" content="width=device-width,initial-scale=1">

<title>Astro Search API</title>

<style>

body{
font-family:Arial;
background:#0b1f3a;
color:white;
padding:20px;
}

h1{
text-align:center;
color:#4da3ff;
}

.card{
background:#132c52;
padding:20px;
border-radius:10px;
margin-top:20px;
}

input,select{
width:100%;
padding:12px;
margin-top:10px;
border-radius:8px;
border:none;
}

button{
width:100%;
padding:12px;
margin-top:10px;
background:#4da3ff;
border:none;
border-radius:8px;
color:white;
font-weight:bold;
}

pre{
background:#000;
padding:15px;
border-radius:10px;
overflow:auto;
}

.copy{
background:#28c76f;
}

</style>

</head>

<body>

<h1>🚀 Astro Search API</h1>

<div class="card">

Token

<input id="token" placeholder="seu token">

Endpoint

<select id="endpoint">
${Object.keys(ENDPOINTS).map(e=>`<option>${e}</option>`).join("")}
</select>

Valor

<input id="valor" placeholder="valor da consulta">

<button onclick="consultar()">CONSULTAR</button>

</div>

<div class="card">

URL

<pre id="url"></pre>

<button class="copy" onclick="copiar('url')">COPIAR URL</button>

</div>

<div class="card">

RESPOSTA

<pre id="resposta"></pre>

<button class="copy" onclick="copiar('resposta')">COPIAR RESPOSTA</button>

</div>

<script>

async function consultar(){

const token=document.getElementById("token").value
const endpoint=document.getElementById("endpoint").value
const valor=document.getElementById("valor").value

const url="${base}/"+endpoint+"?token="+token+"&"+endpoint.replace(/[0-9]/g,'')+"="+valor

document.getElementById("url").innerText=url

const r=await fetch(url)
const j=await r.json()

document.getElementById("resposta").innerText=JSON.stringify(j,null,2)

}

function copiar(id){

const text=document.getElementById(id).innerText

navigator.clipboard.writeText(text)

alert("Copiado!")

}

</script>

</body>
</html>

`,{

headers:{
"content-type":"text/html"
}

})

}

/*
|--------------------------------------------------------------------------
| ERROS
|--------------------------------------------------------------------------
*/

function jsonErro(code,msg,extra=null){

return new Response(JSON.stringify({

status:false,

erro:{
codigo:code,
mensagem:msg
},

suporte:"@puxardados5",

extra:extra

},null,2),{

status:400,

headers:{
"Content-Type":"application/json"
}

})

}