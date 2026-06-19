/* ══════════════════════════════════════════════════════════════════════
   report.js — Professional PDF/Print report with 8 SVG charts
   ══════════════════════════════════════════════════════════════════════ */

/* ── Shared chart helpers ─────────────────────────────────────────── */
function _rptOvers(s){ return Math.floor(s.balls/6)+'.'+s.balls%6; }
function _rptRR(s){ return s.balls>0?(s.runs/(s.balls/6)).toFixed(2):'0.00'; }

function _overRunsArr(oh){
  return (oh||[]).map(function(balls){
    return (balls||[]).reduce(function(t,b){
      if(!b) return t;
      if(b.startsWith('WD')||b.startsWith('NB')) return t+(b.length>2?1+(parseInt(b.slice(3))||0):1);
      if(b==='W') return t;
      if(/^\d+W$/.test(b)) return t+(parseInt(b)||0);
      if(b.startsWith('B+')||b.startsWith('LB+')) return t+(parseInt(b.slice(b.indexOf('+')+1))||0);
      var n=parseInt(b); return t+(isNaN(n)?0:n);
    },0);
  });
}

function _overWicketsArr(oh, fow){
  var n=(oh||[]).length;
  var arr=[];
  for(var i=0;i<n;i++) arr.push(0);
  (fow||[]).forEach(function(f){
    var ov=parseInt(f.over)||0;
    if(ov<n) arr[ov]=(arr[ov]||0)+1;
  });
  return arr;
}

function _cumulative(runs){
  var c=[],t=0;
  (runs||[]).forEach(function(r){ t+=r; c.push(t); });
  return c;
}

/* ── Chart 1: Manhattan (runs per over bars, wicket overs red) ───── */
function _chartManhattan(oh1, oh2, fow1, fow2, name1, name2, totalOvers){
  var runs1=_overRunsArr(oh1), runs2=_overRunsArr(oh2);
  if(!runs1.length&&!runs2.length) return '';
  var W=520, H=160, pad={t:20,r:12,b:32,l:34};
  var innerW=W-pad.l-pad.r, innerH=H-pad.t-pad.b;
  var maxR=Math.max.apply(null, runs1.concat(runs2).concat([1]));
  maxR=Math.ceil(maxR/5)*5;
  var n=Math.max(runs1.length, runs2.length, 1);
  var bw, gap=1;
  var hasBoth=runs1.length&&runs2.length;
  if(hasBoth){ bw=Math.max(2,(innerW/n)/2-gap); }
  else { bw=Math.max(2,(innerW/n)-gap*2); }

  function barSet(runs, fow, color, offset){
    var wOvers={};
    (fow||[]).forEach(function(f){ var ov=parseInt(f.over)||0; wOvers[ov]=1; });
    return (runs||[]).map(function(r,i){
      var slotW=innerW/n;
      var x=pad.l+i*slotW+offset;
      var bh=Math.max(1,(r/maxR)*innerH);
      var y=pad.t+innerH-bh;
      var fill=wOvers[i]?'#e53935':color;
      return '<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+bh.toFixed(1)+'" fill="'+fill+'" rx="1"><title>Over '+(i+1)+': '+r+' runs'+(wOvers[i]?' (wicket)':'')+'</title></rect>';
    }).join('');
  }

  function offset1(){ return hasBoth?(innerW/n-bw*2-gap)/2:((innerW/n)-bw)/2; }
  function offset2(){ return hasBoth?(innerW/n-bw*2-gap)/2+bw+gap:((innerW/n)-bw)/2; }

  var yLabels='', yStep=Math.ceil(maxR/4);
  for(var v=0;v<=maxR;v+=yStep){
    var yy=(pad.t+innerH-(v/maxR)*innerH).toFixed(1);
    yLabels+='<line x1="'+pad.l+'" y1="'+yy+'" x2="'+(W-pad.r)+'" y2="'+yy+'" stroke="#eeeeee" stroke-width="0.6"/>'+
      '<text x="'+(pad.l-4)+'" y="'+(parseFloat(yy)+3)+'" text-anchor="end" font-size="8" fill="#999">'+v+'</text>';
  }
  var xLabels='';
  for(var o=0;o<n;o++){
    if((o+1)%5===0||(o===0&&n<=5)){
      var xc=(pad.l+(o+0.5)*(innerW/n)).toFixed(1);
      xLabels+='<text x="'+xc+'" y="'+(H-pad.b+11)+'" text-anchor="middle" font-size="8" fill="#888">'+(o+1)+'</text>';
    }
  }
  var legend='';
  if(hasBoth){
    legend='<rect x="'+pad.l+'" y="4" width="10" height="8" fill="#1565c0" rx="1"/>'+
      '<text x="'+(pad.l+13)+'" y="11" font-size="9" fill="#333">'+escapeHtml(name1)+'</text>'+
      '<rect x="'+(pad.l+70)+'" y="4" width="10" height="8" fill="#2e7d32" rx="1"/>'+
      '<text x="'+(pad.l+83)+'" y="11" font-size="9" fill="#333">'+escapeHtml(name2)+'</text>'+
      '<rect x="'+(pad.l+150)+'" y="4" width="10" height="8" fill="#e53935" rx="1"/>'+
      '<text x="'+(pad.l+163)+'" y="11" font-size="9" fill="#333">Wicket over</text>';
  } else {
    legend='<rect x="'+pad.l+'" y="4" width="10" height="8" fill="#1565c0" rx="1"/>'+
      '<text x="'+(pad.l+13)+'" y="11" font-size="9" fill="#333">'+escapeHtml(name1||name2)+'</text>'+
      '<rect x="'+(pad.l+100)+'" y="4" width="10" height="8" fill="#e53935" rx="1"/>'+
      '<text x="'+(pad.l+113)+'" y="11" font-size="9" fill="#333">Wicket over</text>';
  }
  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;display:block;max-width:520px">'+
    yLabels+xLabels+
    (runs1.length?barSet(runs1,fow1,'#1565c0',offset1()):'')+
    (runs2.length?barSet(runs2,fow2,'#2e7d32',offset2()):'')+
    '<line x1="'+pad.l+'" y1="'+pad.t+'" x2="'+pad.l+'" y2="'+(H-pad.b)+'" stroke="#ccc" stroke-width="1"/>'+
    '<line x1="'+pad.l+'" y1="'+(H-pad.b)+'" x2="'+(W-pad.r)+'" y2="'+(H-pad.b)+'" stroke="#ccc" stroke-width="1"/>'+
    legend+
    '</svg>';
}

