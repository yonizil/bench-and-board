/* Bench & Board — app logic
   Plain vanilla JavaScript, no framework, no build step.
   Everything runs in the browser. Nothing is sent to a server. */

function parseInches(str){
  if(str==null)return NaN;
  str=(''+str).trim().replace(/"/g,'');
  if(str==='')return NaN;
  if(/^-?\d*\.?\d+$/.test(str))return parseFloat(str);
  var m=str.match(/^(-?\d+)[\s-]+(\d+)\s*\/\s*(\d+)$/);
  if(m){var w=parseInt(m[1]);var s=w<0?-1:1;return w+s*(parseInt(m[2])/parseInt(m[3]));}
  m=str.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if(m)return parseInt(m[1])/parseInt(m[2]);
  return evalExpression(str);
}
/* prices may include $ , and spaces */
function parseMoney(str){
  if(str==null)return NaN;
  str=(''+str).replace(/[$,\s]/g,'');
  if(str==='')return NaN;
  return parseInches(str);
}
function evalExpression(str){
  str=str.replace(/(\d+)\s+(\d+)\s*\/\s*(\d+)/g,function(_,w,n,d){return (parseInt(w)+parseInt(n)/parseInt(d)).toString();});
  if(!/^[\d\s.+\-*/()]+$/.test(str))return NaN;
  if(!/[+\-*/]/.test(str))return NaN;
  try{var v=Function('"use strict";return ('+str+')')();return (typeof v==='number'&&isFinite(v))?v:NaN;}catch(e){return NaN;}
}
/* full expression for the calculator: handles mixed numbers, fractions,
   and the friendly symbols on the keypad. Returns NaN if incomplete. */
function evalFraction(raw){
  if(raw==null)return NaN;
  var str=(''+raw).replace(/"/g,'').replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').trim();
  if(str==='')return NaN;
  str=str.replace(/(\d+)\s+(\d+)\s*\/\s*(\d+)/g,function(_,w,n,d){return (parseInt(w)+parseInt(n)/parseInt(d));});
  str=str.replace(/\s+/g,'');
  if(!/^[\d.+\-*/()]+$/.test(str))return NaN;
  if(/[+\-*/.]$/.test(str))return NaN;
  try{var v=Function('"use strict";return ('+str+')')();return (typeof v==='number'&&isFinite(v))?v:NaN;}catch(e){return NaN;}
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=b;b=a%b;a=t;}return a;}
function toFraction(value,denom){
  if(denom===0)denom=64;
  var neg=value<0;value=Math.abs(value);
  var whole=Math.floor(value);var num=Math.round((value-whole)*denom);
  if(num===denom){whole+=1;num=0;}
  var out;
  if(num===0)out=whole.toString();
  else{var g=gcd(num,denom);out=(whole>0?whole+' ':'')+(num/g)+'/'+(denom/g);}
  return (neg?'-':'')+out;
}
function fmt(n){return (Math.round(n*1000)/1000).toString();}
/* display a measurement as a mixed-number fraction (1/16" precision) */
function fmtInch(n){
  var f=toFraction(n,16);
  return f+'"';
}
/* ---- units (in/cm) + smart-buy helpers ---- */
function unitsMetric(){var s=document.getElementById('unitSel');return !!(s&&s.value==='cm');}
function parseLen(str){if(unitsMetric()){var v=parseFloat((''+str).replace(',','.'));return isNaN(v)?NaN:v/2.54;}return parseInches(str);}
function fmtLen(inches){if(unitsMetric())return (Math.round(inches*2.54*10)/10)+' cm';return fmtInch(inches);}
function fmtLenShort(inches){if(unitsMetric())return ''+Math.round(inches*2.54);return fmt(inches)+'"';}
function smartBuyOn(){var c=document.getElementById('smartBuy');return c?c.checked:true;}
function candidateLengths(prof){var lim=maxHaulInches();var all=/Picket/.test(prof)?[72,96,120,144]:[96,120,144,192];var o=all.filter(function(x){return x<=lim+1e-6;});return o.length?o:[all[0]];}
function showToast(msg){var t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  setTimeout(function(){t.classList.remove('show');},1900);}
/* navigation (top tabs + hamburger menu share this) */
function goTo(id, scrollToId){
  document.querySelectorAll('section').forEach(function(x){x.classList.remove('active');});
  var sec=document.getElementById(id); if(sec)sec.classList.add('active');
  document.querySelectorAll('.tab').forEach(function(t){t.classList.toggle('active', t.dataset.tab===id);});
  if(id==='prices'&&typeof renderPriceBook==='function')renderPriceBook();
  if(id==='settings'&&typeof checkStatus==='function')checkStatus();
  if(scrollToId){
    var el=document.getElementById(scrollToId);
    if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
  }else{
    window.scrollTo({top:0,behavior:'smooth'});
  }
}
document.querySelectorAll('.tab').forEach(function(t){
  t.addEventListener('click',function(){goTo(t.dataset.tab);});
});
var stockLen=document.getElementById('stockLen');
stockLen.addEventListener('change',function(){
  document.getElementById('customLenWrap').style.display=stockLen.value==='custom'?'block':'none';
});
/* "Fits in my car": caps the longest board the app offers / recommends */
var MAXHAUL_KEY='benchboard_maxhaul';
var maxHaulSel=document.getElementById('maxHaul');
function maxHaulInches(){return maxHaulSel?(parseFloat(maxHaulSel.value)||192):192;}
function applyMaxHaulToStock(){
  if(!maxHaulSel)return;
  var lim=maxHaulInches();
  Array.prototype.forEach.call(stockLen.options,function(o){
    var v=parseFloat(o.value);
    if(!isNaN(v))o.disabled=(v>lim+1e-6);
  });
  if(stockLen.value!=='custom'){
    var cur=parseFloat(stockLen.value);
    if(!isNaN(cur)&&cur>lim){
      var best=null;
      Array.prototype.forEach.call(stockLen.options,function(o){var v=parseFloat(o.value);if(!isNaN(v)&&v<=lim&&(best===null||v>best))best=v;});
      if(best!==null)stockLen.value=String(best);
    }
  }
}
if(maxHaulSel){
  try{var savedHaul=localStorage.getItem(MAXHAUL_KEY);if(savedHaul)maxHaulSel.value=savedHaul;}catch(e){}
  maxHaulSel.addEventListener('change',function(){
    try{localStorage.setItem(MAXHAUL_KEY,maxHaulSel.value);}catch(e){}
    applyMaxHaulToStock();
  });
  applyMaxHaulToStock();
}
/* smart-buy + measurement-unit preferences */
var smartBuyChk=document.getElementById('smartBuy');
if(smartBuyChk){
  try{var sv=localStorage.getItem('benchboard_smartbuy');if(sv!=null)smartBuyChk.checked=(sv==='1');}catch(e){}
  smartBuyChk.addEventListener('change',function(){try{localStorage.setItem('benchboard_smartbuy',smartBuyChk.checked?'1':'0');}catch(e){}});
}
var unitSel=document.getElementById('unitSel');
function applyUnits(){
  var metric=unitsMetric();
  var lbl=document.getElementById('pLenLabel');if(lbl)lbl.textContent=metric?'Length (cm)':'Length (in)';
  var pl=document.getElementById('pLen');if(pl)pl.placeholder=metric?'72':'28.5';
  if(typeof renderList==='function'&&Array.isArray(pieces))renderList();
}
if(unitSel){
  try{var uu=localStorage.getItem('benchboard_units');if(uu)unitSel.value=uu;}catch(e){}
  unitSel.addEventListener('change',function(){try{localStorage.setItem('benchboard_units',unitSel.value);}catch(e){}applyUnits();});
  applyUnits();
}
/* pieces: each = {qty, len, profile, label} */
var pieces=[];var listEl=document.getElementById('pieceList');
function defaultProfile(){return document.getElementById('stockProfile').value;}
var editingIndex=-1;
function renderList(){
  if(pieces.length===0){listEl.innerHTML='<div class="empty">No pieces yet. Add each cut your project needs.</div>';return;}
  listEl.innerHTML='';
  pieces.forEach(function(p,i){
    var prof=(p.profile==='default')?'default board':p.profile;
    var lab=p.label?(p.label+' &middot; '):'';
    var d=document.createElement('div');d.className='piece'+(editingIndex===i?' editing':'');
    d.innerHTML='<span class="tag">'+p.qty+'&#215;</span><div class="meta"><div class="len">'+fmtLen(p.len)+'</div><div class="lab">'+lab+prof+'</div></div>'+
      '<button class="pbtn edit-btn" data-i="'+i+'" aria-label="edit" title="Edit">&#9998;</button>'+
      '<button class="del" data-i="'+i+'" aria-label="remove">&#215;</button>';
    listEl.appendChild(d);
  });
  listEl.querySelectorAll('.del').forEach(function(b){
    b.addEventListener('click',function(){
      if(editingIndex===+b.dataset.i){cancelEdit();}
      pieces.splice(+b.dataset.i,1);renderList();document.getElementById('result').innerHTML='';hideSave();
    });
  });
  listEl.querySelectorAll('.edit-btn').forEach(function(b){
    b.addEventListener('click',function(){startEdit(+b.dataset.i);});
  });
}
function startEdit(i){
  var p=pieces[i];
  editingIndex=i;
  document.getElementById('pQty').value=p.qty;
  document.getElementById('pLen').value=unitsMetric()?(Math.round(p.len*2.54*10)/10):fmt(p.len);
  document.getElementById('pProfile').value=p.profile;
  document.getElementById('pLabel').value=p.label||'';
  document.getElementById('addPiece').textContent='Update piece';
  renderList();
  document.getElementById('pLen').focus();
}
function cancelEdit(){
  editingIndex=-1;
  document.getElementById('pQty').value=1;
  document.getElementById('pLen').value='';
  document.getElementById('pProfile').value='default';
  document.getElementById('pLabel').value='';
  document.getElementById('addPiece').textContent='Add to list';
}
function addPiece(){
  lastPlanInfo=null;
  var q=parseInt(document.getElementById('pQty').value);
  var l=parseLen(document.getElementById('pLen').value);
  var prof=document.getElementById('pProfile').value;
  var label=document.getElementById('pLabel').value.trim().slice(0,24);
  if(!q||q<1){alert('Enter how many pieces (1 or more).');return;}
  if(!l||l<=0||isNaN(l)){alert(unitsMetric()?'Enter a length in centimeters, e.g. 72.':'Enter a length in inches. You can type 28.5 or 28 1/2.');return;}
  if(editingIndex>=0&&editingIndex<pieces.length){
    pieces[editingIndex]={qty:q,len:l,profile:prof,label:label};
    cancelEdit();
  }else{
    pieces.push({qty:q,len:l,profile:prof,label:label});
    document.getElementById('pLen').value='';document.getElementById('pQty').value='1';document.getElementById('pLabel').value='';
    document.getElementById('pLen').focus();
  }
  document.getElementById('result').innerHTML='';hideSave();renderList();
}
document.getElementById('addPiece').addEventListener('click',addPiece);
/* Enter key on any add-piece field adds the piece */
['pQty','pLen','pLabel'].forEach(function(id){
  document.getElementById(id).addEventListener('keydown',function(e){
    if(e.key==='Enter'){e.preventDefault();addPiece();}
  });
});
/* popular board quick buttons (Add pieces) */
var pProfileSel=document.getElementById('pProfile');
function syncBoardChips(){
  document.querySelectorAll('#boardChips .chip').forEach(function(c){
    c.classList.toggle('active', c.dataset.board===pProfileSel.value);
  });
}
document.querySelectorAll('#boardChips .chip').forEach(function(c){
  c.addEventListener('click',function(){pProfileSel.value=c.dataset.board;syncBoardChips();});
});
pProfileSel.addEventListener('change',syncBoardChips);
pProfileSel.value='2x4';syncBoardChips();
document.getElementById('clearAll').addEventListener('click',function(){
  pieces=[];cancelEdit();renderList();document.getElementById('result').innerHTML='';hideSave();lastPlanInfo=null;
});
function stockLength(){
  if(stockLen.value==='custom'){var c=parseInches(document.getElementById('customLen').value);return (c&&c>0)?c:null;}
  return parseFloat(stockLen.value);
}
function profileLabel(prof,feet){
  return (prof==='any'?'':prof+' ')+(feet%1===0?feet:feet.toFixed(1))+' ft';
}
/* actual milled dimensions (thickness x width, inches) for surface-area math */
var ACTUAL={
  '2x2':{t:1.5,w:1.5},'2x4':{t:1.5,w:3.5},'2x6':{t:1.5,w:5.5},'2x8':{t:1.5,w:7.25},'2x10':{t:1.5,w:9.25},'2x12':{t:1.5,w:11.25},
  '4x4':{t:3.5,w:3.5},'6x6':{t:5.5,w:5.5},
  '1x2':{t:0.75,w:1.5},'1x3':{t:0.75,w:2.5},'1x4':{t:0.75,w:3.5},'1x6':{t:0.75,w:5.5},'1x8':{t:0.75,w:7.25},'1x10':{t:0.75,w:9.25},'1x12':{t:0.75,w:11.25},
  'Picket 3.5"':{t:0.625,w:3.5},'Picket 5.5"':{t:0.625,w:5.5},'Picket 6"':{t:0.625,w:6}
};
/* pack one group of cuts into boards via First Fit Decreasing.
   A board only loses kerf BETWEEN pieces, so the first piece on a board
   pays no kerf. This avoids over-buying and negative-scrap displays. */
function packGroup(cuts,usable,kerf){
  cuts=cuts.slice().sort(function(a,b){return b-a;});
  var boards=[];
  cuts.forEach(function(c){
    var placed=false;
    for(var b=0;b<boards.length;b++){
      var k=boards[b].segs.length>0?kerf:0;
      if(boards[b].used+k+c<=usable+1e-6){boards[b].used+=k+c;boards[b].segs.push(c);placed=true;break;}
    }
    if(!placed)boards.push({used:c,segs:[c]});
  });
  return boards;
}
document.getElementById('calc').addEventListener('click',function(){runCalc();});
function runCalc(){
  var res=document.getElementById('result');
  var stock=stockLength();
  var kerf=parseFloat(document.getElementById('kerf').value);
  var prices=loadPrices();
  var trim=parseInches(document.getElementById('trimEnd').value);
  var spare=document.getElementById('spare').checked;
  var defProf=defaultProfile();
  if(isNaN(trim)||trim<0)trim=0;
  var smartOn=smartBuyOn();
  if(pieces.length===0){res.innerHTML='<div class="warn">Add at least one piece first.</div>';hideSave();return;}
  if(!smartOn){
    if(!stock){res.innerHTML='<div class="warn">Enter a valid custom stock length.</div>';hideSave();return;}
    if(stock>maxHaulInches()+1e-6){res.innerHTML='<div class="warn">A '+fmt(stock/12)+' ft board is longer than your car fits ('+fmt(maxHaulInches()/12)+' ft). Pick a shorter stock length, or change "Fits in my car" in Settings.</div>';hideSave();return;}
    if(stock-2*trim<=0){res.innerHTML='<div class="warn">Trim amount is too big for this board length.</div>';hideSave();return;}
  }
  function estPrice(prof,L){var base=prices[prof]||0;var ref=/Picket/.test(prof)?72:96;return base>0?base*(L/ref):0;}
  // group pieces by resolved profile
  var groups={};var order=[];
  pieces.forEach(function(p){
    var prof=(p.profile==='default')?defProf:p.profile;
    if(!groups[prof]){groups[prof]=[];order.push(prof);}
    for(var i=0;i<p.qty;i++)groups[prof].push(p.len);
  });
  var grandBoards=0,grandCost=0,html='';
  var perType=[],resultGroups=[],tooLong=null,lensUsed={};
  order.forEach(function(prof){
    var arr=groups[prof];
    var cands=smartOn?candidateLengths(prof):[stock];
    var best=null,longU=0;
    cands.forEach(function(L){
      if(!L)return;
      var uG=L-2*trim;if(uG>longU)longU=uG;
      if(uG<=0)return;
      if(!arr.every(function(c){return c<=uG+1e-6;}))return;
      var bds=packGroup(arr,uG,kerf);
      var cand={L:L,uG:uG,feet:L/12,boards:bds,purchased:bds.length*L,unit:estPrice(prof,L)};
      if(!best||cand.purchased<best.purchased-1e-6||(Math.abs(cand.purchased-best.purchased)<1e-6&&cand.boards.length<best.boards.length))best=cand;
    });
    if(!best){if(!tooLong)tooLong={prof:prof,usable:longU,maxLen:Math.max.apply(null,arr)};return;}
    lensUsed[best.feet]=1;
    var boards=best.boards.slice();
    if(spare)boards.push({used:0,segs:[],isSpare:true});
    grandBoards+=boards.length;
    if(best.unit>0)grandCost+=best.unit*boards.length;
    perType.push({prof:prof,count:boards.length,feet:best.feet});
    resultGroups.push({prof:prof,boards:boards,usable:best.uG,feet:best.feet,trim:trim});
  });
  if(tooLong){res.innerHTML='<div class="warn">A '+fmtLen(tooLong.maxLen)+' piece won\'t fit on a '+fmtLen(tooLong.usable)+' usable board ('+tooLong.prof+'). Use a shorter length, less end-trim'+(smartOn?', or raise "Fits in my car" in Settings':'')+'.</div>';hideSave();return;}
  // buy summary
  html+='<div class="buyline">';
  if(perType.length===1){
    html+='<div class="num">Buy '+perType[0].count+' <small>&#215; '+profileLabel(perType[0].prof,perType[0].feet)+'</small></div>';
  }else{
    html+='<div class="num">Shopping list</div><div style="margin-top:12px;">';
    perType.forEach(function(t){
      html+='<div class="buyrow"><span>'+profileLabel(t.prof,t.feet)+'</span><b>'+t.count+'</b></div>';
    });
    html+='</div>';
  }
  var subbits=[grandBoards+' board'+(grandBoards!==1?'s':'')+' total'];
  if(smartOn)subbits.push(Object.keys(lensUsed).length>1?'smart-buy mix':'smart-buy');
  if(spare)subbits.push('incl. spares');
  if(grandCost>0)subbits.push('~$'+grandCost.toFixed(2));
  html+='<div class="sub">'+subbits.join(' &middot; ')+'</div></div>';
  // per-group cut maps
  resultGroups.forEach(function(rg){
    if(resultGroups.length>1)html+='<div class="grouphdr">'+rg.prof+(smartOn?' &middot; '+profileLabel('',rg.feet).trim():'')+'</div>';
    rg.boards.forEach(function(bd,i){
      if(bd.isSpare){
        html+='<div class="board"><div class="bhead"><span class="name">Board '+(i+1)+' (spare)</span><span class="scrap" style="color:var(--good)">backup</span></div><div class="bar"><div class="seg scrap" style="flex:1">keep on hand</div></div></div>';
        return;
      }
      var left=Math.max(0,rg.usable-bd.used);
      html+='<div class="board"><div class="bhead"><span class="name">Board '+(i+1)+'</span><span class="scrap">scrap '+fmtLen(Math.round(left*100)/100)+'</span></div><div class="bar">';
      if(rg.trim>0)html+='<div class="seg trim" style="flex:'+rg.trim+' '+rg.trim+' 0">trim</div>';
      bd.segs.forEach(function(s){html+='<div class="seg use" style="flex:'+s+' '+s+' 0">'+fmtLenShort(s)+'</div>';});
      if(left>0.25)html+='<div class="seg scrap" style="flex:'+left+' '+left+' 0">scrap</div>';
      if(rg.trim>0)html+='<div class="seg trim" style="flex:'+rg.trim+' '+rg.trim+' 0">trim</div>';
      html+='</div></div>';
    });
  });
  // legend
  html+='<div class="legend"><span><i style="background:linear-gradient(180deg,var(--use),var(--use-dk))"></i>your cut</span><span><i style="background:repeating-linear-gradient(45deg,#e6dfd2,#e6dfd2 4px,#d8cfbd 4px,#d8cfbd 8px)"></i>scrap</span>';
  if(trim>0)html+='<span><i style="background:repeating-linear-gradient(45deg,#e7c3b6,#e7c3b6 4px,#dcae9e 4px,#dcae9e 8px)"></i>trimmed end</span>';
  html+='</div>';
  // plain text cut list
  html+='<div class="cutlist"><h3>Cut list</h3>';
  resultGroups.forEach(function(rg){
    if(resultGroups.length>1)html+='<div class="cutrow" style="margin-top:6px;color:var(--steel);font-weight:700">'+rg.prof+'</div>';
    rg.boards.forEach(function(bd,i){
      if(bd.isSpare){html+='<div class="cutrow"><b>Board '+(i+1)+':</b> spare, leave uncut</div>';return;}
      var counts={};bd.segs.forEach(function(s){counts[s]=(counts[s]||0)+1;});
      var parts=Object.keys(counts).map(function(key){return counts[key]+' @ '+fmtLen(parseFloat(key));});
      html+='<div class="cutrow"><b>Board '+(i+1)+':</b> '+parts.join('  &middot;  ')+'</div>';
    });
  });
  html+='</div>';
  var allCuts=0;order.forEach(function(p){groups[p].forEach(function(c){allCuts+=c;});});
  var totalUsable=0;resultGroups.forEach(function(rg){rg.boards.forEach(function(bd){if(!bd.isSpare)totalUsable+=rg.usable;});});
  var efficiency=totalUsable>0?Math.round(allCuts/totalUsable*100):0;
  html+='<div class="totals"><b>Wood in cuts:</b> '+fmtLen(Math.round(allCuts*10)/10)+'  &middot;  <b>Boards:</b> '+grandBoards;
  html+='  &middot;  <b>Kerf:</b> '+fmt(kerf)+'"/cut';
  html+='  &middot;  <b>Efficiency:</b> <span style="color:'+(efficiency>=75?'var(--good)':efficiency>=50?'var(--amber-dk)':'var(--cut)')+'">'+efficiency+'%</span></div>';
  // project extras: rough screws + finish estimate
  var exPieces=0,exSqIn=0;
  order.forEach(function(prof){
    var dims=ACTUAL[prof]||ACTUAL['2x4'];
    groups[prof].forEach(function(len){exPieces++;exSqIn+=2*(dims.t+dims.w)*len+2*(dims.t*dims.w);});
  });
  var exSqft=Math.round(exSqIn/144*10)/10;
  var exScrews=Math.max(8,Math.ceil(exPieces*4/10)*10);
  var exStain=Math.max(1,Math.ceil(exSqft/125));
  var exPaint=Math.max(1,Math.ceil(exSqft/100));
  html+='<div class="extras"><h3>Project extras <span class="exhint">rough estimate</span></h3>'+
    '<div class="exrow"><span>Screws</span><b>~'+exScrews+'</b></div>'+
    '<div class="exrow"><span>Surface to finish</span><b>~'+exSqft+' sq ft</b></div>'+
    '<div class="exrow"><span>Stain</span><b>~'+exStain+' qt / coat</b></div>'+
    '<div class="exrow"><span>Paint</span><b>~'+exPaint+' qt / coat</b></div>'+
    '<div class="exnote">Screws assume about four per piece. Finish is from board surface area (stain ~125, paint ~100 sq ft per quart). Buy a little extra.</div></div>';
  lastCalc={resultGroups:resultGroups,kerf:kerf,grandBoards:grandBoards,grandCost:grandCost,trim:trim,spare:spare,prices:prices,efficiency:efficiency,smartOn:smartOn,extras:{screws:exScrews,sqft:exSqft,stain:exStain,paint:exPaint,pieces:exPieces}};
  res.innerHTML=html;
  buildCopyText(resultGroups,kerf,grandBoards,grandCost,trim);
  showSave();
  res.scrollIntoView({behavior:'smooth',block:'start'});
}
/* plain-text cut list for clipboard */
var _copyText='';
var lastCalc=null;
var lastPlanInfo=null;
function buildCopyText(resultGroups,kerf,grandBoards,grandCost,trim){
  var lines=['=== Bench & Board Cut List ===',''];
  resultGroups.forEach(function(rg){
    if(resultGroups.length>1)lines.push('-- '+rg.prof+' ('+profileLabel('',rg.feet).trim()+') --');
    rg.boards.forEach(function(bd,i){
      if(bd.isSpare){lines.push('Board '+(i+1)+': spare (keep uncut)');return;}
      var counts={};bd.segs.forEach(function(s){counts[s]=(counts[s]||0)+1;});
      var parts=Object.keys(counts).map(function(k){return counts[k]+' @ '+fmtLen(parseFloat(k));});
      var left=Math.max(0,rg.usable-bd.used);
      lines.push('Board '+(i+1)+': '+parts.join(', ')+(left>0.25?' | scrap '+fmtLen(Math.round(left*100)/100):''));
    });
  });
  lines.push('');
  lines.push('Buy: '+grandBoards+' board'+(grandBoards!==1?'s':'')+' total');
  resultGroups.forEach(function(rg){
    var n=rg.boards.filter(function(b){return !b.isSpare;}).length+(rg.boards.some(function(b){return b.isSpare;})?1:0);
    lines.push('  '+n+' x '+profileLabel(rg.prof,rg.feet));
  });
  if(grandCost>0)lines.push('Est. cost: $'+grandCost.toFixed(2));
  _copyText=lines.join('\n');
}
document.getElementById('copyListBtn').addEventListener('click',function(){
  if(!_copyText){showToast('Run the calculator first');return;}
  copyText(_copyText);showToast('Cut list copied');
});
/* save / share via URL */
function currentState(){
  return {
    sp:document.getElementById('stockProfile').value,
    sl:stockLen.value,
    cl:document.getElementById('customLen').value,
    k:document.getElementById('kerf').value,
    tr:document.getElementById('trimEnd').value,
    spr:document.getElementById('spare').checked?1:0,
    pcs:pieces
  };
}
function showSave(){document.getElementById('saveShareWrap').style.display='flex';}
function hideSave(){document.getElementById('saveShareWrap').style.display='none';}
document.getElementById('saveBtn').addEventListener('click',function(){
  try{
    var enc=btoa(unescape(encodeURIComponent(JSON.stringify(currentState()))));
    var url=location.origin+location.pathname+'#p='+enc;
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(function(){showToast('Share link copied');},function(){fallbackCopy(url);});
    }else{fallbackCopy(url);}
    location.hash='p='+enc;
  }catch(e){showToast('Could not build link');}
});
function fallbackCopy(text){
  var ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
  document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');showToast('Share link copied');}catch(e){showToast('Copy failed, link in address bar');}
  document.body.removeChild(ta);
}
/* build a clean one-page spec sheet for printing / saving as PDF */
function buildSpecSheet(){
  if(!lastCalc)return false;
  var lc=lastCalc;
  var dateStr=new Date().toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
  function pUnit(prof,feet){var base=lc.prices[prof]||0;var ref=/Picket/.test(prof)?72:96;return base>0?base*(feet*12/ref):0;}
  var rows='',shopCost=0;
  lc.resultGroups.forEach(function(rg){
    var count=rg.boards.length,unit=pUnit(rg.prof,rg.feet),cost=unit*count;shopCost+=cost;
    var name=(rg.prof==='any')?'Any / mixed':rg.prof;
    rows+='<tr><td><span class="ps-box"></span></td>'+
      '<td class="ps-qty">'+count+'</td>'+
      '<td class="ps-item">'+escapeHtml(name)+' <span class="ps-dim">&middot; '+profileLabel('',rg.feet).trim()+'</span></td>'+
      '<td class="ps-cost">'+(unit>0?'$'+cost.toFixed(2):'&mdash;')+'</td></tr>';
  });
  var cuts='';
  lc.resultGroups.forEach(function(rg){
    if(lc.resultGroups.length>1)cuts+='<div class="ps-cgroup">'+escapeHtml(rg.prof)+' &middot; '+profileLabel('',rg.feet).trim()+'</div>';
    rg.boards.forEach(function(bd,i){
      if(bd.isSpare){cuts+='<div class="ps-crow"><span class="ps-bd">Board '+(i+1)+'</span><span class="ps-cs">spare &mdash; keep uncut</span><span class="ps-sc"></span></div>';return;}
      var counts={};bd.segs.forEach(function(s){counts[s]=(counts[s]||0)+1;});
      var parts=Object.keys(counts).map(function(k){return counts[k]+' @ '+fmtLen(parseFloat(k));});
      var left=Math.max(0,rg.usable-bd.used);
      cuts+='<div class="ps-crow"><span class="ps-bd">Board '+(i+1)+'</span><span class="ps-cs">'+parts.join('  &middot;  ')+'</span><span class="ps-sc">'+(left>0.25?'scrap '+fmtLen(Math.round(left*100)/100):'')+'</span></div>';
    });
  });
  var sset='<span><b>Buying:</b> '+(lc.smartOn?'smart-buy':'fixed length')+'</span>'+
    '<span><b>Blade kerf:</b> '+fmt(lc.kerf)+'"</span>'+
    (lc.trim>0?'<span><b>Trim / end:</b> '+fmtLen(lc.trim)+'</span>':'')+
    '<span><b>Spare board:</b> '+(lc.spare?'yes':'no')+'</span>'+
    '<span><b>Efficiency:</b> '+lc.efficiency+'%</span>';
  var logo='<svg viewBox="0 0 24 24" fill="none"><path d="M3 17h18M6 17V9l6-3 6 3v8" stroke="#e0a838" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 17v-4h4v4" stroke="#e0a838" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var proj=(lastPlanInfo&&lastPlanInfo.name)?lastPlanInfo.name:'';
  var html='<div class="ps-head"><div class="ps-brand"><span class="ps-mark">'+logo+'</span>'+
    '<span class="ps-name">Bench &amp; Board<small>CUT &amp; SHOPPING SPEC</small></span></div>'+
    '<div class="ps-doc"><div class="ps-kind">'+(proj?escapeHtml(proj):'Materials list')+'</div><div class="ps-meta">'+dateStr+' &middot; '+lc.grandBoards+' board'+(lc.grandBoards!==1?'s':'')+'</div></div></div>';
  html+='<div class="ps-sec"><div class="ps-sec-h">Shopping list &mdash; what to buy</div>'+
    '<table class="ps-buy"><thead><tr><th></th><th>Qty</th><th>Board</th><th style="text-align:right">Est.</th></tr></thead>'+
    '<tbody>'+rows+'</tbody>'+
    '<tfoot><tr><td></td><td class="ps-qty">'+lc.grandBoards+'</td><td>Total boards</td><td class="ps-cost">'+(shopCost>0?'$'+shopCost.toFixed(2):'&mdash;')+'</td></tr></tfoot></table></div>';
  html+='<div class="ps-sec"><div class="ps-sec-h">Cut list &mdash; what to cut at home</div><div class="ps-cuts">'+cuts+'</div></div>';
  html+='<div class="ps-sec"><div class="ps-sec-h">Settings</div><div class="ps-settings">'+sset+'</div></div>';
  if(lc.extras){
    html+='<div class="ps-sec"><div class="ps-sec-h">Project extras (rough)</div><div class="ps-settings">'+
      '<span><b>Screws:</b> ~'+lc.extras.screws+'</span>'+
      '<span><b>Finish surface:</b> ~'+lc.extras.sqft+' sq ft</span>'+
      '<span><b>Stain:</b> ~'+lc.extras.stain+' qt/coat</span>'+
      '<span><b>Paint:</b> ~'+lc.extras.paint+' qt/coat</span></div></div>';
  }
  if(lastPlanInfo&&lastPlanInfo.steps&&lastPlanInfo.steps.length){
    html+='<div class="ps-sec"><div class="ps-sec-h">Assembly steps</div><ol class="ps-steps">';
    lastPlanInfo.steps.forEach(function(s){html+='<li>'+s+'</li>';});
    html+='</ol></div>';
  }
  html+='<div class="ps-foot"><span>Generated by Bench &amp; Board &middot; measurements in inches unless noted</span><span>bench-and-board.pages.dev</span></div>';
  document.getElementById('printSheet').innerHTML=html;
  return true;
}
document.getElementById('printBtn').addEventListener('click',function(){
  if(!buildSpecSheet()){showToast('Run the calculator first');return;}
  window.print();
});
/* apply a saved state object to the form */
function applyState(s){
  lastPlanInfo=null;
  if(s.sp)document.getElementById('stockProfile').value=s.sp;
  if(s.sl){stockLen.value=s.sl;document.getElementById('customLenWrap').style.display=s.sl==='custom'?'block':'none';}
  if(s.cl)document.getElementById('customLen').value=s.cl; else document.getElementById('customLen').value='';
  if(s.k)document.getElementById('kerf').value=s.k;
  document.getElementById('trimEnd').value=s.tr||'';
  document.getElementById('spare').checked=!!s.spr;
  pieces=Array.isArray(s.pcs)?s.pcs.map(function(p){return {qty:+p.qty||1,len:+p.len||0,profile:p.profile||'default',label:p.label||''};}).filter(function(p){return p.len>0;}):[];
  if(typeof applyMaxHaulToStock==='function')applyMaxHaulToStock();
  renderList();
}
/* restore from URL on load */
function restoreFromHash(){
  if(location.hash.indexOf('#p=')!==0)return;
  try{
    var raw=decodeURIComponent(escape(atob(location.hash.slice(3))));
    applyState(JSON.parse(raw));
    if(pieces.length){runCalc();showToast('Project loaded from link');}
  }catch(e){/* bad hash, ignore */}
}
/* ---- project presets ---- */
var PRESETS={
  bed:{name:'Raised garden bed',
    fields:[['L','Length (in)','48'],['W','Width (in)','24'],['H','Height (in)','11'],['bw','Side board width (in)','5.5']],
    note:'Side boards stacked in rows. Short sides sit between the long sides (−3" for 1½" lumber). Stakes anchor the corners.',
    build:function(v){
      var rows=Math.max(1,Math.round(v.H/v.bw));
      return [
        {qty:2*rows,len:v.L,profile:'2x6',label:'long sides'},
        {qty:2*rows,len:v.W-3,profile:'2x6',label:'short sides'},
        {qty:4,len:v.H+2,profile:'2x2',label:'corner stakes'}
      ];
    }},
  shelf:{name:'Bookshelf',
    fields:[['W','Width (in)','30'],['H','Height (in)','36'],['n','Number of shelves','3']],
    note:'Sides run the full height. Shelves fit between them (−1½" for ¾" sides). Pick a board as deep as your shelf.',
    build:function(v){
      return [
        {qty:2,len:v.H,profile:'1x8',label:'sides'},
        {qty:Math.max(1,Math.round(v.n)),len:v.W-1.5,profile:'1x8',label:'shelves'}
      ];
    }},
  fence:{name:'Picket fence section',
    fields:[['SW','Section width (in)','72'],['pw','Picket width (in)','5.5'],['g','Gap between (in)','0.5'],['FH','Picket height (in)','72'],['r','Number of rails','3']],
    note:'Pickets are counted to fill the span with your gap. Rails run post to post.',
    build:function(v){
      var pitch=v.pw+v.g;var n=pitch>0?Math.floor((v.SW+v.g)/pitch):0;
      return [
        {qty:Math.max(1,n),len:v.FH,profile:'Picket 5.5"',label:'pickets'},
        {qty:Math.max(1,Math.round(v.r)),len:v.SW,profile:'2x4',label:'rails'}
      ];
    }},
  bench:{name:'Workbench',
    fields:[['L','Top length (in)','60'],['Wd','Top width (in)','24'],['Ht','Height (in)','34'],['sw','Top slat width (in)','5.5']],
    note:'4x4 legs, 2x4 aprons, 2x6 top slats. Aprons set inside the legs (−7" for 3½" legs). Top sits on the frame (−1½").',
    build:function(v){
      var slats=Math.max(1,Math.round(v.Wd/v.sw));
      return [
        {qty:4,len:v.Ht-1.5,profile:'4x4',label:'legs'},
        {qty:2,len:v.L-7,profile:'2x4',label:'long aprons'},
        {qty:2,len:v.Wd-7,profile:'2x4',label:'short aprons'},
        {qty:slats,len:v.L,profile:'2x6',label:'top slats'}
      ];
    }}
};
/* augment presets with a tagline and a 2D sketch */
PRESETS.bed.tag='Stacked-board garden box';
PRESETS.shelf.tag='Open shelves between two sides';
PRESETS.fence.tag='Pickets on rails, post to post';
PRESETS.bench.tag='Four legs, apron frame, slat top';
PRESETS.bed.sketch=sk_bed;
PRESETS.shelf.sketch=sk_shelf;
PRESETS.fence.sketch=sk_fence;
PRESETS.bench.sketch=sk_bench;
PRESETS.bed.steps=[
  'Cut all side boards and corner stakes to length.',
  'Lay out one long side and one short side, then build up the rows.',
  'Screw the short sides between the long sides so the corners overlap.',
  'Stand the box up and add the remaining rows, keeping corners square.',
  'Drive a corner stake at each inside corner and screw through into the boards.',
  'Set the bed in place, level it, and fill with soil.'
];
PRESETS.shelf.steps=[
  'Cut the two sides and all shelves to length.',
  'Mark matching shelf positions on both side boards.',
  'Attach the top and bottom shelves between the sides to form a box.',
  'Add the middle shelves at your marks, checking each for level.',
  'Square the frame and add a back panel or brace if it racks.'
];
PRESETS.fence.steps=[
  'Set and level your posts first (posts are not in the cut list).',
  'Cut the rails to span post to post and fasten them between posts.',
  'Cut pickets to height, dog-earing the tops if you like.',
  'Hang the first picket plumb, then space the rest with a spacer block.',
  'Screw each picket to every rail, checking level as you go.'
];
PRESETS.bench.steps=[
  'Cut the legs, aprons, and top slats to length.',
  'Build two end frames: two legs joined by a short apron.',
  'Connect the end frames with the long aprons to make the base.',
  'Check the base for square, then add a shelf or stretcher if you want one.',
  'Lay the top slats across with an even gap and screw down.'
];
PRESETS.picnic={name:'Picnic table',
  fields:[['L','Table length (in)','72'],['W','Top width (in)','28'],['H','Height (in)','30']],
  note:'Slatted top with attached benches. Legs are cut a touch long for the angle, then trimmed to sit flat.',
  build:function(v){
    return [
      {qty:5,len:v.L,profile:'2x6',label:'tabletop slats'},
      {qty:4,len:v.L,profile:'2x6',label:'bench slats'},
      {qty:4,len:Math.round(v.H*1.25),profile:'2x6',label:'legs'},
      {qty:3,len:v.W,profile:'2x4',label:'top cleats'},
      {qty:2,len:Math.round(v.W*2.1),profile:'2x4',label:'seat supports'},
      {qty:1,len:Math.max(12,v.L-14),profile:'2x4',label:'center brace'}
    ];
  },
  tag:'Slatted top with attached benches',
  steps:[
    'Cut the slats, legs, cleats, and supports to length.',
    'Build two leg pairs, each joined across the middle by a seat support.',
    'Connect the two leg pairs with the center brace to make the base.',
    'Screw the top cleats across the legs, then lay the tabletop slats on with even gaps.',
    'Add the bench slats onto the seat supports and check everything sits level.'
  ]};
