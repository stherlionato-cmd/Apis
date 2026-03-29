export default {

async fetch(request, env, ctx) {

const url = new URL(request.url)

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

/*
|--------------------------------------------------------------------------
| 🔐 TOKENS
|--------------------------------------------------------------------------
*/

const TOKENS = [
"token1",
"token2"
]

const UNLIMITED = [
"vip_token"
]

if(!TOKENS.includes(token) && !UNLIMITED.includes(token)){
return jsonErro("AUTH_001","Token inválido")
}

/*
|--------------------------------------------------------------------------
| ⚡ CACHE
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
| 🔌 API SARA
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
| 📊 ESTRUTURA
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
| 🎯 FINAL
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

}

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
