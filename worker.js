export default {

async fetch(request, env, ctx) {

const url = new URL(request.url)

/*
|--------------------------------------------------------------------------
| HOME
|--------------------------------------------------------------------------
*/

if(url.pathname === "/"){
return home()
}

/*
|--------------------------------------------------------------------------
| ROUTER
|--------------------------------------------------------------------------
*/

if(url.pathname === "/telefone-full"){
return consultaTelefoneFull(request,url,ctx)
}

if(url.pathname === "/telefone-cpf"){
return consultaTelefoneCPF(request,url,ctx)
}

if(url.pathname === "/ddd"){
return consultaDDD(request,url,ctx)
}

if(url.pathname === "/operadora"){
return consultaOperadora(request,url,ctx)
}

if(url.pathname === "/rg"){
return consultaRG(request,url,ctx)
}

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

if(url.pathname === "/titulo"){
return consultaTitulo(request,url,ctx)
}

if(url.pathname === "/pis"){
return consultaPIS(request,url,ctx)
}

if(url.pathname === "/nis"){
return consultaNIS(request,url,ctx)
}

if(url.pathname === "/parentes"){
return consultaParentes(request,url,ctx)
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

async function consultaTelefoneFull(request,url,ctx){

if(request.method !== "GET"){
return jsonErro("REQ_000","Método inválido")
}

const token = url.searchParams.get("token")
const telefone = (url.searchParams.get("telefone") || "").replace(/\D/g,'')

if(!token || !telefone){
return jsonErro("REQ_001","Parâmetros incompletos")
}

if(!validarToken(token)){
return jsonErro("AUTH_001","Token inválido")
}

const cacheKey = new Request(request.url,{method:"GET"})
const cache = caches.default

let response = await cache.match(cacheKey)

if(response){
return response
}

let api

try{

const res = await fetch(`https://sara-api.xyz/consulta/telefone-full?phone=${telefone}`)

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
telefone:p.telefone ?? null,

localizacao:{
cidade:p.cidade ?? null,
uf:p.uf ?? null
},

fonte:p.fonte ?? null

}))

const finalResponse = {

status:true,

meta:{
sistema:"Astro Search",
empresa:"Astro Company",
endpoint:"telefone-full",
timestamp:new Date().toISOString()
},

consulta:telefone,

total_resultados:dados.length,

dados:dados

}

response = new Response(JSON.stringify(finalResponse,null,2),{
headers:{
"Content-Type":"application/json"
}
})

ctx.waitUntil(cache.put(cacheKey,response.clone()))

return response

}

async function consultaTitulo(request,url,ctx){

if(request.method !== "GET"){
return jsonErro("REQ_000","Método inválido")
}

const token = url.searchParams.get("token")
const titulo = (url.searchParams.get("titulo") || "").replace(/\D/g,'')

if(!token || !titulo){
return jsonErro("REQ_001","Parâmetros incompletos")
}

if(!validarToken(token)){
return jsonErro("AUTH_001","Token inválido")
}

let api

try{

const res = await fetch(`https://sara-api.xyz/consulta/titulo?titulo=${titulo}`)

if(!res.ok){
return jsonErro("API_002","API offline")
}

api = await res.json()

}catch(e){
return jsonErro("API_001","Erro na conexão",e.toString())
}

if(!api?.resultado?.data){
return jsonErro("DATA_001","Sem dados")
}

const p = api.resultado.data

return new Response(JSON.stringify({

status:true,

meta:{
sistema:"Astro Search",
empresa:"Astro Company",
endpoint:"titulo",
timestamp:new Date().toISOString()
},

consulta:titulo,

dados:{
cpf:p.cpf ?? null,
nome:p.nome ?? null,
sexo:p.sexo ?? null,
nascimento:p.nascimento ?? null,

filiacao:{
mae:p.nome_mae ?? null
},

documentos:{
titulo_eleitor:p.titulo_eleitor ?? null
}

}

},null,2),{
headers:{
"Content-Type":"application/json"
}
})

}

async function consultaPIS(request,url,ctx){

if(request.method !== "GET"){
return jsonErro("REQ_000","Método inválido")
}

const token = url.searchParams.get("token")
const pis = (url.searchParams.get("pis") || "").replace(/\D/g,'')

if(!token || !pis){
return jsonErro("REQ_001","Parâmetros incompletos")
}

if(!validarToken(token)){
return jsonErro("AUTH_001","Token inválido")
}

let api

try{

const res = await fetch(`https://sara-api.xyz/consulta/pis?pis=${pis}`)

if(!res.ok){
return jsonErro("API_002","API offline")
}

api = await res.json()

}catch(e){
return jsonErro("API_001","Erro na conexão",e.toString())
}

if(!api?.resultado?.data){
return jsonErro("DATA_001","Sem dados")
}

const d = api.resultado.data

return new Response(JSON.stringify({

status:true,

meta:{
sistema:"Astro Search",
empresa:"Astro Company",
endpoint:"pis",
timestamp:new Date().toISOString()
},

consulta:pis,

dados:{
cpf:d.cpf ?? null,
pis:d.pis ?? null
}

},null,2),{
headers:{
"Content-Type":"application/json"
}
})

}

async function consultaNIS(request,url,ctx){

if(request.method !== "GET"){
return jsonErro("REQ_000","Método inválido")
}

const token = url.searchParams.get("token")
const nis = (url.searchParams.get("nis") || "").replace(/\D/g,'')

if(!token || !nis){
return jsonErro("REQ_001","Parâmetros incompletos")
}

if(!validarToken(token)){
return jsonErro("AUTH_001","Token inválido")
}

let api

try{

const res = await fetch(`https://sara-api.xyz/consulta/nis?nis=${nis}`)

if(!res.ok){
return jsonErro("API_002","API offline")
}

api = await res.json()

}catch(e){
return jsonErro("API_001","Erro na conexão",e.toString())
}

if(!api?.resultado?.data){
return jsonErro("DATA_001","Sem dados")
}

const d = api.resultado.data

return new Response(JSON.stringify({

status:true,

meta:{
sistema:"Astro Search",
empresa:"Astro Company",
endpoint:"nis",
timestamp:new Date().toISOString()
},

consulta:nis,

dados:{
cpf:d.cpf ?? null,
nis:d.pis ?? null
}

},null,2),{
headers:{
"Content-Type":"application/json"
}
})

}

async function consultaParentes(request,url,ctx){

if(request.method !== "GET"){
return jsonErro("REQ_000","Método inválido")
}

const token = url.searchParams.get("token")
const cpf = (url.searchParams.get("cpf") || "").replace(/\D/g,'')

if(!token || !cpf){
return jsonErro("REQ_001","Parâmetros incompletos")
}

if(!validarToken(token)){
return jsonErro("AUTH_001","Token inválido")
}

let api

try{

const res = await fetch(`https://sara-api.xyz/consulta/parentes?cpf=${cpf}`)

if(!res.ok){
return jsonErro("API_002","API offline")
}

api = await res.json()

}catch(e){
return jsonErro("API_001","Erro na conexão",e.toString())
}

if(!api?.resultado?.data){
return jsonErro("DATA_001","Sem dados")
}

const lista = api.resultado.data

const parentes = lista.map(p => ({

cpf:p.cpf ?? null,
nome:p.nome ?? null,
vinculo:p.vinculo ?? null

}))

return new Response(JSON.stringify({

status:true,

meta:{
sistema:"Astro Search",
empresa:"Astro Company",
endpoint:"parentes",
timestamp:new Date().toISOString()
},

consulta:cpf,

pessoa:api.resultado.pessoa ?? null,

total_resultados:parentes.length,

dados:parentes

},null,2),{
headers:{
"Content-Type":"application/json"
}
})

}

async function consultaTelefoneCPF(request,url,ctx){

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

const cacheKey = new Request(request.url,{method:"GET"})
const cache = caches.default

let response = await cache.match(cacheKey)

if(response){
return response
}

let api

try{

const res = await fetch(`https://sara-api.xyz/consulta/telefone-cpf?cpf=${cpf}`)

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

telefone:p.telefone ?? null,

ddd:p.ddd ?? null,
numero:p.numero ?? null,

nome:p.nome ?? null,

localizacao:{
cidade:p.cidade ?? null,
uf:p.uf ?? null
},

fonte:p.fonte ?? null

}))

