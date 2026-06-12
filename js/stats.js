/* ═══════════════════════════════════════════════════════════════════════
   stats.js — Cricket Statistics Engine + Dashboard
   Computes advanced analytics from existing S state and match history.
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Ball value helpers ─────────────────────────────────────────────── */
function _ballRuns(b){
  if(b==='W') return 0;
  if(/^\d+W$/.test(b)) return parseInt(b)||0; // run-out with runs
  if(b.startsWith('WD')) return b.length>2?1+(parseInt(b.slice(3))||0):1;
  if(b.startsWith('NB')) return b.length>2?1+(parseInt(b.slice(3))||0):1;
  if(b.startsWith('B') || b.startsWith('LB')) return parseInt(b.slice(b.indexOf('+')+1))||0;
  return parseInt(b)||0;
}
function _isWicket(b){ return b==='W' || /^\d+W$/.test(b); }
function _isExtra(b){ return b.startsWith('WD')||b.startsWith('NB')||b.startsWith('B+')||b.startsWith('LB+'); }
function _isLegalBall(b){ return !b.startsWith('WD')&&!b.startsWith('NB'); }
function _isBoundary(b){ return b==='4'||b==='6'; }

/* ── Compute per-over stats from overHistory ───────────────────────── */
function _computeOverStats(overHistory){
  return overHistory.map(function(ov, idx){
    var runs=0, wickets=0, extras=0, dots=0, fours=0, sixes=0, legal=0;
    ov.forEach(function(b){
      if(_isLegalBall(b)) legal++;
      if(b==='0') dots++;
      if(b==='4'){ fours++; runs+=4; }
      else if(b==='6'){ sixes++; runs+=6; }
      else if(_isWicket(b)){ wickets++; runs+=_ballRuns(b); }
      else if(_isExtra(b)){ extras++; runs+=_ballRuns(b); }
      else runs+=_ballRuns(b);
    });
    return {over:idx+1, balls:ov, runs:runs, wickets:wickets, extras:extras, dots:dots, fours:fours, sixes:sixes, legal:legal};
  });
}

/* ── Compute batting dot balls from overHistory ─────────────────────── */
function _battingDots(batName, batting, overHistory, overBowlers){
  // Returns {dots, singles, doubles, triples} per batter from ball-by-ball
  // We can't track per-batter from overHistory without striker tracking,
  // so we compute approximate dots from batter.balls - batter.runs contributions
  // For exact dot counts we use the batting array directly.
  var b=batting.filter(function(x){return x.name===batName;})[0];
  if(!b) return {dots:0,singles:0,doubles:0,triples:0};
  // Approximate: dots = balls - balls_with_runs (fours count as 1 run-ball, sixes 1)
  var scoringBalls=b.balls - Math.max(0, b.balls - (b.runs - b.fours*4 - b.sixes*6) - (b.fours + b.sixes));
  // Simple heuristic — actual per-ball batter tracking isn't stored
  // We'll return 0 and rely on what IS stored
  return null;
}

/* ── Build batting stats for one innings ───────────────────────────── */
function _battingStats(batting, order, score){
  var notBatted=[];
  for(var i=0;i<batting.length;i++) if(order.indexOf(i)<0) notBatted.push(i);
  var idxs=order.concat(notBatted);
  return idxs.map(function(i){
    var b=batting[i];
    if(!b) return null;
    var sr=b.balls>0?((b.runs/b.balls)*100).toFixed(1):'-';
    var bdyRuns=b.fours*4+b.sixes*6;
    var bdyPct=b.runs>0?((bdyRuns/b.runs)*100).toFixed(0):0;
    var scorePct=b.balls>0?(((b.balls-(b.balls-Math.min(b.balls,b.runs>0?b.runs:0)))/b.balls)*100).toFixed(0):0;
    return {
      name: b.name,
      runs: b.runs,
      balls: b.balls,
      fours: b.fours,
      sixes: b.sixes,
      sr: sr,
      out: b.out,
      retiredHurt: b.retiredHurt,
      howOut: b.howOut||'',
      bdyRuns: bdyRuns,
      bdyPct: bdyPct,
      dnb: b.balls===0 && !b.out && !b.retiredHurt
    };
  }).filter(Boolean);
}

/* ── Build bowling stats for one innings ───────────────────────────── */
function _bowlingStats(bowling, order, overHistory, overBowlers){
  var result=[];
  var arr=order.length? (function(){
    var rest=bowling.map(function(_,i){return i;}).filter(function(i){return order.indexOf(i)<0;});
    return order.concat(rest).map(function(i){return bowling[i];}).filter(Boolean);
  })() : bowling.slice();
  arr.forEach(function(b){
    if(!b||b.balls===0) return;
    // Per-over breakdown for this bowler
    var overs=[];
    var maidens=0, dotBalls=0, bdyConceded=0;
    if(overHistory&&overBowlers){
      overHistory.forEach(function(ov,i){
        if(overBowlers[i]!==b.name) return;
        var ovRuns=0, ovWkts=0, ovDots=0, ovBdy=0, legalCount=0;
        ov.forEach(function(ball){
          if(_isLegalBall(ball)) legalCount++;
          if(ball==='0') ovDots++;
          if(_isBoundary(ball)) ovBdy++;
          ovRuns+=_ballRuns(ball);
          if(_isWicket(ball)) ovWkts++;
        });
        if(ovRuns===0 && legalCount>=6) maidens++;
        dotBalls+=ovDots;
        bdyConceded+=ovBdy;
        overs.push({num:i+1, runs:ovRuns, wickets:ovWkts, dots:ovDots, balls:ov});
      });
    }
    var econ=b.balls>0?(b.runs/(b.balls/6)).toFixed(2):'-';
    var avg=b.wickets>0?(b.runs/b.wickets).toFixed(1):'-';
    var bsr=b.wickets>0?(b.balls/b.wickets).toFixed(1):'-';
    result.push({
      name: b.name,
      balls: b.balls,
      overs: Math.floor(b.balls/6)+'.'+b.balls%6,
      runs: b.runs,
      wickets: b.wickets,
      maidens: maidens,
      econ: econ,
      avg: avg,
      bsr: bsr,
      dotBalls: dotBalls,
      bdyConceded: bdyConceded,
      overBreakdown: overs
    });
  });
  return result;
}

