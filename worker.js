export default {

async fetch(request, env, ctx) {

const url = new URL(request.url)

/*
|--------------------------------------------------------------------------
| ROUTER
|--------------------------------------------------------------------------
*/

if(url.pathname === "/cpf"){
return consultaCPF(request,url,ctx)
}

if(url.pathname === "/foto"){
return consultaFoto(request,url,ctx)
}

if(url.pathname === "/email"){
return consultaEmail(request,url,ctx)
}

if(url.pathname === "/nome"){
return consultaNome(request,url,ctx)
}

if(url.pathname === "/telefone"){
return consultaTelefone(request,url,ctx)
}

if(url.pathname === "/placa"){
return consultaPlaca(request,url,ctx)
}

return new Response(JSON.stringify({
status:false,
msg:"Endpoint não encontrado"
}),{
headers:{
"Content-Type":"application/json"
},
status:404
})

}

}

/*
|--------------------------------------------------------------------------
| 🔐 TOKENS
|--------------------------------------------------------------------------
*/

const TOKENS = [
"dragon",
"IFNastro"
]

const UNLIMITED = [
"vip_token"
]

function validarToken(token){

if(!TOKENS.includes(token) && !UNLIMITED.includes(token)){
return false
}

return true

}

/*
|--------------------------------------------------------------------------
| CPF
|--------------------------------------------------------------------------
*/

async function consultaCPF(request,url,ctx){

if(request.method !== "GET"){
return jsonErro("REQ_000","Método inválido")
}

const token = url.searchParams.get("token")
const cpf = (url.searchParams.get("cpf") || "").replace(/\D/g,'')

if(!token || !cpf){
return jsonErro("REQ_001","Parâmetros incompletos")
}

if(cpf.length !== 11){
return jsonErro("REQ_002","CPF inválido")
}

if(!validarToken(token)){
return jsonErro("AUTH_001","Token inválido")
}

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
| API
|--------------------------------------------------------------------------
*/

let api

try{

const res = await fetch(`https://sara-api.xyz/consulta/cpf?cpf=${cpf}`)

if(!res.ok){
return jsonErro("API_002","API offline")
}

api = await res.json()

}catch(e){

return jsonErro("API_001","Erro na conexão",e.toString())

}

if(!api?.resultado?.body){
return jsonErro("DATA_001","Sem dados")
}

const body = api.resultado.body

/*
|--------------------------------------------------------------------------
| RESULTADO
|--------------------------------------------------------------------------
*/

const resultado = {

identificacao:{
cpf:body.cpf ?? null,
cpf_formatado:body.cpf_masked ?? null,
nome:body.name ?? null,
primeiro_nome:body.first_name ?? null,
sobrenome:body.last_name ?? null,
sexo:body.gender ?? null,
nascimento:body.birth_date ?? null,
obito:body.death_flag ?? null,
data_obito:body.death_date ?? null
},

filiacao:{
mae:body.mother_name ?? null,
pai:body.father_name ?? null
},

documentos:{
rg:body.rg ?? null,
rg_orgao:body.rg_issuer ?? null,
rg_estado:body.rg_state ?? null,
titulo_eleitor:body.voter_id ?? null,
pis:body?.serasa_completo?.pis ?? null
},

financeiro:{
renda:body.income ?? null,
faixa_renda:body.income_bracket ?? null,
score:body?.score?.value ?? null,
classe_social:body?.social_class?.social_class ?? null,
subclasse:body?.social_class?.sub_social_class ?? null
},

poder_aquisitivo:{
nivel:body?.poder_aquisitivo?.PODER_AQUISITIVO ?? null,
renda_estimada:body?.poder_aquisitivo?.RENDA_PODER_AQUISITIVO ?? null,
faixa:body?.poder_aquisitivo?.FX_PODER_AQUISITIVO ?? null
},

profissional:{
profissao:body.occupation ?? null,
cbo:body.cbo ?? null
},

contato:{
emails:body?.serasa_completo?.emails ?? [],
telefones:body?.phones ?? []
},

enderecos:{
principal:body.address ?? {},
historico:body.all_addresses ?? []
},

veiculos:body?.vehicles?.list ?? [],

familia:{
parentes:body?.serasa_completo?.parentes ?? []
},

status_receita:body.federal_status ?? null,

qualidade_dados:body.data_quality ?? {}

}

/*
|--------------------------------------------------------------------------
| FINAL
|--------------------------------------------------------------------------
*/

const finalResponse = {

status:true,

meta:{
sistema:"Astro Search",
empresa:"Astro Company",
criador:"@puxardados5",
endpoint:"cpf",
timestamp:new Date().toISOString()
},

consulta:cpf,

dados:resultado

}

response = new Response(
JSON.stringify(finalResponse,null,2),
{
headers:{
"Content-Type":"application/json"
}
}
)

ctx.waitUntil(cache.put(cacheKey,response.clone()))

return response

}