const finalResponse = {

status:true,

meta:{
sistema:"Astro Search",
empresa:"Astro Company",
endpoint:"telefone-cpf",
timestamp:new Date().toISOString()
},

consulta:cpf,

total_resultados:dados.length,

dados:dados

}

response = new Response(JSON.stringify(finalResponse,null,2),{
headers:{
"Content-Type":"application/json"
}
})

ctx.waitUntil(cache.put(cacheKey,response.clone()))

return response

}

async function consultaDDD(request,url,ctx){

if(request.method !== "GET"){
return jsonErro("REQ_000","Método inválido")
}

const token = url.searchParams.get("token")
const ddd = (url.searchParams.get("ddd") || "").replace(/\D/g,'')

if(!token || !ddd){
return jsonErro("REQ_001","Parâmetros incompletos")
}

if(!validarToken(token)){
return jsonErro("AUTH_001","Token inválido")
}

const cacheKey = new Request(request.url,{method:"GET"})
const cache = caches.default

let response = await cache.match(cacheKey)

if(response){
return response
}

let api

try{

const res = await fetch(`https://sara-api.xyz/consulta/ddd?ddd=${ddd}`)

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

telefone:p.telefone ?? null,

localizacao:{
cidade:p.cidade ?? null,
uf:p.uf ?? null
},

operadora:p.operadora ?? null,
fonte:p.fonte ?? null

}))

