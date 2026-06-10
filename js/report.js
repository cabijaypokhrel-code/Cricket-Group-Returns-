
/* ── ANALYSIS CHARTS (SVG, no external libs) ──────────────────────────── */
function buildAnalysisHTML(matchObj, s1, s2, oh1, oh2, fow1, fow2){
  var bat1=matchObj.batFirst, bat2=bat1===matchObj.team1?matchObj.team2:matchObj.team1;
  var totalOvers=matchObj.overs||20;

  /* Compute cumulative runs per over for each innings */
  function overRuns(oh){
    return (oh||[]).map(function(balls){
      return balls.reduce(function(s,b){
        if(b==='Wd'||b==='NB') return s+1;
        var n=parseInt(b); return s+(isNaN(n)?0:n);
      },0);
    });
  }
  function cumulative(runs){
    var c=[],t=0;
    runs.forEach(function(r){ t+=r; c.push(t); });
    return c;
  }

  var runs1=overRuns(oh1), runs2=overRuns(oh2);
  var cum1=cumulative(runs1), cum2=cumulative(runs2);
  var target=s1.runs+1;

  /* SVG bar chart: runs per over with FOW markers */
  function barChart(runs, fow, teamName, color, targetLine){
    if(!runs||!runs.length) return '<p style="color:#aaa;font-size:12px;text-align:center">No over data</p>';
    var W=320, H=140, pad={t:10,r:10,b:30,l:30};
    var innerW=W-pad.l-pad.r, innerH=H-pad.t-pad.b;
    var maxR=Math.max.apply(null,runs.concat([1]));
    if(targetLine) maxR=Math.max(maxR,Math.ceil(target/runs.length)+4);
    var n=runs.length;
    var bw=Math.max(2,(innerW/n)-2);
    /* FOW by over */
    var fowOvers={};
    (fow||[]).forEach(function(f){
      var ov=parseInt(f.over)||0;
      fowOvers[ov]=(fowOvers[ov]||0)+1;
    });
    var bars=runs.map(function(r,i){
      var x=pad.l+i*(innerW/n)+(innerW/n-bw)/2;
      var bh=Math.max(1,(r/maxR)*innerH);
      var y=pad.t+innerH-bh;
      var hasFow=fowOvers[i+1]||fowOvers[i];
      var fill=hasFow?'#e53935':color;
      var tooltip=i+1+' ov: '+r+' runs'+(hasFow?' | W':'');
      return '<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+bh.toFixed(1)+'" fill="'+fill+'" rx="2"><title>'+tooltip+'</title></rect>'+
        (hasFow?'<circle cx="'+(x+bw/2).toFixed(1)+'" cy="'+(y-5).toFixed(1)+'" r="3" fill="#e53935"/>':'');
    }).join('');
    /* y-axis labels */
    var yLabels='';
    for(var v=0;v<=maxR;v+=Math.ceil(maxR/4)){
      var yy=(pad.t+innerH-(v/maxR)*innerH).toFixed(1);
      yLabels+='<text x="'+(pad.l-4)+'" y="'+yy+'" text-anchor="end" font-size="8" fill="#888">'+v+'</text>'+
        '<line x1="'+pad.l+'" y1="'+yy+'" x2="'+(W-pad.r)+'" y2="'+yy+'" stroke="#eee" stroke-width="0.5"/>';
    }
    /* x-axis labels every 5 overs */
    var xLabels=runs.map(function(_,i){
      if((i+1)%5!==0&&i!==0) return '';
      var x=pad.l+(i+0.5)*(innerW/n);
      return '<text x="'+x.toFixed(1)+'" y="'+(H-pad.b+12)+'" text-anchor="middle" font-size="8" fill="#888">'+(i+1)+'</text>';
    }).join('');
    /* optional target line */
    var tLine='';
    if(targetLine&&target>0){
      var tPerOver=target/totalOvers;
      var ty=(pad.t+innerH-(tPerOver/maxR)*innerH).toFixed(1);
      tLine='<line x1="'+pad.l+'" y1="'+ty+'" x2="'+(W-pad.r)+'" y2="'+ty+'" stroke="#e53935" stroke-width="1.2" stroke-dasharray="4,3"/>'+
        '<text x="'+(W-pad.r+1)+'" y="'+(parseFloat(ty)+3)+'" font-size="8" fill="#e53935">Req</text>';
    }
    return '<div style="margin-bottom:4px"><div style="font-size:12px;font-weight:700;color:#333;margin-bottom:2px">'+teamName+' — Runs per over</div>'+
      '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;max-width:400px;display:block">'+
        yLabels+tLine+bars+xLabels+
        '<rect x="'+pad.l+'" y="'+pad.t+'" width="'+innerW+'" height="'+innerH+'" fill="none" stroke="#ddd" stroke-width="0.5"/>'+
        '<text x="'+(pad.l+12)+'" y="'+(H-2)+'" font-size="7" fill="#e53935">■ Wicket fell that over</text>'+
      '</svg></div>';
  }

  /* SVG line graph: cumulative runs chase */
  function lineChart(){
    if(!cum1.length&&!cum2.length) return '';
    var W=320, H=150, pad={t:12,r:12,b:30,l:32};
    var innerW=W-pad.l-pad.r, innerH=H-pad.t-pad.b;
    var maxR=Math.max.apply(null,[s1.runs,s2.runs,target,1])+5;
    var n=totalOvers;
    function px(i){ return (pad.l+((i)/n)*innerW).toFixed(1); }
    function py(r){ return (pad.t+innerH-(r/maxR)*innerH).toFixed(1); }

    /* target line */
    var tPath='M'+px(0)+','+py(0)+' L'+px(n)+','+py(s1.runs);
    /* inn1 cumulative */
    var path1=cum1.map(function(r,i){ return (i===0?'M':'L')+px(i+1)+','+py(r); }).join(' ');
    /* inn2 cumulative */
    var path2=cum2.map(function(r,i){ return (i===0?'M':'L')+px(i+1)+','+py(r); }).join(' ');
    /* FOW dots */
    function fowDots(fow, cum){
      return (fow||[]).map(function(f){
        var ov=Math.ceil(parseFloat(f.over)||0);
        var r=cum[Math.min(ov,cum.length)-1]||0;
        return '<circle cx="'+px(ov)+'" cy="'+py(r)+'" r="3.5" fill="#e53935"><title>W'+f.wkts+': '+f.name+' '+f.score+'/'+f.wkts+'</title></circle>';
      }).join('');
    }
    /* y-axis */
    var yLabels='';
    for(var v=0;v<=maxR;v+=Math.round(maxR/5/10)*10||10){
      var yy=py(v);
      yLabels+='<line x1="'+pad.l+'" y1="'+yy+'" x2="'+(W-pad.r)+'" y2="'+yy+'" stroke="#eee" stroke-width="0.5"/>'+
        '<text x="'+(pad.l-3)+'" y="'+(parseFloat(yy)+3)+'" text-anchor="end" font-size="8" fill="#888">'+v+'</text>';
    }
    /* x-axis */
    var xLabels='';
    for(var o=0;o<=n;o+=5){
      xLabels+='<text x="'+px(o)+'" y="'+(H-pad.b+12)+'" text-anchor="middle" font-size="8" fill="#888">'+o+'</text>';
    }
    return '<div style="margin-top:10px"><div style="font-size:12px;font-weight:700;color:#333;margin-bottom:2px">Run Chase — Cumulative Runs</div>'+
      '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;max-width:400px;display:block">'+
        yLabels+xLabels+
        (cum1.length?'<path d="'+path1+'" fill="none" stroke="#0F6E56" stroke-width="2"/>'+fowDots(fow1,cum1):'')+
        (cum2.length?'<path d="'+path2+'" fill="none" stroke="#185FA5" stroke-width="2"/>'+fowDots(fow2,cum2):'')+
        '<path d="'+tPath+'" fill="none" stroke="#e53935" stroke-width="1" stroke-dasharray="5,3"/>'+
        '<rect x="'+pad.l+'" y="'+pad.t+'" width="'+innerW+'" height="'+innerH+'" fill="none" stroke="#ddd" stroke-width="0.5"/>'+
        '<text x="'+(pad.l+4)+'" y="'+(pad.t+9)+'" font-size="7" fill="#0F6E56">— '+bat1+'</text>'+
        (cum2.length?'<text x="'+(pad.l+60)+'" y="'+(pad.t+9)+'" font-size="7" fill="#185FA5">— '+bat2+'</text>':'')+
        '<text x="'+(pad.l+120)+'" y="'+(pad.t+9)+'" font-size="7" fill="#e53935">-- Target</text>'+
        '<text x="'+(pad.l+4)+'" y="'+(pad.t+18)+'" font-size="7" fill="#e53935">● Wicket</text>'+
      '</svg></div>';
  }

  var css='body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:20px}h2{font-size:14px;color:#0F6E56;border-bottom:2px solid #0F6E56;padding-bottom:3px;margin:16px 0 8px}';
  return '<style>'+css+'</style>'+
    '<h1 style="color:#0F6E56;font-size:18px;margin-bottom:2px">📊 Match Analysis</h1>'+
    '<div style="font-size:11px;color:#888;margin-bottom:14px">'+matchObj.team1+' vs '+matchObj.team2+'</div>'+
    '<h2>Over-by-over Runs</h2>'+
    barChart(runs1, fow1, bat1, '#0F6E56', false)+
    (runs2.length?barChart(runs2, fow2, bat2, '#185FA5', true):'')+
    (cum2.length?'<h2>Run Chase Progress</h2>'+lineChart():'');
}