PRESETS.planter={name:'Planter box',
  fields:[['L','Box length (in)','36'],['W','Box width (in)','16'],['H','Leg height (in)','24'],['D','Box depth (in)','11'],['bw','Side board width (in)','5.5']],
  note:'Raised box on legs. Side boards stack in rows; short sides sit between the long sides. Leave gaps in the bottom slats to drain.',
  build:function(v){
    var rows=Math.max(1,Math.round(v.D/v.bw));
    return [
      {qty:2*rows,len:v.L,profile:'1x6',label:'long sides'},
      {qty:2*rows,len:v.W-1.5,profile:'1x6',label:'short sides'},
      {qty:4,len:v.H,profile:'2x2',label:'legs'},
      {qty:Math.max(3,Math.round(v.L/6)),len:v.W,profile:'1x4',label:'bottom slats'},
      {qty:2,len:v.L,profile:'2x2',label:'top rails'}
    ];
  },
  tag:'Raised box on four legs',
  steps:[
    'Cut the side boards, legs, bottom slats, and top rails to length.',
    'Build the box: screw the short sides between the long sides, stacking rows to your depth.',
    'Stand a leg in each inside corner and screw through the box sides into it.',
    'Add the top rails around the rim to stiffen the box.',
    'Lay the bottom slats with small gaps for drainage, then line and fill.'
  ]};