/* ── Chart 2: Worm (cumulative runs) ─────────────────────────────── */
function _chartWorm(oh1, oh2, fow1, fow2, s1, s2, name1, name2, totalOvers){
  var runs1=_overRunsArr(oh1), runs2=_overRunsArr(oh2);
  var cum1=_cumulative(runs1), cum2=_cumulative(runs2);
  if(!cum1.length) return '';
  var W=520, H=200, pad={t:28,r:16,b:32,l:42};
  var innerW=W-pad.l-pad.r, innerH=H-pad.t-pad.b;
  var maxR=Math.max.apply(null,[s1.runs,s2.runs,1]);
  maxR=Math.ceil((maxR+20)/50)*50;
  var n=totalOvers;
  function px(i){ return (pad.l+(i/n)*innerW).toFixed(2); }
  function py(r){ return (pad.t+innerH-(r/maxR)*innerH).toFixed(2); }

  var grid='', yStep=maxR<=100?25:maxR<=200?50:100;
  for(var v=0;v<=maxR;v+=yStep){
    var yy=py(v);
    grid+='<line x1="'+pad.l+'" y1="'+yy+'" x2="'+(W-pad.r)+'" y2="'+yy+'" stroke="#e8e8e8" stroke-width="0.8" stroke-dasharray="3,3"/>'+
      '<text x="'+(pad.l-5)+'" y="'+(parseFloat(yy)+3)+'" text-anchor="end" font-size="9" fill="#888">'+v+'</text>';
  }
  var xStep=n<=10?2:n<=20?5:10;
  var xLabels='';
  for(var o=0;o<=n;o+=xStep){
    xLabels+='<text x="'+px(o)+'" y="'+(H-pad.b+12)+'" text-anchor="middle" font-size="9" fill="#888">'+o+'</text>';
  }

  function makePath(cum,color,sw){
    if(!cum.length) return '';
    var d='M'+px(0)+','+py(0);
    cum.forEach(function(r,i){ d+=' L'+px(i+1)+','+py(r); });
    return '<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+sw+'" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  function fowDots(fow, cum, color){
    return (fow||[]).map(function(f){
      var ov=Math.min(Math.ceil(parseFloat(f.over)||1),cum.length);
      var r=cum[ov-1]||0;
      return '<circle cx="'+px(ov)+'" cy="'+py(r)+'" r="4.5" fill="#fff" stroke="'+color+'" stroke-width="2"><title>'+escapeHtml(f.name)+' '+f.score+'/'+f.wkts+' (ov '+f.over+')</title></circle>';
    }).join('');
  }

  var c1='#1565c0', c2='#2e7d32';
  var axes='<line x1="'+pad.l+'" y1="'+pad.t+'" x2="'+pad.l+'" y2="'+(H-pad.b)+'" stroke="#bbb" stroke-width="1"/>'+
    '<line x1="'+pad.l+'" y1="'+(H-pad.b)+'" x2="'+(W-pad.r)+'" y2="'+(H-pad.b)+'" stroke="#bbb" stroke-width="1"/>';
  var legend='<circle cx="'+(pad.l+6)+'" cy="12" r="5" fill="'+c1+'"/>'+
    '<text x="'+(pad.l+14)+'" y="16" font-size="9" font-weight="700" fill="'+c1+'">'+escapeHtml(name1)+'</text>'+
    (cum2.length?'<circle cx="'+(pad.l+6+90)+'" cy="12" r="5" fill="'+c2+'"/><text x="'+(pad.l+14+90)+'" y="16" font-size="9" font-weight="700" fill="'+c2+'">'+escapeHtml(name2)+'</text>':'');
  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;display:block;max-width:520px">'+
    grid+axes+xLabels+legend+
    makePath(cum1,c1,2.6)+
    (cum2.length?makePath(cum2,c2,2.6):'')+
    fowDots(fow1,cum1,c1)+
    (cum2.length?fowDots(fow2,cum2,c2):'')+
    '<text x="'+(pad.l-28)+'" y="'+(pad.t+innerH/2)+'" text-anchor="middle" font-size="9" fill="#777" transform="rotate(-90,'+(pad.l-28)+','+(pad.t+innerH/2)+')">RUNS</text>'+
    '<text x="'+(pad.l+innerW/2)+'" y="'+(H-2)+'" text-anchor="middle" font-size="9" fill="#777">OVERS</text>'+
    '</svg>';
}

