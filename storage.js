// ── storage.js ──────────────────────────────
function saveProgress(){
  try {
    var saveData = {
      S: {
        phase:S.phase, match:S.match, innings:S.innings,
        t1:S.t1, t2:S.t2,
        batting:S.batting, bowling:S.bowling,
        strikerIdx:S.strikerIdx, nonStrikerIdx:S.nonStrikerIdx, bowlerIdx:S.bowlerIdx,
        thisBalls:S.thisBalls, thisBallsRunout:S.thisBallsRunout,
        overHistory:S.overHistory, overBowlers:S.overBowlers, fow:S.fow,
        wicketPending:S.wicketPending, outIdx:S.outIdx,
        overDone:S.overDone, editStriker:S.editStriker, editBowler:S.editBowler,
        extrasPanel:S.extrasPanel, activeTab:S.activeTab,
        inn1batting:S.inn1batting, inn1bowling:S.inn1bowling, inn1fow:S.inn1fow,
        inn1overHistory:S.inn1overHistory, inn1overBowlers:S.inn1overBowlers||[], inn1score:S.inn1score,
        battingOrder:S.battingOrder, inn1battingOrder:S.inn1battingOrder||[], bowlingOrder:S.bowlingOrder, inn1bowlingOrder:S.inn1bowlingOrder||[],
        bowlerConfirmed:S.bowlerConfirmed, dismissalPending:S.dismissalPending,
        dismissalType:S.dismissalType, confirmEndInnings:S.confirmEndInnings,
        inn1Complete:S.inn1Complete
      },
      savedAt: new Date().toLocaleString()
    };
    localStorage.setItem('cricket_progress', JSON.stringify(saveData));
    showToast('Progress saved ✓');
  } catch(e){ showToast('Could not save — storage unavailable'); }
}

function loadProgress(){
  try {
    var raw = localStorage.getItem('cricket_progress');
    if(!raw){ showToast('No saved progress found'); return; }
    var data = JSON.parse(raw);
    var saved = data.S;
    Object.assign(S, saved);
    S.snapshots = [];
    showToast('Progress loaded ✓');
    render();
  } catch(e){ showToast('Could not load saved data'); }
}

function clearProgress(){
  localStorage.removeItem('cricket_progress');
  showToast('Saved progress cleared');
}

function hasSavedProgress(){
  try { return !!localStorage.getItem('cricket_progress'); } catch(e){ return false; }
}

function saveMatchToHistory(){
  try {
    var bat1=S.match.batFirst, bat2=bat1===S.match.team1?S.match.team2:S.match.team1;
    var s1=S.inn1score||S.t1, s2=S.t2;
    var result='';
    if(s1.runs>s2.runs) result=bat1+' won by '+(s1.runs-s2.runs)+' run'+(s1.runs-s2.runs!==1?'s':'');
    else if(s2.runs>s1.runs) result=bat2+' won by '+(10-s2.wickets)+' wicket'+(10-s2.wickets!==1?'s':'');
    else result='Match tied';
    var b1=S.inn1batting.length?S.inn1batting:S.batting;
    var bw1=S.inn1bowling.length?S.inn1bowling:S.bowling;
    var fow1=S.inn1fow.length?S.inn1fow:S.fow;
    var b2=S.innings===2||S.phase==='result'?S.batting:[];
    var bw2=S.innings===2||S.phase==='result'?S.bowling:[];
    var fow2=S.innings===2||S.phase==='result'?S.fow:[];
    var entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      team1: S.match.team1, team2: S.match.team2,
      batFirst: bat1,
      overs: S.match.overs,
      inn1: {runs:s1.runs, wickets:s1.wickets, balls:s1.balls, wide:s1.wide||0, nb:s1.nb||0},
      inn2: {runs:s2.runs, wickets:s2.wickets, balls:s2.balls, wide:s2.wide||0, nb:s2.nb||0},
      result: result,
      bat1players: orderedNames(b1, S.inn1battingOrder.length?S.inn1battingOrder:S.battingOrder),
      bat2players: b2.length?orderedNames(b2, S.battingOrder):[],
      inn1batting: JSON.parse(JSON.stringify(b1)),
      inn1bowling: JSON.parse(JSON.stringify(bw1)),
      inn1fow: JSON.parse(JSON.stringify(fow1)),
      inn1battingOrder: (S.inn1battingOrder.length?S.inn1battingOrder:S.battingOrder).slice(),
      inn1bowlingOrder: (S.inn1bowlingOrder.length?S.inn1bowlingOrder:S.bowlingOrder).slice(),
      inn2batting: JSON.parse(JSON.stringify(b2)),
      inn2bowling: JSON.parse(JSON.stringify(bw2)),
      inn2fow: JSON.parse(JSON.stringify(fow2)),
      inn2battingOrder: S.battingOrder.slice(),
      inn2bowlingOrder: S.bowlingOrder.slice()
    };
    var history = getMatchHistory();
    history.unshift(entry);
    if(history.length>10) history=history.slice(0,10);
    localStorage.setItem('cricket_history', JSON.stringify(history));
  } catch(e){}
}

