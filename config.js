// Selam Market connection settings (safe to be public: access is controlled by database rules)
window.SELAM = {
  supabaseUrl: 'https://amutaslmrjasowwrhyjw.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtdXRhc2xtcmphc293d3JoeWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzMzk5ODAsImV4cCI6MjEwOTkxNTk4MH0.JsHyhVTeREHvgZsJqmoDU9B7D9NLhQvTaRCMFCKTyD0',
  telegram: 'Born_confus_ed',     // Telegram username for orders (without @)
  channel: 'selamarket251',       // public Telegram channel for new items
  whatsapp: '+1 647 573 0925',    // WhatsApp number for orders
  turnstileSiteKey: '0x4AAAAAAF_IrXTL1j43oI2w',           // Cloudflare Turnstile site key for the sign-in bot check; leave '' to keep it off
  analyticsToken: 'df99b1ec074f4086a43abd83a114908e',             // Cloudflare Web Analytics token; leave '' to keep visitor stats off
  categories: ['Electronics','Clothing','Traditional clothing','Shoes','Beauty','Coffee & spices','Jewelry','Crafts & art','Home','Kids','Bags','Other'],
  occasions: ['Genna','Timket','Fasika','Eid','Meskel','Irreecha','Enkutatash','Any holiday','School year','Any time'],
  conditions: ['New','New with tags','New in box','Sealed','Handmade','Like new','Used, good'],
  pickupAreas: ['Bole','Kazanchis','CMC','Piassa','Megenagna','Sarbet','Ayat','Other']
};