/* ── Chart 3: Run Rate — current rate + required rate (chase) ─────── */
function _chartRunRate(oh1, oh2, name1, name2, totalOvers, s1){
  var runs1=_overRunsArr(oh1), runs2=_overRunsArr(oh2);
  if(!runs1.length) return '';
  function rrArr(runs){
    var cumR=0, arr=[];
    runs.forEach(function(r,i){ cumR+=r; arr.push(cumR/(i+1)); });
    return arr;
  }
  var rr1=rrArr(runs1), rr2=rrArr(runs2);
  // Required run rate for the chasing side, over by over
  var target=(s1&&s1.runs!=null)?s1.runs+1:null;
  var rrr=[];
  if(rr2.length && target){
    var cumR2=0;
    runs2.forEach(function(r,i){
      cumR2+=r;
      var rem=totalOvers-(i+1);
      if(rem>0){ rrr.push(Math.max(0,(target-cumR2)/rem)); }
      else { rrr.push(null); }
    });
  }
  var allRR=rr1.concat(rr2).concat(rrr.filter(function(x){return x!=null;})).concat([1]);
  var maxRR=Math.ceil(Math.max.apply(null,allRR)/2)*2+1;
  var W=520, H=150, pad={t:24,r:16,b:30,l:34};
  var innerW=W-pad.l-pad.r, innerH=H-pad.t-pad.b;
  var n=Math.max(rr1.length,rr2.length,1);
  function px(i){ return (pad.l+((i+1)/n)*innerW).toFixed(2); }
  function py(r){ return (pad.t+innerH-(r/maxRR)*innerH).toFixed(2); }
  var grid='';
  for(var v=0;v<=maxRR;v+=Math.ceil(maxRR/4)){
    var yy=py(v);
    grid+='<line x1="'+pad.l+'" y1="'+yy+'" x2="'+(W-pad.r)+'" y2="'+yy+'" stroke="#eeeeee" stroke-width="0.7"/>'+
      '<text x="'+(pad.l-4)+'" y="'+(parseFloat(yy)+3)+'" text-anchor="end" font-size="8" fill="#999">'+v+'</text>';
  }
  function makePath(arr,color,dash){
    if(!arr.length) return '';
    var d='', started=false;
    arr.forEach(function(r,i){ if(r==null){started=false;return;} d+=(started?' L':' M')+px(i)+','+py(r); started=true; });
    return '<path d="'+d.trim()+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'+(dash?' stroke-dasharray="5,4"':'')+'/>';
  }
  var xLabels='';
  for(var o=1;o<=n;o+=Math.ceil(n/8)){
    xLabels+='<text x="'+px(o-1)+'" y="'+(H-pad.b+11)+'" text-anchor="middle" font-size="8" fill="#888">'+o+'</text>';
  }
  var c1='#1565c0', c2='#2e7d32', cR='#e53935';
  var lx=pad.l+5;
  var legend='<circle cx="'+lx+'" cy="10" r="4" fill="'+c1+'"/><text x="'+(lx+7)+'" y="14" font-size="8" fill="#333">'+escapeHtml(name1)+'</text>';
  lx+=72;
  if(rr2.length){ legend+='<circle cx="'+lx+'" cy="10" r="4" fill="'+c2+'"/><text x="'+(lx+7)+'" y="14" font-size="8" fill="#333">'+escapeHtml(name2)+'</text>'; lx+=72; }
  if(rrr.length){ legend+='<line x1="'+lx+'" y1="10" x2="'+(lx+12)+'" y2="10" stroke="'+cR+'" stroke-width="2" stroke-dasharray="5,4"/><text x="'+(lx+16)+'" y="14" font-size="8" fill="#333">Req. rate</text>'; }
  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;display:block;max-width:520px">'+
    grid+xLabels+legend+
    '<line x1="'+pad.l+'" y1="'+pad.t+'" x2="'+pad.l+'" y2="'+(H-pad.b)+'" stroke="#bbb" stroke-width="1"/>'+
    '<line x1="'+pad.l+'" y1="'+(H-pad.b)+'" x2="'+(W-pad.r)+'" y2="'+(H-pad.b)+'" stroke="#bbb" stroke-width="1"/>'+
    makePath(rr1,c1)+(rr2.length?makePath(rr2,c2):'')+(rrr.length?makePath(rrr,cR,true):'')+
    '</svg>';
}

/* ── Chart 5: Batter Contribution (horizontal bars) ──────────────── */
function _chartBatterContrib(batting, order, teamName, color){
  var idxs=order.slice();
  for(var i=0;i<batting.length;i++){ if(order.indexOf(i)<0) idxs.push(i); }
  var batters=idxs.map(function(i){ return batting[i]; }).filter(function(b){ return b&&b.balls>0; });
  if(!batters.length) return '';
  var maxR=Math.max.apply(null, batters.map(function(b){ return b.runs; }).concat([1]));
  var barH=14, gap=4, W=420, padL=80, padR=50, padT=8, padB=8;
  var H=padT+batters.length*(barH+gap)+padB;
  var innerW=W-padL-padR;
  var bars=batters.map(function(b,i){
    var bw=Math.max(2,(b.runs/maxR)*innerW);
    var y=padT+i*(barH+gap);
    var label=escapeHtml(b.name.length>12?b.name.slice(0,11)+'…':b.name);
    var notOut=!b.out&&b.balls>0?'*':'';
    return '<text x="'+(padL-5)+'" y="'+(y+barH-3)+'" text-anchor="end" font-size="9" fill="#333">'+label+'</text>'+
      '<rect x="'+padL+'" y="'+y+'" width="'+bw.toFixed(1)+'" height="'+barH+'" fill="'+color+'" rx="2" opacity="0.85"/>'+
      '<text x="'+(padL+bw+4)+'" y="'+(y+barH-3)+'" font-size="9" fill="#555">'+b.runs+notOut+'</text>';
  }).join('');
  var xLabels='', xStep=Math.ceil(maxR/4/10)*10||10;
  for(var v=0;v<=maxR;v+=xStep){
    var xp=(padL+v/maxR*innerW).toFixed(1);
    xLabels+='<text x="'+xp+'" y="'+(H-1)+'" text-anchor="middle" font-size="7" fill="#aaa">'+v+'</text>'+
      '<line x1="'+xp+'" y1="'+padT+'" x2="'+xp+'" y2="'+(H-padB-4)+'" stroke="#f0f0f0" stroke-width="0.8"/>';
  }
  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;display:block;max-width:420px">'+
    xLabels+bars+
    '</svg>';
}