function getMatchHistory(){
  try {
    var raw=localStorage.getItem('cricket_history');
    return raw?JSON.parse(raw):[];
  } catch(e){ return []; }
}

function toggleDark(){
  document.body.classList.toggle('dark');
  var btn=document.getElementById('dark-btn');
  if(btn) btn.textContent=document.body.classList.contains('dark')?'☀️ Light':'🌙 Dark';
}

function showMilestone(name, runs){
  var icons={25:'🏅',50:'⭐',75:'🔥',100:'💯',150:'🚀',200:'🏆'};
  var label={25:'Quarter-Century!',50:'FIFTY!',75:'75!',100:'CENTURY!!!',150:'150!',200:'DOUBLE HUNDRED!'};
  var mil=25; [200,150,100,75,50,25].forEach(function(m){ if(runs>=m) mil=m; });
  var el=document.getElementById('milestone-toast');
  if(!el) return;
  el.innerHTML=(icons[mil]||'⭐')+' '+name+' — '+(label[mil]||runs+'!');
  el.style.display='block';
  el.style.animation='none';
  void el.offsetWidth;
  el.style.animation='milestonePop .4s var(--ease) forwards';
  clearTimeout(el._timer);
  el._timer=setTimeout(function(){ el.style.display='none'; }, 3000);
}

var _hatTrickTracker={};
function checkHatTrick(bowler){
  var nm=bowler.name;
  if(!_hatTrickTracker[nm]) _hatTrickTracker[nm]=[];
  var arr=_hatTrickTracker[nm];
  // Check if last ball in thisBalls was a wicket
  var lastBall=S.thisBalls[S.thisBalls.length-1];
  if(lastBall==='W'){ arr.push(1); } else { arr.push(0); }
  if(arr.length>3) arr=arr.slice(-3);
  _hatTrickTracker[nm]=arr;
  if(arr.length===3 && arr[0]&&arr[1]&&arr[2]) showMilestone(nm+' — HAT-TRICK',0);
}

function showToast(msg){
  var t=document.getElementById('toast-msg');
  if(!t){
    t=document.createElement('div');
    t.id='toast-msg';
    t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;z-index:9999;opacity:0;transition:opacity .3s;pointer-events:none;white-space:nowrap';
    document.body.appendChild(t);
  }
  t.textContent=msg;
  t.style.opacity='1';
  clearTimeout(t._timer);
  t._timer=setTimeout(function(){ t.style.opacity='0'; },2200);
}