/* ── Compute all partnerships for an innings ───────────────────────── */
function _partnerships(batting, order, fow, score, overHistory){
  if(!batting||!batting.length) return [];
  var notBatted=[];
  for(var i=0;i<batting.length;i++) if(order.indexOf(i)<0) notBatted.push(i);
  var idxs=order.concat(notBatted);
  var partners=[];
  // Reconstruct who batted together between each wicket
  // FoW gives us the score at each wicket — we derive partnership runs from delta
  var prevScore=0, prevBalls=0;
  var activePair=[idxs[0]!==undefined?idxs[0]:-1, idxs[1]!==undefined?idxs[1]:-1];
  var inPair=2;
  fow.forEach(function(f, wi){
    var p1=batting[activePair[0]], p2=batting[activePair[1]];
    if(!p1||!p2) return;
    // Balls used by this partnership: fow ball count approx from over string
    var fowBalls=0;
    var parts=f.over.split('.');
    fowBalls=parseInt(parts[0])*6+(parseInt(parts[1])||0);
    var pRuns=f.score-prevScore;
    var pBalls=Math.max(0, fowBalls-prevBalls);
    var pFours=0, pSixes=0;
    partners.push({
      p1: p1.name, p2: p2.name,
      runs: pRuns, balls: pBalls,
      fours: pFours, sixes: pSixes,
      rr: pBalls>0?((pRuns/(pBalls/6)).toFixed(2)):'-',
      overs: pBalls>0?(Math.floor(pBalls/6)+'.'+pBalls%6):'-'
    });
    prevScore=f.score; prevBalls=fowBalls;
    // Out batter is f.name — remove from pair, bring in next
    if(p1.name===f.name) activePair[0]=idxs[inPair]!==undefined?idxs[inPair]:-1;
    else activePair[1]=idxs[inPair]!==undefined?idxs[inPair]:-1;
    inPair++;
  });
  // Last partnership (from last wicket to end of innings)
  var lp1=batting[activePair[0]], lp2=batting[activePair[1]];
  if(lp1&&lp2){
    var finalRuns=score.runs-prevScore;
    var finalBalls=Math.max(0, score.balls-prevBalls);
    if(finalRuns>0||finalBalls>0){
      partners.push({
        p1:lp1.name, p2:lp2.name,
        runs:finalRuns, balls:finalBalls,
        fours:0, sixes:0,
        rr: finalBalls>0?((finalRuns/(finalBalls/6)).toFixed(2)):'-',
        overs: finalBalls>0?(Math.floor(finalBalls/6)+'.'+finalBalls%6):'-'
      });
    }
  }
  return partners;
}

/* ── SVG Worm / Manhattan / Run Rate charts ─────────────────────────── */
function _svgManhattan(overStats1, overStats2, teamName1, teamName2, fow1, fow2){
  var runs1=overStats1.map(function(o){return o.runs;});
  var runs2=overStats2.map(function(o){return o.runs;});
  var allRuns=runs1.concat(runs2);
  var maxR=Math.max.apply(null,allRuns.concat([1]));
  var W=340, H=160, pad={t:10,r:12,b:32,l:32};
  var innerW=W-pad.l-pad.r, innerH=H-pad.t-pad.b;
  var n=Math.max(runs1.length,runs2.length)||1;
  var bw=Math.max(1,(innerW/n)*0.35);
  var gap=Math.max(1,(innerW/n)*0.08);

  /* grid lines */
  var grid='';
  var yStep=maxR<=10?2:maxR<=20?5:maxR<=50?10:20;
  for(var v=0;v<=maxR;v+=yStep){
    var yy=(pad.t+innerH-(v/maxR)*innerH).toFixed(1);
    grid+='<line x1="'+pad.l+'" y1="'+yy+'" x2="'+(W-pad.r)+'" y2="'+yy+'" stroke="#e8e8e8" stroke-width="0.8"/>'+
      '<text x="'+(pad.l-4)+'" y="'+(parseFloat(yy)+3)+'" text-anchor="end" font-size="8" fill="#999">'+v+'</text>';
  }
  /* bars */
  var bars='';
  function drawBar(runs, idxArr, color, fow, offset){
    idxArr.forEach(function(r,i){
      var slotW=innerW/n;
      var x=pad.l+i*slotW+offset;
      var bh=Math.max(1,(r/maxR)*innerH);
      var y=pad.t+innerH-bh;
      var hasWkt=fow&&fow.some(function(f){
        var ov=parseInt(f.over)||0; return ov===i+1||ov===i;
      });
      bars+='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+bh.toFixed(1)+
        '" fill="'+(hasWkt?'#e53935':color)+'" rx="1.5">'+
        '<title>Over '+(i+1)+': '+r+'r'+(hasWkt?' W':'')+' ('+teamName1+')</title></rect>';
    });
  }
  drawBar(runs1, runs1, '#0e8f6f', fow1, (innerW/n-bw*2-gap)/2);
  if(runs2.length) drawBar(runs2, runs2, '#2563eb', fow2, (innerW/n-bw*2-gap)/2+bw+gap);
  /* x labels every 5 */
  var xLabels='';
  for(var xi=0;xi<n;xi++){
    if((xi+1)%5===0||xi===0){
      var slotX=pad.l+(xi+0.5)*(innerW/n);
      xLabels+='<text x="'+slotX.toFixed(1)+'" y="'+(H-pad.b+12)+'" text-anchor="middle" font-size="8" fill="#888">'+(xi+1)+'</text>';
    }
  }
  /* legend */
  var legend='<rect x="'+pad.l+'" y="1" width="10" height="7" fill="#0e8f6f" rx="1"/>'+
    '<text x="'+(pad.l+13)+'" y="8" font-size="8" fill="#555">'+teamName1+(runs2.length?' (Inn1)':'')+'</text>';
  if(runs2.length) legend+='<rect x="'+(pad.l+80)+'" y="1" width="10" height="7" fill="#2563eb" rx="1"/>'+
    '<text x="'+(pad.l+93)+'" y="8" font-size="8" fill="#555">'+teamName2+' (Inn2)</text>';
  legend+='<rect x="'+(W-pad.r-60)+'" y="1" width="7" height="7" fill="#e53935" rx="1"/>'+
    '<text x="'+(W-pad.r-51)+'" y="8" font-size="8" fill="#e53935">Wicket over</text>';

  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;display:block">'+
    grid+bars+xLabels+legend+
    '<line x1="'+pad.l+'" y1="'+(H-pad.b)+'" x2="'+(W-pad.r)+'" y2="'+(H-pad.b)+'" stroke="#ccc" stroke-width="1"/>'+
    '<line x1="'+pad.l+'" y1="'+pad.t+'" x2="'+pad.l+'" y2="'+(H-pad.b)+'" stroke="#ccc" stroke-width="1"/>'+
  '</svg>';
}

