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
function showToast(msg){var t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  setTimeout(function(){t.classList.remove('show');},1900);}
/* navigation (top tabs + hamburger menu share this) */
function goTo(id, scrollToId){
  document.querySelectorAll('section').forEach(function(x){x.classList.remove('active');});
  var sec=document.getElementById(id); if(sec)sec.classList.add('active');
  document.querySelectorAll('.tab').forEach(function(t){t.classList.toggle('active', t.dataset.tab===id);});
  if(id==='prices'&&typeof renderPriceBook==='function')renderPriceBook();
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
    d.innerHTML='<span class="tag">'+p.qty+'&#215;</span><div class="meta"><div class="len">'+fmtInch(p.len)+'</div><div class="lab">'+lab+prof+'</div></div>'+
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
  document.getElementById('pLen').value=fmt(p.len);
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
  var q=parseInt(document.getElementById('pQty').value);
  var l=parseInches(document.getElementById('pLen').value);
  var prof=document.getElementById('pProfile').value;
  var label=document.getElementById('pLabel').value.trim().slice(0,24);
  if(!q||q<1){alert('Enter how many pieces (1 or more).');return;}
  if(!l||l<=0||isNaN(l)){alert('Enter a length in inches. You can type 28.5 or 28 1/2.');return;}
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
  pieces=[];cancelEdit();renderList();document.getElementById('result').innerHTML='';hideSave();
});
function stockLength(){
  if(stockLen.value==='custom'){var c=parseInches(document.getElementById('customLen').value);return (c&&c>0)?c:null;}
  return parseFloat(stockLen.value);
}
function profileLabel(prof,feet){
  return (prof==='any'?'':prof+' ')+(feet%1===0?feet:feet.toFixed(1))+' ft';
}
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
  var usable=stock-2*trim; // trim both ends
  if(pieces.length===0){res.innerHTML='<div class="warn">Add at least one piece first.</div>';hideSave();return;}
  if(!stock){res.innerHTML='<div class="warn">Enter a valid custom stock length.</div>';hideSave();return;}
  if(usable<=0){res.innerHTML='<div class="warn">Trim amount is too big for this board length.</div>';hideSave();return;}
  // group pieces by resolved profile
  var groups={};var order=[];
  pieces.forEach(function(p){
    var prof=(p.profile==='default')?defProf:p.profile;
    if(!groups[prof]){groups[prof]=[];order.push(prof);}
    for(var i=0;i<p.qty;i++)groups[prof].push(p.len);
  });
  // check any piece too long
  for(var gi=0;gi<order.length;gi++){
    var g=groups[order[gi]];
    for(var k=0;k<g.length;k++){
      if(g[k]>usable){res.innerHTML='<div class="warn">A '+fmt(g[k])+'" piece won\'t fit on a '+fmt(usable)+'" usable board ('+order[gi]+'). Use a longer length or less end-trim.</div>';hideSave();return;}
    }
  }
  var feet=stock/12;
  var grandBoards=0,grandCost=0,html='';
  var perType=[]; // for the buy summary
  var resultGroups=[];
  order.forEach(function(prof){
    var boards=packGroup(groups[prof],usable,kerf);
    if(spare)boards.push({used:0,segs:[],isSpare:true});
    grandBoards+=boards.length;
    var unit=prices[prof];
    if(unit&&unit>0)grandCost+=unit*boards.length;
    perType.push({prof:prof,count:boards.length,feet:feet});
    resultGroups.push({prof:prof,boards:boards});
  });
  // buy summary
  html+='<div class="buyline">';
  if(perType.length===1){
    html+='<div class="num">Buy '+perType[0].count+' <small>&#215; '+profileLabel(perType[0].prof,feet)+'</small></div>';
  }else{
    html+='<div class="num">Shopping list</div><div style="margin-top:12px;">';
    perType.forEach(function(t){
      html+='<div class="buyrow"><span>'+profileLabel(t.prof,feet)+'</span><b>'+t.count+'</b></div>';
    });
    html+='</div>';
  }
  var subbits=[grandBoards+' board'+(grandBoards!==1?'s':'')+' total'];
  if(spare)subbits.push('incl. spares');
  if(grandCost>0)subbits.push('~$'+grandCost.toFixed(2));
  html+='<div class="sub">'+subbits.join(' &middot; ')+'</div></div>';
  // per-group cut maps
  resultGroups.forEach(function(rg){
    if(resultGroups.length>1)html+='<div class="grouphdr">'+rg.prof+'</div>';
    rg.boards.forEach(function(bd,i){
      if(bd.isSpare){
        html+='<div class="board"><div class="bhead"><span class="name">Board '+(i+1)+' (spare)</span><span class="scrap" style="color:var(--good)">backup</span></div><div class="bar"><div class="seg scrap" style="flex:1">keep on hand</div></div></div>';
        return;
      }
      var left=Math.max(0,usable-bd.used);
      html+='<div class="board"><div class="bhead"><span class="name">Board '+(i+1)+'</span><span class="scrap">scrap '+fmt(Math.round(left*100)/100)+'"</span></div><div class="bar">';
      if(trim>0)html+='<div class="seg trim" style="flex:'+trim+' '+trim+' 0">trim</div>';
      bd.segs.forEach(function(s){html+='<div class="seg use" style="flex:'+s+' '+s+' 0">'+fmt(s)+'"</div>';});
      if(left>0.25)html+='<div class="seg scrap" style="flex:'+left+' '+left+' 0">scrap</div>';
      if(trim>0)html+='<div class="seg trim" style="flex:'+trim+' '+trim+' 0">trim</div>';
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
      var parts=Object.keys(counts).map(function(key){return counts[key]+' @ '+fmt(parseFloat(key))+'"';});
      html+='<div class="cutrow"><b>Board '+(i+1)+':</b> '+parts.join('  &middot;  ')+'</div>';
    });
  });
  html+='</div>';
  var allCuts=0;order.forEach(function(p){groups[p].forEach(function(c){allCuts+=c;});});
  var totalUsable=grandBoards*usable;
  var efficiency=totalUsable>0?Math.round(allCuts/totalUsable*100):0;
  html+='<div class="totals"><b>Wood in cuts:</b> '+fmtInch(Math.round(allCuts*10)/10)+'  &middot;  <b>Boards:</b> '+grandBoards;
  if(trim>0)html+='  &middot;  <b>Usable/board:</b> '+fmtInch(usable);
  html+='  &middot;  <b>Kerf:</b> '+fmt(kerf)+'"/cut';
  html+='  &middot;  <b>Efficiency:</b> <span style="color:'+(efficiency>=75?'var(--good)':efficiency>=50?'var(--amber-dk)':'var(--cut)')+'">'+efficiency+'%</span></div>';
  res.innerHTML=html;
  buildCopyText(resultGroups,usable,kerf,feet,grandBoards,grandCost,null,trim);
  showSave();
  res.scrollIntoView({behavior:'smooth',block:'start'});
}
/* plain-text cut list for clipboard */
var _copyText='';
function buildCopyText(resultGroups,usable,kerf,feet,grandBoards,grandCost,price,trim){
  var lines=['=== Bench & Board Cut List ===',''];
  resultGroups.forEach(function(rg){
    if(resultGroups.length>1)lines.push('-- '+rg.prof+' --');
    rg.boards.forEach(function(bd,i){
      if(bd.isSpare){lines.push('Board '+(i+1)+': spare (keep uncut)');return;}
      var counts={};bd.segs.forEach(function(s){counts[s]=(counts[s]||0)+1;});
      var parts=Object.keys(counts).map(function(k){return counts[k]+' @ '+fmtInch(parseFloat(k));});
      var left=Math.max(0,usable-bd.used);
      lines.push('Board '+(i+1)+': '+parts.join(', ')+(left>0.25?' | scrap '+fmtInch(Math.round(left*100)/100):''));
    });
  });
  lines.push('');
  lines.push('Buy: '+grandBoards+' board'+(grandBoards!==1?'s':'')+' ('+profileLabel(resultGroups[0]&&resultGroups[0].prof||'',feet)+')');
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
document.getElementById('printBtn').addEventListener('click',function(){window.print();});
/* apply a saved state object to the form */
function applyState(s){
  if(s.sp)document.getElementById('stockProfile').value=s.sp;
  if(s.sl){stockLen.value=s.sl;document.getElementById('customLenWrap').style.display=s.sl==='custom'?'block':'none';}
  if(s.cl)document.getElementById('customLen').value=s.cl; else document.getElementById('customLen').value='';
  if(s.k)document.getElementById('kerf').value=s.k;
  document.getElementById('trimEnd').value=s.tr||'';
  document.getElementById('spare').checked=!!s.spr;
  pieces=Array.isArray(s.pcs)?s.pcs.map(function(p){return {qty:+p.qty||1,len:+p.len||0,profile:p.profile||'default',label:p.label||''};}).filter(function(p){return p.len>0;}):[];
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
var PLAN_ORDER=['bed','shelf','fence','bench'];

function planDefaults(p){var v={};p.fields.forEach(function(f){v[f[0]]=parseInches(f[2]);});return v;}
function planValsLenient(p){var v={};p.fields.forEach(function(f){var x=parseInches(document.getElementById('pf_'+f[0]).value);v[f[0]]=(isNaN(x)||x<=0)?parseInches(f[2]):x;});return v;}
function planValsStrict(p){var v={},ok=true;p.fields.forEach(function(f){var x=parseInches(document.getElementById('pf_'+f[0]).value);if(isNaN(x)||x<=0)ok=false;v[f[0]]=x;});return ok?v:null;}
function planPieces(p,v){return p.build(v).filter(function(x){return x.len>0&&x.qty>0;}).map(function(x){return {qty:Math.round(x.qty),len:Math.round(x.len*16)/16,profile:x.profile||'default',label:x.label||''};});}

/* shopping list: pack each board type onto a sensible stock length, price it */
function planStockLen(prof,maxLen){
  var opts=/Picket/.test(prof)?[72,96,120,144]:[96,120,144,192];
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
  html+='</div><div class="btn-row"><button class="btn btn-ghost btn-sm" id="planToCut">Open in Cut &amp; Buy</button></div>';
  res.innerHTML=html;
  document.getElementById('planToCut').addEventListener('click',function(){
    if(pieces.length>0&&!confirm('Replace your current pieces with the '+p.name+' cut list?'))return;
    pieces=built;renderList();document.getElementById('result').innerHTML='';hideSave();
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
    if(pieces.length)runCalc();
    showToast('Opened "'+arr[idx].name+'"');
    document.getElementById('projCard').scrollIntoView({behavior:'smooth',block:'start'});
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
/* ---- settings shortcut + dark/light theme ---- */
var settingsJump=document.getElementById('settingsJump');
if(settingsJump)settingsJump.addEventListener('click',function(){goTo('settings');});
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

renderList();
renderProjects();
renderPriceBook();
renderPlanGrid();
restoreFromHash();
