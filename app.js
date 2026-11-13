// Selam Market storefront. Plain ES5-friendly JavaScript so it runs on older phones too.
(function(){
var C=window.SELAM, I=window.SELAM_I18N, T=I.T, TG=C.telegram, WA=C.whatsapp;
var LI={en:0,am:1,om:2};

/* ---------- helpers ---------- */
function $(s){return document.querySelector(s)}
function $$(s){return Array.prototype.slice.call(document.querySelectorAll(s))}
function esc(t){return String(t==null?"":t).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function store(k,v){try{if(v===undefined){var x=localStorage.getItem(k);return x?JSON.parse(x):null}localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
function up(el,sel){while(el&&el.nodeType===1){var m=el.matches||el.webkitMatchesSelector||el.msMatchesSelector;if(m&&m.call(el,sel))return el;el=el.parentNode}return null}
var lang=store("sm-lang")||"en"; if(!T[lang])lang="en";
function t(k,vars){var s=T[lang][k]!=null?T[lang][k]:(T.en[k]||"");if(vars)for(var v in vars)s=s.split("{"+v+"}").join(vars[v]);return s}
function tr(map,key){var r=map[key];return r?r[LI[lang]]:key}
function birr(n){return Math.round(n).toLocaleString("en-US")+" "+(lang==="am"?"ብር":"Br")}
function toast(m){var d=document.createElement("div");d.className="toast";d.textContent=m;document.body.appendChild(d);setTimeout(function(){if(d.parentNode)d.parentNode.removeChild(d)},2600)}
function copy(text,box){
  function ok(){toast(t("copied"))}
  function fail(){if(box){box.focus();box.select()}toast(t("copyfail"))}
  try{if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(ok,fail);return}}catch(e){}
  try{if(box){box.focus();box.select();if(document.execCommand("copy")){ok();return}}}catch(e){}
  fail();
}
var TG_URL=C.telegramLink||("https://t.me/"+encodeURIComponent(TG)), WA_NUM=WA.replace(/\D/g,"");
function waUrl(msg){return "https://wa.me/"+WA_NUM+"?text="+encodeURIComponent(msg)}

/* Ethiopian calendar date */
function ecDate(d){var a=Math.floor((14-(d.getMonth()+1))/12),y=d.getFullYear()+4800-a,m=d.getMonth()+1+12*a-3;
  var jdn=d.getDate()+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045;
  var r=(jdn-1723856)%1461,n=(r%365)+365*Math.floor(r/1460);
  return {y:4*Math.floor((jdn-1723856)/1461)+Math.floor(r/365)-Math.floor(r/1460),m:Math.floor(n/30),d:(n%30)+1}}

/* ---------- language ---------- */
function applyLang(){
  document.documentElement.lang=lang;
  $$("[data-t]").forEach(function(el){el.textContent=t(el.getAttribute("data-t"))});
  $$("[data-tp]").forEach(function(el){el.placeholder=t(el.getAttribute("data-tp"))});
  $$("[data-lang]").forEach(function(b){b.setAttribute("aria-pressed",b.getAttribute("data-lang")===lang?"true":"false")});
  var e=ecDate(new Date());
  $("#ecDate").textContent=(lang==="am"?I.MONTHS_AM[e.m]:I.MONTHS_LAT[e.m])+" "+e.d+", "+e.y+" "+t("era");
  $("#pvStats").hidden=!C.analyticsToken;$("#pvContact").textContent=t("pv_ct",{tg:TG,wa:WA});
  renderShop();renderMarket();renderGifts();renderBoard();if(curView==="item")renderDetail();
}

/* ---------- router ---------- */
var VIEWS=["shop","gifts","from-addis","order-abroad","travelers","about","privacy"];
var curView="shop", detail=null, savedY={};
function route(){var h=location.hash.slice(1),m=/^(item|addis)-(\d+)$/.exec(h),v=h==="products"?"shop":h,prev=curView;
  if(m){v="item";detail={kind:m[1],id:m[2]}}else{detail=null;if(VIEWS.indexOf(v)<0)v="shop"}
  if(prev!=="item"&&v==="item")savedY[prev]=window.pageYOffset||0;
  curView=v;
  $$("[data-view]").forEach(function(s){s.hidden=s.getAttribute("data-view")!==v});
  var nav=v==="item"?(detail.kind==="addis"?"from-addis":"shop"):v;
  $$("[data-v]").forEach(function(a){if(a.getAttribute("data-v")===nav)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
  if(v==="item"){renderDetail();window.scrollTo(0,0);return}
  document.title="Selam Market";
  if(h==="products"){var p=$("#products");if(p)p.scrollIntoView()}
  else if(prev==="item"&&savedY[v]!=null)window.scrollTo(0,savedY[v]);
  else window.scrollTo(0,0)}
window.addEventListener("hashchange",route);

/* ---------- shop ---------- */
var ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 9h16l-1.2 11H5.2zM8 9V7a4 4 0 0 1 8 0v2"/></svg>';
var items=store("sm-items-cache"), state=items?"ready":"loading", cat="All";
function loadItems(){
  var url=C.supabaseUrl+"/rest/v1/items?select=*&status=neq.sold&order=created_at.desc";
  fetch(url,{headers:{apikey:C.supabaseAnonKey,Authorization:"Bearer "+C.supabaseAnonKey}})
   .then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})
   .then(function(d){items=d;state="ready";store("sm-items-cache",d);renderShop();if(curView==="item")renderDetail()})
   .catch(function(){if(!items){state="error";renderShop();if(curView==="item")renderDetail()}});
}
function renderShop(){
  var grid=$("#grid");
  if(state==="loading"){grid.innerHTML=new Array(5).join('<div class="skel"></div>');$("#cats").innerHTML="";return}
  if(state==="error"){grid.innerHTML='<p class="empty">'+esc(t("load_err"))+"</p>";return}
  var seen={},cats=["All"];items.forEach(function(i){if(!seen[i.category]){seen[i.category]=1;cats.push(i.category)}});
  if(cats.indexOf(cat)<0)cat="All";
  $("#cats").innerHTML=cats.length>2?cats.map(function(c){return '<button type="button" class="chip" data-cat="'+esc(c)+'" aria-pressed="'+(c===cat)+'">'+esc(c==="All"?t("all"):tr(I.CATS,c))+"</button>"}).join(""):"";
  if(!items.length){grid.innerHTML='<p class="empty">'+esc(t("empty"))+"</p>";return}
  var q=$("#q").value.toLowerCase();
  var list=items.filter(function(i){return (cat==="All"||i.category===cat)&&(i.name+" "+(i.description||"")+" "+i.category+" "+tr(I.CATS,i.category)).toLowerCase().indexOf(q)>-1});
  grid.innerHTML=list.length?list.map(function(i,n){var res=i.status==="reserved";
    return shopCard(i,n)}).join("")
    :'<p class="empty">'+esc(t("nomatch"))+"</p>";
}
function shopCard(i,n){var res=i.status==="reserved",href="#item-"+esc(i.id);
  return '<article class="card"><a class="open" href="'+href+'"><div class="ph">'+(i.photo_url?'<img src="'+esc(i.photo_url)+'" alt="'+esc(i.name)+'" width="600" height="480" decoding="async"'+(n>3?' loading="lazy"':'')+'>':ICON)+
    '<span class="badge'+(res?" res":"")+'">'+esc(res?t("reserved"):tr(I.CONDS,i.condition))+'</span>'+(i.is_sample?'<span class="stag">'+esc(t("sample"))+'</span>':'')+'</div></a>'+
    '<div class="bd"><a class="open" href="'+href+'"><h3>'+esc(i.name)+"</h3></a>"+(i.description?'<div class="meta clamp">'+esc(i.description)+"</div>":"")+
    '<div class="meta">'+esc(t("pickup",{a:i.pickup_area}))+'</div><div class="price">'+birr(i.price_etb)+"</div>"+
    '<button type="button" class="btn pri sm" data-buy="'+esc(i.id)+'">'+esc(i.is_sample?t("sample_ask"):res?t("ask"):t("buy"))+"</button></div></article>"}
$("#q").addEventListener("input",renderShop);

/* ---------- From Addis (approved seller products, price on request) ---------- */
var market=store("sm-market-cache"), mstate=market?"ready":"loading", mcat="All";
function loadMarket(){
  fetch(C.supabaseUrl+"/rest/v1/marketplace_products?select=*&order=created_at.desc",{headers:{apikey:C.supabaseAnonKey,Authorization:"Bearer "+C.supabaseAnonKey}})
   .then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})
   .then(function(d){market=d;mstate="ready";store("sm-market-cache",d);renderMarket();if(curView==="item")renderDetail()})
   .catch(function(){if(!market){mstate="error";renderMarket();if(curView==="item")renderDetail()}});
}
function renderMarket(){
  var grid=$("#fgrid");
  if(mstate==="loading"){grid.innerHTML=new Array(5).join('<div class="skel"></div>');return}
  if(mstate==="error"){grid.innerHTML='<p class="empty">'+esc(t("load_err"))+"</p>";return}
  if(!market.length){$("#fcats").innerHTML="";grid.innerHTML='<p class="empty">'+esc(t("fa_empty"))+"</p>";return}
  var seen={},cats=["All"];market.forEach(function(i){if(!seen[i.category]){seen[i.category]=1;cats.push(i.category)}});
  if(cats.indexOf(mcat)<0)mcat="All";
  $("#fcats").innerHTML=cats.length>2?cats.map(function(c){return '<button type="button" class="chip" data-mcat="'+esc(c)+'" aria-pressed="'+(c===mcat)+'">'+esc(c==="All"?t("all"):tr(I.CATS,c))+"</button>"}).join(""):"";
  var q=$("#fq").value.toLowerCase();
  var list=market.filter(function(i){return (mcat==="All"||i.category===mcat)&&(i.name+" "+(i.description||"")+" "+i.shop_name+" "+tr(I.CATS,i.category)).toLowerCase().indexOf(q)>-1});
  grid.innerHTML=list.length?list.map(function(i,n){
    return marketCard(i,n)}).join("")
    :'<p class="empty">'+esc(t("nomatch"))+"</p>";
}
function marketCard(i,n){var href="#addis-"+esc(i.id);
  return '<article class="card"><a class="open" href="'+href+'"><div class="ph">'+(i.photo_url?'<img src="'+esc(i.photo_url)+'" alt="'+esc(i.name)+'" width="600" height="480" decoding="async"'+(n>3?' loading="lazy"':'')+'>':ICON)+
    '<span class="badge">'+esc(tr(I.CONDS,i.condition))+'</span>'+(i.is_sample?'<span class="stag">'+esc(t("sample"))+'</span>':'')+'</div></a><div class="bd"><a class="open" href="'+href+'"><h3>'+esc(i.name)+"</h3></a>"+
    (i.description?'<div class="meta clamp">'+esc(i.description)+"</div>":"")+'<div class="shop">'+esc(t("fa_shop",{s:i.shop_name,a:i.shop_area}))+"</div>"+
    '<button type="button" class="btn pri sm" data-ask="'+esc(i.id)+'" style="margin-top:8px">'+esc(t("fa_ask"))+"</button></div></article>"}
$("#fq").addEventListener("input",renderMarket);

/* ---------- gifts for family (priced in CAD) ---------- */
var GIFT_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1.5-3-5-3.5-5-1.2C7 7 9.5 7 12 7zm0 0c1.5-3 5-3.5 5-1.2C17 7 14.5 7 12 7z"/></svg>';
var gifts=store("sm-gifts-cache"), gstate=gifts?"ready":"loading";
function cad(n){n=+n;return "$"+(n%1?n.toFixed(2):n.toFixed(0))+" CAD"}
function loadGifts(){
  fetch(C.supabaseUrl+"/rest/v1/gifts?select=*&active=is.true&order=sort.asc,id.asc",{headers:{apikey:C.supabaseAnonKey,Authorization:"Bearer "+C.supabaseAnonKey}})
   .then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})
   .then(function(d){gifts=d;gstate="ready";store("sm-gifts-cache",d);renderGifts()})
   .catch(function(){if(!gifts){gstate="error";renderGifts()}});
}
function renderGifts(){
  var grid=$("#ggrid");
  if(gstate==="loading"){grid.innerHTML=new Array(4).join('<div class="skel"></div>');return}
  var custom='<div class="gcustom"><h3>'+esc(t("g_custom_t"))+"</h3><p>"+esc(t("g_custom_s"))+'</p><button type="button" class="btn ghost" data-gcustom>'+esc(t("g_custom_btn"))+"</button></div>";
  if(gstate==="error"){grid.innerHTML='<p class="empty">'+esc(t("load_err"))+"</p>";return}
  if(!gifts.length){grid.innerHTML='<p class="empty">'+esc(t("g_empty"))+"</p>"+custom;return}
  grid.innerHTML=gifts.map(function(g,n){
    return '<article class="card gcard"><div class="ph" data-gift="'+esc(g.id)+'" style="cursor:pointer">'+(g.photo_url?'<img src="'+esc(g.photo_url)+'" alt="'+esc(g.name)+'" width="600" height="480" decoding="async"'+(n>3?' loading="lazy"':'')+'>':GIFT_ICON)+
      '<span class="badge occ">'+esc(tr(I.OCC,g.occasion))+'</span>'+(g.is_sample?'<span class="stag">'+esc(t("sample"))+'</span>':'')+'</div><div class="bd"><h3>'+esc(g.name)+"</h3>"+
      (g.description?'<div class="meta">'+esc(g.description)+"</div>":"")+'<div class="gprice">'+cad(g.price_cad)+"</div>"+
      '<button type="button" class="btn pri sm" data-gift="'+esc(g.id)+'">'+esc(t("g_send"))+"</button></div></article>"}).join("")+custom;
}
var GIFT_CITIES=["Addis Ababa","Adama","Bishoftu","Bahir Dar","Hawassa","Dire Dawa","Harar","Jimma","Dessie","Gondar","Mekelle"];
function giftSheet(g){
  var cities=GIFT_CITIES.map(function(c){return '<option value="'+esc(c)+'">'+esc(c)+"</option>"}).join("")+'<option value="other">'+esc(t("c_other_city"))+"</option>";
  var pay=[["etransfer","pay_etr"],["paypal","pay_pp"],["cash","pay_cash"]].map(function(p,i){return '<label data-pay="'+p[0]+'"><input type="radio" name="gpay" value="'+p[0]+'"'+(i?"":" checked")+"><span>"+esc(t(p[1]))+"</span></label>"}).join("");
  openSheet('<h2>'+esc(t("gf_t",{n:g.name}))+'</h2><p class="sub">'+esc(tr(I.OCC,g.occasion))+" · "+cad(g.price_cad)+'</p>'+(g.is_sample?'<p class="snote">'+esc(t("sample_gift_note"))+"</p>":"")+'<form id="gf" class="fields cols" novalidate>'+
   '<label><span>'+esc(t("gf_you"))+'</span><input id="gyou" autocomplete="name"></label>'+
   '<label><span>'+esc(t("gf_where"))+'</span><select id="gwhere"><option value="ca">'+esc(t("c_ca"))+'</option><option value="us">'+esc(t("c_us"))+'</option><option value="other">'+esc(t("c_other"))+"</option></select></label>"+
   '<label><span>'+esc(t("gf_rname"))+'</span><input id="grname"></label>'+
   '<label><span>'+esc(t("gf_rphone"))+'</span><input id="grphone" type="tel" inputmode="tel" placeholder="+251 9__ ___ ___"></label>'+
   '<label><span>'+esc(t("gf_city"))+'</span><select id="gcity">'+cities+"</select></label>"+
   '<label><span>'+esc(t("gf_date"))+'</span><input id="gdate" type="date"></label>'+
   '<label class="full"><span>'+esc(t("gf_area"))+'</span><input id="garea"></label>'+
   '<p class="note full" id="gfee" hidden>'+esc(t("gf_fee"))+"</p>"+
   '<label class="full"><span>'+esc(t("gf_note"))+'</span><textarea id="gnote" style="min-height:64px"></textarea></label>'+
   '<div class="full"><b style="font-size:13.5px">'+esc(t("gf_pay"))+'</b><div class="payopts" role="radiogroup">'+pay+'</div><p class="note">'+esc(t("gf_pay_note"))+"</p></div>"+
   '<button class="btn pri full" type="submit">'+esc(t("gf_next"))+'</button><button class="btn ghost full" type="button" data-close>'+esc(t("cancel"))+"</button></form>");
  $("#gcity").addEventListener("change",function(){$("#gfee").hidden=this.value==="Addis Ababa"});
  function syncPay(){var ca=$("#gwhere").value==="ca",et=$('[data-pay="etransfer"]'),pm=document.querySelector('input[name="gpay"]:checked');
    et.hidden=!ca;if(!ca&&pm&&pm.value==="etransfer")document.querySelector('input[name="gpay"][value="paypal"]').checked=true}
  $("#gwhere").addEventListener("change",syncPay);
  $$('input[name="gpay"]').forEach(function(r){r.addEventListener("change",syncPay)});
  $("#gf").addEventListener("submit",function(e){e.preventDefault();
    var y=$("#gyou").value.trim(),r=$("#grname").value.trim(),ph=$("#grphone").value.trim();
    if(!y||!r||!ph){toast(t("gf_req"));return}
    var city=$("#gcity").value==="other"?t("c_other_city"):$("#gcity").value,pm=document.querySelector('input[name="gpay"]:checked');
    var wh=$("#gwhere"),msg=t("gf_msg",{g:g.name,p:cad(g.price_cad),y:y,w:wh.options[wh.selectedIndex].text,r:r,ph:ph,c:city,a:$("#garea").value.trim()||"-",d:$("#gdate").value||"-",m:$("#gnote").value.trim()||"-",
      pay:t(pm.value==="etransfer"?"pay_etr":pm.value==="paypal"?"pay_pp":"pay_cash")});
    if(g.is_sample)msg+="\n"+t("sample_gift_tag");
    contactSheet(t("gf_t",{n:g.name}),t("gf_after"),msg,true)});
}