PRESETS.plantstand={name:'Plant stand',
  fields:[['Wd','Top size (in)','12'],['Ht','Height (in)','18']],
  note:'Small square stand. Four legs with an apron just under the top, finished with slats.',
  build:function(v){
    return [
      {qty:4,len:v.Ht,profile:'2x2',label:'legs'},
      {qty:4,len:v.Wd-3,profile:'2x2',label:'aprons'},
      {qty:Math.max(2,Math.round(v.Wd/3.5)),len:v.Wd,profile:'1x4',label:'top slats'}
    ];
  },
  tag:'Four legs, apron, slatted top',
  steps:[
    'Cut the legs, aprons, and top slats to length.',
    'Join two legs with an apron to make a side; build two sides.',
    'Connect the two sides with the remaining aprons to form the base.',
    'Check for square, then lay the top slats across with even gaps and screw down.'
  ]};
PRESETS.shoerack={name:'Shoe rack',
  fields:[['W','Width (in)','28'],['H','Height (in)','20'],['D','Depth (in)','10'],['t','Number of tiers','3']],
  note:'Open tiered rack. Each tier is a pair of rails with slats across. Change the tier count for more or fewer shelves.',
  build:function(v){
    var tiers=Math.max(1,Math.round(v.t));
    return [
      {qty:4,len:v.H,profile:'2x2',label:'legs'},
      {qty:2*tiers,len:v.W,profile:'2x2',label:'tier rails'},
      {qty:tiers*Math.max(2,Math.round(v.D/3)),len:v.D,profile:'1x3',label:'shelf slats'}
    ];
  },
  tag:'Open tiers of slats on four legs',
  steps:[
    'Cut the legs, tier rails, and shelf slats to length.',
    'Mark each leg where the tiers go so all four match.',
    'Screw a pair of rails (front and back) at each tier between the legs.',
    'Lay the shelf slats across each tier with even gaps and fasten.',
    'Stand it up and check it sits flat and square.'
  ]};