/* ── Chart 6: Bowler Economy (horizontal bars) ────────────────────── */
function _chartBowlerEconomy(bowling, order, color){
  var ordered=orderedBowlers(bowling,order).filter(function(b){ return b.balls>0; });
  if(!ordered.length) return '';
  var econs=ordered.map(function(b){ return b.balls>0?(b.runs/(b.balls/6)):0; });
  var maxE=Math.max.apply(null,econs.concat([8]));
  maxE=Math.ceil(maxE/2)*2;
  var barH=13, gap=4, W=420, padL=85, padR=45, padT=8, padB=12;
  var H=padT+ordered.length*(barH+gap)+padB;
  var innerW=W-padL-padR;
  var bars=ordered.map(function(b,i){
    var ec=econs[i];
    var bw=Math.max(2,(ec/maxE)*innerW);
    var y=padT+i*(barH+gap);
    var label=escapeHtml(b.name.length>13?b.name.slice(0,12)+'…':b.name);
    var ovs=Math.floor(b.balls/6)+'.'+b.balls%6;
    var fill=ec>8?'#e53935':ec>6?'#f57c00':color;
    return '<text x="'+(padL-5)+'" y="'+(y+barH-3)+'" text-anchor="end" font-size="9" fill="#333">'+label+'</text>'+
      '<rect x="'+padL+'" y="'+y+'" width="'+bw.toFixed(1)+'" height="'+barH+'" fill="'+fill+'" rx="2" opacity="0.85"/>'+
      '<text x="'+(padL+bw+4)+'" y="'+(y+barH-3)+'" font-size="8" fill="#555">'+ec.toFixed(2)+' ('+ovs+' ov)</text>';
  }).join('');
  var xLabels='';
  for(var v=0;v<=maxE;v+=2){
    var xp=(padL+v/maxE*innerW).toFixed(1);
    xLabels+='<text x="'+xp+'" y="'+(H-1)+'" text-anchor="middle" font-size="7" fill="#aaa">'+v+'</text>'+
      '<line x1="'+xp+'" y1="'+padT+'" x2="'+xp+'" y2="'+(H-padB-4)+'" stroke="#f0f0f0" stroke-width="0.8"/>';
  }
  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;display:block;max-width:420px">'+
    xLabels+bars+
    '</svg>';
}

/* ── Chart 7: Extras Breakdown (segmented bar) ────────────────────── */
function _chartExtras(s1, s2, name1, name2){
  var wide1=s1.wide||0, nb1=s1.nb||0, b1=s1.byes||0, lb1=s1.lb||0;
  var wide2=s2.wide||0, nb2=s2.nb||0, b2=s2.byes||0, lb2=s2.lb||0;
  var tot1=wide1+nb1+b1+lb1, tot2=wide2+nb2+b2+lb2;
  if(!tot1&&!tot2) return '';
  var W=420, rowH=20, padL=85, padR=60, padT=10, gap=10;
  var rows=tot2>0?2:1;
  var H=padT+rows*(rowH+gap);
  var innerW=W-padL-padR;
  var maxT=Math.max(tot1,tot2,1);
  var cats=[
    {key:'W',label:'Wide',c:'#f57c00'},
    {key:'NB',label:'No Ball',c:'#7b1fa2'},
    {key:'B',label:'Byes',c:'#0277bd'},
    {key:'LB',label:'Leg-Byes',c:'#2e7d32'}
  ];
  function buildRow(vals, tot, name, y){
    var total=vals.reduce(function(s,v){return s+v;},0);
    if(!total) return '';
    var bw=(total/maxT)*innerW;
    var segments='', x=padL;
    vals.forEach(function(v,i){
      if(!v) return;
      var sw=(v/maxT)*innerW;
      segments+='<rect x="'+x.toFixed(1)+'" y="'+y+'" width="'+sw.toFixed(1)+'" height="'+rowH+'" fill="'+cats[i].c+'" opacity="0.85">'+
        '<title>'+cats[i].label+': '+v+'</title></rect>';
      x+=sw;
    });
    return '<text x="'+(padL-5)+'" y="'+(y+rowH-5)+'" text-anchor="end" font-size="9" fill="#333">'+escapeHtml(name)+'</text>'+
      segments+
      '<text x="'+(padL+bw+5)+'" y="'+(y+rowH-5)+'" font-size="9" fill="#555">'+total+'</text>';
  }
  var content=buildRow([wide1,nb1,b1,lb1],tot1,name1,padT);
  if(tot2>0) content+=buildRow([wide2,nb2,b2,lb2],tot2,name2,padT+rowH+gap);
  var legend=cats.map(function(c,i){
    return '<rect x="'+(padL+i*80)+'" y="'+(H-8)+'" width="8" height="8" fill="'+c.c+'" rx="1"/>'+
      '<text x="'+(padL+i*80+11)+'" y="'+(H-1)+'" font-size="7" fill="#666">'+c.label+'</text>';
  }).join('');
  return '<svg viewBox="0 0 '+W+' '+(H+12)+'" style="width:100%;display:block;max-width:420px">'+
    content+legend+
    '</svg>';
}

