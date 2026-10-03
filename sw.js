/* 修改任何檔案內容後，請把版本號 +1，使用者下次開啟就會取得最新版 */
const V='osce-v2';
const CORE=['./','index.html','style.css','app.js','manifest.webmanifest','topics/index.json',
 'icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil((async()=>{
  const c=await caches.open(V);
  await c.addAll(CORE);
  const idx=await (await fetch('topics/index.json',{cache:'no-store'})).json();   // 新增主題時不必改這裡
  await c.addAll(idx.filter(t=>t.ready).map(t=>'topics/'+t.file));
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
    const net=fetch(r).then(res=>{if(res.ok)caches.open(V).then(c=>c.put(r,res.clone()));return res})
      .catch(()=>hit||(r.mode==='navigate'?caches.match('index.html'):Response.error()));
    return hit||net;   // 先給快取（離線可用），背景更新
  })());
});
