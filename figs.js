/* 手繪風病灶示意圖（簡化，非精確解剖）。紅色區域為病灶；除非標示雙側，皆畫在影像右側 */
const FIGS={
 mid:{vb:'0 0 220 190',t:'中腦（軸狀切面）',a:['背側','腹側'],
  out:'<path class="fg-line" d="M45,70 C45,35 75,22 110,22 C145,22 175,35 175,70 C175,110 150,150 110,160 C70,150 45,110 45,70 Z"/>',
  deco:'<circle class="d" cx="110" cy="62" r="5"/><circle class="d" cx="85" cy="86" r="10"/><circle class="d" cx="135" cy="86" r="10"/><path class="d" d="M110,100 L110,150"/>',
  z:{ventral:['大腦腳（皮質脊髓束）',134,116,18,20],tegmentum:['被蓋（紅核區）',138,86,22,16],tegmentum_d:['背內側被蓋',128,76,12,9],cn3:['動眼神經纖維',122,106,8,16],scp:['上小腦腳交叉',110,92,12,9],dorsal:['頂蓋前區／上丘',110,40,30,11]}},
 pons:{vb:'0 0 220 190',t:'橋腦（軸狀切面）',a:['背側','腹側'],
  out:'<path class="fg-line" d="M30,85 C30,45 70,28 110,28 C150,28 190,45 190,85 C190,135 150,168 110,168 C70,168 30,135 30,85 Z"/>',
  deco:'<path class="d" d="M95,44 L125,44 L110,60 Z"/><path class="d" d="M40,100 C70,80 150,80 180,100"/><path class="d" d="M110,100 L110,160"/>',
  z:{basis:['橋腹側基底部（皮質脊髓束）',140,125,30,28],tegmentum:['橋被蓋',135,70,28,18],mlf:['內側縱束',120,52,7,9],pprf:['外展核／水平凝視中樞',134,54,11,9],cn7:['顏面神經纖維',152,96,9,12],cn6f:['外展神經纖維',124,118,7,16],lateral:['外側橋（小腦腳、痛溫覺徑）',172,88,15,26]}},
 med:{vb:'0 0 220 190',t:'延髓（軸狀切面）',a:['背側','腹側'],
  out:'<path class="fg-line" d="M60,80 C60,45 85,30 110,30 C135,30 160,45 160,80 C160,125 135,165 110,170 C85,165 60,125 60,80 Z"/>',
  deco:'<circle class="d" cx="110" cy="68" r="4"/><ellipse class="d" cx="95" cy="138" rx="9" ry="18"/><ellipse class="d" cx="125" cy="138" rx="9" ry="18"/><ellipse class="d" cx="76" cy="112" rx="11" ry="14"/><ellipse class="d" cx="144" cy="112" rx="11" ry="14"/>',
  z:{lateral:['外側延髓（疑核、三叉脊徑、痛溫覺徑）',143,82,14,26],medial:['內側延髓（錐體、舌下神經、內側蹄系）',122,120,11,30]}},
 cbl:{vb:'0 0 220 190',t:'小腦（後面觀）',a:['上','下'],
  out:'<ellipse class="fg-line" cx="66" cy="105" rx="56" ry="62"/><ellipse class="fg-line" cx="154" cy="105" rx="56" ry="62"/><ellipse class="fg-line" cx="110" cy="105" rx="13" ry="60"/>',
  deco:'<path class="d" d="M20,90 C60,100 90,100 105,90"/><path class="d" d="M200,90 C160,100 130,100 115,90"/>',
  z:{sca:['小腦上部（SCA 領域）',152,58,38,22],pica:['小腦下內側（PICA 領域）',142,142,28,30],aica:['小腦前下外側（AICA 領域）',182,126,15,20],whole:['整個半球（腫脹）',154,105,56,62],post:['後葉',142,122,34,42],vermis:['小腦蚓部',110,105,13,60]}},
 cer:{vb:'0 0 220 248',t:'大腦（軸狀切面）',a:['前','後'],
  out:'<path class="fg-line" d="M110,20 C165,20 195,70 195,130 C195,190 160,228 110,228 C60,228 25,190 25,130 C25,70 55,20 110,20 Z"/>',
  deco:'<path class="d" d="M110,20 L110,228"/><ellipse class="d" cx="142" cy="108" rx="12" ry="18"/><ellipse class="d" cx="78" cy="108" rx="12" ry="18"/><ellipse class="d" cx="122" cy="130" rx="9" ry="15"/><ellipse class="d" cx="98" cy="130" rx="9" ry="15"/>',
  z:{aca:['ACA 領域（內側額葉）',118,52,12,30],mca_s:['MCA 上分支領域（外側額葉）',160,62,22,28],mca_i:['MCA 下分支領域（外側顳頂葉）',170,150,18,40],pca:['PCA 領域（枕葉）',128,205,26,14],ang:['頂葉（角迴區）',158,172,18,18],splen:['胼胝體壓部',110,178,12,8],capsule:['內囊後肢',131,112,6,20],genu:['內囊膝部',128,90,6,10],thal:['丘腦',122,130,10,15],ws_a:['ACA–MCA 分水嶺',142,70,8,24],ws_p:['MCA–PCA 分水嶺（頂枕交界）',150,186,14,12],lgn:['外側膝狀體',126,148,6,6]}}
};
let figN=0;
function figZones(f){const V=FIGS[f.v];return V?(f.z||[]).map(k=>V.z[k]).filter(Boolean):[]}
function figSVG(f){
  const V=FIGS[f.v];if(!V)return'';const id='sk'+(++figN),zs=figZones(f),H=+V.vb.split(' ')[3];
  const el=z=>`<ellipse class="fg-hl" cx="${z[1]}" cy="${z[2]}" rx="${z[3]}" ry="${z[4]}"/>`;
  const hl=zs.map(el).join('')+(f.b?`<g transform="translate(220,0) scale(-1,1)">${zs.filter(z=>z[1]!==110).map(el).join('')}</g>`:'');
  return `<svg viewBox="${V.vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${V.t}病灶示意"><defs><filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="${figN%9+1}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.5"/></filter></defs>
   <g filter="url(#${id})">${V.out}${V.deco}${hl}</g>
   <text class="fg-t" x="6" y="14">${V.t}</text><text class="fg-t" x="214" y="14" text-anchor="end">${f.b?'雙側':'病灶側（示意）'}</text>
   <text class="fg-t" x="110" y="${H-4}" text-anchor="middle">${V.a[1]}</text><text class="fg-t" x="110" y="26" text-anchor="middle" opacity="0">${V.a[0]}</text></svg>`;
}
function figCap(f){return '紅色區域：'+figZones(f).map(z=>z[0]).join('、')+(f.n?'。'+f.n:'')+'（示意圖，非精確解剖）'}
function figBlock(f){return `<div class="fgwrap">${figSVG(f)}<div class="fgcap">${figCap(f)}</div></div>`}
function figDetails(f){return `<details class="fgd"><summary>🧠 病灶示意圖</summary>${figBlock(f)}</details>`}