/* ---------- item detail page ---------- */
function findIn(list,id){var r=null;(list||[]).forEach(function(x){if(String(x.id)===String(id))r=x});return r}
function renderDetail(){
  if(!detail)return;var box=$("#detail"),addis=detail.kind==="addis",list=addis?market:items,st=addis?mstate:state;
  var backHref=addis?"#from-addis":"#shop",back='<a class="back" href="'+backHref+'">'+esc(t("back"))+"</a>";
  if(!list&&st!=="error"){box.innerHTML=back+'<div class="skel" style="height:360px"></div>';return}
  var i=findIn(list,detail.id);
  if(!i){document.title="Selam Market";box.innerHTML=back+'<div class="gone"><h1>'+esc(t("gone_t"))+"</h1><p>"+esc(t("gone_p"))+'</p><a class="btn pri" href="'+backHref+'">'+esc(t("btn_browse"))+"</a></div>";return}
  document.title=i.name+" · Selam Market";
  var res=!addis&&i.status==="reserved";
  var pic='<div class="pic">'+(i.photo_url?'<a href="'+esc(i.photo_url)+'" target="_blank" rel="noopener"><img src="'+esc(i.photo_url)+'" alt="'+esc(i.name)+'"></a>':ICON)+
    '<span class="badge'+(res?" res":"")+'">'+esc(res?t("reserved"):tr(I.CONDS,i.condition))+"</span>"+(i.is_sample?'<span class="stag">'+esc(t("sample"))+'</span>':'')+"</div>";
  var rows=[[t("d_cat"),tr(I.CATS,i.category)],[t("d_cond"),tr(I.CONDS,i.condition)]];
  if(addis)rows.push([t("d_shop"),i.shop_name+" · "+t("in_addis",{a:i.shop_area})]);else rows.push([t("d_pick"),t("in_addis",{a:i.pickup_area})]);
  rows.push([t("d_num"),"#"+i.id]);
  var info='<div class="info2"><h1>'+esc(i.name)+"</h1>"+
    (addis?'<div class="shopline">'+esc(t("fa_shop",{s:i.shop_name,a:i.shop_area}))+"</div>":'<div class="bigprice">'+birr(i.price_etb)+"</div>")+
    (i.is_sample?'<p class="snote">'+esc(t("sample_note"))+"</p>":"")+
    '<div class="actions">'+(addis?'<button type="button" class="btn pri block" data-ask="'+esc(i.id)+'">'+esc(t("fa_ask"))+"</button>":
      '<button type="button" class="btn pri block" data-buy="'+esc(i.id)+'">'+esc(i.is_sample?t("sample_ask"):res?t("ask"):t("buy"))+"</button>")+
    '<button type="button" class="btn ghost block" data-share>'+esc(t("share"))+"</button></div>"+
    (i.description?"<h2>"+esc(t("desc_t"))+'</h2><p class="desc">'+esc(i.description)+"</p>":"")+
    "<dl>"+rows.map(function(r){return "<dt>"+esc(r[0])+"</dt><dd>"+esc(r[1])+"</dd>"}).join("")+"</dl>"+
    '<div class="why"><b>'+esc(t("why_t"))+"</b><ul>"+(addis?["fa_why1","fa_why2","pay_na"]:["insp_short","del_addis","pay_et"]).map(function(k){return "<li>"+esc(t(k))+"</li>"}).join("")+"</ul></div></div>";
  var more=(list||[]).filter(function(x){return String(x.id)!==String(i.id)&&x.category===i.category}).slice(0,4);
  if(more.length<2)more=(list||[]).filter(function(x){return String(x.id)!==String(i.id)}).slice(0,4);
  box.innerHTML=back+'<div class="dt">'+pic+info+"</div>"+
    (more.length?'<div class="more"><h2>'+esc(t("more_t"))+'</h2><div class="grid">'+more.map(function(x,n){return addis?marketCard(x,n+4):shopCard(x,n+4)}).join("")+"</div></div>":"");
}
function shareItem(){var url=location.href.split("#")[0]+"#"+(detail.kind==="addis"?"addis-":"item-")+detail.id;
  var i=findIn(detail.kind==="addis"?market:items,detail.id),title=i?i.name:"Selam Market";
  try{if(navigator.share){navigator.share({title:title,text:title+" · Selam Market",url:url}).catch(function(){});return}}catch(e){}
  try{if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(url).then(function(){toast(t("link_copied"))},function(){toast(url)});return}}catch(e){}
  toast(url)}

