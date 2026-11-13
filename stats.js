// Visitor stats: Cloudflare Web Analytics (free, no cookies, no personal data).
// Off until analyticsToken is set in config.js.
(function(){
  var C=window.SELAM||{};
  if(!C.analyticsToken)return;
  var s=document.createElement("script");
  s.defer=true;
  s.src="https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon",JSON.stringify({token:C.analyticsToken}));
  document.head.appendChild(s);
})();