const finalResponse = {

status:true,

meta:{
sistema:"Astro Search",
empresa:"Astro Company",
endpoint:"ddd",
timestamp:new Date().toISOString()
},

consulta:ddd,

total_resultados:dados.length,

dados:dados

}

response = new Response(JSON.stringify(finalResponse,null,2),{
headers:{
"Content-Type":"application/json"
}
})

ctx.waitUntil(cache.put(cacheKey,response.clone()))

return response

}

async function consultaOperadora(request,url,ctx){

if(request.method !== "GET"){
return jsonErro("REQ_000","Método inválido")
}

const token = url.searchParams.get("token")
const telefone = (url.searchParams.get("telefone") || "").replace(/\D/g,'')

if(!token || !telefone){
return jsonErro("REQ_001","Parâmetros incompletos")
}

if(!validarToken(token)){
return jsonErro("AUTH_001","Token inválido")
}

let api

try{

const res = await fetch(`https://sara-api.xyz/consulta/operadora?telefone=${telefone}`)

if(!res.ok){
return jsonErro("API_002","API offline")
}

api = await res.json()

}catch(e){
return jsonErro("API_001","Erro na conexão",e.toString())
}

if(!api?.resultado?.data){
return jsonErro("DATA_001","Sem dados")
}

const d = api.resultado.data

return new Response(JSON.stringify({

status:true,

meta:{
sistema:"Astro Search",
empresa:"Astro Company",
endpoint:"operadora",
timestamp:new Date().toISOString()
},

consulta:telefone,

dados:{
telefone:d.telefone ?? null,
telefone_formatado:d.telefone_formatado ?? null,

ddd:d.ddd ?? null,
numero:d.numero ?? null,

estado:d.estado ?? null,

tipo:d.tipo ?? null,

operadora:d.operadora ?? null,

portabilidade:d.portabilidade ?? null,

confianca:d.confianca ?? null,

nota:d.nota ?? null
}

},null,2),{
headers:{
"Content-Type":"application/json"
}
})

}

