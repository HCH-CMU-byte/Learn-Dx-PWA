/* OSCE 模擬考：隨機病例、限時、有限詢問次數、評分與講解 */
let timer=null;const stopTimer=()=>{clearInterval(timer);timer=null};
let EXAM_MIN=0;
const pick1=a=>a[Math.floor(Math.random()*a.length)];
const PLAN=[["urgent","立即啟動急診處置（監測生命徵象、通知醫師、安排緊急影像）"],["complete","補完關鍵病史與神經學檢查（依〔還缺〕項目）"],["image","安排影像檢查（CT／MRI／血管影像）"],["lab","安排抽血與心電圖等基本檢驗"],["consult","專科會診或轉診"],["follow","門診追蹤，症狀惡化時儘速回診"],["educ","衛教：誘發因子、紅旗症狀與用藥"],["home","症狀治療後返家觀察"]];

function examMenu(){
  EXAM_MIN=EXAM_MIN||store.get('examMin',8);
  document.title='OSCE 模擬考';
  const ready=INDEX.filter(t=>t.ready);
  app.innerHTML=`<button class="back" id="back">← 回首頁</button>
   <header><div class="eyebrow">專科護理師 OSCE 模擬</div><h1>隨機病例模擬考</h1>
   <p class="sub">系統隨機產生病例。請在時限內，從有限的次數中選擇要深入詢問或檢查的項目，最後判斷病灶區域、列出至少 3 項鑑別診斷並擬定下一步計畫，作答後會有評分與講解。</p></header>
   <div class="combo"><div class="combo-title">作答時限</div><div class="combo-row">${[5,8,10].map(m=>`<button type="button" class="cbtn${m===EXAM_MIN?' rand':''}" data-m="${m}">${m} 分鐘</button>`).join('')}</div></div>
   <div class="tlist"><button type="button" class="tcard" data-x="random"><div class="tt">🎲 隨機主題</div><div class="td">從所有主題中隨機抽題</div></button>
   ${ready.map(t=>{const r=store.get('exam:'+t.id,null);return `<button type="button" class="tcard" data-x="${t.id}"><div class="tt">${t.title}</div>${r?`<div class="tn">已練習 ${r.n} 次・最近 ${r.last} 分・最佳 ${r.best} 分</div>`:''}</button>`}).join('')}</div>`;
  app.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{EXAM_MIN=+b.dataset.m;store.set('examMin',EXAM_MIN);app.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('rand',x===b))});
  app.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{location.hash='#/osce/'+b.dataset.x});
  document.getElementById('back').onclick=()=>{location.hash='#/'};
}