PRESETS.picnic.sketch=sk_picnic;
PRESETS.planter.sketch=sk_planter;
PRESETS.plantstand.sketch=sk_plantstand;
PRESETS.shoerack.sketch=sk_shoerack;
var PLAN_ORDER=['bed','shelf','fence','bench','picnic','planter','plantstand','shoerack'];
PRESETS.bed.tools=['Tape measure','Pencil','Speed square','Saw (circular or miter)','Drill / driver','Safety glasses'];PRESETS.bed.outdoor=true;
PRESETS.shelf.tools=['Tape measure','Pencil','Speed square','Saw (circular or miter)','Drill / driver','Level','Clamps','Sandpaper'];
PRESETS.fence.tools=['Tape measure','Pencil','Speed square','Saw (circular or miter)','Drill / driver','Level','String line','Post-hole digger'];PRESETS.fence.outdoor=true;
PRESETS.bench.tools=['Tape measure','Pencil','Speed square','Saw (circular or miter)','Drill / driver','Clamps','Sandpaper','Safety glasses'];
PRESETS.picnic.tools=['Tape measure','Pencil','Speed square','Saw (circular or miter)','Drill / driver','Clamps','Sandpaper'];PRESETS.picnic.outdoor=true;
PRESETS.planter.tools=['Tape measure','Pencil','Speed square','Saw (circular or miter)','Drill / driver','Clamps','Staple gun (for liner)'];PRESETS.planter.outdoor=true;
PRESETS.plantstand.tools=['Tape measure','Pencil','Speed square','Saw (circular or miter)','Drill / driver','Sandpaper'];
PRESETS.shoerack.tools=['Tape measure','Pencil','Speed square','Saw (circular or miter)','Drill / driver','Sandpaper'];