function buildReportHTML(matchObj, s1, s2, b1, bw1, fow1, b2, bw2, fow2, bo1, bo2, showResult, bwo1, bwo2){
  var bat1=matchObj.batFirst, bat2=bat1===matchObj.team1?matchObj.team2:matchObj.team1;
  var result='';
  if(showResult){
    result=s1.runs>s2.runs?bat1+' won by '+(s1.runs-s2.runs)+' run'+(s1.runs-s2.runs!==1?'s':'')
          :s2.runs>s1.runs?bat2+' won by '+(10-s2.wickets)+' wicket'+(10-s2.wickets!==1?'s':'')
          :'Match tied!';
  }
  function _overs(s){ return Math.floor(s.balls/6)+'.'+s.balls%6; }
  function _rr(s){ return s.balls>0?((s.runs/(s.balls/6))).toFixed(2):'0.00'; }
  function batRows(arr, order){
    var notBatted=[];
    for(var ii=0;ii<arr.length;ii++){ if(order.indexOf(ii)<0) notBatted.push(ii); }
    var idxs=order.concat(notBatted);
    return idxs.map(function(i){
      var b=arr[i]; if(!b) return '';
      var status, sc;
      if(b.out){ status=b.howOut; sc='#791F1F'; }
      else if(b.retiredHurt){ status='retired hurt'; sc='#aaa'; }
      else if(b.balls>0){ status='not out'; sc='#0F6E56'; }
      else { status='did not bat'; sc='#aaa'; }
      var r=b.balls>0?b.runs:'-', bl=b.balls>0?b.balls:'-';
      var sr=b.balls>0?((b.runs/b.balls)*100).toFixed(0):'-';
      return '<tr><td>'+b.name+'</td><td style="color:'+sc+';font-size:11px">'+status+'</td><td>'+r+'</td><td>'+bl+'</td><td>'+(b.balls>0?b.fours:'-')+'</td><td>'+(b.balls>0?b.sixes:'-')+'</td><td>'+sr+'</td></tr>';
    }).join('');
  }
  function bowlRows(arr,order){
    return orderedBowlers(arr,order).filter(function(b){return b.balls>0;}).map(function(b){
      return '<tr><td>'+b.name+'</td><td>'+Math.floor(b.balls/6)+'.'+b.balls%6+'</td><td>'+b.runs+'</td><td>'+b.wickets+'</td><td>'+(b.runs/(b.balls/6)).toFixed(2)+'</td></tr>';
    }).join('');
  }
  function fowRows(arr){
    return arr.map(function(f,i){
      return '<tr><td>'+(i+1)+'</td><td>'+f.score+'/'+f.wkts+'</td><td>'+f.name+'</td><td>'+f.over+'</td></tr>';
    }).join('');
  }
  var css='body{font-family:Arial,sans-serif;font-size:13px;color:#111;margin:24px}'+
    'h1{color:#0F6E56;font-size:20px;margin-bottom:2px}'+
    '.meta{color:#888;font-size:12px;margin-bottom:16px}'+
    '.result{background:#E1F5EE;color:#0F6E56;padding:10px 14px;border-radius:6px;font-size:15px;font-weight:700;text-align:center;margin-bottom:18px}'+
    '.summary{display:flex;gap:20px;margin-bottom:18px}'+
    '.sum-box{flex:1;border:1px solid #ddd;border-radius:8px;padding:10px 14px}'+
    '.sum-box h3{font-size:13px;color:#0F6E56;margin:0 0 4px}'+
    '.sum-score{font-size:22px;font-weight:700;color:#111}'+
    '.sum-detail{font-size:12px;color:#888}'+
    'h2{font-size:14px;color:#444;border-bottom:2px solid #0F6E56;padding-bottom:4px;margin:18px 0 8px}'+
    'table{width:100%;border-collapse:collapse;margin-bottom:12px}'+
    'th{text-align:left;font-size:11px;color:#888;font-weight:600;padding:5px 6px;border-bottom:2px solid #eee;background:#f7f7f5}'+
    'td{padding:5px 6px;border-bottom:1px solid #f0f0ee}'+
    'td:last-child,th:last-child{text-align:right}'+
    '.extras{font-size:12px;color:#666;margin-top:-8px;margin-bottom:12px}';
  return '<style>'+css+'</style>'+
    '<h1>&#127955; Match Report</h1>'+
    '<div style="font-size:11px;color:#0F6E56;font-weight:700;float:right;margin-top:-28px">&#9733; CA Bijay Pokhrel</div>'+
    '<div class="meta">'+matchObj.team1+' vs '+matchObj.team2+' &nbsp;|&nbsp; '+matchObj.overs+' overs &nbsp;|&nbsp; '+bat1+' batted first</div>'+
    (result?'<div class="result">'+result+'</div>':'')+
    '<div class="summary">'+
      '<div class="sum-box"><h3>'+bat1+' (Inn. 1)</h3><div class="sum-score">'+s1.runs+'/'+s1.wickets+'</div><div class="sum-detail">'+_overs(s1)+' ov &nbsp;|&nbsp; RR: '+_rr(s1)+'</div></div>'+
      (b2.length?'<div class="sum-box"><h3>'+bat2+' (Inn. 2)</h3><div class="sum-score">'+s2.runs+'/'+s2.wickets+'</div><div class="sum-detail">'+_overs(s2)+' ov &nbsp;|&nbsp; RR: '+_rr(s2)+'</div></div>':'')+
    '</div>'+
    '<h2>'+bat1+' &mdash; Batting</h2>'+
    '<table><tr><th>Batsman</th><th>Dismissal</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>'+batRows(b1,bo1)+'</table>'+
    '<div class="extras">Extras: Wide '+(s1.wide||0)+' &nbsp; No Ball '+(s1.nb||0)+' &nbsp; Total '+s1.runs+'/'+s1.wickets+' ('+_overs(s1)+' ov)</div>'+
    (fow1.length?'<h2>Fall of Wickets &mdash; '+bat1+'</h2><table><tr><th>Wkt</th><th>Score</th><th>Batsman</th><th>Over</th></tr>'+fowRows(fow1)+'</table>':'')+
    '<h2>'+bat2+' &mdash; Bowling (Inn. 1)</h2>'+
    '<table><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Econ</th></tr>'+bowlRows(bw1,bwo1)+'</table>'+
    (b2.length?
      '<h2>'+bat2+' &mdash; Batting</h2>'+
      '<table><tr><th>Batsman</th><th>Dismissal</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>'+batRows(b2,bo2)+'</table>'+
      '<div class="extras">Extras: Wide '+(s2.wide||0)+' &nbsp; No Ball '+(s2.nb||0)+' &nbsp; Total '+s2.runs+'/'+s2.wickets+' ('+_overs(s2)+' ov)</div>'+
      (fow2.length?'<h2>Fall of Wickets &mdash; '+bat2+'</h2><table><tr><th>Wkt</th><th>Score</th><th>Batsman</th><th>Over</th></tr>'+fowRows(fow2)+'</table>':'')+
      '<h2>'+bat1+' &mdash; Bowling (Inn. 2)</h2>'+
      '<table><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Econ</th></tr>'+bowlRows(bw2,bwo2)+'</table>'
    :'');
}

