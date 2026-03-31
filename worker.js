export default {

async fetch(request, env, ctx){

const url = new URL(request.url)
const endpoint = url.pathname.replace("/","")

if(endpoint === ""){
return home()
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
| ENDPOINTS
|--------------------------------------------------------------------------
*/

const APIKEY = "bigmouth"

const ENDPOINTS = {

/* CPF */

cpf:{
url:"https://knowsapi.shop/api/consulta/cpf",
param:"code",
query:"cpf"
},

cpf2:{
url:"https://knowsapi.shop/api/consulta/cpf-v2",
param:"code",
query:"cpf"
},

cpf3:{
url:"https://knowsapi.shop/api/consultas/cpf",
param:"cpf",
query:"cpf"
},

cpf4:{
url:"https://knowsapi.shop/api/consulta/cpf-v3",
param:"code",
query:"cpf"
},

cpf5:{
url:"https://knowsapi.shop/api/consulta/cpf-v4",
param:"code",
query:"cpf"
},

cpf6:{
url:"https://knowsapi.shop/api/consulta/cpf-v5",
param:"code",
query:"cpf"
},

/* NOME */

nome:{
url:"https://knowsapi.shop/api/consultas/nome",
param:"nome",
query:"nome"
},

nome2:{
url:"https://knowsapi.shop/api/consulta/nome-v1",
param:"nome",
query:"nome"
},

/* TELEFONE */

telefone:{
url:"https://knowsapi.shop/api/consultas/telefone",
param:"telefone",
query:"telefone"
},

telefone2:{
url:"https://knowsapi.shop/api/consulta/telefone-v1",
param:"telefone",
query:"telefone"
},

operadora:{
url:"https://knowsapi.shop/api/consultas/operadora",
param:"telefone",
query:"telefone"
},

/* EMAIL */

email:{
url:"https://knowsapi.shop/api/consultas/email",
param:"email",
query:"email"
},

/* CEP */

cep:{
url:"https://knowsapi.shop/api/consultas/cep-v1",
param:"cep",
query:"cep"
},

cep2:{
url:"https://knowsapi.shop/api/consulta/cep-v1",
param:"cep",
query:"cep"
},

/* PLACA */

placa:{
url:"https://knowsapi.shop/api/consulta/placa-v1",
param:"placa",
query:"placa"
},

placa2:{
url:"https://knowsapi.shop/api/consulta/placa-v2",
param:"placa",
query:"placa"
},

/* DOCUMENTOS */

rg:{
url:"https://knowsapi.shop/api/consultas/rg",
param:"cpf",
query:"cpf"
},

titulo:{
url:"https://knowsapi.shop/api/consultas/titulo",
param:"cpf",
query:"cpf"
},

pis:{
url:"https://knowsapi.shop/api/consultas/pis",
param:"cpf",
query:"cpf"
},

nis:{
url:"https://knowsapi.shop/api/consultas/nis",
param:"cpf",
query:"cpf"
},

/* RELAÇÕES */

parentes:{
url:"https://knowsapi.shop/api/consultas/parentes",
param:"cpf",
query:"cpf"
},

vizinhos:{
url:"https://knowsapi.shop/api/consultas/vizinhos",
param:"cpf",
query:"cpf"
}

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
return jsonErro("API_003","Resposta inválida",text)
}

}catch(e){
return jsonErro("API_001","Erro na conexão",e.toString())
}

/*
|--------------------------------------------------------------------------
| LIMPAR RESPOSTA
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
"Content-Type":"application/json",
"Cache-Control":"public, max-age=3600"
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
return decodeURIComponent(escape(data))
}catch{
return data
}

}

return data

}

/*
|--------------------------------------------------------------------------
| HOME
|--------------------------------------------------------------------------
*/

function home(){

return new Response(JSON.stringify({

api:"Astro Search API",
status:"online",

endpoints:Object.keys(ENDPOINTS),

total_endpoints:Object.keys(ENDPOINTS).length

},null,2),{

headers:{
"Content-Type":"application/json"
}

})

}

/*
|--------------------------------------------------------------------------
| ERRO
|--------------------------------------------------------------------------
*/

function jsonErro(code,msg,extra=null){

return new Response(JSON.stringify({

status:false,
error_code:code,
msg:msg,
extra:extra

}),{

headers:{
"Content-Type":"application/json"
},
status:400

})

}