function planDefaults(p){var v={};p.fields.forEach(function(f){v[f[0]]=parseInches(f[2]);});return v;}
function planValsLenient(p){var v={};p.fields.forEach(function(f){var x=parseInches(document.getElementById('pf_'+f[0]).value);v[f[0]]=(isNaN(x)||x<=0)?parseInches(f[2]):x;});return v;}
function planValsStrict(p){var v={},ok=true;p.fields.forEach(function(f){var x=parseInches(document.getElementById('pf_'+f[0]).value);if(isNaN(x)||x<=0)ok=false;v[f[0]]=x;});return ok?v:null;}
function planPieces(p,v){return p.build(v).filter(function(x){return x.len>0&&x.qty>0;}).map(function(x){return {qty:Math.round(x.qty),len:Math.round(x.len*16)/16,profile:x.profile||'default',label:x.label||''};});}

/* shopping list: pack each board type onto a sensible stock length, price it */
function planStockLen(prof,maxLen){
  var lim=(typeof maxHaulInches==='function')?maxHaulInches():192;
  var all=/Picket/.test(prof)?[72,96,120,144]:[96,120,144,192];
  var opts=all.filter(function(x){return x<=lim+1e-6;});
  if(opts.length===0)opts=[all[0]];
  for(var i=0;i<opts.length;i++){if(opts[i]>=maxLen-1e-6)return opts[i];}
  return opts[opts.length-1];
}
function computeShopping(built){
  var groups={},order=[];
  built.forEach(function(p){if(!groups[p.profile]){groups[p.profile]=[];order.push(p.profile);}for(var i=0;i<p.qty;i++)groups[p.profile].push(p.len);});
  var prices=loadPrices(),out=[],totalBoards=0,totalCost=0;
  order.forEach(function(prof){
    var arr=groups[prof],maxLen=Math.max.apply(null,arr),stock=planStockLen(prof,maxLen),boards=packGroup(arr,stock,0.125),unit=prices[prof]||0;
    out.push({prof:prof,count:boards.length,lenFt:stock/12,unit:unit});
    totalBoards+=boards.length;totalCost+=unit*boards.length;
  });
  return {groups:out,totalBoards:totalBoards,totalCost:totalCost};
}

function renderPlanGrid(){
  var el=document.getElementById('planGrid');if(!el)return;
  el.innerHTML='';
  PLAN_ORDER.forEach(function(key){
    var p=PRESETS[key];
    var c=document.createElement('button');c.type='button';c.className='plan-card';c.setAttribute('data-key',key);
    c.innerHTML='<div class="plan-thumb">'+p.sketch(planDefaults(p))+'</div><div class="plan-name">'+p.name+'</div><div class="plan-tag">'+p.tag+'</div>';
    el.appendChild(c);
  });
  el.querySelectorAll('.plan-card').forEach(function(c){c.addEventListener('click',function(){selectPlan(c.getAttribute('data-key'));});});
}
function selectPlan(key){
  var p=PRESETS[key],d=document.getElementById('planDetail');
  var h='<div class="card"><h2>'+p.name+'</h2>'
    +'<div class="plan-sketch" id="planSketch">'+p.sketch(planDefaults(p))+'</div>'
    +'<p class="pb-note">'+p.note+'</p><div class="grid2" style="margin-top:4px;">';
  p.fields.forEach(function(f){h+='<div class="field"><label>'+f[1]+'</label><input id="pf_'+f[0]+'" type="text" inputmode="decimal" value="'+f[2]+'"></div>';});
  h+='</div><button class="btn btn-amber" id="planBuild" style="margin-top:15px;">Build cut &amp; shopping list</button><div id="planResult" style="margin-top:18px;"></div></div>';
  d.innerHTML=h;
  p.fields.forEach(function(f){document.getElementById('pf_'+f[0]).addEventListener('input',function(){updatePlanSketch(key);});});
  document.getElementById('planBuild').addEventListener('click',function(){buildPlan(key);});
  buildPlan(key);
  d.scrollIntoView({behavior:'smooth',block:'start'});
}
function updatePlanSketch(key){var p=PRESETS[key],s=document.getElementById('planSketch');if(s)s.innerHTML=p.sketch(planValsLenient(p));}
function buildPlan(key){
  var p=PRESETS[key],res=document.getElementById('planResult');if(!res)return;
  var v=planValsStrict(p);
  if(!v){res.innerHTML='<div class="warn">Fill in every measurement with a number (fractions like 5 1/2 are fine).</div>';return;}
  updatePlanSketch(key);
  var built=planPieces(p,v);
  if(built.length===0){res.innerHTML='<div class="warn">Those measurements did not produce any pieces.</div>';return;}
  var shop=computeShopping(built),html='';
  html+='<div class="buyline"><div class="num">Shopping list</div><div style="margin-top:12px;">';
  shop.groups.forEach(function(g){
    html+='<div class="buyrow"><span>'+profileLabel(g.prof,g.lenFt)+'</span><b>'+g.count+(g.unit>0?' <span style="font-weight:600;opacity:.75">$'+(g.unit*g.count).toFixed(2)+'</span>':'')+'</b></div>';
  });
  html+='</div><div class="sub">'+shop.totalBoards+' board'+(shop.totalBoards!==1?'s':'')+' total'+(shop.totalCost>0?' &middot; ~$'+shop.totalCost.toFixed(2):'')+'</div></div>';
  html+='<div class="cutlist"><h3>Cut list</h3>';
  built.forEach(function(b){html+='<div class="cutrow"><b>'+b.qty+' &#215; '+fmt(b.len)+'"</b> &middot; '+(b.label?b.label+' &middot; ':'')+b.profile+'</div>';});
  html+='</div>';
  if(p.tools&&p.tools.length){
    var mat=shop.groups.map(function(g){return g.count+' &times; '+profileLabel(g.prof,g.lenFt);});
    mat.push('Wood screws (2½ in)');
    mat.push('Wood glue');
    mat.push(p.outdoor?'Exterior stain or sealer':'Stain, paint, or sealer (optional)');
    html+='<div class="cutlist"><h3>Tools &amp; materials</h3><div class="checkcols">'+
      '<div><div class="ck-h">Tools</div>'+p.tools.map(function(t){return '<div class="ck-item"><span class="ck-box"></span>'+t+'</div>';}).join('')+'</div>'+
      '<div><div class="ck-h">Materials</div>'+mat.map(function(m){return '<div class="ck-item"><span class="ck-box"></span>'+m+'</div>';}).join('')+'</div>'+
      '</div></div>';
  }
  if(p.steps&&p.steps.length){
    html+='<div class="cutlist"><h3>Assembly steps</h3><ol class="asm">';
    p.steps.forEach(function(s){html+='<li>'+s+'</li>';});
    html+='</ol></div>';
  }
  html+='<div class="btn-row"><button class="btn btn-ghost btn-sm" id="planToCut">Open in Cut &amp; Buy</button></div>';
  res.innerHTML=html;
  document.getElementById('planToCut').addEventListener('click',function(){
    if(pieces.length>0&&!confirm('Replace your current pieces with the '+p.name+' cut list?'))return;
    pieces=built;renderList();document.getElementById('result').innerHTML='';hideSave();
    lastPlanInfo={name:p.name,steps:p.steps||[]};
    goTo('cut');runCalc();showToast(p.name+' loaded into Cut & Buy');
  });
}
/* ---- preset sketches (schematic SVG) ---- */
function sk_bed(v){var L=fmt(v.L),W=fmt(v.W),H=fmt(v.H);
  return '<svg viewBox="0 0 220 150" xmlns="http://www.w3.org/2000/svg">'
   +'<polygon points="150,60 150,120 190,94 190,34" fill="#e2dccf" stroke="#2a2d30" stroke-width="2" stroke-linejoin="round"/>'
   +'<polygon points="30,60 150,60 190,34 70,34" fill="#f6f2ea" stroke="#2a2d30" stroke-width="2" stroke-linejoin="round"/>'
   +'<polygon points="30,60 150,60 150,120 30,120" fill="#efeae0" stroke="#2a2d30" stroke-width="2" stroke-linejoin="round"/>'
   +'<line x1="30" y1="86" x2="150" y2="86" stroke="#2a2d30" stroke-width="1.1"/>'
   +'<line x1="30" y1="104" x2="150" y2="104" stroke="#2a2d30" stroke-width="1.1"/>'
   +'<g fill="#74706a" font-family="-apple-system,sans-serif" font-size="11" font-weight="700">'
   +'<text x="90" y="138" text-anchor="middle">L '+L+'"</text>'
   +'<text x="20" y="92" text-anchor="middle" transform="rotate(-90 20 92)">H '+H+'"</text>'
   +'<text x="168" y="30" text-anchor="middle">W '+W+'"</text></g></svg>';}