/* ---------- bottom sheet ---------- */
var lastFocus=null;
function openSheet(html){lastFocus=document.activeElement;$("#sheet").innerHTML=html;$("#modal").hidden=false;document.body.style.overflow="hidden";
  var f=$("#sheet").querySelector("textarea,input,select");if(f)f.focus()}
function closeSheet(){$("#modal").hidden=true;document.body.style.overflow="";if(lastFocus&&lastFocus.focus)lastFocus.focus()}
$("#modal").addEventListener("click",function(e){if(e.target.id==="modal"||up(e.target,"[data-close]"))closeSheet()});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!$("#modal").hidden)closeSheet()});
function botCode(){var a="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789",o="",r=new Uint8Array(18);
  try{crypto.getRandomValues(r)}catch(e){for(var j=0;j<18;j++)r[j]=Math.random()*256}
  for(var i=0;i<18;i++)o+=a[r[i]%a.length];return o}
function contactSheet(title,sub,msg,waFirst){
  var BOT=C.telegramBot, bk=BOT?"_bot":"";
  var tgBtn='<a class="btn '+(waFirst?"ghost":"pri")+' block" id="tgGo" target="_blank" rel="noopener" href="'+(BOT?"https://t.me/"+encodeURIComponent(BOT):TG_URL)+'">'+esc(t((waFirst?"dlg_tg_alt":"dlg_tg")+bk))+"</a>",
      waBtn='<a class="btn '+(waFirst?"pri":"ghost")+' block" id="waGo" target="_blank" rel="noopener" href="'+waUrl(msg)+'">'+esc(t(waFirst?"dlg_wa_main":"dlg_wa"))+"</a>";
  openSheet('<h2>'+esc(title)+'</h2>'+(sub?'<p class="sub">'+esc(sub)+"</p>":"")+
   '<label><span>'+esc(t("dlg_msg"))+'</span><textarea id="cmsg">'+esc(msg)+"</textarea></label>"+
   '<div class="stack">'+(waFirst?waBtn+tgBtn:tgBtn+waBtn)+"</div>"+
   '<p class="note">'+esc(t(waFirst?"dlg_note_wa":"dlg_note"+bk))+"</p>"+
   '<div class="contacts"><div><span>Telegram</span><b>@'+esc(BOT||TG)+"</b></div><div><span>WhatsApp</span><b>"+esc(WA)+"</b></div></div>"+
   '<div class="stack"><button type="button" class="btn ghost" data-close>'+esc(t("close"))+"</button></div>");
  var box=$("#cmsg");
  box.addEventListener("input",function(){$("#waGo").href=waUrl(box.value)});
  $("#tgGo").addEventListener("click",function(){
    if(!BOT){copy(box.value,box);return}
    // Save the message with a one-time code; the bot picks it up when the customer taps Start.
    var code=botCode();this.href="https://t.me/"+encodeURIComponent(BOT)+"?start="+code;
    try{fetch(C.supabaseUrl+"/rest/v1/bot_orders",{method:"POST",keepalive:true,headers:{apikey:C.supabaseAnonKey,Authorization:"Bearer "+C.supabaseAnonKey,"Content-Type":"application/json",Prefer:"return=minimal"},
      body:JSON.stringify({code:code,message:box.value.trim().slice(0,3000)||"-",page:(location.hash||"#shop").slice(0,200),lang:lang})})}catch(e){}
    copy(box.value,box)});
}