function _svgWorm(overStats1, overStats2, teamName1, teamName2, fow1, fow2, target, totalOvers){
  var cum1=[], cum2=[], t1=0, t2=0;
  overStats1.forEach(function(o){t1+=o.runs; cum1.push(t1);});
  overStats2.forEach(function(o){t2+=o.runs; cum2.push(t2);});
  if(!cum1.length&&!cum2.length) return '';
  var maxR=Math.max.apply(null,cum1.concat(cum2).concat([target||0,1]));
  maxR=Math.ceil((maxR+15)/25)*25;
  var W=340, H=200, pad={t:38,r:16,b:36,l:38};
  var innerW=W-pad.l-pad.r, innerH=H-pad.t-pad.b;
  var n=totalOvers||Math.max(cum1.length,cum2.length)||1;
  function px(i){return (pad.l+(i/n)*innerW).toFixed(2);}
  function py(r){return (pad.t+innerH-(r/maxR)*innerH).toFixed(2);}

  /* grid */
  var grid='';
  var yStep=maxR<=100?25:maxR<=200?50:100;
  for(var v=0;v<=maxR;v+=yStep){
    var yy=py(v);
    grid+='<line x1="'+pad.l+'" y1="'+yy+'" x2="'+(W-pad.r)+'" y2="'+yy+'" stroke="#e0e0e0" stroke-width="0.8" stroke-dasharray="3,3"/>'+
      '<text x="'+(pad.l-5)+'" y="'+(parseFloat(yy)+3.5)+'" text-anchor="end" font-size="9" fill="#888">'+v+'</text>';
  }
  /* x labels */
  var xStep=n<=10?2:n<=20?5:10;
  var xLabels='';
  for(var xi=0;xi<=n;xi+=xStep){
    xLabels+='<text x="'+px(xi)+'" y="'+(H-pad.b+13)+'" text-anchor="middle" font-size="9" fill="#888">'+xi+'</text>';
  }
  /* axes */
  var axes='<line x1="'+pad.l+'" y1="'+pad.t+'" x2="'+pad.l+'" y2="'+(H-pad.b)+'" stroke="#bbb" stroke-width="1"/>'+
    '<line x1="'+pad.l+'" y1="'+(H-pad.b)+'" x2="'+(W-pad.r)+'" y2="'+(H-pad.b)+'" stroke="#bbb" stroke-width="1"/>';
  var axisTitles=
    '<text x="'+(pad.l-28)+'" y="'+(pad.t+innerH/2)+'" text-anchor="middle" font-size="9" font-weight="700" fill="#666" '+
    'transform="rotate(-90,'+(pad.l-28)+','+(pad.t+innerH/2)+')">RUNS</text>'+
    '<text x="'+(pad.l+innerW/2)+'" y="'+(H-1)+'" text-anchor="middle" font-size="9" font-weight="700" fill="#666">OVERS</text>';

  /* paths */
  function makePath(cum, color){
    if(!cum.length) return '';
    var d='M'+px(0)+','+py(0);
    cum.forEach(function(r,i){d+=' L'+px(i+1)+','+py(r);});
    return '<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  /* target (par) line */
  var targetLine='';
  if(target&&target>0&&cum2.length){
    var tRunPerOver=target/n;
    var tPath='M'+px(0)+','+py(0);
    for(var ti=1;ti<=n;ti++) tPath+=' L'+px(ti)+','+py(ti*tRunPerOver);
    targetLine='<path d="'+tPath+'" fill="none" stroke="#e53935" stroke-width="1.5" stroke-dasharray="5,4"/>'+
      '<text x="'+(W-pad.r)+'" y="'+(parseFloat(py(target))-4)+'" text-anchor="end" font-size="8" fill="#e53935">Target '+target+'</text>';
  }
  /* wicket circles */
  function fowDots(fow, cum, color){
    return (fow||[]).map(function(f){
      var ov=Math.min(Math.ceil(parseFloat(f.over)||1),cum.length);
      var r=cum[ov-1]||0;
      return '<circle cx="'+px(ov)+'" cy="'+py(r)+'" r="4" fill="#fff" stroke="'+color+'" stroke-width="2">'+
        '<title>'+f.name+' '+f.score+'/'+f.wkts+' (ov '+f.over+')</title></circle>';
    }).join('');
  }
  /* legend */
  var c1='#0e8f6f', c2='#2563eb';
  var legend='<line x1="'+pad.l+'" y1="'+(pad.t-18)+'" x2="'+(pad.l+18)+'" y2="'+(pad.t-18)+'" stroke="'+c1+'" stroke-width="2.5"/>'+
    '<text x="'+(pad.l+21)+'" y="'+(pad.t-14)+'" font-size="9" font-weight="700" fill="'+c1+'">'+teamName1+(cum2.length?' (Inn1)':'')+'</text>';
  if(cum2.length){
    legend+='<line x1="'+(pad.l+95)+'" y1="'+(pad.t-18)+'" x2="'+(pad.l+113)+'" y2="'+(pad.t-18)+'" stroke="'+c2+'" stroke-width="2.5"/>'+
      '<text x="'+(pad.l+116)+'" y="'+(pad.t-14)+'" font-size="9" font-weight="700" fill="'+c2+'">'+teamName2+' (Inn2)</text>';
    legend+='<text x="'+(W-pad.r)+'" y="'+(pad.t-14)+'" text-anchor="end" font-size="8" fill="#888">○ wicket</text>';
  }

  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;display:block">'+
    grid+axes+axisTitles+xLabels+legend+targetLine+
    makePath(cum1,c1)+(cum2.length?makePath(cum2,c2):'')+
    fowDots(fow1,cum1,c1)+(cum2.length?fowDots(fow2,cum2,c2):'')+
  '</svg>';
}

function _svgRunRate(overStats1, overStats2, totalOvers){
  var rr1=[], rr2=[];
  var t1=0, b1=0, t2=0, b2=0;
  overStats1.forEach(function(o){
    t1+=o.runs; b1+=o.legal||6;
    rr1.push(b1>0?parseFloat((t1/(b1/6)).toFixed(2)):0);
  });
  overStats2.forEach(function(o){
    t2+=o.runs; b2+=o.legal||6;
    rr2.push(b2>0?parseFloat((t2/(b2/6)).toFixed(2)):0);
  });
  if(!rr1.length&&!rr2.length) return '';
  var allVals=rr1.concat(rr2);
  var maxV=Math.max.apply(null,allVals.concat([1]));
  maxV=Math.ceil((maxV+2)/5)*5;
  var W=340, H=160, pad={t:16,r:12,b:30,l:32};
  var innerW=W-pad.l-pad.r, innerH=H-pad.t-pad.b;
  var n=totalOvers||Math.max(rr1.length,rr2.length)||1;
  function px(i){return (pad.l+(i/n)*innerW).toFixed(2);}
  function py(v){return (pad.t+innerH-(v/maxV)*innerH).toFixed(2);}
  /* grid */
  var grid='';
  for(var gv=0;gv<=maxV;gv+=5){
    var gy=py(gv);
    grid+='<line x1="'+pad.l+'" y1="'+gy+'" x2="'+(W-pad.r)+'" y2="'+gy+'" stroke="#eee" stroke-width="0.8"/>'+
      '<text x="'+(pad.l-4)+'" y="'+(parseFloat(gy)+3)+'" text-anchor="end" font-size="8" fill="#999">'+gv+'</text>';
  }
  /* RR=6 baseline */
  var baseLine='<line x1="'+pad.l+'" y1="'+py(6)+'" x2="'+(W-pad.r)+'" y2="'+py(6)+'" stroke="#0e8f6f" stroke-width="1" stroke-dasharray="4,4"/>'+
    '<text x="'+(W-pad.r+1)+'" y="'+(parseFloat(py(6))+3)+'" font-size="7" fill="#0e8f6f">RR6</text>';
  /* paths */
  function mkPath(arr, color){
    if(!arr.length) return '';
    var d='M'+px(0)+','+py(arr[0]||0);
    arr.forEach(function(v,i){d+=' L'+px(i+1)+','+py(v);});
    return '<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  /* x labels */
  var xLabels='';
  var xStep=n<=10?2:n<=20?5:10;
  for(var xi=0;xi<=n;xi+=xStep)
    xLabels+='<text x="'+px(xi)+'" y="'+(H-pad.b+12)+'" text-anchor="middle" font-size="8" fill="#888">'+xi+'</text>';

  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;display:block">'+
    grid+baseLine+
    mkPath(rr1,'#0e8f6f')+(rr2.length?mkPath(rr2,'#2563eb'):'')+
    xLabels+
    '<line x1="'+pad.l+'" y1="'+(H-pad.b)+'" x2="'+(W-pad.r)+'" y2="'+(H-pad.b)+'" stroke="#ccc" stroke-width="1"/>'+
    '<line x1="'+pad.l+'" y1="'+pad.t+'" x2="'+pad.l+'" y2="'+(H-pad.b)+'" stroke="#ccc" stroke-width="1"/>'+
  '</svg>';
}

/* ── Highlight boxes ────────────────────────────────────────────────── */
function _statBox(label, value, sub, color){
  return '<div style="flex:1;min-width:0;background:var(--c-surface);border-radius:var(--radius-md);padding:12px 10px;text-align:center;border:1px solid var(--c-border)">'+
    '<div style="font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--c-text-faint);margin-bottom:4px">'+label+'</div>'+
    '<div style="font-size:20px;font-weight:800;color:'+(color||'var(--c-text)')+';line-height:1">'+value+'</div>'+
    (sub?'<div style="font-size:10px;color:var(--c-text-soft);margin-top:3px">'+sub+'</div>':'')+
  '</div>';
}

/* ── Section header ─────────────────────────────────────────────────── */
function _sectionHead(title){
  return '<div style="font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:var(--c-text-faint);padding:14px 0 6px;border-top:1px solid var(--c-border);margin-top:10px">'+title+'</div>';
}

/* ── Batting table ──────────────────────────────────────────────────── */
function _renderBatTable(stats, isLive, strikerIdx, nonStrikerIdx, batting){
  if(!stats.length) return '<p style="font-size:13px;color:var(--c-text-faint)">No batting data.</p>';
  var rows=stats.map(function(b, i){
    var isStriker=isLive&&batting&&batting[i]&&batting[i].name===b.name&&i===strikerIdx;
    var isNS=isLive&&batting&&batting[i]&&batting[i].name===b.name&&i===nonStrikerIdx;
    var statusCss=b.out?'color:var(--c-wicket)':b.dnb?'color:var(--c-text-faint);font-style:italic':'color:var(--c-primary)';
    var status=b.out?b.howOut:b.dnb?'dnb':(b.retiredHurt?'ret. hurt':'not out');
    return '<tr'+(isStriker?' style="background:#e3f6f0"':isNS?' style="background:#f0faf7"':'')+'>'+
      '<td>'+b.name+(isStriker?' <span style="color:var(--c-primary)">★</span>':'')+
        '<br><span style="font-size:10px;'+statusCss+'">'+status+'</span></td>'+
      '<td style="font-weight:'+(b.runs>=50?'800':'600')+';color:'+(b.runs>=100?'#7c3aed':b.runs>=50?'var(--c-primary)':'var(--c-text)')+'">'+b.runs+'</td>'+
      '<td>'+b.balls+'</td>'+
      '<td style="color:var(--c-primary)">'+b.fours+'</td>'+
      '<td style="color:var(--c-live)">'+b.sixes+'</td>'+
      '<td style="font-weight:600;color:'+(parseFloat(b.sr)>=150?'#7c3aed':parseFloat(b.sr)>=100?'var(--c-primary)':'var(--c-text-soft)')+'">'+b.sr+'</td>'+
      '<td style="font-size:11px;color:var(--c-text-soft)">'+b.bdyRuns+'<span style="color:var(--c-text-faint);font-size:9px"> ('+b.bdyPct+'%)</span></td>'+
    '</tr>';
  }).join('');
  return '<div style="overflow-x:auto"><table class="scorecard-table" style="min-width:420px">'+
    '<tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th><th>Bdy R</th></tr>'+
    rows+
  '</table></div>';
}

/* ── Bowling table ──────────────────────────────────────────────────── */
function _renderBowlTable(stats){
  if(!stats.length) return '<p style="font-size:13px;color:var(--c-text-faint)">No bowling data.</p>';
  var rows=stats.map(function(b){
    return '<tr>'+
      '<td>'+b.name+'</td>'+
      '<td>'+b.overs+'</td>'+
      '<td style="color:var(--c-text-soft)">'+b.maidens+'</td>'+
      '<td>'+b.runs+'</td>'+
      '<td style="font-weight:700;color:'+(b.wickets>=5?'#7c3aed':b.wickets>=3?'var(--c-wicket)':'var(--c-text)')+'">'+b.wickets+'</td>'+
      '<td style="font-weight:600;color:'+(parseFloat(b.econ)<5?'var(--c-primary)':parseFloat(b.econ)>9?'var(--c-wicket)':'var(--c-text-soft)')+'">'+b.econ+'</td>'+
      '<td>'+b.avg+'</td>'+
      '<td>'+b.dotBalls+'</td>'+
      '<td style="font-size:11px;color:var(--c-text-soft)">'+b.bdyConceded+'</td>'+
    '</tr>';
  }).join('');
  return '<div style="overflow-x:auto"><table class="scorecard-table" style="min-width:480px">'+
    '<tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th><th>Avg</th><th>Dots</th><th>Bdy</th></tr>'+
    rows+
  '</table></div>';
}

/* ── Partnership table ──────────────────────────────────────────────── */
function _renderPartnershipTable(parts, score){
  if(!parts.length) return '<p style="font-size:13px;color:var(--c-text-faint)">Insufficient data.</p>';
  var maxRuns=Math.max.apply(null,parts.map(function(p){return p.runs;}));
  var rows=parts.map(function(p, i){
    var pct=maxRuns>0?Math.round((p.runs/score)*100):0;
    var barW=maxRuns>0?Math.round((p.runs/maxRuns)*100):0;
    var isTop=p.runs===maxRuns;
    return '<div style="padding:10px 0;border-bottom:1px solid var(--c-border)">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'+
        '<span style="font-size:13px;font-weight:600">'+(i+1)+'. '+p.p1+' &amp; '+p.p2+
          (isTop?' <span style="font-size:10px;background:#7c3aed;color:#fff;border-radius:6px;padding:1px 6px;margin-left:4px">Best</span>':'')+
        '</span>'+
        '<span style="font-size:15px;font-weight:800;color:'+(isTop?'var(--c-primary)':'var(--c-text)')+'">'+p.runs+'</span>'+
      '</div>'+
      '<div style="background:var(--c-border);border-radius:4px;height:6px;margin-bottom:4px">'+
        '<div style="background:'+(isTop?'var(--c-primary)':'var(--c-runs)')+';width:'+barW+'%;height:100%;border-radius:4px"></div>'+
      '</div>'+
      '<div style="display:flex;gap:12px;font-size:11px;color:var(--c-text-soft)">'+
        '<span>'+p.balls+'b</span>'+
        '<span>RR '+p.rr+'</span>'+
        '<span>'+pct+'% of total</span>'+
        '<span>'+p.overs+' ov</span>'+
      '</div>'+
    '</div>';
  }).join('');
  return '<div>'+rows+'</div>';
}

/* ── Over cards ─────────────────────────────────────────────────────── */
function _renderOverCards(overStats, overBowlers){
  if(!overStats.length) return '<p style="font-size:13px;color:var(--c-text-faint)">No overs completed.</p>';
  return overStats.map(function(o){
    var ballsHtml=o.balls.map(function(b){
      return '<div class="ball ball-'+ballClass(b)+'" style="width:26px;height:26px;font-size:10px">'+b+'</div>';
    }).join('');
    var bowler=overBowlers[o.over-1]||'';
    return '<div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-md);padding:10px 12px;margin-bottom:8px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'+
        '<span style="font-size:12px;font-weight:800;color:var(--c-text)">Over '+o.over+
          (bowler?' <span style="font-size:10px;font-weight:500;color:var(--c-text-soft)">· '+bowler+'</span>':'')+
        '</span>'+
        '<span style="font-size:13px;font-weight:800;color:'+(o.runs>=12?'#7c3aed':o.runs>=8?'var(--c-runs)':'var(--c-text)')+'">'+o.runs+'r'+
          (o.wickets?' <span style="color:var(--c-wicket)">'+o.wickets+'w</span>':'')+
        '</span>'+
      '</div>'+
      '<div class="over-balls" style="justify-content:flex-start;gap:4px">'+ballsHtml+'</div>'+
      '<div style="display:flex;gap:10px;margin-top:6px;font-size:11px;color:var(--c-text-faint)">'+
        '<span>Dots: <strong style="color:var(--c-text)">'+o.dots+'</strong></span>'+
        '<span>Extras: <strong style="color:var(--c-text)">'+o.extras+'</strong></span>'+
        (o.fours?'<span>4s: <strong style="color:var(--c-primary)">'+o.fours+'</strong></span>':'')+
        (o.sixes?'<span>6s: <strong style="color:var(--c-live)">'+o.sixes+'</strong></span>':'')+
      '</div>'+
    '</div>';
  }).join('');
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN RENDER FUNCTION
   ══════════════════════════════════════════════════════════════════════ */
function renderStats(targetEl){
  /* targetEl: explicit mount point (scoring stats-panel), or result-tab-content, or main-content */
  var mc=targetEl||document.getElementById('result-tab-content')||document.getElementById('main-content');
  var isResult=S.phase==='result';
  var isInn2=S.innings===2||isResult;

  /* Gather data for both innings */
  var bt=S.match.batFirst, bw=bt===S.match.team1?S.match.team2:S.match.team1;
  var s1=S.inn1score||S.t1;
  var s2=isInn2?S.t2:{runs:0,wickets:0,balls:0,wide:0,nb:0,byes:0,legbyes:0};

  var bat1=isInn2||S.inn1batting.length?S.inn1batting:S.batting;
  var bow1=isInn2||S.inn1bowling.length?S.inn1bowling:S.bowling;
  var fow1=isInn2||S.inn1fow.length?S.inn1fow:S.fow;
  var oh1=isInn2&&S.inn1overHistory.length?S.inn1overHistory:S.overHistory;
  var ob1=isInn2&&S.inn1overBowlers.length?S.inn1overBowlers:S.overBowlers;
  var bo1=isInn2&&S.inn1battingOrder.length?S.inn1battingOrder:S.battingOrder;
  var bwo1=isInn2&&S.inn1bowlingOrder.length?S.inn1bowlingOrder:S.bowlingOrder;

  var bat2=isInn2?S.batting:[];
  var bow2=isInn2?S.bowling:[];
  var fow2=isInn2?S.fow:[];
  var oh2=isInn2?S.overHistory:[];
  var ob2=isInn2?S.overBowlers:[];
  var bo2=S.battingOrder;
  var bwo2=S.bowlingOrder;

  /* Computed stats */
  var batStats1=_battingStats(bat1, bo1, s1);
  var batStats2=_battingStats(bat2, bo2, s2);
  var bowlStats1=_bowlingStats(bow1, bwo1, oh1, ob1);
  var bowlStats2=_bowlingStats(bow2, bwo2, oh2, ob2);
  var overStats1=_computeOverStats(oh1);
  var overStats2=_computeOverStats(oh2);
  var parts1=_partnerships(bat1, bo1, fow1, s1, oh1);
  var parts2=_partnerships(bat2, bo2, fow2, s2, oh2);

  /* Match summary figures */
  var inn1Boundaries=batStats1.reduce(function(a,b){return a+b.fours+b.sixes;},0);
  var inn1Dots=bowlStats1.reduce(function(a,b){return a+b.dotBalls;},0);
  var bestBat1=batStats1.slice().sort(function(a,b){return b.runs-a.runs;})[0];
  var bestBow1=bowlStats1.slice().sort(function(a,b){return b.wickets-a.wickets||parseFloat(a.econ)-parseFloat(b.econ);})[0];
  var bestPart1=parts1.length?parts1.slice().sort(function(a,b){return b.runs-a.runs;})[0]:null;
  var rr1=s1.balls>0?(s1.runs/(s1.balls/6)).toFixed(2):'0.00';

  var inn2Boundaries=batStats2.reduce(function(a,b){return a+b.fours+b.sixes;},0);
  var inn2Dots=bowlStats2.reduce(function(a,b){return a+b.dotBalls;},0);
  var bestBat2=batStats2.slice().sort(function(a,b){return b.runs-a.runs;})[0];
  var bestBow2=bowlStats2.slice().sort(function(a,b){return b.wickets-a.wickets||parseFloat(a.econ)-parseFloat(b.econ);})[0];
  var bestPart2=parts2.length?parts2.slice().sort(function(a,b){return b.runs-a.runs;})[0]:null;
  var rr2=s2.balls>0?(s2.runs/(s2.balls/6)).toFixed(2):'0.00';

  /* Sub-tabs */
  var tabs=['summary','charts','batting','bowling','partnerships','overs'];
  var tabLabels={'summary':'Summary','charts':'📊 Charts','batting':'Batting','bowling':'Bowling','partnerships':'Partnerships','overs':'Overs'};
  if(!S._statsTab) S._statsTab='summary';

  var tabsHtml='<div style="display:flex;overflow-x:auto;gap:0;background:var(--c-surface);border-radius:var(--radius-md);padding:4px;margin-bottom:12px;border:1px solid var(--c-border);scrollbar-width:none">'+
    tabs.map(function(t){
      var active=S._statsTab===t;
      return '<button data-action="stats-tab" data-val="'+t+'" style="flex-shrink:0;padding:7px 12px;border:none;border-radius:var(--radius-sm);font-size:12px;font-weight:'+(active?'700':'500')+';background:'+(active?'var(--c-primary)':'none')+';color:'+(active?'#fff':'var(--c-text-soft)')+';cursor:pointer;white-space:nowrap">'+tabLabels[t]+'</button>';
    }).join('')+
  '</div>';

  /* ── Summary tab ── */
  function renderSummary(){
    var resultLine='';
    if(isResult){
      var r=s1.runs>s2.runs?bt+' won by '+(s1.runs-s2.runs)+' run'+(s1.runs-s2.runs!==1?'s':'')
        :s2.runs>s1.runs?bw+' won by '+(10-s2.wickets)+' wicket'+(10-s2.wickets!==1?'s':'')
        :'Match tied!';
      resultLine='<div style="background:var(--c-primary);color:#fff;border-radius:var(--radius-md);padding:12px 16px;text-align:center;font-size:15px;font-weight:800;margin-bottom:14px">🏆 '+r+'</div>';
    }
    function inningsSummary(label, sc, batS, bowlS, bestPart, inn, fow){
      if(!sc.balls&&!sc.runs) return '';
      var ex=(sc.wide||0)+(sc.nb||0)+(sc.byes||0)+(sc.legbyes||0);
      var bdys=batS.reduce(function(a,b){return a+b.fours+b.sixes;},0);
      var dots=bowlS.reduce(function(a,b){return a+b.dotBalls;},0);
      var topBat=batS.slice().sort(function(a,b){return b.runs-a.runs;})[0];
      var topBowl=bowlS.slice().sort(function(a,b){return b.wickets-a.wickets||parseFloat(a.econ)-parseFloat(b.econ);})[0];
      var rrv=sc.balls>0?(sc.runs/(sc.balls/6)).toFixed(2):'—';
      return '<div style="background:var(--c-surface-alt);border:1px solid var(--c-border);border-radius:var(--radius-md);padding:14px;margin-bottom:12px">'+
        '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.7px;color:var(--c-text-faint);margin-bottom:8px">'+label+'</div>'+
        '<div style="font-size:28px;font-weight:900;color:var(--c-text);line-height:1;margin-bottom:2px">'+sc.runs+'/'+sc.wickets+'</div>'+
        '<div style="font-size:12px;color:var(--c-text-soft);margin-bottom:12px">'+Math.floor(sc.balls/6)+'.'+sc.balls%6+' overs &nbsp;·&nbsp; RR '+rrv+'</div>'+
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">'+
          _statBox('Boundaries',bdys,'4s + 6s','var(--c-primary)')+
          _statBox('Dot balls',dots,'legal only','var(--c-text-soft)')+
          _statBox('Extras',ex,'Wd/NB/B/LB','var(--c-extras)')+
        '</div>'+
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">'+
          (topBat?_statBox('Best bat',topBat.runs,topBat.name+' ('+topBat.balls+'b)','var(--c-runs)'):'') +
          (topBowl?_statBox('Best bowl',topBowl.wickets+'/'+ topBowl.runs,topBowl.name+' '+topBowl.overs+'ov','var(--c-wicket)'):'') +
          (bestPart?_statBox('Best part.',bestPart.runs+'r',bestPart.p1+' & '+bestPart.p2,'#7c3aed'):'') +
        '</div>'+
        '<div style="font-size:11px;color:var(--c-text-faint)">'+
          'Wd: <b>'+sc.wide+'</b> &nbsp; NB: <b>'+sc.nb+'</b> &nbsp; B: <b>'+(sc.byes||0)+'</b> &nbsp; LB: <b>'+(sc.legbyes||0)+'</b>'+
          (fow&&fow.length?' &nbsp;·&nbsp; FoW: '+fow.map(function(f){return f.score+'/'+f.wkts;}).join(' '):'')  +
        '</div>'+
      '</div>';
    }
    return resultLine+
      inningsSummary(bt+' — 1st Innings', s1, batStats1, bowlStats1, bestPart1, 1, fow1)+
      (isInn2?inningsSummary(bw+' — 2nd Innings', s2, batStats2, bowlStats2, bestPart2, 2, fow2):'');
  }

  /* ── Charts tab ── */
  function renderCharts(){
    var hasData=overStats1.length>0||overStats2.length>0;
    if(!hasData) return '<p style="color:var(--c-text-faint);font-size:13px;padding:20px 0">Complete at least one over to see charts.</p>';
    return '<div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-md);padding:14px;margin-bottom:12px">'+
        '<div style="font-size:13px;font-weight:800;color:var(--c-text);margin-bottom:10px">📊 Manhattan — Runs per Over</div>'+
        _svgManhattan(overStats1, overStats2, bt, bw, fow1, fow2)+
      '</div>'+
      '<div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-md);padding:14px;margin-bottom:12px">'+
        '<div style="font-size:13px;font-weight:800;color:var(--c-text);margin-bottom:10px">🐛 Worm — Cumulative Runs</div>'+
        _svgWorm(overStats1, overStats2, bt, bw, fow1, fow2, isInn2?s1.runs+1:null, S.match.overs)+
      '</div>'+
      '<div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-md);padding:14px;margin-bottom:12px">'+
        '<div style="font-size:13px;font-weight:800;color:var(--c-text);margin-bottom:10px">📈 Run Rate Progression</div>'+
        _svgRunRate(overStats1, overStats2, S.match.overs)+
        '<div style="font-size:10px;color:var(--c-text-faint);margin-top:6px">Green = '+bt+(overStats2.length?' &nbsp;·&nbsp; Blue = '+bw:'')+' &nbsp;·&nbsp; Dashed = RR 6.0</div>'+
      '</div>';
  }

  /* ── Batting tab ── */
  function renderBatting(){
    return (batStats1.length?
      _sectionHead(bt+' Batting — 1st Innings')+
      _renderBatTable(batStats1, S.innings===1, S.strikerIdx, S.nonStrikerIdx, bat1)+
      '<div style="font-size:11px;color:var(--c-text-faint);margin-top:4px">'+
        'Total: <b>'+s1.runs+'</b> · Extras: <b>'+((s1.wide||0)+(s1.nb||0)+(s1.byes||0)+(s1.legbyes||0))+'</b>'+
      '</div>':'') +
    (isInn2&&batStats2.length?
      _sectionHead(bw+' Batting — 2nd Innings')+
      _renderBatTable(batStats2, S.innings===2, S.strikerIdx, S.nonStrikerIdx, bat2)+
      '<div style="font-size:11px;color:var(--c-text-faint);margin-top:4px">'+
        'Total: <b>'+s2.runs+'</b> · Extras: <b>'+((s2.wide||0)+(s2.nb||0)+(s2.byes||0)+(s2.legbyes||0))+'</b>'+
      '</div>':'');
  }

  /* ── Bowling tab ── */
  function renderBowling(){
    return (bowlStats1.length?
      _sectionHead(bw+' Bowling — 1st Innings')+
      _renderBowlTable(bowlStats1):'') +
    (isInn2&&bowlStats2.length?
      _sectionHead(bt+' Bowling — 2nd Innings')+
      _renderBowlTable(bowlStats2):'');
  }

  /* ── Partnerships tab ── */
  function renderPartnerships(){
    return (parts1.length?
      _sectionHead(bt+' Partnerships — 1st Innings')+
      _renderPartnershipTable(parts1, s1.runs):'') +
    (isInn2&&parts2.length?
      _sectionHead(bw+' Partnerships — 2nd Innings')+
      _renderPartnershipTable(parts2, s2.runs):'') +
    (!parts1.length&&!parts2.length?
      '<p style="font-size:13px;color:var(--c-text-faint);padding:12px 0">No wickets have fallen yet — partnerships will show once batters are dismissed.</p>':'');
  }

  /* ── Overs tab ── */
  function renderOvers(){
    return (overStats1.length?
      _sectionHead(bt+' Over Log — 1st Innings')+
      _renderOverCards(overStats1, ob1):'') +
    (isInn2&&overStats2.length?
      _sectionHead(bw+' Over Log — 2nd Innings')+
      _renderOverCards(overStats2, ob2):'') +
    (!overStats1.length?'<p style="font-size:13px;color:var(--c-text-faint);padding:12px 0">No overs completed yet.</p>':'');
  }

  /* Render active tab content */
  var content;
  switch(S._statsTab){
    case 'charts':       content=renderCharts();       break;
    case 'batting':      content=renderBatting();      break;
    case 'bowling':      content=renderBowling();      break;
    case 'partnerships': content=renderPartnerships(); break;
    case 'overs':        content=renderOvers();        break;
    default:             content=renderSummary();      break;
  }

  mc.innerHTML=
    '<div style="padding-bottom:24px">'+
      tabsHtml+
      '<div>'+content+'</div>'+
    '</div>';
}