function _histBatTable(teamName, batting, order, wide, nb){
  if(!batting||!batting.length) return '';
  var notBatted=[];
  for(var i=0;i<batting.length;i++) if(order.indexOf(i)<0) notBatted.push(i);
  var idxs=order.length?order.concat(notBatted):batting.map(function(_,i){return i;});
  var rows=idxs.map(function(i){
    var b=batting[i]; if(!b) return '';
    var status,sc;
    if(b.out){status=b.howOut;sc='#c0392b';}
    else if(b.retiredHurt){status='ret. hurt';sc='#aaa';}
    else if(b.balls>0){status='not out';sc='#0F6E56';}
    else{status='dnb';sc='#ccc';}
    var r=b.balls>0?'<strong>'+b.runs+'</strong>':'-';
    return '<tr><td style="padding:4px 6px;font-size:12px;font-weight:600">'+b.name+'</td>'+
      '<td style="padding:4px 6px;font-size:11px;color:'+sc+'">'+status+'</td>'+
      '<td style="padding:4px 6px;font-size:12px;text-align:right">'+r+'</td>'+
      '<td style="padding:4px 6px;font-size:12px;text-align:right">'+(b.balls>0?b.balls:'-')+'</td>'+
      '<td style="padding:4px 6px;font-size:12px;text-align:right">'+(b.balls>0?b.fours:'-')+'</td>'+
      '<td style="padding:4px 6px;font-size:12px;text-align:right">'+(b.balls>0?b.sixes:'-')+'</td>'+
      '<td style="padding:4px 6px;font-size:12px;text-align:right">'+(b.balls>0?((b.runs/b.balls)*100).toFixed(0):'-')+'</td></tr>';
  }).join('');
  return '<div style="margin:0 14px 8px">'+
    '<div style="font-size:11px;font-weight:700;color:#0F6E56;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">'+teamName+' — Batting</div>'+
    '<table style="width:100%;border-collapse:collapse">'+
    '<tr style="border-bottom:2px solid #f0f0f0"><th style="padding:3px 6px;font-size:10px;color:#999;font-weight:600;text-align:left">Batsman</th><th style="padding:3px 6px;font-size:10px;color:#999;font-weight:600;text-align:left">Status</th><th style="padding:3px 6px;font-size:10px;color:#999;font-weight:600;text-align:right">R</th><th style="padding:3px 6px;font-size:10px;color:#999;font-weight:600;text-align:right">B</th><th style="padding:3px 6px;font-size:10px;color:#999;font-weight:600;text-align:right">4s</th><th style="padding:3px 6px;font-size:10px;color:#999;font-weight:600;text-align:right">6s</th><th style="padding:3px 6px;font-size:10px;color:#999;font-weight:600;text-align:right">SR</th></tr>'+
    rows+'</table>'+
    '<div style="font-size:11px;color:#999;margin-top:3px">Extras: Wd '+(wide||0)+' &nbsp; Nb '+(nb||0)+'</div>'+
    '</div>';
}
function _histBowlTable(teamName, bowling, order){
  if(!bowling||!bowling.length) return '';
  var rows=orderedBowlers(bowling,order).filter(function(b){return b.balls>0;}).map(function(b){
    return '<tr><td style="padding:4px 6px;font-size:12px;font-weight:600">'+b.name+'</td>'+
      '<td style="padding:4px 6px;font-size:12px;text-align:right">'+Math.floor(b.balls/6)+'.'+b.balls%6+'</td>'+
      '<td style="padding:4px 6px;font-size:12px;text-align:right">'+b.runs+'</td>'+
      '<td style="padding:4px 6px;font-size:12px;text-align:right;font-weight:700;color:#791F1F">'+b.wickets+'</td>'+
      '<td style="padding:4px 6px;font-size:12px;text-align:right">'+(b.runs/(b.balls/6)).toFixed(1)+'</td></tr>';
  }).join('');
  if(!rows) return '';
  return '<div style="margin:0 14px 10px">'+
    '<div style="font-size:11px;font-weight:700;color:#0F6E56;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">'+teamName+' — Bowling</div>'+
    '<table style="width:100%;border-collapse:collapse">'+
    '<tr style="border-bottom:2px solid #f0f0f0"><th style="padding:3px 6px;font-size:10px;color:#999;font-weight:600;text-align:left">Bowler</th><th style="padding:3px 6px;font-size:10px;color:#999;font-weight:600;text-align:right">O</th><th style="padding:3px 6px;font-size:10px;color:#999;font-weight:600;text-align:right">R</th><th style="padding:3px 6px;font-size:10px;color:#999;font-weight:600;text-align:right">W</th><th style="padding:3px 6px;font-size:10px;color:#999;font-weight:600;text-align:right">Econ</th></tr>'+
    rows+'</table></div>';
}
function _histFowRow(teamName, fow){
  if(!fow||!fow.length) return '';
  var chips=fow.map(function(f,i){
    return '<span style="font-size:11px;background:#f5f5f5;border-radius:6px;padding:2px 7px;color:#555">'+(i+1)+'/'+f.score+' '+f.name+'</span>';
  }).join(' ');
  return '<div style="margin:0 14px 10px">'+
    '<div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">FoW — '+teamName+'</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:4px">'+chips+'</div></div>';
}