/*
|--------------------------------------------------------------------------
| NOME
|--------------------------------------------------------------------------
*/

async function consultaNome(request,url,ctx){

if(request.method !== "GET"){
return jsonErro("REQ_000","Método inválido")
}

const token = url.searchParams.get("token")
const nome = (url.searchParams.get("nome") || "").trim()

if(!token || !nome){
return jsonErro("REQ_001","Parâmetros incompletos")
}

if(!validarToken(token)){
return jsonErro("AUTH_001","Token inválido")
}

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
| API
|--------------------------------------------------------------------------
*/

let api

try{

const res = await fetch(`https://sara-api.xyz/consulta/nome?nome=${encodeURIComponent(nome)}`)

if(!res.ok){
return jsonErro("API_002","API offline")
}

api = await res.json()

}catch(e){

return jsonErro("API_001","Erro na conexão",e.toString())

}

if(!api?.resultado?.body){
return jsonErro("DATA_001","Sem resultados")
}

const lista = api.resultado.body

/*
|--------------------------------------------------------------------------
| RESULTADOS
|--------------------------------------------------------------------------
*/

const resultados = lista.map(pessoa => ({

identificacao:{
cpf:pessoa.cpf ?? null,
nome:pessoa.name ?? null,
sexo:pessoa.gender ?? null,
nascimento:pessoa.birth_date ?? null,
rg:pessoa.rg ?? null
},

filiacao:{
mae:pessoa.mother_name?.trim() ?? null
}

}))

/*
|--------------------------------------------------------------------------
| FINAL
|--------------------------------------------------------------------------
*/

const finalResponse = {

status:true,

meta:{
sistema:"Astro Search",
empresa:"Astro Company",
criador:"@puxardados5",
endpoint:"nome",
timestamp:new Date().toISOString()
},

consulta:nome,

total_resultados:api.resultado.total_results ?? resultados.length,

dados:resultados

}

response = new Response(
JSON.stringify(finalResponse,null,2),
{
headers:{
"Content-Type":"application/json"
}
}
)

ctx.waitUntil(cache.put(cacheKey,response.clone()))

return response

}

/*
|--------------------------------------------------------------------------
| TELEFONE
|--------------------------------------------------------------------------
*/

async function consultaTelefone(request,url,ctx){

if(request.method !== "GET"){
return jsonErro("REQ_000","Método inválido")
}

const token = url.searchParams.get("token")
const telefone = (url.searchParams.get("telefone") || "").replace(/\D/g,'')

if(!token || !telefone){
return jsonErro("REQ_001","Parâmetros incompletos")
}

if(telefone.length < 10){
return jsonErro("REQ_002","Telefone inválido")
}

if(!validarToken(token)){
return jsonErro("AUTH_001","Token inválido")
}

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
| CONSULTA TELEFONE
|--------------------------------------------------------------------------
*/

let api

try{

const res = await fetch(`https://sara-api.xyz/consulta/telefone?telefone=${telefone}`)

if(!res.ok){
return jsonErro("API_002","API offline")
}

api = await res.json()

}catch(e){

return jsonErro("API_001","Erro na conexão",e.toString())

}

if(!api?.resultado?.body){
return jsonErro("DATA_001","Sem resultados")
}

const registros = api.resultado.body

/*
|--------------------------------------------------------------------------
| BUSCAR DADOS COMPLETOS PELO CPF
|--------------------------------------------------------------------------
*/

const pessoas = []

for(const item of registros){

const cpf = item.cpf?.replace(/\D/g,'')

if(!cpf) continue

try{

const cpfRes = await fetch(`https://sara-api.xyz/consulta/cpf?cpf=${cpf}`)
const cpfJson = await cpfRes.json()

if(!cpfJson?.resultado?.body) continue

const body = cpfJson.resultado.body

pessoas.push({

telefone_consultado:telefone,

identificacao:{
cpf:body.cpf ?? null,
cpf_formatado:body.cpf_masked ?? null,
nome:body.name ?? null,
sexo:body.gender ?? null,
nascimento:body.birth_date ?? null
},

localizacao:{
cidade:item.city ?? null,
estado:item.state ?? null
},

contato:{
email:item.email ?? null,
emails:body?.serasa_completo?.emails ?? [],
telefones:body?.phones ?? []
},

filiacao:{
mae:body.mother_name ?? null,
pai:body.father_name ?? null
},

enderecos:{
principal:body.address ?? {},
historico:body.all_addresses ?? []
},

familia:{
parentes:body?.serasa_completo?.parentes ?? []
},

veiculos:body?.vehicles?.list ?? []

})

}catch(e){
continue
}

}

/*
|--------------------------------------------------------------------------
| FINAL
|--------------------------------------------------------------------------
*/

const finalResponse = {

status:true,

meta:{
sistema:"Astro Search",
empresa:"Astro Company",
criador:"@puxardados5",
endpoint:"telefone",
timestamp:new Date().toISOString()
},

consulta:telefone,

total_resultados:pessoas.length,

dados:pessoas

}

response = new Response(
JSON.stringify(finalResponse,null,2),
{
headers:{
"Content-Type":"application/json"
}
}
)

ctx.waitUntil(cache.put(cacheKey,response.clone()))

return response

}