/* ── Chart 8: Partnerships (back-to-back contribution bars) ───────────
   Each row = one partnership: both batsmen, their individual run
   contributions, and the partnership total — split from a centre line
   so the larger contributor's bar is longer. */
function _ordinal(n){ var s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }

function _chartPartnerships(partnerships, color1, color2){
  var parts=(partnerships||[]).filter(function(p){ return p && p.runs>0; });
  if(!parts.length) return '';
  var W=520, rowH=42, padT=10, padB=6;
  var H=padT+parts.length*rowH+padB;
  var cx=W/2, halfMax=148;
  var maxC=1;
  parts.forEach(function(p){ maxC=Math.max(maxC, p.b1.runs, p.b2.runs); });
  var c1=color1||'#1565c0', c2=color2||'#2e7d32';
  function trunc(n){ n=n||'—'; return escapeHtml(n.length>14?n.slice(0,13)+'…':n); }
  var rows=parts.map(function(p,i){
    var top=padT+i*rowH, yT=top+14, yB=top+22, barH=12;
    var lw=Math.max(1,(p.b1.runs/maxC)*halfMax);
    var rw=Math.max(1,(p.b2.runs/maxC)*halfMax);
    return '<text x="'+(cx-halfMax-10)+'" y="'+yT+'" text-anchor="end" font-size="10" font-weight="600" fill="#333">'+trunc(p.b1.name)+'</text>'+
      '<text x="'+cx+'" y="'+yT+'" text-anchor="middle" font-size="13" font-weight="800" fill="#111">'+p.runs+'</text>'+
      '<text x="'+(cx+halfMax+10)+'" y="'+yT+'" text-anchor="start" font-size="10" font-weight="600" fill="#333">'+trunc(p.b2.name)+'</text>'+
      '<rect x="'+(cx-lw).toFixed(1)+'" y="'+yB+'" width="'+lw.toFixed(1)+'" height="'+barH+'" fill="'+c1+'" opacity="0.85" rx="1.5"><title>'+escapeHtml(p.b1.name)+': '+p.b1.runs+'</title></rect>'+
      '<rect x="'+cx+'" y="'+yB+'" width="'+rw.toFixed(1)+'" height="'+barH+'" fill="'+c2+'" opacity="0.85" rx="1.5"><title>'+escapeHtml(p.b2.name)+': '+p.b2.runs+'</title></rect>'+
      '<text x="'+(cx-lw-4)+'" y="'+(yB+barH-2)+'" text-anchor="end" font-size="8" fill="#666">'+p.b1.runs+'</text>'+
      '<text x="'+(cx+rw+4)+'" y="'+(yB+barH-2)+'" text-anchor="start" font-size="8" fill="#666">'+p.b2.runs+'</text>'+
      '<text x="'+(cx+halfMax+10)+'" y="'+(yB+barH-1)+'" text-anchor="start" font-size="7" fill="#aaa">'+_ordinal(p.wkt||i+1)+' wkt</text>';
  }).join('');
  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;display:block;max-width:520px">'+
    '<line x1="'+cx+'" y1="'+padT+'" x2="'+cx+'" y2="'+(H-padB)+'" stroke="#e0e0e0" stroke-width="1"/>'+
    rows+'</svg>';
}

/* ── Print CSS ─────────────────────────────────────────────────────── */
var _PDF_CSS=
'@page{size:A4;margin:15mm 12mm}'+
'*{box-sizing:border-box}'+
'body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;margin:0;padding:0}'+
'.page{padding:8mm;max-width:794px;margin:0 auto}'+
'h1{color:#0F6E56;font-size:18px;margin:0 0 2px}'+
'.meta{color:#777;font-size:11px;margin-bottom:10px}'+
'.result-banner{background:#E1F5EE;color:#0F6E56;padding:8px 14px;border-radius:6px;font-size:14px;font-weight:700;text-align:center;margin-bottom:12px;border-left:4px solid #0F6E56}'+
'.summary-row{display:flex;gap:12px;margin-bottom:12px}'+
'.sum-box{flex:1;border:1px solid #e0e0e0;border-radius:6px;padding:8px 12px;border-top:3px solid #0F6E56}'+
'.sum-box h3{font-size:11px;color:#0F6E56;margin:0 0 4px;font-weight:700;text-transform:uppercase}'+
'.sum-score{font-size:20px;font-weight:800;color:#111}'+
'.sum-detail{font-size:11px;color:#888;margin-top:2px}'+
'h2{font-size:13px;color:#0F6E56;border-bottom:2px solid #e8f5e9;padding-bottom:3px;margin:14px 0 6px;font-weight:800}'+
'h3.chart-title{font-size:12px;color:#333;margin:10px 0 4px;font-weight:700}'+
'table{width:100%;border-collapse:collapse;margin-bottom:8px;font-size:11px}'+
'th{text-align:left;font-size:10px;color:#666;font-weight:700;padding:4px 5px;border-bottom:2px solid #e0e0e0;background:#fafafa;text-transform:uppercase;letter-spacing:0.3px}'+
'td{padding:4px 5px;border-bottom:1px solid #f0f0f0}'+
'tr:last-child td{border-bottom:none}'+
'td.num,th.num{text-align:right}'+
'.extras{font-size:11px;color:#777;margin:-4px 0 8px}'+
'.fow-note{font-size:11px;color:#555;line-height:1.7}'+
'.chart-wrap{background:#fafafa;border:1px solid #eeeeee;border-radius:6px;padding:8px 10px;margin-bottom:8px}'+
'.credit{font-size:10px;color:#aaa;text-align:right;margin-top:4px}'+
'@media print{.no-print{display:none!important}.page-break{page-break-before:always}}';