function renderHistory(){
  var history=getMatchHistory();
  var hasSaved=hasSavedProgress();
  var html='<div class="setup-panel"><h3>&#128202; Match History (last 10)</h3>';

  // Career stats panel
  if(history.length>0){
    var topBat={}, topBowl={};
    history.forEach(function(m){
      var process=function(arr){ (arr||[]).forEach(function(b){
        if(!topBat[b.name]) topBat[b.name]={runs:0,balls:0,matches:0};
        topBat[b.name].runs+=b.runs||0; topBat[b.name].balls+=b.balls||0;
        if(b.balls>0) topBat[b.name].matches++;
      }); };
      process(m.inn1batting); process(m.inn2batting);
      var processBwl=function(arr){ (arr||[]).forEach(function(b){
        if(!topBowl[b.name]) topBowl[b.name]={wickets:0,runs:0,balls:0,matches:0};
        topBowl[b.name].wickets+=b.wickets||0; topBowl[b.name].runs+=b.runs||0; topBowl[b.name].balls+=b.balls||0;
        if(b.balls>0) topBowl[b.name].matches++;
      }); };
      processBwl(m.inn1bowling); processBwl(m.inn2bowling);
    });
    var batArr=Object.keys(topBat).map(function(n){ return {name:n,runs:topBat[n].runs,balls:topBat[n].balls,matches:topBat[n].matches}; });
    batArr.sort(function(a,b){ return b.runs-a.runs; });
    var bowlArr=Object.keys(topBowl).map(function(n){ return {name:n,wickets:topBowl[n].wickets,runs:topBowl[n].runs,balls:topBowl[n].balls,matches:topBowl[n].matches}; });
    bowlArr.sort(function(a,b){ return b.wickets-a.wickets||(a.runs/Math.max(a.balls,1))-(b.runs/Math.max(b.balls,1)); });
    html+='<div style="background:linear-gradient(135deg,#0e8f6f11,#2563eb11);border:1px solid var(--c-border);border-radius:var(--radius-md);padding:14px;margin-bottom:14px">'+
      '<div style="font-size:11px;font-weight:700;color:var(--c-text-faint);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px">&#127942; Career Stats ('+history.length+' match'+(history.length>1?'es':'')+')</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
        '<div>'+
          '<div style="font-size:10px;font-weight:700;color:var(--c-primary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Top Scorers</div>'+
          batArr.slice(0,5).map(function(b,i){
            var sr=b.balls>0?((b.runs/b.balls)*100).toFixed(0):0;
            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--c-border)">'+
              '<span style="font-size:12px;font-weight:600;color:var(--c-text)">'+(i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':'')+b.name+'</span>'+
              '<span style="font-size:11px;color:var(--c-text-soft)"><b style="color:var(--c-text)">'+b.runs+'</b> <span style="color:var(--c-text-faint)">SR'+sr+'</span></span>'+
            '</div>';
          }).join('')+
        '</div>'+
        '<div>'+
          '<div style="font-size:10px;font-weight:700;color:var(--c-red);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Top Wicket-takers</div>'+
          bowlArr.slice(0,5).map(function(b,i){
            var econ=b.balls>0?(b.runs/(b.balls/6)).toFixed(1):0;
            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--c-border)">'+
              '<span style="font-size:12px;font-weight:600;color:var(--c-text)">'+(i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':'')+b.name+'</span>'+
              '<span style="font-size:11px;color:var(--c-text-soft)"><b style="color:var(--c-red)">'+b.wickets+'W</b> <span style="color:var(--c-text-faint)">'+econ+'e</span></span>'+
            '</div>';
          }).join('')+
        '</div>'+
      '</div>'+
    '</div>';
  }
  if(!history.length){
    html+='<p style="font-size:13px;color:#aaa;margin-bottom:12px">No previous matches recorded yet.</p>';
  } else {
    history.forEach(function(m,idx){
      var bat1=m.batFirst, bat2=bat1===m.team1?m.team2:m.team1;
      var ov1=Math.floor(m.inn1.balls/6)+'.'+m.inn1.balls%6;
      var ov2=m.inn2?Math.floor(m.inn2.balls/6)+'.'+m.inn2.balls%6:'0.0';
      var hasDetail=!!(m.inn1batting&&m.inn1batting.length);
      html+='<div style="border:1px solid #e0e0e0;border-radius:12px;margin-bottom:14px;background:#fff;overflow:hidden">';
      // Header row
      html+='<div style="background:#f7f9f7;padding:11px 14px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:flex-start">'+
        '<div><div style="font-size:13px;font-weight:700;color:#1a1a1a">'+m.team1+' vs '+m.team2+'</div>'+
        '<div style="font-size:12px;font-weight:600;color:#0F6E56;margin-top:2px">'+m.result+'</div></div>'+
        '<div style="font-size:11px;color:#aaa;text-align:right">'+m.date+'<br><span style="color:#bbb">'+m.overs+' overs</span></div>'+
        '</div>';
      // Score summary bar
      html+='<div style="padding:10px 14px;background:#E1F5EE;display:flex;align-items:center;gap:16px;border-bottom:1px solid #d4eee4">'+
        '<div><div style="font-size:11px;color:#555;font-weight:700">'+bat1+'</div>'+
        '<div style="font-size:22px;font-weight:900;color:#0F6E56;line-height:1.1">'+m.inn1.runs+'/'+m.inn1.wickets+'</div>'+
        '<div style="font-size:11px;color:#777">('+ov1+' ov)</div></div>'+
        '<div style="font-size:18px;color:#9FE1CB;font-weight:300">vs</div>'+
        '<div><div style="font-size:11px;color:#555;font-weight:700">'+bat2+'</div>'+
        '<div style="font-size:22px;font-weight:900;color:#0F6E56;line-height:1.1">'+m.inn2.runs+'/'+m.inn2.wickets+'</div>'+
        '<div style="font-size:11px;color:#777">('+ov2+' ov)</div></div>'+
        '</div>';
      // Full details
      if(hasDetail){
        html+='<div style="padding-top:10px">';
        html+=_histBatTable(bat1, m.inn1batting, m.inn1battingOrder||[], m.inn1.wide, m.inn1.nb);
        html+=_histFowRow(bat1, m.inn1fow);
        html+=_histBowlTable(bat2, m.inn1bowling, m.inn1bowlingOrder||[]);
        if(m.inn2batting&&m.inn2batting.length){
          html+='<div style="border-top:1px solid #f0f0f0;padding-top:8px">';
          html+=_histBatTable(bat2, m.inn2batting, m.inn2battingOrder||[], m.inn2.wide, m.inn2.nb);
          html+=_histFowRow(bat2, m.inn2fow);
          html+=_histBowlTable(bat1, m.inn2bowling, m.inn2bowlingOrder||[]);
          html+='</div>';
        }
        html+='</div>';
      }
      // Action buttons
      html+='<div style="padding:10px 14px;border-top:1px solid #f0f0f0;display:flex;gap:8px;flex-wrap:wrap">'+
        '<button class="btn-secondary" style="width:auto;padding:6px 10px;font-size:12px;margin:0" data-action="use-players" data-val="'+idx+'">&#128101; Use players</button>'+
        (hasDetail?'<button class="btn-secondary" style="width:auto;padding:6px 10px;font-size:12px;margin:0" data-action="print-history" data-val="'+idx+'">&#128438; Print / PDF</button>':'')+
        '</div>';
      html+='</div>';
    });
  }
  if(hasSaved){
    html+=
      '<div style="background:#E1F5EE;border:1px solid #9FE1CB;border-radius:10px;padding:12px;margin-bottom:10px">'+
        '<div style="font-size:13px;font-weight:600;color:#0F6E56;margin-bottom:6px">&#128190; Saved Progress Found</div>'+
        '<div style="font-size:12px;color:#555;margin-bottom:8px">You have an unfinished match saved. Would you like to continue?</div>'+
        '<button class="btn-primary" style="margin-bottom:6px" data-action="load-progress">&#9654; Continue Saved Match</button>'+
        '<button class="btn-secondary" style="margin:0" data-action="clear-progress">&#128465; Discard Saved Progress</button>'+
      '</div>';
  }
  html+='<button class="btn-secondary" style="margin-top:4px" data-action="back-to-setup">&#8592; Back to Setup</button></div>';
  document.getElementById('main-content').innerHTML=html;
}