document.addEventListener("click",function(e){
  var l=up(e.target,"[data-lang]");if(l){lang=l.getAttribute("data-lang");store("sm-lang",lang);applyLang();return}
  var mc=up(e.target,"[data-mcat]");if(mc){mcat=mc.getAttribute("data-mcat");renderMarket();return}
  var ak=up(e.target,"[data-ask]");if(ak){var aid=ak.getAttribute("data-ask"),m=null;market.forEach(function(x){if(String(x.id)===aid)m=x});
    if(m)contactSheet(t("fa_ask"),m.is_sample?t("sample_note"):m.name+" · "+m.shop_name,m.is_sample?t("sample_fa_msg",{n:m.name}):t("fa_msg",{n:m.name,i:m.id,s:m.shop_name}));return}
  var c=up(e.target,"[data-cat]");if(c){cat=c.getAttribute("data-cat");renderShop();return}
  var b=up(e.target,"[data-buy]");if(b){var id=b.getAttribute("data-buy"),i=null;
    items.forEach(function(x){if(String(x.id)===id)i=x});
    if(i)contactSheet(i.is_sample?t("sample_ask"):t("dlg_t"),i.is_sample?t("sample_note"):i.name+" · "+birr(i.price_etb),i.is_sample?t("sample_msg",{n:i.name}):t("buy_msg",{n:i.name,p:birr(i.price_etb),i:i.id}));return}
  if(up(e.target,"[data-share]")){shareItem();return}
  var gb=up(e.target,"[data-gift]");if(gb){var g=findIn(gifts,gb.getAttribute("data-gift"));if(g)giftSheet(g);return}
  if(up(e.target,"[data-gcustom]")){contactSheet(t("g_custom_t"),"",t("g_custom_msg"),true);return}
});

