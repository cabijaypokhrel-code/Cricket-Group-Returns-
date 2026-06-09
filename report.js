// ── report.js ──────────────────────────────
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
  var s1=S.inn1score||S.t1;
  var s2=(S.innings===2||S.phase==='result')?S.t2:{runs:0,wickets:0,balls:0,wide:0,nb:0};
  var b1=S.inn1batting.length?S.inn1batting:S.batting;
  var bw1=S.inn1bowling.length?S.inn1bowling:S.bowling;
  var fow1=S.inn1fow.length?S.inn1fow:S.fow;
  var b2=(S.innings===2||S.phase==='result')?S.batting:[];
  var bw2=(S.innings===2||S.phase==='result')?S.bowling:[];
  var fow2=(S.innings===2||S.phase==='result')?S.fow:[];
  var bo1=S.inn1battingOrder.length?S.inn1battingOrder:S.battingOrder;
  var bwo1=S.inn1bowlingOrder.length?S.inn1bowlingOrder:S.bowlingOrder;
  printOverlay(buildReportHTML(S.match,s1,s2,b1,bw1,fow1,b2,bw2,fow2,bo1,S.battingOrder,S.phase==='result',bwo1,S.bowlingOrder));
}

function printHistoryMatch(idx){
  var history=getMatchHistory();
  var m=history[idx];
  if(!m||!m.inn1batting) return;
  var s1=m.inn1, s2=m.inn2||{runs:0,wickets:0,balls:0};
  printOverlay(buildReportHTML(
    {team1:m.team1,team2:m.team2,batFirst:m.batFirst,overs:m.overs},
    s1, s2,
    m.inn1batting, m.inn1bowling||[], m.inn1fow||[],
    m.inn2batting||[], m.inn2bowling||[], m.inn2fow||[],
    m.inn1battingOrder||[], m.inn2battingOrder||[],
    true,
    m.inn1bowlingOrder||[], m.inn2bowlingOrder||[]
  ));
}
