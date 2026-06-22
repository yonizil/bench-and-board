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
/* tabs */
document.querySelectorAll('.tab').forEach(function(t){
  t.addEventListener('click',function(){
    document.querySelectorAll('.tab').forEach(function(x){x.classList.remove('active');});
    document.querySelectorAll('section').forEach(function(x){x.classList.remove('active');});
    t.classList.add('active');document.getElementById(t.dataset.tab).classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
  });
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
  var price=parseMoney(document.getElementById('price').value);
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
    if(price&&price>0)grandCost+=price*boards.length;
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
  buildCopyText(resultGroups,usable,kerf,feet,grandBoards,grandCost,price,trim);
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
    pr:document.getElementById('price').value,
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
  document.getElementById('price').value=s.pr||'';
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
var presetSel=document.getElementById('presetSel');
presetSel.addEventListener('change',function(){
  var key=presetSel.value;
  var fc=document.getElementById('presetFields');
  var note=document.getElementById('presetNote');
  var btn=document.getElementById('buildPreset');
  if(!PRESETS[key]){fc.innerHTML='';note.style.display='none';btn.style.display='none';return;}
  var p=PRESETS[key];var h='<div class="grid2" style="margin-top:13px;">';
  p.fields.forEach(function(f){
    h+='<div class="field"><label>'+f[1]+'</label><input id="pf_'+f[0]+'" type="text" inputmode="decimal" value="'+f[2]+'"></div>';
  });
  h+='</div>';
  fc.innerHTML=h;
  note.textContent=p.note;note.style.display='block';
  btn.style.display='block';
});
document.getElementById('buildPreset').addEventListener('click',function(){
  var key=presetSel.value;if(!PRESETS[key])return;
  var p=PRESETS[key];var v={};var ok=true;
  p.fields.forEach(function(f){
    var val=parseInches(document.getElementById('pf_'+f[0]).value);
    if(isNaN(val)||val<=0)ok=false;
    v[f[0]]=val;
  });
  if(!ok){alert('Fill in every measurement with a number (fractions like 5 1/2 are fine).');return;}
  var built=p.build(v).filter(function(x){return x.len>0&&x.qty>0;}).map(function(x){
    return {qty:Math.round(x.qty),len:Math.round(x.len*16)/16,profile:x.profile||'default',label:x.label||''};
  });
  if(built.length===0){alert('Those measurements did not produce any pieces. Check the numbers.');return;}
  if(pieces.length>0&&!confirm('Replace your current pieces with the '+p.name+' cut list?'))return;
  pieces=built;
  renderList();
  document.getElementById('result').innerHTML='';hideSave();
  runCalc();
  showToast(p.name+' cut list built');
});
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
renderList();
renderProjects();
restoreFromHash();
