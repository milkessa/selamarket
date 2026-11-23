/* Selam Market: install-as-app support. Registers the service worker and shows a small
   "Get the app" bar on the shop page (Android: one-tap install; iPhone: Add to Home Screen steps). */
(function () {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });

  var S = {
    en: { title: "Get the ሰላም Market app", sub: "Add it to your home screen. Free, no app store.", install: "Install", later: "Not now",
          ios: "Tap the Share button {share} (in Safari it may be under ⋯ first)", ios2: "Scroll down and choose “Add to Home Screen” {add}, then Add", other: "Open your browser menu (⋮) and choose “Install app” or “Add to Home screen”.",
          inapp: "Open selammarket.ca in Chrome or Safari to install the app.", done: "Installed! Find ሰላም Market on your home screen.", foot: "Install the app" },
    am: { title: "የሰላም ማርኬትን መተግበሪያ ያግኙ", sub: "በስልክዎ መነሻ ገጽ ላይ ያስቀምጡት። ነፃ ነው፤ አፕ ስቶር አያስፈልግም።", install: "ጫን", later: "አሁን አይደለም",
          ios: "የ Share ቁልፉን {share} ይጫኑ (በ Safari መጀመሪያ ⋯ ውስጥ ሊሆን ይችላል)", ios2: "ወደ ታች ይሸብልሉና “Add to Home Screen” {add} ይምረጡ፣ ከዚያ Add", other: "የብሮውዘርዎን ምናሌ (⋮) ይክፈቱና “Install app” ወይም “Add to Home screen” ይምረጡ።",
          inapp: "መተግበሪያውን ለመጫን selammarket.caን በ Chrome ወይም በ Safari ይክፈቱ።", done: "ተጭኗል! ሰላም ማርኬትን በመነሻ ገጽዎ ላይ ያገኙታል።", foot: "መተግበሪያውን ይጫኑ" },
    om: { title: "Appii ሰላም Market argadhu", sub: "Fuula jalqabaa bilbila keetii irratti kaa'i. Bilisa; app store hin barbaachisu.", install: "Fe'i", later: "Amma miti",
          ios: "Qabduu Share {share} tuqi (Safari keessatti dura ⋯ jalatti ta'uu danda'a)", ios2: "Gadi siqsiitii “Add to Home Screen” {add} filadhu, achiis Add", other: "Menu browser kee (⋮) bani, “Install app” ykn “Add to Home screen” filadhu.",
          inapp: "Appii fe'uuf selammarket.ca Chrome ykn Safari keessatti bani.", done: "Fe'ameera! Fuula jalqabaa irratti ሰላም Market argatta.", foot: "Appii fe'i" }
  };
  function L() { var l = "en"; try { l = JSON.parse(localStorage.getItem("sm-lang") || '"en"'); } catch (e) {} return S[l] || S.en; }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var ua = navigator.userAgent || "";
  var standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  var ios = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var inApp = /FBAN|FBAV|Instagram|musical_ly|Bytedance|TikTok|Telegram|Line\/|Snapchat|wv\)/i.test(ua);
  var iosSafari = ios && !inApp; // every iPhone browser (Safari, Chrome, Edge…) installs the same way: Share, then Add to Home Screen
  var shop = !/(seller|travel|admin|soon)\.html$/.test(location.pathname);
  var deferred = null, bar = null;
  if (standalone) return;

  var css = ".pwa-bar{position:fixed;left:12px;right:12px;bottom:calc(72px + env(safe-area-inset-bottom,0px));z-index:40;background:#0B6B57;color:#fff;border-radius:18px;padding:14px 14px 14px 12px;display:flex;gap:12px;align-items:center;box-shadow:0 12px 32px rgba(0,0,0,.28);max-width:520px;margin:0 auto;font:14px/1.4 system-ui,-apple-system,'Segoe UI',Roboto,'Noto Sans Ethiopic',sans-serif}" +
    ".pwa-bar img{width:44px;height:44px;border-radius:11px;flex:none}.pwa-bar b{display:block;font-size:15px}.pwa-bar .s{color:#D6EBE3;font-size:13px}.pwa-bar .tx{flex:1;min-width:0}" +
    ".pwa-bar button{border:0;border-radius:999px;font:700 14px system-ui,sans-serif;min-height:40px;padding:0 16px;cursor:pointer}.pwa-bar .go{background:#D49A1F;color:#1B1F1A}.pwa-bar .x{background:transparent;color:#fff;padding:0 8px;font-size:22px;line-height:1}" +
    ".pwa-bar ol.ios{margin:4px 0 0;padding-left:18px;display:grid;gap:4px}.pwa-bar .ic{display:inline-flex;vertical-align:-3px;background:#fff;color:#0B6B57;border-radius:6px;padding:2px;margin:0 2px}" +
    "@media (min-width:860px){.pwa-bar{bottom:20px;left:auto;right:20px}}";
  function addCss() { if (document.getElementById("pwa-css")) return; var st = document.createElement("style"); st.id = "pwa-css"; st.textContent = css; document.head.appendChild(st); }

  function show(mode) {
    var s = L(); addCss(); hide();
    bar = document.createElement("div"); bar.className = "pwa-bar"; bar.setAttribute("role", "dialog");
    var sub = mode === "prompt" ? s.sub : mode === "ios" ? s.ios : mode === "inapp" ? s.inapp : s.other;
    bar.innerHTML = '<img src="icons/icon-192.png" alt=""><div class="tx"><b></b><div class="s"></div></div>' +
      (mode === "prompt" ? '<button type="button" class="go"></button>' : "") + '<button type="button" class="x" aria-label="Close">×</button>';
    bar.querySelector("b").textContent = s.title;
    if (mode === "ios") {
      var SH = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Share"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/></svg>';
      var AD = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-label="Add"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
      var e = function (t) { return t.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); };
      bar.querySelector(".s").innerHTML = '<ol class="ios">' + '<li>' + e(s.ios).replace("{share}", '<span class="ic">' + SH + "</span>") + "</li>" +
        '<li>' + e(s.ios2).replace("{add}", '<span class="ic">' + AD + "</span>") + "</li></ol>";
    } else bar.querySelector(".s").textContent = sub;
    var go = bar.querySelector(".go"); if (go) { go.textContent = s.install; go.onclick = install; }
    bar.querySelector(".x").onclick = function () { set("sm-pwa-later", String(Date.now())); hide(); };
    document.body.appendChild(bar);
  }
  function hide() { if (bar && bar.parentNode) bar.parentNode.removeChild(bar); bar = null; }
  function install() {
    if (!deferred) { show(iosSafari ? "ios" : inApp ? "inapp" : "other"); return; }
    deferred.prompt(); deferred.userChoice.then(function () { deferred = null; hide(); });
  }
  window.SelamInstall = function () { install(); };
  function recentlyDismissed() { var t = +get("sm-pwa-later") || 0; return Date.now() - t < 14 * 864e5; }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); deferred = e;
    if (shop && !recentlyDismissed()) setTimeout(function () { if (deferred) show("prompt"); }, 6000);
  });
  window.addEventListener("appinstalled", function () { deferred = null; var s = L(); addCss(); hide(); set("sm-pwa-later", String(Date.now()));
    var d = document.createElement("div"); d.className = "pwa-bar"; d.textContent = s.done; document.body.appendChild(d); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 4000); });
  if (iosSafari && shop && !recentlyDismissed()) setTimeout(function () { show("ios"); }, 8000);

  // footer link on the shop page
  document.addEventListener("DOMContentLoaded", function () {
    var a = document.getElementById("installApp"); if (!a) return;
    a.hidden = false; a.textContent = L().foot;
    a.addEventListener("click", function (e) { e.preventDefault(); install(); });
    document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-lang]")) setTimeout(function () { a.textContent = L().foot; }, 0); });
  });
})();
