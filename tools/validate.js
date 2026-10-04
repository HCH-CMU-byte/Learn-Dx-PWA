// 用法：node tools/validate.js   ——新增或修改主題 JSON 後執行，抓出選項拼字不一致等錯誤
const fs=require('fs');let bad=0;
const err=m=>{console.log('✗ '+m);bad++};
for(const t of JSON.parse(fs.readFileSync('topics/index.json','utf8')).filter(t=>t.ready)){
  const T=JSON.parse(fs.readFileSync('topics/'+t.file,'utf8')),opt=Object.fromEntries(T.steps.map(s=>[s.dim,s.options]));
  T.dx.forEach(d=>{
    if(!d.name||!d.missing)err(`${t.id}: 診斷缺少 name 或 missing`);
    for(const [k,v] of Object.entries(d.match)){
      if(!opt[k])err(`${t.id}/${d.name}: 未知維度 ${k}`);
      else v.forEach(x=>opt[k].includes(x)||err(`${t.id}/${d.name}: 「${x}」不在 ${k} 的選項中`));}});
  T.steps.forEach(s=>s.options.forEach(o=>T.dx.some(d=>(d.match[s.dim]||[]).includes(o))||err(`${t.id}: 選項「${o}」沒有任何診斷對應`)));
  if(T.regions)T.dx.forEach(d=>T.regions.some(g=>g.id===d.region)||err(`${t.id}/${d.name}: region 不在 regions 清單`));
  (T.presets||[]).forEach(p=>(p.vals.length!==T.steps.length||p.vals.some((v,i)=>!T.steps[i].options.includes(v)))&&err(`${t.id}: 範例「${p.label}」與選項不符`));
  console.log(`✓ ${t.id}：${T.steps.length} 項線索、${T.dx.length} 個診斷、${(T.presets||[]).length} 個範例`);
}
process.exit(bad?1:0);