/* ── Scorecard builder ────────────────────────────────────────────── */
function _buildScorecard(matchObj, s1, s2, b1, bw1, fow1, b2, bw2, fow2, bo1, bo2, bwo1, bwo2, showResult){
  var bat1=matchObj.batFirst, bat2=bat1===matchObj.team1?matchObj.team2:matchObj.team1;
  var result='';
  if(showResult){
    result=s1.runs>s2.runs?bat1+' won by '+(s1.runs-s2.runs)+' run'+(s1.runs-s2.runs!==1?'s':'')
          :s2.runs>s1.runs?bat2+' won by '+(10-s2.wickets)+' wicket'+(10-s2.wickets!==1?'s':'')
          :'Match tied!';
  }
  function batRows(arr, order){
    var notBatted=[];
    for(var ii=0;ii<arr.length;ii++){ if(order.indexOf(ii)<0) notBatted.push(ii); }
    var idxs=order.concat(notBatted);
    return idxs.map(function(i){
      var b=arr[i]; if(!b) return '';
      var status, sc;
      if(b.out){ status=escapeHtml(b.howOut); sc='#791F1F'; }
      else if(b.retiredHurt){ status='retired hurt'; sc='#aaa'; }
      else if(b.balls>0){ status='not out'; sc='#0F6E56'; }
      else { status='did not bat'; sc='#aaa'; }
      var r=b.balls>0?b.runs:'-', bl=b.balls>0?b.balls:'-';
      var sr=b.balls>0?((b.runs/b.balls)*100).toFixed(0):'-';
      return '<tr><td>'+escapeHtml(b.name)+'</td><td style="color:'+sc+';font-size:10px">'+status+'</td><td class="num">'+r+'</td><td class="num">'+bl+'</td><td class="num">'+(b.balls>0?b.fours:'-')+'</td><td class="num">'+(b.balls>0?b.sixes:'-')+'</td><td class="num">'+sr+'</td></tr>';
    }).join('');
  }
  function bowlRows(arr, order){
    return orderedBowlers(arr,order).filter(function(b){return b.balls>0;}).map(function(b){
      return '<tr><td>'+escapeHtml(b.name)+'</td><td class="num">'+Math.floor(b.balls/6)+'.'+b.balls%6+'</td><td class="num">'+b.runs+'</td><td class="num">'+b.wickets+'</td><td class="num">'+(b.runs/(b.balls/6)).toFixed(2)+'</td></tr>';
    }).join('');
  }
  function fowInline(arr){
    return (arr||[]).map(function(f,i){
      return '<span style="margin-right:8px">'+(i+1)+'. '+escapeHtml(f.name)+' <b>'+f.score+'/'+(i+1)+'</b> ('+f.over+' ov)</span>';
    }).join('');
  }

  var html='';
  html+='<h1>&#127955; Match Report</h1>';
  html+='<div class="meta">'+escapeHtml(matchObj.team1)+' vs '+escapeHtml(matchObj.team2)+' &nbsp;&bull;&nbsp; '+matchObj.overs+' overs &nbsp;&bull;&nbsp; '+escapeHtml(bat1)+' batted first &nbsp;&bull;&nbsp; '+new Date().toLocaleDateString()+'</div>';
  if(result) html+='<div class="result-banner">'+escapeHtml(result)+'</div>';
  html+='<div class="summary-row">'+
    '<div class="sum-box"><h3>'+escapeHtml(bat1)+' — 1st Innings</h3><div class="sum-score">'+s1.runs+'/'+s1.wickets+'</div><div class="sum-detail">'+_rptOvers(s1)+' ov &nbsp;&bull;&nbsp; RR: '+_rptRR(s1)+'</div></div>'+
    (b2.length?'<div class="sum-box"><h3>'+escapeHtml(bat2)+' — 2nd Innings</h3><div class="sum-score">'+s2.runs+'/'+s2.wickets+'</div><div class="sum-detail">'+_rptOvers(s2)+' ov &nbsp;&bull;&nbsp; RR: '+_rptRR(s2)+'</div></div>':'')+
  '</div>';

  // Inn 1 batting
  html+='<h2>'+escapeHtml(bat1)+' — Batting</h2>';
  html+='<table><tr><th>Batsman</th><th>Dismissal</th><th class="num">R</th><th class="num">B</th><th class="num">4s</th><th class="num">6s</th><th class="num">SR</th></tr>'+batRows(b1,bo1)+'</table>';
  html+='<div class="extras">Extras: Wide '+(s1.wide||0)+' &nbsp; No Ball '+(s1.nb||0)+' &nbsp; Byes '+(s1.byes||0)+' &nbsp; Leg-Byes '+(s1.lb||0)+' &nbsp;&bull;&nbsp; Total <b>'+s1.runs+'/'+s1.wickets+'</b> ('+_rptOvers(s1)+' ov)</div>';
  if(fow1&&fow1.length) html+='<div class="fow-note"><b>Fall of Wickets:</b> '+fowInline(fow1)+'</div>';
  html+='<h2>'+escapeHtml(bat2)+' — Bowling (Inn. 1)</h2>';
  html+='<table><tr><th>Bowler</th><th class="num">O</th><th class="num">R</th><th class="num">W</th><th class="num">Econ</th></tr>'+bowlRows(bw1,bwo1)+'</table>';

  if(b2&&b2.length){
    html+='<div class="page-break"></div>';
    html+='<h2>'+escapeHtml(bat2)+' — Batting</h2>';
    html+='<table><tr><th>Batsman</th><th>Dismissal</th><th class="num">R</th><th class="num">B</th><th class="num">4s</th><th class="num">6s</th><th class="num">SR</th></tr>'+batRows(b2,bo2)+'</table>';
    html+='<div class="extras">Extras: Wide '+(s2.wide||0)+' &nbsp; No Ball '+(s2.nb||0)+' &nbsp; Byes '+(s2.byes||0)+' &nbsp; Leg-Byes '+(s2.lb||0)+' &nbsp;&bull;&nbsp; Total <b>'+s2.runs+'/'+s2.wickets+'</b> ('+_rptOvers(s2)+' ov)</div>';
    if(fow2&&fow2.length) html+='<div class="fow-note"><b>Fall of Wickets:</b> '+fowInline(fow2)+'</div>';
    html+='<h2>'+escapeHtml(bat1)+' — Bowling (Inn. 2)</h2>';
    html+='<table><tr><th>Bowler</th><th class="num">O</th><th class="num">R</th><th class="num">W</th><th class="num">Econ</th></tr>'+bowlRows(bw2,bwo2)+'</table>';
  }
  return html;
}