/*
|--------------------------------------------------------------------------
| PLACA
|--------------------------------------------------------------------------
*/

async function consultaPlaca(request,url,ctx){

if(request.method !== "GET"){
return jsonErro("REQ_000","Método inválido")
}

const token = url.searchParams.get("token")
const placa = (url.searchParams.get("placa") || "").toUpperCase().replace(/[^A-Z0-9]/g,'')

if(!token || !placa){
return jsonErro("REQ_001","Parâmetros incompletos")
}

if(!validarToken(token)){
return jsonErro("AUTH_001","Token inválido")
}

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
| CONSULTA API
|--------------------------------------------------------------------------
*/

let api

try{

const res = await fetch(`https://api.blackaut.shop/api/dados-pessoais/placa?placa=${placa}&apikey=EbmScZ0ntHf61KJz3H`)

if(!res.ok){
return jsonErro("API_002","API offline")
}

api = await res.json()

}catch(e){

return jsonErro("API_001","Erro na conexão",e.toString())

}

if(!api?.resultado){
return jsonErro("DATA_001","Sem dados")
}

/*
|--------------------------------------------------------------------------
| PARSE DO TEXTO
|--------------------------------------------------------------------------
*/

const texto = api.resultado.resultado || ""

function extrair(campo){

const regex = new RegExp(`• ${campo}: (.*)`)
const match = texto.match(regex)

return match ? match[1].trim() : null

}

/*
|--------------------------------------------------------------------------
| DADOS VEICULO
|--------------------------------------------------------------------------
*/

const veiculo = {

placa:extrair("PLACA"),
situacao:extrair("SITUAÇÃO"),

marca_modelo:extrair("MARCA/MODELO"),
cor:extrair("COR"),

ano_fabricacao:extrair("ANO - FABRICAÇÃO"),
ano_modelo:extrair("ANO - MODELO"),

municipio:extrair("MUNICIPIO"),
estado:extrair("ESTADO"),

chassi:extrair("CHASSI"),
renavam:extrair("RENAVAM"),

combustivel:extrair("COMBUSTIVEL"),
potencia:extrair("POTENCIA"),

tipo_veiculo:extrair("TIPO DE VEICULO"),
especie:extrair("ESPECIE"),

passageiros:extrair("QUANTIDADE DE PASSAGEIROS")

}

/*
|--------------------------------------------------------------------------
| PROPRIETARIO
|--------------------------------------------------------------------------
*/

const docProprietario = extrair("CPF/CNPJ")
const nomeProprietario = extrair("NOME")

let proprietario = {

documento:docProprietario,
nome:nomeProprietario

}

/*
|--------------------------------------------------------------------------
| ENRIQUECER COM API CPF
|--------------------------------------------------------------------------
*/

if(docProprietario && docProprietario.length === 11){

try{

const cpfRes = await fetch(`https://sara-api.xyz/consulta/cpf?cpf=${docProprietario}`)
const cpfJson = await cpfRes.json()

if(cpfJson?.resultado?.body){

const body = cpfJson.resultado.body

proprietario = {

cpf:body.cpf ?? null,
cpf_formatado:body.cpf_masked ?? null,

nome:body.name ?? null,
sexo:body.gender ?? null,
nascimento:body.birth_date ?? null,

filiacao:{
mae:body.mother_name ?? null,
pai:body.father_name ?? null
},

contato:{
emails:body?.serasa_completo?.emails ?? [],
telefones:body?.phones ?? []
},

enderecos:{
principal:body.address ?? {},
historico:body.all_addresses ?? []
},

veiculos:body?.vehicles?.list ?? []

}

}

}catch(e){}

}

/*
|--------------------------------------------------------------------------
| FINAL
|--------------------------------------------------------------------------
*/

const finalResponse = {

status:true,

meta:{
sistema:"Astro Search",
empresa:"Astro Company",
criador:"@puxardados5",
endpoint:"placa",
timestamp:new Date().toISOString()
},

consulta:placa,

dados:{
veiculo:veiculo,
proprietario:proprietario
}

}

response = new Response(
JSON.stringify(finalResponse,null,2),
{
headers:{
"Content-Type":"application/json"
}
}
)

ctx.waitUntil(cache.put(cacheKey,response.clone()))

return response

}