/* ---------- Amazon / Shein request (price is sent by Selam Market) ---------- */
$("#abroad").addEventListener("submit",function(e){e.preventDefault();var l=$("#alink").value.trim();
  if(!/^https?:\/\/\S+\.\S+/.test(l)){toast(t("ab_linkerr"));$("#alink").focus();return}
  var s=$("#astore"),q=Math.max(1,parseInt($("#aqty").value,10)||1);
  contactSheet(t("ab_t"),t("ab_after"),t("ab_msg",{l:l,s:s.options[s.selectedIndex].text,q:q,o:$("#anote").value.trim()||"-"}))});

/* ---------- traveler board (public; contact happens on travel.html) ---------- */
var board=null, bstate="loading";
var OM_MONTHS=["Amajjii","Guraandhala","Bitootessa","Ebla","Caamsaa","Waxabajjii","Adoolessa","Hagayya","Fulbaana","Onkoloolessa","Sadaasa","Muddee"];
function fmtDate(iso){var p=String(iso).split("-"),d=new Date(+p[0],+p[1]-1,+p[2]);
  if(lang==="om")return OM_MONTHS[d.getMonth()]+" "+d.getDate();
  try{return d.toLocaleDateString(lang==="am"?"am-ET":"en-CA",{month:"short",day:"numeric"})}catch(e){return iso}}