/* ── Charts page builder ─────────────────────────────────────────── */
function _buildChartsHTML(matchObj, s1, s2, oh1, oh2, fow1, fow2, b1, bw1, bo1, b2, bw2, bo2, pnr1, pnr2){
  var bat1=matchObj.batFirst, bat2=bat1===matchObj.team1?matchObj.team2:matchObj.team1;
  var totalOvers=matchObj.overs||20;
  var html='<div class="page-break"></div>';
  html+='<h2 style="font-size:16px;color:#0F6E56;margin-bottom:12px">&#128200; Match Charts</h2>';

  var mh=_chartManhattan(oh1,oh2,fow1,fow2,bat1,bat2,totalOvers);
  if(mh){ html+='<h3 class="chart-title">Runs Per Over (Manhattan)</h3><div class="chart-wrap">'+mh+'</div>'; }

  var worm=_chartWorm(oh1,oh2,fow1,fow2,s1,s2,bat1,bat2,totalOvers);
  if(worm){ html+='<h3 class="chart-title">Cumulative Score (Worm)</h3><div class="chart-wrap">'+worm+'</div>'; }

  var rr=_chartRunRate(oh1,oh2,bat1,bat2,totalOvers,s1);
  if(rr){ html+='<h3 class="chart-title">Run Rate'+(oh2&&oh2.length?' &amp; Required Rate':'')+'</h3><div class="chart-wrap">'+rr+'</div>'; }

  if(b1&&b1.length){
    var bc1=_chartBatterContrib(b1,bo1,bat1,'#1565c0');
    if(bc1){ html+='<h3 class="chart-title">Batter Contributions — '+escapeHtml(bat1)+'</h3><div class="chart-wrap">'+bc1+'</div>'; }
  }
  if(b2&&b2.length){
    var bc2=_chartBatterContrib(b2,bo2,bat2,'#2e7d32');
    if(bc2){ html+='<h3 class="chart-title">Batter Contributions — '+escapeHtml(bat2)+'</h3><div class="chart-wrap">'+bc2+'</div>'; }
  }

  if(bw1&&bw1.length){
    var be1=_chartBowlerEconomy(bw1,bo1&&bo1.length?bo1:[],'#7b1fa2');
    if(be1){ html+='<h3 class="chart-title">Bowler Economy — '+escapeHtml(bat2)+' bowling</h3><div class="chart-wrap">'+be1+'</div>'; }
  }
  if(bw2&&bw2.length){
    var be2=_chartBowlerEconomy(bw2,bo2&&bo2.length?bo2:[],'#c62828');
    if(be2){ html+='<h3 class="chart-title">Bowler Economy — '+escapeHtml(bat1)+' bowling</h3><div class="chart-wrap">'+be2+'</div>'; }
  }

  var ext=_chartExtras(s1,s2,bat1,bat2);
  if(ext){ html+='<h3 class="chart-title">Extras Breakdown</h3><div class="chart-wrap">'+ext+'</div>'; }

  var ps1=_chartPartnerships(pnr1,'#1565c0','#5e92d0');
  if(ps1){ html+='<h3 class="chart-title">Partnerships — '+escapeHtml(bat1)+'</h3><div class="chart-wrap">'+ps1+'</div>'; }
  var ps2=_chartPartnerships(pnr2,'#2e7d32','#66a86b');
  if(ps2){ html+='<h3 class="chart-title">Partnerships — '+escapeHtml(bat2)+'</h3><div class="chart-wrap">'+ps2+'</div>'; }

  html+='<div class="credit">&#9733; CA Bijay Pokhrel</div>';
  return html;
}

/* ── Print machinery ─────────────────────────────────────────────── */
var _pdfHtml='';