function sk_shelf(v){var W=fmt(v.W),H=fmt(v.H),n=Math.max(1,Math.round(v.n||3));
  var x=55,y=16,w=110,h=120,t=8,inX=x+t,inW=w-2*t,top=y+t,bot=y+h-t,span=bot-top,s='';
  for(var i=0;i<n;i++){var yy=top+span*((i+1)/(n+1));s+='<rect x="'+inX+'" y="'+(yy-3).toFixed(1)+'" width="'+inW+'" height="6" fill="#c79a5f"/>';}
  return '<svg viewBox="0 0 220 150" xmlns="http://www.w3.org/2000/svg">'
   +'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="2" fill="#efeae0" stroke="#2a2d30" stroke-width="2"/>'
   +'<rect x="'+inX+'" y="'+top+'" width="'+inW+'" height="'+span+'" fill="#fff"/>'+s
   +'<g fill="#74706a" font-family="-apple-system,sans-serif" font-size="11" font-weight="700">'
   +'<text x="110" y="11" text-anchor="middle">W '+W+'"</text>'
   +'<text x="180" y="76" text-anchor="middle" transform="rotate(-90 180 76)">H '+H+'"</text></g></svg>';}
function sk_fence(v){var SW=v.SW||72,FH=v.FH||72,pw=v.pw||5.5,g=v.g||0.5;
  var pitch=pw+g,n=pitch>0?Math.floor((SW+g)/pitch):1;n=Math.max(1,n);
  var draw=Math.min(n,13),x0=18,top=16,bot=126,area=184,cell=area/draw,w=cell*0.82,ear=Math.min(5,w*0.32),s='';
  for(var i=0;i<draw;i++){var px=x0+i*cell+(cell-w)/2;
    s+='<polygon points="'+px.toFixed(1)+','+(top+ear).toFixed(1)+' '+(px+ear).toFixed(1)+','+top+' '+(px+w-ear).toFixed(1)+','+top+' '+(px+w).toFixed(1)+','+(top+ear).toFixed(1)+' '+(px+w).toFixed(1)+','+bot+' '+px.toFixed(1)+','+bot+'" fill="#efeae0" stroke="#2a2d30" stroke-width="1.5" stroke-linejoin="round"/>';}
  return '<svg viewBox="0 0 220 150" xmlns="http://www.w3.org/2000/svg">'+s
   +'<g fill="#74706a" font-family="-apple-system,sans-serif" font-size="11" font-weight="700">'
   +'<text x="110" y="142" text-anchor="middle">'+n+' pickets, '+fmt(SW)+'" wide</text>'
   +'<text x="9" y="71" text-anchor="middle" transform="rotate(-90 9 71)">H '+fmt(FH)+'"</text></g></svg>';}
function sk_bench(v){var L=fmt(v.L),Ht=fmt(v.Ht);
  return '<svg viewBox="0 0 220 150" xmlns="http://www.w3.org/2000/svg">'
   +'<rect x="48" y="60" width="12" height="58" fill="#e2dccf" stroke="#2a2d30" stroke-width="1.5"/>'
   +'<rect x="160" y="60" width="12" height="58" fill="#e2dccf" stroke="#2a2d30" stroke-width="1.5"/>'
   +'<rect x="30" y="62" width="13" height="62" fill="#efeae0" stroke="#2a2d30" stroke-width="2"/>'
   +'<rect x="177" y="62" width="13" height="62" fill="#efeae0" stroke="#2a2d30" stroke-width="2"/>'
   +'<rect x="30" y="52" width="160" height="10" fill="#efeae0" stroke="#2a2d30" stroke-width="2"/>'
   +'<rect x="24" y="38" width="172" height="15" rx="2" fill="#c79a5f" stroke="#2a2d30" stroke-width="2"/>'
   +'<g fill="#74706a" font-family="-apple-system,sans-serif" font-size="11" font-weight="700">'
   +'<text x="110" y="32" text-anchor="middle">L '+L+'"</text>'
   +'<text x="206" y="92" text-anchor="middle" transform="rotate(-90 206 92)">H '+Ht+'"</text></g></svg>';}
function sk_picnic(v){var L=fmt(v.L);
  return '<svg viewBox="0 0 220 150" xmlns="http://www.w3.org/2000/svg">'
   +'<rect x="34" y="40" width="152" height="12" rx="2" fill="#c79a5f" stroke="#2a2d30" stroke-width="2"/>'
   +'<rect x="14" y="92" width="44" height="9" rx="2" fill="#efeae0" stroke="#2a2d30" stroke-width="2"/>'
   +'<rect x="162" y="92" width="44" height="9" rx="2" fill="#efeae0" stroke="#2a2d30" stroke-width="2"/>'
   +'<path d="M150 52 L40 118" stroke="#2a2d30" stroke-width="4" stroke-linecap="round"/>'
   +'<path d="M70 52 L180 118" stroke="#2a2d30" stroke-width="4" stroke-linecap="round"/>'
   +'<line x1="58" y1="96" x2="162" y2="96" stroke="#2a2d30" stroke-width="3"/>'
   +'<g fill="#74706a" font-family="-apple-system,sans-serif" font-size="11" font-weight="700">'
   +'<text x="110" y="32" text-anchor="middle">L '+L+'"</text></g></svg>';}
function sk_planter(v){var L=fmt(v.L),H=fmt(v.H);
  return '<svg viewBox="0 0 220 150" xmlns="http://www.w3.org/2000/svg">'
   +'<rect x="46" y="30" width="128" height="54" rx="2" fill="#efeae0" stroke="#2a2d30" stroke-width="2"/>'
   +'<line x1="46" y1="57" x2="174" y2="57" stroke="#2a2d30" stroke-width="1"/>'
   +'<rect x="53" y="84" width="9" height="42" fill="#e2dccf" stroke="#2a2d30" stroke-width="2"/>'
   +'<rect x="158" y="84" width="9" height="42" fill="#e2dccf" stroke="#2a2d30" stroke-width="2"/>'
   +'<g fill="#74706a" font-family="-apple-system,sans-serif" font-size="11" font-weight="700">'
   +'<text x="110" y="22" text-anchor="middle">L '+L+'"</text>'
   +'<text x="188" y="106" text-anchor="middle" transform="rotate(-90 188 106)">H '+H+'"</text></g></svg>';}
function sk_plantstand(v){var Wd=fmt(v.Wd),Ht=fmt(v.Ht);
  return '<svg viewBox="0 0 220 150" xmlns="http://www.w3.org/2000/svg">'
   +'<rect x="60" y="40" width="100" height="11" rx="2" fill="#c79a5f" stroke="#2a2d30" stroke-width="2"/>'
   +'<rect x="70" y="51" width="8" height="66" fill="#e2dccf" stroke="#2a2d30" stroke-width="2"/>'
   +'<rect x="142" y="51" width="8" height="66" fill="#e2dccf" stroke="#2a2d30" stroke-width="2"/>'
   +'<line x1="78" y1="66" x2="142" y2="66" stroke="#2a2d30" stroke-width="2"/>'
   +'<g fill="#74706a" font-family="-apple-system,sans-serif" font-size="11" font-weight="700">'
   +'<text x="110" y="34" text-anchor="middle">W '+Wd+'"</text>'
   +'<text x="186" y="86" text-anchor="middle" transform="rotate(-90 186 86)">H '+Ht+'"</text></g></svg>';}
function sk_shoerack(v){var W=fmt(v.W),H=fmt(v.H),t=Math.max(1,Math.round(v.t||3));
  var x=58,y=20,w=104,h=108,s='',i;
  for(i=0;i<t;i++){var yy=(y+h*((i+1)/(t+1))).toFixed(1);s+='<line x1="'+(x+6)+'" y1="'+yy+'" x2="'+(x+w-6)+'" y2="'+yy+'" stroke="#c79a5f" stroke-width="6" stroke-linecap="round"/>';}
  return '<svg viewBox="0 0 220 150" xmlns="http://www.w3.org/2000/svg">'
   +'<rect x="'+x+'" y="'+y+'" width="8" height="'+h+'" fill="#e2dccf" stroke="#2a2d30" stroke-width="2"/>'
   +'<rect x="'+(x+w-8)+'" y="'+y+'" width="8" height="'+h+'" fill="#e2dccf" stroke="#2a2d30" stroke-width="2"/>'+s
   +'<g fill="#74706a" font-family="-apple-system,sans-serif" font-size="11" font-weight="700">'
   +'<text x="110" y="142" text-anchor="middle">W '+W+'"  &middot;  '+t+' tiers</text>'
   +'<text x="'+(x-8)+'" y="'+(y+h/2)+'" text-anchor="middle" transform="rotate(-90 '+(x-8)+' '+(y+h/2)+')">H '+H+'"</text></g></svg>';}
