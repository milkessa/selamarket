// Bot check for sign-ins: Cloudflare Turnstile (free, usually invisible).
// Off until turnstileSiteKey is set in config.js. When it is on in Supabase, every sign-in must send a token.
window.SelamCaptcha=(function(){
  var C=window.SELAM||{}, key=C.turnstileSiteKey, widgets=[], loading=null;
  function load(){
    if(!key)return Promise.resolve(false);
    if(window.turnstile)return Promise.resolve(true);
    if(loading)return loading;
    loading=new Promise(function(res){
      var s=document.createElement("script");
      s.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async=true;s.onload=function(){res(true)};s.onerror=function(){res(false)};
      document.head.appendChild(s);
    });
    return loading;
  }
  // Show the check inside an element (it stays invisible unless Cloudflare needs the visitor to tap it)
  function mount(el,lang){
    if(!key||!el)return;
    load().then(function(ok){
      if(!ok||!window.turnstile||el.getAttribute("data-mounted"))return;
      el.setAttribute("data-mounted","1");
      var w={el:el,token:null};
      w.id=window.turnstile.render(el,{sitekey:key,language:lang==="am"?"am":"auto",appearance:"interaction-only",
        callback:function(tok){w.token=tok},"expired-callback":function(){w.token=null},"error-callback":function(){w.token=null}});
      widgets.push(w);
    });
  }
  function find(el){for(var i=0;i<widgets.length;i++)if(widgets[i].el===el)return widgets[i];return null}
  // Returns the token for the check in this element, waiting up to 8 seconds; undefined when the check is off
  function token(el){
    if(!key)return Promise.resolve(undefined);
    return new Promise(function(res){
      var tries=0;(function wait(){var w=find(el);if(w&&w.token)return res(w.token);if(++tries>40)return res(null);setTimeout(wait,200)})();
    });
  }
  // Each token works once, so get a fresh one after every attempt
  function reset(el){var w=find(el);if(w&&window.turnstile){w.token=null;try{window.turnstile.reset(w.id)}catch(e){}}}
  return {enabled:!!key,mount:mount,token:token,reset:reset};
})();