function exam(T,meta){
  EXAM_MIN=EXAM_MIN||store.get('examMin',8);
  document.title='OSCE 模擬考｜'+meta.title;
  const S=T.steps,N=T.dx.length,$=id=>document.getElementById(id),w=d=>S.find(s=>s.dim===d).w||1,ttl=d=>S.find(s=>s.dim===d).title,wt=(d,v)=>{const s=S.find(x=>x.dim===d);return (s.w||1)*(s.normal===v?.5:1)};
  const truth=pick1(T.dx),val={};
  S.forEach(s=>{const m=truth.match[s.dim]||[];val[s.dim]=pick1(m.length?m:s.options)});
  const auto=S.filter(s=>s.dim==='age'||s.dim==='sex').map(s=>s.dim),ask=S.filter(s=>!auto.includes(s.dim));
  const cap=Math.min(ask.length,Math.max(2,Math.floor(ask.length*.7)));
  const nMatch=d=>T.dx.filter(x=>(x.match[d]||[]).includes(val[d])).length;
  const spec=Object.fromEntries(ask.map(s=>[s.dim,(1-nMatch(s.dim)/N)*w(s.dim)]));
  const asked=[],loc={v:null},dsel=new Set(),psel=new Set();let left=EXAM_MIN*60,done=false;
  const sc=(d,dims)=>dims.reduce((a,x)=>a+((d.match[x]||[]).includes(val[x])?wt(x,val[x]):0),0);
  const locLabel=id=>(T.localize.options.find(o=>o.id===id)||{}).label||'未選擇';
  const who=(val.age||'')+(val.sex?(val.sex==='男'?'男性':'女性'):'')||'成人病人';
  app.innerHTML=`<div class="tbar"><span id="clock"></span><span id="quota"></span></div>
   <button class="back" id="back">← 離開模擬考</button>
   <header><div class="eyebrow">OSCE 模擬站　·　${meta.title}</div><h1>病人：${who}</h1>
   <p class="sub">主訴：${(T.exam&&T.exam.cc)||'因神經學症狀來診'}。請在時限內決定要詢問或檢查的項目。</p></header><div id="stage"></div>`;
  $('back').onclick=()=>{location.hash='#/osce'};
  const logHTML=()=>asked.map(d=>`<div class="logrow"><b>${ttl(d)}</b><br>${val[d]}</div>`).join('')||'<div class="sub">尚未詢問任何項目。</div>';
  const tick=()=>{const m=Math.floor(left/60),s=left%60;$('clock').textContent=`⏱ ${m}:${String(s).padStart(2,'0')}`;$('clock').className=left<=60?'warn':''};
  timer=setInterval(()=>{left--;tick();if(left<=0)finish(true)},1000);tick();

  function stageAsk(){
    $('stage').innerHTML=`<div class="step"><div class="step-head"><div class="step-title">病史詢問／檢查</div><div class="step-picked" id="left"></div></div>
     <div class="opts" id="asks">${ask.map(s=>`<button type="button" class="opt" data-d="${s.dim}">${s.title}</button>`).join('')}</div></div>
     <div class="logbox" id="log"></div><div class="endnav"><button type="button" class="cbtn rand" id="go">結束詢問，開始作答 →</button></div>`;
    const upd=()=>{$('left').textContent=`還可選 ${cap-asked.length} 項`;$('quota').textContent=`詢問 ${asked.length}/${cap}`;$('log').innerHTML=logHTML();
      if(asked.length>=cap)document.querySelectorAll('#asks .opt:not(.sel)').forEach(b=>b.disabled=true)};
    document.querySelectorAll('#asks .opt').forEach(b=>b.onclick=()=>{if(asked.length>=cap||asked.includes(b.dataset.d))return;asked.push(b.dataset.d);b.classList.add('sel');b.disabled=true;upd()});
    $('go').onclick=stageAnswer;upd();
  }
  function stageAnswer(){
    $('stage').innerHTML=`<div class="diffbox"><h3>已取得的資訊</h3><div class="logbox">${logHTML()}</div></div><div class="connector"></div>
     <div class="step"><div class="step-head"><div class="step-num">1</div><div class="step-title">最可能的病灶區域</div></div><div class="opts" id="locs">${T.localize.options.map(o=>`<button type="button" class="opt" data-id="${o.id}">${o.label}</button>`).join('')}</div></div><div class="connector"></div>
     <div class="step"><div class="step-head"><div class="step-num">2</div><div class="step-title">鑑別診斷（至少 3 項，最多 5 項）</div><div class="step-picked" id="dcount">0/5</div></div>
     <input id="dq" class="search" type="search" placeholder="搜尋診斷名稱…">
     ${T.localize.options.map(o=>{const L=T.dx.map((d,i)=>[d,i]).filter(([d])=>d.loc===o.id);return L.length?`<div class="dgrp"><div class="gname">${o.label}</div><div class="opts">${L.map(([d,i])=>`<button type="button" class="opt dopt" data-i="${i}">${d.name}</button>`).join('')}</div></div>`:''}).join('')}</div><div class="connector"></div>
     <div class="step"><div class="step-head"><div class="step-num">3</div><div class="step-title">下一步計畫（最多 5 項）</div></div><div class="opts" id="plans">${PLAN.map(p=>`<button type="button" class="opt" data-p="${p[0]}">${p[1]}</button>`).join('')}</div></div>
     <div class="endnav"><button type="button" class="cbtn rand" id="submit">送出作答</button></div><div class="msg" id="msg"></div>`;
    document.querySelectorAll('#locs .opt').forEach(b=>b.onclick=()=>{loc.v=b.dataset.id;document.querySelectorAll('#locs .opt').forEach(x=>x.classList.toggle('sel',x===b))});
    document.querySelectorAll('.dopt').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(dsel.has(i))dsel.delete(i);else if(dsel.size<5)dsel.add(i);else return;b.classList.toggle('sel',dsel.has(i));$('dcount').textContent=dsel.size+'/5'});
    document.querySelectorAll('#plans .opt').forEach(b=>b.onclick=()=>{const k=b.dataset.p;if(psel.has(k))psel.delete(k);else if(psel.size<5)psel.add(k);else return;b.classList.toggle('sel',psel.has(k))});
    $('dq').oninput=e=>{const q=e.target.value.trim().toLowerCase();document.querySelectorAll('.dgrp').forEach(g=>{let any=false;g.querySelectorAll('.dopt').forEach(b=>{const ok=!q||b.textContent.toLowerCase().includes(q);b.style.display=ok?'':'none';any=any||ok});g.style.display=any?'':'none'})};
    $('submit').onclick=()=>{if(dsel.size<3){$('msg').textContent='鑑別診斷至少需要選 3 項。';return}finish(false)};
    window.scrollTo(0,0);
  }
  function finish(timeup){
    if(done)return;done=true;stopTimer();
    const rev=[...auto,...asked],full=S.map(s=>s.dim);
    const rs=T.dx.map(d=>({d,s:sc(d,rev)})).sort((a,b)=>b.s-a.s||(b.d.red?1:0)-(a.d.red?1:0));
    const thr=rs[Math.min(5,rs.length-1)].s,plaus=new Set(rs.filter(x=>x.s>=thr&&x.s>0).map(x=>x.d)),top5=rs.slice(0,5).map(x=>x.d);
    const tf=sc(truth,full),eq=d=>d!==truth&&sc(d,full)>=tf;
    // 資訊蒐集 25
    const rank=Object.keys(spec).sort((a,b)=>spec[b]-spec[a]),key=rank.slice(0,cap);
    const best=key.reduce((a,d)=>a+spec[d],0)||1,pI=Math.round(25*Math.min(1,asked.reduce((a,d)=>a+spec[d],0)/best));
    const missed=key.filter(d=>!asked.includes(d)),wasted=asked.filter(d=>!key.includes(d));
    // 病灶 20
    const pL=loc.v===truth.loc?20:0;
    // 鑑別診斷 35
    const ch=[...dsel].map(i=>T.dx[i]),cat=d=>d===truth?'✓':eq(d)?'≈':plaus.has(d)?'○':'✗';
    const oth=ch.filter(d=>d!==truth),reds=top5.filter(d=>d.red);
    let pD=ch.includes(truth)?20:(ch.some(eq)?10:0);
    pD+=oth.length?Math.round(10*oth.filter(d=>cat(d)!=='✗').length/oth.length):0;
    const redOK=!reds.length||ch.some(d=>reds.includes(d)||(d===truth&&truth.red));pD+=redOK?5:0;
    if(ch.length<3)pD=Math.min(pD,15);if(!ch.length)pD=0;
    // 計畫 20
    const has=k=>psel.has(k),pn=[];let pP=0;
    if(truth.red){if(has('urgent'))pP+=10;else pn.push('此診斷屬危及生命或需緊急處置者，應先「立即啟動急診處置」。');
      if(has('image'))pP+=5;else pn.push('此類診斷需盡速安排影像或血管檢查。');
      if(has('consult')||has('lab'))pP+=5;else pn.push('應同時通知專科並完成基本檢驗。');
      if(has('home')||has('follow')){pP=Math.max(0,pP-5);pn.push('此病例選擇返家或門診追蹤屬低估風險，需特別留意。')}}
    else{if(has('complete'))pP+=6;else pn.push('尚未補完關鍵病史與神經學檢查，確診前不宜直接結案。');
      if(has('follow')||has('educ'))pP+=8;else pn.push('應安排追蹤，並衛教紅旗症狀與回診時機。');
      if(has('image')||has('lab')||has('consult'))pP+=6;else pn.push('可視需要安排檢查或會診以釐清診斷。');
      if(has('urgent')){pP=Math.max(0,pP-3);pn.push('此病例線索較不具緊急性，啟動急診處置屬過度升級；但仍須持續評估紅旗症狀。')}}
    pP=Math.min(20,pP);if(!psel.size)pP=0;
    const total=pI+pL+pD+pP,grade=total>=85?'表現優良':total>=70?'尚可，仍有進步空間':'需加強';
    const r=store.get('exam:'+T.id,{n:0,best:0,last:0});store.set('exam:'+T.id,{n:r.n+1,last:total,best:Math.max(r.best,total)});
    const li=a=>a.length?'<ul>'+a.map(x=>`<li>${x}</li>`).join('')+'</ul>':'';
    const row=(t,s,m,body)=>`<div class="dxcard"><div class="dxname rs"><span>${t}</span><span>${s}／${m}</span></div>${body}</div>`;
    const infoL=[`你詢問了：${asked.map(ttl).join('、')||'（無）'}。`,
      ...missed.map(d=>`<span class="bad">漏問</span>「${ttl(d)}」：本案答案為「${val[d]}」，只符合 ${nMatch(d)}／${N} 個診斷，是縮小範圍的關鍵。`),
      ...wasted.map(d=>`「${ttl(d)}」：本案答案（${val[d]}）符合 ${nMatch(d)}／${N} 個診斷，區辨力較低，在次數有限時應排在後面。`)];
    if(!missed.length&&asked.length)infoL.push('<span class="ok">詢問的項目抓到了本案最有區辨力的線索。</span>');
    const locL=[`你的答案：${locLabel(loc.v)}；正確：<b>${locLabel(truth.loc)}</b>${truth.sub?'（'+truth.sub+'）':''}。`];
    if(pL===0)locL.push('定位時先看是否有皮質症狀、交叉性症狀或眩暈共濟失調等定位線索，再決定層級。');
    const dL=ch.map(d=>`${cat(d)} ${d.name}${d.red?'（紅旗）':''}`);
    const dN=['✓ 正確診斷　≈ 依線索難以與正解區分，亦屬合理　○ 合理候選　✗ 與線索不符'];
    if(ch.length<3)dN.push('<span class="bad">鑑別診斷不足 3 項，扣分上限 15。</span>');
    if(!ch.includes(truth))dN.push(`本案答案為 <b>${truth.name}</b>。確診尚需補足：${truth.missing}`);
    else dN.push(`確診尚需補足：${truth.missing}`);
    if(!redOK)dN.push(`依你取得的線索，需優先排除：${reds.map(d=>d.name).join('、')}，但你的清單中未列入。`);
    const sugg=[];
    if(pI<15)sugg.push(`問診效率：次數有限時，先問區辨力高的項目（本案依序為：${key.map(ttl).join('、')}）。`);
    if(pL===0)sugg.push('先定位再列鑑別診斷，定位錯誤會使後續推理整體偏離。');
    if(!ch.includes(truth))sugg.push('列出鑑別診斷時，兼顧「最可能」與「不能漏掉」（紅旗）兩類。');
    if(pP<14)sugg.push('下一步計畫應與風險等級相符：危及生命者先處置、後精查；穩定者先補完評估與衛教追蹤。');
    if(timeup)sugg.push('時間到時以目前已填內容評分，建議先完成各項作答再回頭精修。');
    $('stage').innerHTML=`<div class="final"><h3>🎯 成績 ${total}／100　${grade}</h3>
     <div class="clue">正確答案：<b>${truth.name}</b>　${timeup?'⏰ 時間到，自動送出':''}<br>完整線索：${S.map(s=>`${s.label}＝${val[s.dim]}${auto.includes(s.dim)||asked.includes(s.dim)?'':'（未詢問）'}`).join('；')}</div>
     <div class="dxlist">${row('資訊蒐集',pI,25,li(infoL))}${row('病灶區域',pL,20,li(locL)+(truth.fig?figBlock(truth.fig):''))}${row('鑑別診斷',pD,35,li(dL)+li(dN))}${row('下一步計畫',pP,20,li(pn.length?pn:['計畫與風險等級相符。']))}</div>
     ${sugg.length?`<div class="teachnote"><b>改進建議</b>${li(sugg)}</div>`:''}
     <div class="teachnote"><b>教學提醒：</b>${T.teachNote}</div>
     <div class="endnav"><button type="button" class="cbtn rand" id="again">🎲 再來一題</button><button type="button" class="cbtn" id="menu">← 回模擬考選單</button></div></div>`;
    $('clock').textContent='已結束';$('clock').className='';
    $('again').onclick=()=>route();$('menu').onclick=()=>{location.hash='#/osce'};
    window.scrollTo(0,0);
  }
  stageAsk();
}