function printOverlay(html){
  var doc='<!DOCTYPE html><html><head><meta charset="UTF-8">'+
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">'+
    '<title>Match Report</title></head><body>'+html+
    '<script>window.onload=function(){setTimeout(function(){window.print();},250);};<\/script>'+
    '</body></html>';
  var w=window.open('', '_blank');
  if(!w){
    // Popup blocked — fall back to printing in-place via overlay
    var el=document.getElementById('print-overlay');
    if(!el){ el=document.createElement('div'); el.id='print-overlay'; document.body.appendChild(el); }
    el.innerHTML=html;
    window.print();
    setTimeout(function(){ el.innerHTML=''; },1000);
    return;
  }
  w.document.open();
  w.document.write(doc);
  w.document.close();
}

function exportPDF(){
  var isResult=S.phase==='result';
  var isInn2=S.innings===2||isResult;
  var s1=S.inn1score||S.t1;
  var s2=isInn2?S.t2:{runs:0,wickets:0,balls:0,wide:0,nb:0};
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
  var scorecard=buildReportHTML(S.match,s1,s2,b1,bw1,fow1,b2,bw2,fow2,bo1,S.battingOrder,isResult,bwo1,S.bowlingOrder);
  var analysis=buildAnalysisHTML(S.match,s1,s2,oh1,oh2,fow1,fow2);
  printOverlay(scorecard+'<div style="page-break-before:always"></div>'+analysis);
}

function printHistoryMatch(idx){
  var history=getMatchHistory();
  var m=history[idx];
  if(!m||!m.inn1batting) return;
  var s1=m.inn1, s2=m.inn2||{runs:0,wickets:0,balls:0};
  var matchObj={team1:m.team1,team2:m.team2,batFirst:m.batFirst,overs:m.overs};
  var scorecard=buildReportHTML(matchObj, s1, s2,
    m.inn1batting, m.inn1bowling||[], m.inn1fow||[],
    m.inn2batting||[], m.inn2bowling||[], m.inn2fow||[],
    m.inn1battingOrder||[], m.inn2battingOrder||[], true,
    m.inn1bowlingOrder||[], m.inn2bowlingOrder||[]);
  var analysis=buildAnalysisHTML(matchObj, s1, s2,
    m.inn1overHistory||[], m.inn2overHistory||[],
    m.inn1fow||[], m.inn2fow||[]);
  printOverlay(scorecard+'<div style="page-break-before:always"></div>'+analysis);
}