function _doPrint(){
  if(!_pdfHtml) return;
  var fullHtml='<!DOCTYPE html><html><head><meta charset="UTF-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>Match Report</title><style>'+_PDF_CSS+'</style></head>'+
    '<body><div class="page">'+_pdfHtml+'</div></body></html>';
  // Open in new tab — reliable on mobile; user can use browser's Print → Save as PDF
  var win=window.open('','_blank');
  if(win){
    win.document.write(fullHtml);
    win.document.close();
    setTimeout(function(){ try{ win.focus(); win.print(); }catch(e){} }, 600);
  } else {
    // Popup blocked — download as an HTML file instead
    try{
      var blob=new Blob([fullHtml],{type:'text/html'});
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');
      a.href=url; a.download='match-report.html';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    }catch(e){ window.print(); }
  }
}

function printOverlay(html){
  _pdfHtml=html;
  var overlay=document.getElementById('pdf-overlay');
  if(!overlay){
    overlay=document.createElement('div');
    overlay.id='pdf-overlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML=
    '<div id="pdf-overlay-bar">'+
      '<button id="pdf-close-btn" onclick="document.getElementById(\'pdf-overlay\').style.display=\'none\';_pdfHtml=\'\';">&#8592; Back</button>'+
      '<button id="pdf-print-btn" onclick="_doPrint()">&#128438; Download / Print PDF</button>'+
    '</div>'+
    '<div id="pdf-overlay-body"><style>'+_PDF_CSS+'</style>'+html+'</div>';
  overlay.style.display='block';
  overlay.scrollTop=0;
}

/* Build partnerships for the in-progress innings, including the current
   unbroken stand (which has not yet been pushed into S.partnerships). */
function _livePartnerships(){
  var arr=(S.partnerships||[]).slice();
  if((S.partnershipRuns||0)>0 || (S.partnershipBalls||0)>0){
    var a=S.strikerIdx, b=S.nonStrikerIdx, ba=S.batting[a], bb=S.batting[b];
    var rA=(S.pnrContrib&&S.pnrContrib[a])||0, rB=(S.pnrContrib&&S.pnrContrib[b])||0;
    arr.push({wkt:arr.length+1, runs:S.partnershipRuns, balls:S.partnershipBalls,
      b1:{name:ba?ba.name:'', runs:rA}, b2:{name:bb?bb.name:'', runs:rB},
      extras:Math.max(0,S.partnershipRuns-rA-rB)});
  }
  return arr;
}

/* ── Public: export from live match ─────────────────────────────── */
function exportPDF(){
  var isResult=S.phase==='result';
  var isInn2=S.innings===2||isResult;
  var s1=S.inn1score||S.t1;
  var s2=isInn2?S.t2:{runs:0,wickets:0,balls:0,wide:0,nb:0,byes:0,lb:0};
  var b1=S.inn1batting.length?S.inn1batting:S.batting;
  var bw1=S.inn1bowling.length?S.inn1bowling:S.bowling;
  var fow1=S.inn1fow.length?S.inn1fow:S.fow;
  var b2=isInn2?S.batting:[];
  var bw2=isInn2?S.bowling:[];
  var fow2=isInn2?S.fow:[];
  var bo1=S.inn1battingOrder.length?S.inn1battingOrder:S.battingOrder;
  var bwo1=S.inn1bowlingOrder.length?S.inn1bowlingOrder:S.bowlingOrder;
  var oh1=S.inn1overHistory.length?S.inn1overHistory:S.overHistory;
  var oh2=isInn2?S.overHistory:[];
  var pnr1=isInn2?(S.inn1partnerships||[]):_livePartnerships();
  var pnr2=isInn2?_livePartnerships():[];
  var scorecard=_buildScorecard(S.match,s1,s2,b1,bw1,fow1,b2,bw2,fow2,bo1,S.battingOrder,bwo1,S.bowlingOrder,isResult);
  var charts=_buildChartsHTML(S.match,s1,s2,oh1,oh2,fow1,fow2,b1,bw1,bo1,b2,bw2,S.battingOrder,pnr1,pnr2);
  printOverlay(scorecard+charts);
}

/* ── Public: export from history ─────────────────────────────────── */
function printHistoryMatch(idx){
  var history=getMatchHistory();
  var m=history[idx];
  if(!m||!m.inn1batting) return;
  var s1=m.inn1, s2=m.inn2||{runs:0,wickets:0,balls:0,wide:0,nb:0,byes:0,lb:0};
  var matchObj={team1:m.team1,team2:m.team2,batFirst:m.batFirst,overs:m.overs};
  var scorecard=_buildScorecard(matchObj,s1,s2,
    m.inn1batting,m.inn1bowling||[],m.inn1fow||[],
    m.inn2batting||[],m.inn2bowling||[],m.inn2fow||[],
    m.inn1battingOrder||[],m.inn2battingOrder||[],
    m.inn1bowlingOrder||[],m.inn2bowlingOrder||[],true);
  var charts=_buildChartsHTML(matchObj,s1,s2,
    m.inn1overHistory||[],m.inn2overHistory||[],
    m.inn1fow||[],m.inn2fow||[],
    m.inn1batting||[],m.inn1bowling||[],m.inn1battingOrder||[],
    m.inn2batting||[],m.inn2bowling||[],m.inn2battingOrder||[],
    m.inn1partnerships||[],m.inn2partnerships||[]);
  printOverlay(scorecard+charts);
}

/* Legacy shim — stats.js buildAnalysisHTML referenced nowhere else */
function buildAnalysisHTML(){ return ''; }
function buildReportHTML(){ return ''; }
