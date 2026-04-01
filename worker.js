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

// Tokens válidos (padrão)
let TOKENS = {
  dragon:{plano:"VIP",limite:"Ilimitado"},
  IFNastro:{plano:"VIP",limite:"Ilimitado"},
  italoedu7:{plano:"VIP",limite:"Ilimitado"},
  astrofree:{plano:"FREE",limite:"100 consultas"},
  astropro:{plano:"PRO",limite:"1000 consultas"}
}

/* ===== CONFIG ===== */
const APIKEY = "bigmouth"

/* ===== ENDPOINTS ===== */
const ENDPOINTS = {
  cpf: { url:"https://api.blackaut.shop/api/dados-pessoais/cpf", param:"cpf", query:"cpf", apiKey:"EbmScZ0ntHf61KJz3H" },
  nome: { url: "https://api.blackaut.shop/api/dados-pessoais/nome", param:"nome", query:"nome", apiKey:"EbmScZ0ntHf61KJz3H" },
  nome3: { url: "https://api.blackaut.shop/api/dados-pessoais/nome2", param:"nome2", query:"nome", apiKey:"EbmScZ0ntHf61KJz3H" },
  renavam: { url: "https://api.blackaut.shop/api/dados-pessoais/renavam", param: "renavam", query:"renavam", apiKey:"EbmScZ0ntHf61KJz3H" },
  telefone3: { url: "https://api.blackaut.shop/api/dados-pessoais/telefone2", param: "telefone2", query:"telefone", apiKey:"EbmScZ0ntHf61KJz3H" },
  parentes2: { url: "https://api.blackaut.shop/api/dados-pessoais/parentes", param: "parentes", query:"cpf", apiKey:"EbmScZ0ntHf61KJz3H" },
  cnh: { url: "https://api.blackaut.shop/api/dados-pessoais/cnh", param: "cnh", query:"cpf", apiKey:"EbmScZ0ntHf61KJz3H" },
  cnpj: { url: "https://api.blackaut.shop/api/dados-pessoais/cnpj", param: "cnpj", query:"cnpj", apiKey:"EbmScZ0ntHf61KJz3H" }
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

  // CACHE
  const cacheKey = new Request(request.url,{method:"GET"})
  const cache = caches.default
  let response = await cache.match(cacheKey)
  if(response) return response

  // URL FINAL
  const keyToUse = config.apiKey || APIKEY
  const apiURL = `${config.url}?${config.param}=${encodeURIComponent(valor)}&apikey=${keyToUse}`;

  let api
  try{
    const res = await fetch(apiURL,{ headers:{ "User-Agent":"Mozilla/5.0","Accept":"application/json" }, cf:{cacheTtl:0} })
    const text = await res.text()
    api = JSON.parse(text)
  }catch(e){
    return jsonErro("API_001","Erro ao conectar API",e.toString())
  }

  if(!api || Object.keys(api).length===0) return jsonErro("DATA_404","Nenhum dado encontrado")

  let dados = limparRespostaAPI(api)
  dados = normalizarDados(dados)

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

  // ctx.waitUntil(cache.put(cacheKey,response.clone()))
  return new Response(JSON.stringify(finalResponse,null,2),{
    headers:{ "Content-Type":"application/json;charset=UTF-8", "Cache-Control":"no-store" }
  })
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

/* ===== ADMIN PANEL ===== */
function adminPanel(request){
  return new Response(`
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Admin Panel</title>
<style>
body{font-family:Inter;padding:20px;color:#fff;background:radial-gradient(circle at 30% 20%,#0a0f2a,#02030a);}
.card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);padding:16px;border-radius:16px;margin-top:15px;backdrop-filter:blur(10px);}
input,select{width:100%;padding:12px;margin-top:8px;border-radius:10px;border:none;background:#0b1228;color:#fff;}
button{width:100%;padding:12px;margin-top:12px;border:none;border-radius:12px;background:linear-gradient(90deg,#3b82f6,#2563eb);color:#fff;font-weight:600;}
.token-box{margin-top:10px;background:#020617;padding:10px;border-radius:10px;font-size:12px;word-break:break-all;}
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

function login(){
  const val = document.getElementById("adminToken").value
  if(val !== ADMIN){ alert("Token inválido"); return }
  document.getElementById("loginBox").style.display="none"
  document.getElementById("panel").style.display="block"
  renderEndpoints()
}

function renderEndpoints(){
  const div = document.getElementById("endpoints")
  div.innerHTML = ENDPOINTS.map(e => 
    '<label style="display:flex;gap:8px;margin-top:6px;font-size:12px;">' +
      '<input type="checkbox" value="' + e + '" checked>' + e +
    '</label>'
  ).join('')
}

function gerar(){
  const nome = document.getElementById("nome").value || "user"
  const plano = document.getElementById("plano").value
  const checks = [...document.querySelectorAll("#endpoints input:checked")]
  const perms = checks.map(c=>c.value)
  const token = nome + "_" + Math.random().toString(36).slice(2,10)
  let limite = plano==="VIP"?"Ilimitado":plano==="PRO"?"1000 consultas":"100 consultas"
  TOKENS[token] = {plano:plano,limite:limite}
  const base = window.location.origin
  const mensagem = \`🎉 TOKEN GERADO!\n🔑 Token: \${token}\n💎 Plano: \${plano}\n♾️ Limite: \${limite}\n\nExemplo: \${base}/cpf?token=\${token}&cpf=00000000000\`
  document.getElementById("resultado").innerText = mensagem
}
</script>

</body>
</html>
`,{
headers:{ "content-type":"text/html", "Cache-Control":"no-store" }
})
}

/* ===== HOME ===== */
/* ===== HOME ===== */
function home(request){

const base = new URL(request.url).origin

return new Response(`

<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Astro Search API</title>

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">

<style>
:root{--blue:#3b82f6;}
*{margin:0;padding:0;box-sizing:border-box;font-family:'Inter',sans-serif;}
body{background:radial-gradient(circle at 20% 20%, #0a0f2a, #02030a);color:#e2e8f0;padding:20px;}
.header{text-align:center;margin-bottom:20px;}
.header h1{font-size:22px;font-weight:800;}
.header span{color:var(--blue);}
.card{margin-top:15px;padding:16px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);backdrop-filter:blur(10px);}
.input-group{margin-top:10px;}
.label{font-size:11px;opacity:.6;margin-bottom:4px;}
input,select{width:100%;padding:12px;border-radius:12px;border:none;background:#0b1228;color:#fff;outline:none;}
button{width:100%;padding:12px;margin-top:12px;border-radius:12px;border:none;font-weight:600;background:linear-gradient(90deg,#3b82f6,#2563eb);color:#fff;cursor:pointer;transition:.25s;}
button:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(59,130,246,.3);}
button:active{transform:scale(.96);}
.box{margin-top:12px;background:#020617;padding:12px;border-radius:12px;font-size:12px;position:relative;}
pre{white-space:pre-wrap;word-wrap:break-word;}
.copy{margin-top:10px;background:rgba(34,197,94,.2);}
.copy:hover{box-shadow:0 0 15px rgba(34,197,94,.3);}
.loader{height:40px;border-radius:10px;background:linear-gradient(90deg,#111 25%,#1a1a1a 50%,#111 75%);background-size:200%;animation:load 1s infinite;}
@keyframes load{0%{background-position:200%}100%{background-position:-200%}}
#toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(100px);background:#111827;padding:10px 20px;border-radius:10px;font-size:12px;opacity:0;transition:.3s;}
#toast.show{transform:translateX(-50%) translateY(0);opacity:1;}
.modal{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:999;opacity:0;pointer-events:none;transition:.3s;}
.modal.show{opacity:1;pointer-events:all;}
.modal-box{width:100%;max-width:380px;background:#020617;border-radius:18px;padding:20px;transform:scale(.9);transition:.3s;}
.modal.show .modal-box{transform:scale(1);}
.badge{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:600;background:rgba(250,204,21,.2);color:#facc15;position:relative;overflow:hidden;}
#bg{position:fixed;inset:0;z-index:-1;}
</style>

</head>
<body>

<!-- MODAL MANUTENÇÃO -->
<div class="modal" id="maintenanceModal">
  <div class="modal-box">
    <h2>⚠️ Sistema em Manutenção</h2>
    <p>O sistema está passando por atualizações e estará disponível em breve.</p>
    <button onclick="fecharMaintenanceModal()">Fechar</button>
  </div>
</div>

<div class="header">
  <h1>🚀 Astro <span>Search</span></h1>
  <div id="badgeContainer"></div>
</div>

<div class="card">
<div class="input-group">
<div class="label">Token</div>
<input id="token" placeholder="seu token">
</div>
<div class="input-group">
<div class="label">Endpoint</div>
<select id="endpoint">
<option value="cpf">CPF</option>
<option value="nome">Nome</option>
<option value="nome3">Nome2</option>
<option value="renavam">RENAVAM</option>
<option value="cnh">CNH</option>
<option value="cnpj">CNPJ</option>
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
<div class="box" id="resBox"><pre id="resposta"></pre></div>
<button class="copy" onclick="copiar('resposta')">Copiar resposta</button>
</div>

<div id="toast">Copiado!</div>

<canvas id="bg"></canvas>

<script>
// ===== CONFIG =====
const TOKENS = {dragon:"VIP", italoedu7:"VIP", IFNastro:"VIP", astrofree:"FREE", astropro:"PRO"}

// ===== MODAIS =====
function fecharMaintenanceModal(){document.getElementById("maintenanceModal").classList.remove("show")}

// ===== BADGE =====
function renderBadge(plano){document.getElementById("badgeContainer").innerHTML='<div class="badge">'+plano+'</div>'}

// ===== TOAST =====
function mostrarToast(msg){const t=document.getElementById("toast");t.innerText=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),3000)}

// ===== CONSULTA =====
async function consultar(){
const btn=document.getElementById("btnConsultar")
btn.disabled=true;btn.innerText="Consultando..."
const token=document.getElementById("token").value.trim()
const endpoint=document.getElementById("endpoint").value
const valor=document.getElementById("valor").value
if(!token){alert("Digite seu token");btn.disabled=false;btn.innerText="Consultar";return}
if(!TOKENS[token]){alert("Token inválido");btn.disabled=false;btn.innerText="Consultar";return}
renderBadge(TOKENS[token])
const url=window.location.origin+"/"+endpoint+"?token="+token+"&"+endpoint+"="+encodeURIComponent(valor)
document.getElementById("url").innerText=url
document.getElementById("resBox").innerHTML='<div class="loader"></div>'
try{
const r=await fetch(url)
const j=await r.json()
document.getElementById("resBox").innerHTML="<pre>"+JSON.stringify(j,null,2)+"</pre>"
mostrarToast("Consulta feita com sucesso 🚀")
}catch(e){document.getElementById("resBox").innerHTML="<pre>Erro ao consultar</pre>";mostrarToast("Erro na consulta ❌")}
btn.disabled=false;btn.innerText="Consultar"
}

// ===== COPY =====
function copiar(id){const t=document.getElementById(id);navigator.clipboard.writeText(t.innerText);mostrarToast("Copiado!")}

// ===== PARTICULAS =====
const canvas=document.getElementById("bg"),ctx=canvas.getContext("2d");canvas.width=window.innerWidth;canvas.height=window.innerHeight
const particles=[];for(let i=0;i<80;i++)particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*2+1,vx:(Math.random()-0.5)*0.5,vy:(Math.random()-0.5)*0.5})
function drawParticles(){ctx.clearRect(0,0,canvas.width,canvas.height);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>canvas.width)p.vx*=-1;if(p.y<0||p.y>canvas.height)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,2*Math.PI);ctx.fillStyle="rgba(59,130,246,0.7)";ctx.fill()});requestAnimationFrame(drawParticles)}
drawParticles()
window.addEventListener("resize",()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight})
</script>

</body>
</html>

`,{
  headers: { 
    "content-type": "text/html;charset=UTF-8",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
  }
})

}