async function consultaRG(request,url,ctx){

if(request.method !== "GET"){
return jsonErro("REQ_000","Método inválido")
}

const token = url.searchParams.get("token")
const rg = (url.searchParams.get("rg") || "").replace(/\D/g,'')

if(!token || !rg){
return jsonErro("REQ_001","Parâmetros incompletos")
}

if(!validarToken(token)){
return jsonErro("AUTH_001","Token inválido")
}

let api

try{

const res = await fetch(`https://sara-api.xyz/consulta/rg?rg=${rg}`)

if(!res.ok){
return jsonErro("API_002","API offline")
}

api = await res.json()

}catch(e){
return jsonErro("API_001","Erro na conexão",e.toString())
}

if(!api?.resultado?.data){
return jsonErro("DATA_001","Sem dados")
}

const p = api.resultado.data

return new Response(JSON.stringify({

status:true,

meta:{
sistema:"Astro Search",
empresa:"Astro Company",
endpoint:"rg",
timestamp:new Date().toISOString()
},

consulta:rg,

dados:{

cpf:p.cpf ?? null,

nome:p.nome ?? null,

sexo:p.sexo ?? null,

nascimento:p.nascimento ?? null,

filiacao:{
mae:p.nome_mae ?? null,
pai:p.nome_pai ?? null
},

documentos:{
rg:p.rg ?? null,
titulo_eleitor:p.titulo_eleitor ?? null
},

profissional:{
cbo:p.cbo ?? null,
renda:p.renda ?? null
}

}

},null,2),{
headers:{
"Content-Type":"application/json"
}
})

}

/*
|--------------------------------------------------------------------------
| CPF
|--------------------------------------------------------------------------
*/

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
| CONSULTA API
|--------------------------------------------------------------------------
*/

let api

try{

const res = await fetch(`https://knowsapi.shop/api/consulta/cpf-v5?code=${cpf}&apikey=bigmouth`,{
method:"GET",
headers:{
"User-Agent":"Mozilla/5.0",
"Accept":"application/json"
}
})

const text = await res.text()

try{
api = JSON.parse(text)
}catch{
return jsonErro("API_003","Resposta inválida da API",text)
}

}catch(e){

return jsonErro("API_001","Erro na conexão",e.toString())

}

if(!api?.resultado){
return jsonErro("DATA_001","Sem dados")

}

/*
|--------------------------------------------------------------------------
| VERIFICA RESULTADO
|--------------------------------------------------------------------------
*/

if(!api){
return jsonErro("DATA_001","Nenhum dado encontrado")
}

/*
|--------------------------------------------------------------------------
| REMOVE CREDITOS
|--------------------------------------------------------------------------
*/

delete api.creator
delete api.creditos
delete api.autor

/*
|--------------------------------------------------------------------------
| RESPOSTA PADRÃO ASTRO
|--------------------------------------------------------------------------
*/

const finalResponse = {

status:true,

meta:{
sistema:"Astro Search",
empresa:"Astro Company",
criador:"@puxardados5",
endpoint:"cpf",
versao:"1.0",
timestamp:new Date().toISOString()
},

consulta:cpf,

dados:api

}

/*
|--------------------------------------------------------------------------
| RESPONSE
|--------------------------------------------------------------------------
*/

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

const res = await fetch(`https://knowsapi.shop/api/consulta/nome-v1?nome=${encodeURIComponent(nome)}&apikey=bigmouth`)

api = await res.json()

}catch(e){

return jsonErro("API_001","Erro na conexão",e.toString())

}

if(!api?.status || !api?.resultados){
return jsonErro("DATA_001","Sem resultados")
}

const lista = api.resultados

/*
|--------------------------------------------------------------------------
| RESULTADOS
|--------------------------------------------------------------------------
*/