/*
|--------------------------------------------------------------------------
| FOTO
|--------------------------------------------------------------------------
*/

async function consultaFoto(request,url,ctx){

if(request.method !== "GET"){
return jsonErro("REQ_000","Método inválido")
}

const token = url.searchParams.get("token")
const cpf = (url.searchParams.get("cpf") || "").replace(/\D/g,'')

if(!token || !cpf){
return jsonErro("REQ_001","Parâmetros incompletos")
}

if(cpf.length !== 11){
return jsonErro("REQ_002","CPF inválido")
}

if(!validarToken(token)){
return jsonErro("AUTH_001","Token inválido")
}

let api

try{

const res = await fetch(`https://sara-api.xyz/consulta/foto-all?cpf=${cpf}`)

if(!res.ok){
return jsonErro("API_002","API offline")
}

api = await res.json()

}catch(e){

return jsonErro("API_001","Erro na conexão",e.toString())

}

if(!api?.resultado?.fotos){
return jsonErro("DATA_001","Sem fotos")
}

const fotos = api.resultado.fotos.map(f => ({
estado:f.estado,
foto_base64:f.foto
}))

return new Response(JSON.stringify({

status:true,

meta:{
sistema:"Astro Search",
empresa:"Astro Company",
criador:"@puxardados5",
endpoint:"foto",
timestamp:new Date().toISOString()
},

consulta:cpf,

total_fotos:fotos.length,

fotos:fotos

},null,2),{
headers:{
"Content-Type":"application/json"
}
})

}

/*
|--------------------------------------------------------------------------
| EMAIL
|--------------------------------------------------------------------------
*/

async function consultaEmail(request,url,ctx){

if(request.method !== "GET"){
return jsonErro("REQ_000","Método inválido")
}

const token = url.searchParams.get("token")
const email = (url.searchParams.get("email") || "").trim()

if(!token || !email){
return jsonErro("REQ_001","Parâmetros incompletos")
}

if(!validarToken(token)){
return jsonErro("AUTH_001","Token inválido")
}

let api

try{

const res = await fetch(`https://sara-api.xyz/consulta/email?email=${encodeURIComponent(email)}`)

if(!res.ok){
return jsonErro("API_002","API offline")
}

api = await res.json()

}catch(e){

return jsonErro("API_001","Erro na conexão",e.toString())

}

if(!api?.resultado?.data){
return jsonErro("DATA_001","Sem resultados")
}

const dados = api.resultado.data.map(p => ({

cpf:p.cpf ?? null,
nome:p.nome ?? null,
nascimento:p.nascimento ?? null,
email:p.email ?? null

}))

return new Response(JSON.stringify({

status:true,

meta:{
sistema:"Astro Search",
empresa:"Astro Company",
criador:"@puxardados5",
endpoint:"email",
timestamp:new Date().toISOString()
},

consulta:email,

total_resultados:dados.length,

dados:dados

},null,2),{
headers:{
"Content-Type":"application/json"
}
})

}

/*
|--------------------------------------------------------------------------
| ERROS
|--------------------------------------------------------------------------
*/

function jsonErro(code,msg,extra=null){

return new Response(
JSON.stringify({
status:false,
error_code:code,
msg:msg,
extra:extra
}),
{
headers:{
"Content-Type":"application/json"
},
status:400
})

}