/* ---- saved projects (stored on this device) ---- */
var PKEY='benchboard_projects';
function escapeHtml(s){return (''+s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function loadProjects(){try{return JSON.parse(localStorage.getItem(PKEY))||[];}catch(e){return [];}}
function saveProjects(arr){try{localStorage.setItem(PKEY,JSON.stringify(arr));if(window.onProjectsChanged){window.onProjectsChanged(arr);}return true;}catch(e){showToast('Storage is off in this browser');return false;}}
function pieceCount(state){
  if(!state.pcs)return 0;
  return state.pcs.reduce(function(n,p){return n+(+p.qty||0);},0);
}
function renderProjects(){
  var el=document.getElementById('projectList');
  var arr=loadProjects();
  if(arr.length===0){el.innerHTML='<div class="empty">No saved projects yet. Build a cut list, then tap Save.</div>';return;}
  el.innerHTML='';
  arr.forEach(function(p){
    var when=new Date(p.savedAt).toLocaleDateString();
    var d=document.createElement('div');d.className='piece proj';
    d.innerHTML='<div class="meta"><div class="len" style="font-size:15px">'+escapeHtml(p.name)+'</div><div class="lab">'+pieceCount(p.state)+' pieces &middot; '+when+'</div></div>'+
      '<button class="pbtn" data-act="open" data-id="'+p.id+'">Open</button>'+
      '<button class="pbtn" data-act="dup" data-id="'+p.id+'">Copy</button>'+
      '<button class="del" data-act="del" data-id="'+p.id+'" aria-label="delete">&#215;</button>';
    el.appendChild(d);
  });
  el.querySelectorAll('button').forEach(function(b){
    b.addEventListener('click',function(){projectAction(b.dataset.act,b.dataset.id);});
  });
}
function projectAction(act,id){
  var arr=loadProjects();
  var idx=-1;for(var i=0;i<arr.length;i++){if(arr[i].id===id){idx=i;break;}}
  if(idx<0)return;
  if(act==='open'){
    applyState(arr[idx].state);
    if(typeof closeDrawer==='function')closeDrawer();
    goTo('cut');
    if(pieces.length)runCalc();
    showToast('Opened "'+arr[idx].name+'"');
  }else if(act==='dup'){
    var copy=JSON.parse(JSON.stringify(arr[idx]));
    copy.id='p'+Date.now();copy.name=(arr[idx].name+' copy').slice(0,40);copy.savedAt=Date.now();
    arr.unshift(copy);saveProjects(arr);renderProjects();showToast('Copied');
  }else if(act==='del'){
    if(!confirm('Delete "'+arr[idx].name+'"?'))return;
    arr.splice(idx,1);saveProjects(arr);renderProjects();showToast('Deleted');
  }
}
function saveCurrentProject(){
  if(pieces.length===0){alert('Add some pieces first, then save.');return;}
  var name=prompt('Name this project:','My project');
  if(name===null)return;
  name=name.trim()||'Untitled';
  var arr=loadProjects();
  arr.unshift({id:'p'+Date.now(),name:name.slice(0,40),savedAt:Date.now(),state:currentState()});
  if(saveProjects(arr)){renderProjects();showToast('Project saved');}
}
document.getElementById('saveProjBtn').addEventListener('click',saveCurrentProject);
document.getElementById('saveProjBtn2').addEventListener('click',saveCurrentProject);
/* ---- price book (board prices, stored on this device) ---- */
var PRICEKEY='benchboard_prices';
var PRICE_GROUPS=[
  {label:'Framing / dimensional (8 ft)', items:['2x4','2x6','2x8','2x10','2x12','4x4','2x2']},
  {label:'Boards — 1x (8 ft)', items:['1x2','1x3','1x4','1x6','1x8']},
  {label:'Fence pickets (6 ft)', items:['Picket 3.5"','Picket 5.5"','Picket 6"']}
];
var DEFAULT_PRICES={
  '2x4':3.98,'2x6':6.48,'2x8':9.98,'2x10':13.98,'2x12':17.98,'4x4':9.98,'2x2':3.48,
  '1x2':3.48,'1x3':4.48,'1x4':6.48,'1x6':9.48,'1x8':12.98,
  'Picket 3.5"':2.48,'Picket 5.5"':3.48,'Picket 6"':4.48
};
function getSavedPrices(){try{return JSON.parse(localStorage.getItem(PRICEKEY))||{};}catch(e){return {};}}
function loadPrices(){
  var saved=getSavedPrices(),out={};
  for(var k in DEFAULT_PRICES){
    out[k]=(saved[k]!=null&&saved[k]!=='')?+saved[k]:DEFAULT_PRICES[k];
  }
  return out;
}
function savePrices(obj){try{localStorage.setItem(PRICEKEY,JSON.stringify(obj));}catch(e){}}
function renderPriceBook(){
  var el=document.getElementById('priceBook');if(!el)return;
  var prices=loadPrices(),h='';
  PRICE_GROUPS.forEach(function(g){
    h+='<div class="pb-group">'+g.label+'</div>';
    g.items.forEach(function(it){
      h+='<div class="pb-row"><span class="pb-name">'+it+'</span>'+
         '<span class="pb-money"><input type="text" inputmode="decimal" data-prof="'+it.replace(/"/g,'&quot;')+'" value="'+(prices[it]||'')+'"></span></div>';
    });
  });
  el.innerHTML=h;
  el.querySelectorAll('input[data-prof]').forEach(function(inp){
    inp.addEventListener('change',function(){
      var saved=getSavedPrices(),val=parseMoney(inp.value),key=inp.getAttribute('data-prof');
      if(isNaN(val)||val<0){saved[key]='';inp.value='';}else{saved[key]=Math.round(val*100)/100;inp.value=saved[key];}
      savePrices(saved);
    });
  });
}
function openDrawer(){
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer').setAttribute('aria-hidden','false');
  document.getElementById('drawerBackdrop').classList.add('show');
}
function closeDrawer(){
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer').setAttribute('aria-hidden','true');
  document.getElementById('drawerBackdrop').classList.remove('show');
}
document.getElementById('menuBtn').addEventListener('click',openDrawer);
document.getElementById('drawerClose').addEventListener('click',closeDrawer);
document.getElementById('drawerBackdrop').addEventListener('click',closeDrawer);
/* hamburger menu navigation links */
document.querySelectorAll('.drawer-link').forEach(function(l){
  l.addEventListener('click',function(){
    closeDrawer();
    goTo(l.dataset.go, l.dataset.scroll);
  });
});
var openPricesBtn=document.getElementById('openPricesBtn');
if(openPricesBtn)openPricesBtn.addEventListener('click',function(){goTo('prices');});
document.getElementById('resetPrices').addEventListener('click',function(){
  if(!confirm('Reset all prices back to the typical defaults?'))return;
  localStorage.removeItem(PRICEKEY);renderPriceBook();showToast('Prices reset to typical');
});
/* ---- fast inch calculator ---- */
var fExpr=document.getElementById('fExpr');
var fLive=document.getElementById('fLive');
var justEval=false;
function copyText(t){
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).catch(function(){fallbackCopy(t);});}
  else fallbackCopy(t);
}
function fUpdate(){
  var raw=fExpr.value;
  var denom=parseInt(document.getElementById('fRound').value);
  var frEl=fLive.querySelector('.cr-frac'),decEl=fLive.querySelector('.cr-dec');
  if(raw.trim()===''){frEl.textContent='0"';decEl.textContent='';fLive.classList.remove('bad');return;}
  var v=evalFraction(raw);
  if(isNaN(v)){frEl.textContent='—';decEl.textContent='keep typing';fLive.classList.add('bad');return;}
  fLive.classList.remove('bad');
  frEl.textContent=toFraction(v,denom)+'"';
  decEl.textContent=(Math.round(v*10000)/10000)+' in';
}
function fInsert(t){
  if(justEval){
    if(!/^[+\-×÷*/]$/.test(t))fExpr.value='';
    justEval=false;
  }
  fExpr.value+=t;
  fUpdate();
}
function fEquals(){
  var v=evalFraction(fExpr.value);
  if(isNaN(v)){showToast('Not a complete calculation');return;}
  fExpr.value=(Math.round(v*100000)/100000).toString();
  justEval=true;
  fUpdate();
}
document.querySelectorAll('#fKeys .key').forEach(function(k){
  k.addEventListener('click',function(){
    var act=k.dataset.act;
    if(act==='clear'){fExpr.value='';justEval=false;fUpdate();fExpr.focus();return;}
    if(act==='back'){fExpr.value=fExpr.value.slice(0,-1);justEval=false;fUpdate();fExpr.focus();return;}
    if(act==='eq'){fEquals();fExpr.focus();return;}
    fInsert(k.dataset.ins);fExpr.focus();
  });
});
document.querySelectorAll('#fChips .chip').forEach(function(c){
  c.addEventListener('click',function(){
    if(justEval){fExpr.value='';justEval=false;}
    fExpr.value+=(/\d$/.test(fExpr.value)?' ':'')+c.dataset.frac;
    fUpdate();fExpr.focus();
  });
});
fExpr.addEventListener('input',function(){justEval=false;fUpdate();});
fExpr.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();fEquals();}});
document.getElementById('fRound').addEventListener('change',fUpdate);
fLive.addEventListener('click',function(){
  var t=this.querySelector('.cr-frac').textContent;
  if(t&&t!=='—'&&t!=='0"'){copyText(t);showToast('Copied '+t);}
});
document.getElementById('d2f').addEventListener('input',function(){
  var v=parseFloat(this.value);var o=document.getElementById('d2fOut');
  if(isNaN(v)){o.textContent='';return;}
  o.innerHTML='= <b style="color:var(--ink)">'+toFraction(v,16)+'"</b> (to 1/16")';
});
document.getElementById('f2d').addEventListener('input',function(){
  var v=parseInches(this.value);var o=document.getElementById('f2dOut');
  if(isNaN(v)){o.textContent='';return;}
  o.innerHTML='= <b style="color:var(--ink)">'+(Math.round(v*10000)/10000)+'"</b>';
});
/* ---- dark/light theme ---- */
function applyThemeMeta(theme){
  var m=document.querySelector('meta[name="theme-color"]');
  if(m)m.setAttribute('content',theme==='dark'?'#0e1011':'#1b1d1f');
}
function getTheme(){return document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';}
function setTheme(theme){
  if(theme==='dark')document.documentElement.setAttribute('data-theme','dark');
  else document.documentElement.removeAttribute('data-theme');
  try{localStorage.setItem('benchboard_theme',theme);}catch(e){}
  syncThemeControls(theme);
}
function syncThemeControls(theme){
  applyThemeMeta(theme);
  var chk=document.getElementById('darkToggle');if(chk)chk.checked=(theme==='dark');
  var tb=document.getElementById('themeBtn');if(tb)tb.setAttribute('aria-pressed',theme==='dark'?'true':'false');
}
syncThemeControls(getTheme());
var darkToggle=document.getElementById('darkToggle');
if(darkToggle)darkToggle.addEventListener('change',function(){setTheme(this.checked?'dark':'light');});
var themeBtn=document.getElementById('themeBtn');
if(themeBtn)themeBtn.addEventListener('click',function(){setTheme(getTheme()==='dark'?'light':'dark');});

/* ---- Real Sizes: popular-size shortcuts ---- */
document.querySelectorAll('#rsChips .chip').forEach(function(c){
  c.addEventListener('click',function(){
    var row=document.getElementById('rs-'+c.dataset.size);
    if(!row)return;
    document.querySelectorAll('.rs-table tr.rs-flash').forEach(function(r){r.classList.remove('rs-flash');});
    void row.offsetWidth; row.classList.add('rs-flash');
    row.scrollIntoView({behavior:'smooth',block:'center'});
  });
});
/* ---- Lumber terms glossary ---- */
var GLOSSARY=[
  {cat:'Buying lumber',icon:'buy',items:[
    {w:'Nominal size',d:"The size printed on the tag, like 2x4. It's the rough size before the board is planed and dried, so the real board is smaller."},
    {w:'Actual size',d:'What the board really measures. A 2x4 is actually 1½ by 3½ inches. The Real Sizes page lists them all.'},
    {w:'Stock length',d:'The length a board is sold in, usually 8, 10, or 12 feet. Fence pickets are typically 6 feet.'},
    {w:'Board foot',d:'A way lumber is priced by volume: 1 inch thick by 12 inches wide by 12 inches long equals one board foot.'},
    {w:'Dimensional lumber',d:'Standard framing boards milled to set sizes, like 2x4s, 2x6s, and 4x4s.'},
    {w:'Sheet goods',d:'Large flat panels sold in 4 by 8 foot sheets, such as plywood, MDF, and OSB.'},
    {w:'Plywood',d:'A panel made of thin wood layers glued together. Strong and stable for shelves, cabinets, and tops.'},
    {w:'MDF',ab:'MDF',d:'Medium-density fiberboard. Smooth and grain-free, paints well, but heavy and not for damp spots.'},
    {w:'OSB',ab:'OSB',d:'Oriented strand board. A cheaper chip-and-glue sheet used for subfloors and wall sheathing.'},
    {w:'Pressure-treated',ab:'PT',d:'Lumber soaked with preservative to resist rot and insects. Use it outdoors or anywhere near the ground.'},
    {w:'Kiln-dried',ab:'KD',d:'Lumber dried in an oven so it weighs less and is less likely to warp.'},
    {w:'Green lumber',d:"Wood still wet from the mill. It's heavy and will shrink and move as it dries, so let it acclimate."},
    {w:'Softwood',d:'Wood from evergreens like pine, fir, and cedar. Most framing lumber is softwood.'},
    {w:'Hardwood',d:'Wood from leafy trees like oak and maple. Denser and pricier, used for furniture and trim.'}
  ]},
  {cat:'Measuring & cutting',icon:'cut',items:[
    {w:'Kerf',d:'The slice of wood the blade turns to sawdust on each cut, about 1/8 inch. It adds up over many cuts, so the app accounts for it.'},
    {w:'Rip cut',d:'A cut that runs the length of the board, along the grain.'},
    {w:'Crosscut',d:'A cut straight across the board to length, across the grain.'},
    {w:'Miter',d:'An angled cut across the face of a board, like the 45-degree corners of a picture frame.'},
    {w:'Bevel',d:'An angled cut through the thickness or edge of a board.'},
    {w:'Square',d:"A true 90-degree corner. 'Check for square' means making sure corners are right angles."},
    {w:'Flush',d:'Two surfaces sitting perfectly even with each other, with no lip or step.'},
    {w:'On-center',ab:'OC',d:'Spacing measured from the center of one piece to the center of the next, common for studs and joists.'},
    {w:'Face, edge, end',d:'The face is the wide side, the edge is the narrow side, and the end is the cut-off tip (end grain).'}
  ]},
  {cat:'Joining & fastening',icon:'join',items:[
    {w:'Butt joint',d:'The simplest joint: two boards pushed together and fastened, end to face.'},
    {w:'Pocket hole',d:'An angled hole drilled so a screw joins two boards from a hidden spot. Kreg jigs make these.'},
    {w:'Pilot hole',d:"A small hole drilled first so a screw goes in straight and the wood doesn't split."},
    {w:'Countersink',d:'A cone-shaped recess so the screw head sits flush with or just below the surface.'},
    {w:'Dado',d:'A flat-bottomed groove cut across the grain, often to seat a shelf.'},
    {w:'Rabbet',d:'A step-shaped notch cut along the edge of a board, common for cabinet backs.'}
  ]},
  {cat:'Wood quirks & parts',icon:'wood',items:[
    {w:'Grain',d:'The direction the wood fibers run. Cutting and sanding go smoother with the grain.'},
    {w:'Knot',d:'A spot where a branch grew. Solid knots are fine; loose ones weaken the board.'},
    {w:'Warp',d:'Any bend or twist in a board. Cup curls across the width, bow bends along the length, twist wrings it corner to corner.'},
    {w:'Stud',d:'A vertical framing board in a wall, usually a 2x4, spaced 16 inches on-center.'},
    {w:'Picket, rail, post',d:'Fence parts: pickets are the vertical boards, rails run horizontally, and posts are the uprights set in the ground.'},
    {w:'Dog-ear',d:'The clipped top corners of a fence picket.'},
    {w:'Grit',d:'Sandpaper coarseness. Lower numbers (60 to 80) are rough; higher numbers (180 to 220) are smooth.'}
  ]}
];
var GLOSS_ICONS={
  buy:'<svg viewBox="0 0 24 24" fill="none"><path d="M4 13l7 7 9-9V4h-7L4 13z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="15.5" cy="8.5" r="1.4" fill="currentColor"/></svg>',
  cut:'<svg viewBox="0 0 24 24" fill="none"><rect x="2.5" y="8" width="19" height="8" rx="1.5" stroke="currentColor" stroke-width="2"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  join:'<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="6" r="3.2" stroke="currentColor" stroke-width="2"/><path d="M12 9.2V20M9 12.5h6M9 15.5h6M9 18h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  wood:'<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="1.5" stroke="currentColor" stroke-width="2"/><path d="M3 10.5c5 1.2 13 1.2 18 0M3 14c5 1.2 13 1.2 18 0" stroke="currentColor" stroke-width="1.6"/></svg>'
};
var glossOpen={};
function renderGlossary(q){
  var el=document.getElementById('glossList');if(!el)return;
  q=(q||'').trim().toLowerCase();
  var searching=q.length>0,html='';
  GLOSSARY.forEach(function(g,ci){
    var items=g.items.filter(function(it){return !q||(it.w+' '+(it.ab||'')+' '+it.d).toLowerCase().indexOf(q)>=0;});
    if(searching&&items.length===0)return;
    var open=searching?true:!!glossOpen[ci];
    var rows=items.map(function(it){return '<div class="gitem"><div class="gword">'+escapeHtml(it.w)+(it.ab?'<span class="gabbr">'+escapeHtml(it.ab)+'</span>':'')+'</div><div class="gdef">'+it.d+'</div></div>';}).join('');
    html+='<div class="gloss-cat'+(open?' open':'')+'">'+
      '<button class="gloss-head" type="button" data-ci="'+ci+'">'+
        '<span class="gloss-ic">'+(GLOSS_ICONS[g.icon]||'')+'</span>'+
        '<span class="gloss-h-t">'+g.cat+'</span>'+
        '<span class="gloss-count">'+items.length+'</span>'+
        '<span class="gloss-chev" aria-hidden="true"></span>'+
      '</button><div class="gloss-body">'+rows+'</div></div>';
  });
  el.innerHTML=html||'<div class="empty">No terms match that search.</div>';
  el.querySelectorAll('.gloss-head').forEach(function(b){
    b.addEventListener('click',function(){
      var ci=+b.dataset.ci;glossOpen[ci]=!glossOpen[ci];
      renderGlossary(document.getElementById('glossSearch').value);
    });
  });
}
var glossSearch=document.getElementById('glossSearch');
if(glossSearch)glossSearch.addEventListener('input',function(){renderGlossary(this.value);});
/* ---- System status panel ---- */
var STATUS_SERVICES=[
  {key:'pages',name:'App hosting',sub:'Cloudflare Pages'},
  {key:'api',name:'Sync API',sub:'Pages Functions'},
  {key:'d1',name:'Database',sub:'Cloudflare D1'},
  {key:'google',name:'Sign-in',sub:'Google'}
];
var STATUS_HIST_KEY='benchboard_status_hist';
var STATUS_MAX=16;
function loadStatusHist(){try{return JSON.parse(localStorage.getItem(STATUS_HIST_KEY))||{};}catch(e){return {};}}
function saveStatusHist(h){try{localStorage.setItem(STATUS_HIST_KEY,JSON.stringify(h));}catch(e){}}
function pushStatus(hist,key,up){if(!hist[key])hist[key]=[];hist[key].push(up?1:0);if(hist[key].length>STATUS_MAX)hist[key]=hist[key].slice(-STATUS_MAX);}
function statusText(v){return v===1?'Operational':v===0?'Unavailable':'Checking…';}
function renderStatus(current){
  var el=document.getElementById('statusList');if(!el)return;
  var hist=loadStatusHist(),h='';
  STATUS_SERVICES.forEach(function(s){
    var arr=hist[s.key]||[],bars='',pad=STATUS_MAX-arr.length,i;
    for(i=0;i<pad;i++)bars+='<i></i>';
    arr.forEach(function(v){bars+='<i class="'+(v?'up':'down')+'"></i>';});
    var cur=current?current[s.key]:null,dot=cur===1?'up':cur===0?'down':'unk';
    h+='<div class="status-row"><div class="status-meta"><span class="status-name">'+s.name+'</span><span class="status-sub">'+s.sub+'</span></div>'+
       '<div class="status-graph">'+bars+'</div>'+
       '<div class="status-now"><span class="sd '+dot+'"></span><span class="status-state">'+statusText(cur)+'</span></div></div>';
  });
  el.innerHTML=h;
}
var statusBusy=false;
function checkStatus(){
  if(statusBusy)return; statusBusy=true;
  var checkedEl=document.getElementById('statusChecked');
  if(checkedEl)checkedEl.textContent='Checking…';
  var google=!!(window.google&&window.google.accounts&&window.google.accounts.id);
  var current={pages:null,api:null,d1:null,google:google?1:0};
  renderStatus(current);
  function done(){
    var hist=loadStatusHist();
    pushStatus(hist,'pages',current.pages===1);
    pushStatus(hist,'api',current.api===1);
    pushStatus(hist,'d1',current.d1===1);
    pushStatus(hist,'google',current.google===1);
    saveStatusHist(hist);
    renderStatus(current);
    if(checkedEl)checkedEl.textContent='Last checked '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    statusBusy=false;
  }
  if(!navigator.onLine){current.pages=0;current.api=0;current.d1=0;done();return;}
  fetch('/api/health',{cache:'no-store'}).then(function(r){
    current.pages=1;
    if(r.ok){current.api=1;return r.json();}
    current.api=0;return null;
  }).then(function(j){
    current.d1=(j&&j.db===true)?1:0;
    done();
  }).catch(function(){current.pages=0;current.api=0;current.d1=0;done();});
}
var statusRefresh=document.getElementById('statusRefresh');
if(statusRefresh)statusRefresh.addEventListener('click',checkStatus);
renderStatus(null);
renderGlossary('');

renderList();
renderProjects();
renderPriceBook();
renderPlanGrid();
restoreFromHash();