const resultados = lista.map(pessoa => ({

identificacao:{
cpf:pessoa.cpf ?? null,
nome:pessoa.nome ?? null,
sexo:pessoa.sexo ?? null,
nascimento:pessoa.nascimento ?? null,
rg:null
},

filiacao:{
mae:null
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

total_resultados:api.total_encontrados ?? resultados.length,

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

function home(){

return new Response(`<!DOCTYPE html>
<html lang="pt-BR">

<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Astro Search API</title>

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">

<style>

*{
box-sizing:border-box;
}

body{
margin:0;
font-family:Inter;
background:#020617;
color:#e2e8f0;
overflow-x:hidden;
position:relative;
}

/* CANVAS */

canvas{
position:fixed;
top:0;
left:0;
z-index:-1;
pointer-events:none;
}

/* HEADER */

header{
padding:25px;
border-bottom:1px solid rgba(255,255,255,0.05);
display:flex;
justify-content:space-between;
align-items:center;
backdrop-filter:blur(12px);
background:rgba(2,6,23,0.7);
}

.logo{
font-size:20px;
font-weight:600;
color:#60a5fa;
letter-spacing:0.5px;
}

.stats{
font-size:12px;
color:#94a3b8;
margin-top:4px;
}

/* TOKEN */

.token-box{
display:flex;
gap:10px;
}

.token-box input{
padding:9px 12px;
border-radius:8px;
border:1px solid rgba(255,255,255,0.08);
background:#020617;
color:white;
outline:none;
transition:0.2s;
}

.token-box input:focus{
border-color:#3b82f6;
box-shadow:0 0 8px rgba(59,130,246,0.3);
}

/* CONTAINER */

.container{
max-width:1100px;
margin:auto;
padding:35px 20px;
}

/* ENDPOINT */

.endpoint{
background:rgba(15,23,42,0.7);
border:1px solid rgba(255,255,255,0.05);
border-radius:14px;
padding:22px;
margin-bottom:22px;
transition:0.25s;
backdrop-filter:blur(14px);
animation:fade 0.6s ease;
position:relative;
overflow:hidden;
}

.endpoint:hover{
transform:translateY(-4px);
border-color:#2563eb;
box-shadow:0 10px 30px rgba(37,99,235,0.2);
}

.endpoint::before{
content:"";
position:absolute;
inset:0;
background:linear-gradient(120deg,transparent,rgba(59,130,246,0.15),transparent);
opacity:0;
transition:0.3s;
}

.endpoint:hover::before{
opacity:1;
}

/* METHOD */

.method{
background:#2563eb;
padding:4px 10px;
border-radius:6px;
font-size:12px;
margin-right:8px;
}

/* INPUT */

input{
width:100%;
padding:10px;
margin-top:10px;
border-radius:8px;
border:1px solid rgba(255,255,255,0.08);
background:#020617;
color:white;
outline:none;
transition:0.2s;
}

input:focus{
border-color:#3b82f6;
}

/* BUTTONS */

.actions{
display:flex;
gap:8px;
flex-wrap:wrap;
}

button{
margin-top:10px;
padding:10px 16px;
border-radius:8px;
border:none;
background:#2563eb;
color:white;
cursor:pointer;
transition:0.2s;
font-size:13px;
}

button:hover{
background:#1d4ed8;
transform:scale(1.03);
}

.copy{
background:#334155;
}

.copy:hover{
background:#475569;
}

/* URL */

.url{
font-size:12px;
margin-top:10px;
color:#94a3b8;
word-break:break-all;
}

/* RESULT */

pre{
background:#020617;
border:1px solid rgba(255,255,255,0.05);
padding:15px;
border-radius:8px;
overflow:auto;
margin-top:12px;
font-size:12px;
max-height:260px;
}

/* LOADER */

.loader{
width:18px;
height:18px;
border:2px solid rgba(255,255,255,0.2);
border-top:2px solid #3b82f6;
border-radius:50%;
animation:spin 0.7s linear infinite;
display:inline-block;
margin-left:8px;
}

@keyframes spin{
to{transform:rotate(360deg)}
}

@keyframes fade{
from{
opacity:0;
transform:translateY(20px);
}
to{
opacity:1;
transform:translateY(0);
}
}

/* MOBILE */

@media(max-width:700px){

header{
flex-direction:column;
align-items:flex-start;
gap:10px;
}

}

</style>
</head>

<body>

<canvas id="bg"></canvas>

<header>

<div>
<div class="logo">Astro Search API</div>
<div class="stats" id="count"></div>
</div>

<div class="token-box">
<input id="token" placeholder="Digite seu token">
</div>

</header>

<div class="container" id="endpoints"></div>

<script>

/* PARTICLES */

const canvas = document.getElementById("bg")
const ctx = canvas.getContext("2d")

canvas.width = innerWidth
canvas.height = innerHeight

let particles=[]

for(let i=0;i<80;i++){
particles.push({
x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
vx:(Math.random()-0.5)*0.3,
vy:(Math.random()-0.5)*0.3
})
}

function animate(){

ctx.clearRect(0,0,canvas.width,canvas.height)

for(let p of particles){

p.x+=p.vx
p.y+=p.vy

if(p.x<0||p.x>canvas.width) p.vx*=-1
if(p.y<0||p.y>canvas.height) p.vy*=-1

ctx.beginPath()
ctx.arc(p.x,p.y,1.6,0,Math.PI*2)
ctx.fillStyle="#2563eb"
ctx.fill()

}

requestAnimationFrame(animate)

}

animate()

/* API */

const API = location.origin

const endpoints = [

{path:"cpf",param:"cpf",desc:"Consulta completa de CPF"},
{path:"nome",param:"nome",desc:"Busca pessoas por nome"},
{path:"telefone",param:"telefone",desc:"Dados vinculados ao telefone"},
{path:"telefone-full",param:"telefone",desc:"Consulta completa telefone"},
{path:"telefone-cpf",param:"cpf",desc:"Telefones vinculados ao CPF"},
{path:"ddd",param:"ddd",desc:"Busca telefones por DDD"},
{path:"operadora",param:"telefone",desc:"Consulta operadora"},
{path:"rg",param:"rg",desc:"Consulta RG"},
{path:"titulo",param:"titulo",desc:"Consulta título eleitoral"},
{path:"pis",param:"pis",desc:"Consulta PIS"},
{path:"nis",param:"nis",desc:"Consulta NIS"},
{path:"email",param:"email",desc:"Consulta por email"},
{path:"parentes",param:"cpf",desc:"Busca parentes"},
{path:"placa",param:"placa",desc:"Consulta veículo"},
{path:"foto",param:"cpf",desc:"Busca fotos do CPF"}

]

document.getElementById("count").innerText = endpoints.length+" endpoints disponíveis"

const container=document.getElementById("endpoints")

endpoints.forEach(api=>{

const div=document.createElement("div")
div.className="endpoint"

div.innerHTML=`

<span class="method">GET</span>
<b>/${api.path}</b>

<p>${api.desc}</p>

<input placeholder="Digite ${api.param}">

<div class="actions">

<button onclick="consultar('${api.path}','${api.param}',this)">
Consultar
</button>

<button class="copy" onclick="copiarUrl('${api.path}')">
Copiar URL
</button>

</div>

<div class="url" id="url-${api.path}"></div>

<pre id="result-${api.path}"></pre>

`

container.appendChild(div)

const input = div.querySelector("input")

/* ENTER faz consulta */

input.addEventListener("keypress",(e)=>{
if(e.key === "Enter"){
consultar(api.path,api.param,input)
}
})

})

function consultar(path,param,el){

const token = document.getElementById("token").value.trim()

if(!token){
alert("Digite seu token primeiro")
return
}

let input

if(el.tagName === "INPUT"){
input = el.value
}else{
input = el.parentElement.parentElement.querySelector("input").value
}

if(!input){
alert("Digite o valor da consulta")
return
}

const url = API + "/" + path + "?token=" + token + "&" + param + "=" + encodeURIComponent(input)

document.getElementById("url-"+path).innerText = url

const resultBox = document.getElementById("result-"+path)

resultBox.innerHTML = '<span class="loader"></span> consultando...'

fetch(url)
.then(r=>r.json())
.then(d=>{

resultBox.textContent = JSON.stringify(d,null,2)

})
.catch(()=>{

resultBox.textContent = "Erro na consulta"

})

}

function copiarUrl(path){

const token = document.getElementById("token").value.trim()

if(!token){
alert("Digite o token primeiro")
return
}

const url = API + "/" + path + "?token=" + token

navigator.clipboard.writeText(url)

alert("URL copiada!")

}

</script>

</body>
</html>`,{
headers:{
"Content-Type":"text/html;charset=UTF-8"
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