function loadBoard(){
  fetch(C.supabaseUrl+"/rest/v1/board_posts?select=*&order=travel_date.asc",{headers:{apikey:C.supabaseAnonKey,Authorization:"Bearer "+C.supabaseAnonKey}})
   .then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})
   .then(function(d){board=d;bstate="ready";renderBoard()})
   .catch(function(){bstate="error";renderBoard()});
}
function renderBoard(){
  var box=$("#board");if(!box)return;
  if(bstate==="loading"){box.innerHTML=new Array(4).join('<div class="skel" style="height:140px"></div>');return}
  if(bstate==="error"){box.innerHTML='<p class="empty">'+esc(t("load_err"))+"</p>";return}
  var k=$("#bkind").value,f=$("#bfrom").value,to=$("#bto").value;
  var list=board.filter(function(p){return (k==="all"||p.kind===k)&&(!f||p.from_country===f)&&(!to||p.to_country===to)});
  box.innerHTML=list.length?list.map(function(p){var trip=p.kind==="trip";
    return '<article class="post"><div class="top"><span><span class="pill '+(trip?"trip":"req")+'">'+esc(t(trip?"bp_trip":"bp_send"))+'</span>'+(p.is_sample?' <span class="pill smp">'+esc(t("sample"))+'</span>':'')+'</span><span class="when">'+esc(t(trip?"bp_on":"bp_by",{d:fmtDate(p.travel_date)}))+"</span></div>"+
      '<div class="route">'+esc(p.from_city)+"<small>"+esc(p.from_country)+"</small><i>→</i>"+esc(p.to_city)+"<small>"+esc(p.to_country)+"</small></div>"+
      (p.weight_kg?'<div class="meta">'+esc(t(trip?"bp_space":"bp_weight",{k:+p.weight_kg}))+"</div>":"")+
      (p.details?'<p class="det">'+esc(p.details)+"</p>":"")+
      '<div class="who">'+esc(t("bp_who",{n:p.first_name,c:p.member_city}))+"</div>"+
      (p.is_sample?'<p class="snote">'+esc(t("sample_post"))+'</p><a class="btn ghost sm" href="travel.html#new-'+(trip?"trip":"send")+'">'+esc(t(trip?"post_yours":"post_yours_send"))+"</a>":
        '<a class="btn pri sm" href="travel.html#contact-'+esc(p.id)+'">'+esc(t("bp_contact",{n:p.first_name}))+"</a>")+"</article>"}).join("")
    :'<p class="empty">'+esc(t("bp_empty"))+"</p>";
}
["bkind","bfrom","bto"].forEach(function(id){$("#"+id).addEventListener("change",renderBoard)});

/* ---------- start ---------- */
var CH_URL="https://t.me/"+encodeURIComponent(C.channel);$("#heroChan").href=$("#aboutChan").href=$("#chanFoot").href=CH_URL;$("#chanFoot").textContent="t.me/"+C.channel;
$("#tgFoot").textContent="@"+TG;$("#waFoot").textContent=WA;$("#aboutTg").href=TG_URL;$("#aboutWa").href="https://wa.me/"+WA_NUM;$("#aboutTg").textContent="Telegram @"+TG;$("#aboutWa").textContent="WhatsApp "+WA;
route();applyLang();loadItems();loadMarket();loadGifts();loadBoard();
})();
