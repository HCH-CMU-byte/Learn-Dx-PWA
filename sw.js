/* 修改任何檔案內容後，請把版本號 +1，使用者下次開啟就會取得最新版 */
const V='osce-v11.0';
const CORE=['./','index.html','style.css','app.js','exam.js','figs.js','manifest.webmanifest','topics/index.json',
 'icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil((async()=>{
  const c=await caches.open(V);
  const fresh=urls=>Promise.all(urls.map(async u=>{const r=await fetch(u,{cache:'reload'});   // 略過瀏覽器 HTTP 快取，確保拿到伺服器最新檔
    if(!r.ok)throw new Error(u);await c.put(u,r)}));
  await fresh(CORE);
  const idx=await (await fetch('topics/index.json',{cache:'reload'})).json();   // 新增主題時不必改這裡
  await fresh(idx.filter(t=>t.ready).map(t=>'topics/'+t.file));
  self.skipWaiting();
})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  for(const k of await caches.keys()) if(k!==V) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith((async()=>{
    const hit=await caches.match(r,{ignoreSearch:true});
    const net=fetch(r.url,{cache:'no-cache'}).then(res=>{if(res.ok)caches.open(V).then(c=>c.put(r,res.clone()));return res})
      .catch(()=>hit||(r.mode==='navigate'?caches.match('index.html'):Response.error()));
    return hit||net;   // 先給快取（離線可用），背景更新
  })());
});
