const app=document.getElementById('app');
const store={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch{return d}},
             set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const getJSON=async u=>{const r=await fetch(u);if(!r.ok)throw new Error(u+' '+r.status);return r.json()};
let INDEX=null;const CACHE={};
const FOOT='神經科教學研究部　臨床技能中心　｜　鑑別診斷推理訓練系列';

async function route(){
  try{
    INDEX=INDEX||await getJSON('topics/index.json');
    stopTimer();
    const id=location.hash.replace(/^#\/?/,'');
    if(id==='osce')return examMenu();
    if(id.startsWith('osce/')){
      let xid=id.slice(5);if(xid==='random')xid=pick1(INDEX.filter(t=>t.ready)).id;
      const xm=INDEX.find(t=>t.id===xid&&t.ready);if(!xm)return examMenu();
      CACHE[xid]=CACHE[xid]||await getJSON('topics/'+xm.file);return exam(CACHE[xid],xm);
    }
    const meta=INDEX.find(t=>t.id===id&&t.ready);
    if(!meta)return home();
    CACHE[id]=CACHE[id]||await getJSON('topics/'+meta.file);
    topic(CACHE[id],meta);
  }catch(e){
    app.innerHTML='<div class="err"><b>無法載入內容。</b><br>請以網址（https）開啟本頁；直接雙擊 index.html 開啟時，瀏覽器會擋住資料檔。<br><small>'+e.message+'</small></div>';
  }finally{window.scrollTo(0,0)}
}

function home(){
  document.title='神經科 OSCE 鑑別診斷推理訓練';
  const ios=/iphone|ipad/i.test(navigator.userAgent)&&!navigator.standalone&&!matchMedia('(display-mode:standalone)').matches;
  app.innerHTML=`<header><div class="eyebrow">OSCE 臨床推理訓練</div><h1>神經科鑑別診斷推理訓練</h1>
    <p class="sub">選擇主題，依序加入線索，觀察鑑別診斷如何浮現與變化。</p></header>
    ${ios?'<div class="hint">📲 加入主畫面：點 Safari 下方「分享」→「加入主畫面」，之後可像 App 一樣開啟，也能離線使用。</div>':''}
    <button type="button" class="tcard xexam" id="examBtn"><div class="ts">計時・隨機病例</div><div class="tt">🩺 專科護理師 OSCE 模擬考</div><div class="td">限時問診／檢查，判斷病灶、列出鑑別診斷與下一步計畫，並取得評分與講解</div></button>
    <div class="tlist">${INDEX.map(t=>{
      const n=store.get('done:'+t.id,0);
      return `<button class="tcard${t.ready?'':' off'}" data-id="${t.id}" ${t.ready?'':'disabled'}>
        <div class="ts">${t.series?'系列 '+t.series:(t.ready?'':'敬請期待')}</div><div class="tt">${t.title}</div><div class="td">${t.desc}</div>
        ${n?`<div class="tn">已完成 ${n} 次練習</div>`:''}</button>`}).join('')}</div>
    <footer>${FOOT}</footer>`;
  document.getElementById('examBtn').onclick=()=>{location.hash='#/osce'};
  app.querySelectorAll('.tcard[data-id]:not(.off)').forEach(b=>b.onclick=()=>{location.hash='#/'+b.dataset.id});
}

function topic(T,meta){
  document.title=T.title+'｜OSCE';
  const S=T.steps,label=Object.fromEntries(S.map(s=>[s.dim,s.label]));
  let sel={},finished=false;
  app.innerHTML=`<button class="back" id="back">← 所有主題</button>
    <header><div class="eyebrow">OSCE 臨床推理訓練　·　互動式鑑別診斷</div><h1>${T.title}</h1><p class="sub">${T.intro}</p></header>
    <div class="combo"><div class="combo-title">想快速練習不同組合？</div><div class="combo-row" id="combos"></div></div>
    <div class="topbar"><div class="progress" id="progress"></div><button class="resetBtn" id="reset">重新開始</button></div>
    <div class="flow" id="flow"></div>
    <div class="endnav"><button type="button" class="cbtn" id="toTop">↑ 回到頁首</button><button type="button" class="cbtn" id="toList">← 回到主題選單</button></div><footer>${FOOT}　${T.series}</footer>`;
  const $=id=>document.getElementById(id);
  const conn=()=>'<div class="connector"></div>';
  const clue=()=>Object.keys(sel).map(d=>label[d]+'＝'+sel[d]).join('　·　');

  function rank(){
    const dims=Object.keys(sel),isN=d=>S.find(s=>s.dim===d).normal===sel[d];
    let sc=T.dx.map(dx=>{let score=0,m=[],nn=0;
      dims.forEach(d=>{if((dx.match[d]||[]).includes(sel[d])){const st=S.find(s=>s.dim===d),nrm=st.normal===sel[d];score+=(st.w||1)*(nrm?0.5:1);if(nrm)nn++;else m.push(label[d])}});
      return{dx,score,m,nn}});
    let both=false;
    if(T.limb){const inv=k=>T.limb[k].some(d=>d in sel&&!isN(d)),up=inv('upper'),lo=inv('lower');
      if(up&&!lo)sc=sc.filter(x=>x.dx.limb==='upper');else if(lo&&!up)sc=sc.filter(x=>x.dx.limb==='lower');else both=up&&lo}
    sc.sort((a,b)=>b.score-a.score||(b.dx.red?1:0)-(a.dx.red?1:0));
    const n=T.topN||5;let top=sc.slice(0,n);
    if(both){const pk=[sc.find(x=>x.dx.limb==='upper'),sc.find(x=>x.dx.limb==='lower')].filter(Boolean);
      top=[...pk,...sc.filter(x=>!pk.includes(x))].slice(0,n).sort((a,b)=>b.score-a.score)}
    if(T.topN){const pos=top.filter(x=>x.score>0);top=pos.length?pos:top.slice(0,1)}
    const max=dims.reduce((a,d)=>a+(S.find(s=>s.dim===d).w||1),0);
    const regions=(T.regions||[]).map(g=>({...g,best:Math.max(0,...sc.filter(x=>x.dx.region===g.id).map(x=>x.score))})).sort((a,b)=>b.best-a.best);
    return{top,total:dims.length,regions,max,both};
  }
  const regionBox=r=>r.regions.length?`<div class="regions"><div class="rtitle">${T.regionTitle||'最可能的病灶區域'}</div>${r.regions.map((g,i)=>`<div class="rrow"><span class="rname">${g.label}${i===0&&g.best>0&&g.best>r.regions[1].best?' ★':''}</span><span class="rbar"><i class="r-${g.id}" style="width:${Math.round(g.best/r.max*100)}%"></i></span><span class="rnum">${+g.best.toFixed(1)}/${r.max}</span></div>`).join('')}</div>`:'';
  const hasN=S.some(s=>s.normal);
  const card=({dx,m,nn},total)=>{
    const head=hasN?`符合 ${m.length} 項異常發現`:`符合 ${m.length}/${total} 項`;
    const mt=m.length?'符合：'+m.join('、')+(hasN&&nn?`（另有 ${nn} 項正常表現相符）`:''):(hasN&&nn?'異常發現尚無直接相符，僅正常表現相符':'目前線索尚無直接符合');
    return `<div class="dxcard${dx.red?' flag':''}"><div class="dxname">${dx.name}<span class="badge">${dx.red?'⚠ '+(T.redLabel||'優先排除')+'　':''}${head}</span></div>
    <div class="dxmatch">${dx.group?`<span class="gtag g-${dx.group}">${dx.group==='primary'?'原發型':'次發型'}</span>${dx.ichd||''}　｜　`:''}${dx.tag?`<span class="gtag r-${dx.region}">${dx.tag}</span>${dx.sub||''}　｜　`:''}${mt}</div>
    <div class="dxmissing"><b>〔還缺〕</b>${dx.missing}</div>${dx.fig?figDetails(dx.fig):''}</div>`};

  function build(){
    sel={};finished=false;
    $('flow').innerHTML=S.map((s,i)=>`<div class="step${i?' locked':''}" id="step-${i}">
      <div class="step-head"><div class="step-num">${i+1}</div><div class="step-title">${s.title}</div><div class="step-picked" id="picked-${i}"></div></div>
      <div class="opts">${s.options.map((o,j)=>`<button type="button" class="opt" data-i="${i}" data-j="${j}">${o}</button>`).join('')}</div></div>
      ${conn()}<div class="diffbox" id="diff-${i}" style="display:none"><h3>目前線索下的鑑別診斷</h3><div class="clue" id="clue-${i}"></div>
      <div class="early" id="early-${i}"></div><div class="dxlist" id="list-${i}"></div></div>${i<S.length-1?conn():''}`).join('')+'<div id="final" style="display:none"></div>';
    $('flow').querySelectorAll('.opt').forEach(b=>b.onclick=()=>pick(+b.dataset.i,S[+b.dataset.i].options[+b.dataset.j],b,false));
    progress();
  }
  function pick(i,val,btn,silent){
    btn.parentNode.querySelectorAll('.opt').forEach(b=>b.classList.remove('sel'));
    btn.classList.add('sel');
    sel[S[i].dim]=val;
    $('picked-'+i).textContent='已選：'+val;
    $('diff-'+i).style.display='block';
    $('clue-'+i).textContent='已知線索：'+clue();
    $('early-'+i).textContent=Object.keys(sel).length<3?'※ 線索尚少，排序僅供參考，請繼續補充線索。':'';
    const r=rank();$('list-'+i).innerHTML=regionBox(r)+r.top.map(t=>card(t,r.total)).join('');
    if(i<S.length-1){const n=$('step-'+(i+1));n.classList.remove('locked');if(!silent)n.scrollIntoView({behavior:'smooth',block:'center'})}
    else final(silent);
    progress();
  }
  function final(silent){
    const f=$('final'),r=rank();
    f.className='final';f.style.display='block';
    f.innerHTML=`<h3>🎯 綜合 ${S.length} 項線索後的最終鑑別</h3><div class="clue">${clue()}</div>
      <div class="dxlist">${regionBox(r)}${r.top.map(t=>card(t,r.total)).join('')}</div>
      <div class="teachnote"><b>教學提醒：</b>${T.teachNote}</div>`;
    if(!silent)f.scrollIntoView({behavior:'smooth',block:'center'});
    if(!finished){finished=true;store.set('done:'+T.id,store.get('done:'+T.id,0)+1)}
  }
  function progress(){$('progress').innerHTML=S.map(s=>`<div class="dot${sel[s.dim]?' done':''}"></div>`).join('')}
  function apply(vals){
    build();
    vals.forEach((v,i)=>{const b=[...$('step-'+i).querySelectorAll('.opt')].find(x=>x.textContent===v);if(b)pick(i,v,b,true)});
    $('final').scrollIntoView({behavior:'smooth',block:'center'});
  }
  const row=$('combos');
  const add=(t,cls,fn)=>{const b=document.createElement('button');b.type='button';b.className='cbtn '+cls;b.textContent=t;b.onclick=fn;row.appendChild(b)};
  add('🎲 隨機產生組合','rand',()=>apply(S.map(s=>s.options[Math.floor(Math.random()*s.options.length)])));
  (T.presets||[]).forEach(p=>add(p.label,'',()=>apply(p.vals)));
  $('back').onclick=$('toList').onclick=()=>{location.hash='#/'};
  $('toTop').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
  $('reset').onclick=()=>{build();window.scrollTo(0,0)};
  build();
}

addEventListener('hashchange',route);
route();
if('serviceWorker' in navigator&&location.protocol.startsWith('http')){
  const had=!!navigator.serviceWorker.controller;   // 新版 Service Worker 接手時自動重新載入一次，立即看到新內容
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had&&!window.__r){window.__r=1;location.reload()}});
  addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
