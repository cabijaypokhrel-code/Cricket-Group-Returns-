function _histBatTable(teamName, batting, order, wide, nb){
  if(!batting||!batting.length) return '';
  var notBatted=[];
  for(var i=0;i<batting.length;i++) if(order.indexOf(i)<0) notBatted.push(i);
  var idxs=order.length?order.concat(notBatted):batting.map(function(_,i){return i;});
  var rows=idxs.map(function(i){
    var b=batting[i]; if(!b) return '';
    var status,sc;
    if(b.out){status=b.howOut;sc='var(--c-wicket)';}
    else if(b.retiredHurt){status='ret. hurt';sc='var(--c-text-faint)';}
    else if(b.balls>0){status='not out';sc='var(--c-primary)';}
    else{status='dnb';sc='var(--c-text-faint)';}
    return '<tr><td>'+b.name+'<br><span class="out-text" style="color:'+sc+'">'+status+'</span></td>'+
      '<td>'+(b.balls>0?b.runs:'-')+'</td>'+
      '<td>'+(b.balls>0?b.balls:'-')+'</td>'+
      '<td>'+(b.balls>0?b.fours:'-')+'</td>'+
      '<td>'+(b.balls>0?b.sixes:'-')+'</td>'+
      '<td>'+(b.balls>0?((b.runs/b.balls)*100).toFixed(0):'-')+'</td></tr>';
  }).join('');
  return '<div class="section-title" style="margin-top:10px">'+teamName+' — Batting</div>'+
    '<table class="scorecard-table"><tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>'+rows+
    '<tr style="background:var(--c-extras-soft)"><td style="font-weight:600;color:var(--c-extras)" colspan="2">Extras</td>'+
    '<td colspan="4" style="font-size:11px;color:var(--c-text-faint)">Wd '+(wide||0)+' Nb '+(nb||0)+'</td></tr>'+
    '</table>';
}

function _histBowlTable(teamName, bowling, order){
  if(!bowling||!bowling.length) return '';
  var rows=orderedBowlers(bowling,order).filter(function(b){return b.balls>0;}).map(function(b){
    return '<tr><td>'+b.name+'</td>'+
      '<td>'+Math.floor(b.balls/6)+'.'+b.balls%6+'</td>'+
      '<td>'+b.runs+'</td>'+
      '<td style="font-weight:700;color:var(--c-wicket)">'+b.wickets+'</td>'+
      '<td>'+(b.runs/(b.balls/6)).toFixed(1)+'</td></tr>';
  }).join('');
  if(!rows) return '';
  return '<div class="section-title" style="margin-top:10px">'+teamName+' — Bowling</div>'+
    '<table class="scorecard-table"><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Econ</th></tr>'+rows+'</table>';
}

function _histFowRow(teamName, fow){
  if(!fow||!fow.length) return '';
  var chips=fow.map(function(f,i){
    return '<span style="font-size:11px;background:var(--c-surface-alt);border:1px solid var(--c-border);border-radius:6px;padding:2px 8px;color:var(--c-text-soft)">'+(i+1)+'/'+f.score+' '+f.name+'</span>';
  }).join('');
  return '<div class="section-title" style="margin-top:10px">FoW — '+teamName+'</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">'+chips+'</div>';
}

function renderHistory(){
  var history=getMatchHistory();
  var hasSaved=hasSavedProgress();
  var html='<div class="setup-panel"><h3>&#128202; Match History</h3>';

  /* Career stats panel */
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
    html+='<div style="background:linear-gradient(135deg,var(--c-primary-soft),var(--c-runs-soft));border:1px solid var(--c-border);border-radius:var(--radius-md);padding:14px;margin-bottom:16px">'+
      '<div class="section-title">&#127942; Career Stats ('+history.length+' match'+(history.length>1?'es':'')+')</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
        '<div>'+
          '<div style="font-size:10px;font-weight:700;color:var(--c-primary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Top Scorers</div>'+
          batArr.slice(0,5).map(function(b,i){
            var sr=b.balls>0?((b.runs/b.balls)*100).toFixed(0):0;
            return '<div class="info-row" style="padding:5px 0">'+
              '<span style="font-size:12px;font-weight:600;color:var(--c-text)">'+(i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':'')+b.name+'</span>'+
              '<span style="font-size:11px;color:var(--c-text-soft)"><b style="color:var(--c-text)">'+b.runs+'</b> <span style="color:var(--c-text-faint)">SR'+sr+'</span></span>'+
            '</div>';
          }).join('')+
        '</div>'+
        '<div>'+
          '<div style="font-size:10px;font-weight:700;color:var(--c-wicket);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Top Wicket-takers</div>'+
          bowlArr.slice(0,5).map(function(b,i){
            var econ=b.balls>0?(b.runs/(b.balls/6)).toFixed(1):0;
            return '<div class="info-row" style="padding:5px 0">'+
              '<span style="font-size:12px;font-weight:600;color:var(--c-text)">'+(i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':'')+b.name+'</span>'+
              '<span style="font-size:11px;color:var(--c-text-soft)"><b style="color:var(--c-wicket)">'+b.wickets+'W</b> <span style="color:var(--c-text-faint)">'+econ+'e</span></span>'+
            '</div>';
          }).join('')+
        '</div>'+
      '</div>'+
    '</div>';
  }

  if(!history.length){
    html+='<p style="font-size:13px;color:var(--c-text-faint);margin-bottom:12px">No previous matches recorded yet.</p>';
  } else {
    history.forEach(function(m,idx){
      var bat1=m.batFirst, bat2=bat1===m.team1?m.team2:m.team1;
      var ov1=Math.floor(m.inn1.balls/6)+'.'+m.inn1.balls%6;
      var ov2=m.inn2?Math.floor(m.inn2.balls/6)+'.'+m.inn2.balls%6:'0.0';
      var hasDetail=!!(m.inn1batting&&m.inn1batting.length);
      html+='<div class="history-card">';
      /* Header */
      html+='<div class="history-card-header">'+
        '<div>'+
          '<div class="history-card-teams">'+m.team1+' vs '+m.team2+'</div>'+
          '<div class="history-card-result">'+m.result+'</div>'+
        '</div>'+
        '<div class="history-card-meta">'+m.date+'<br>'+m.overs+' overs</div>'+
      '</div>';
      /* Scores */
      html+='<div class="history-card-scores">'+
        '<div class="history-score-block">'+
          '<div class="history-score-team">'+bat1+'</div>'+
          '<div class="history-score-runs">'+m.inn1.runs+'/'+m.inn1.wickets+'</div>'+
          '<div class="history-score-overs">('+ov1+' ov)</div>'+
        '</div>'+
        '<div class="history-vs">vs</div>'+
        '<div class="history-score-block">'+
          '<div class="history-score-team">'+bat2+'</div>'+
          '<div class="history-score-runs">'+m.inn2.runs+'/'+m.inn2.wickets+'</div>'+
          '<div class="history-score-overs">('+ov2+' ov)</div>'+
        '</div>'+
      '</div>';
      /* Detailed scorecard */
      if(hasDetail){
        html+='<div style="padding:0 16px 4px">';
        html+=_histBatTable(bat1, m.inn1batting, m.inn1battingOrder||[], m.inn1.wide, m.inn1.nb);
        html+=_histFowRow(bat1, m.inn1fow);
        html+=_histBowlTable(bat2, m.inn1bowling, m.inn1bowlingOrder||[]);
        if(m.inn2batting&&m.inn2batting.length){
          html+='<div style="border-top:1px solid var(--c-border);margin-top:12px;padding-top:4px">';
          html+=_histBatTable(bat2, m.inn2batting, m.inn2battingOrder||[], m.inn2.wide, m.inn2.nb);
          html+=_histFowRow(bat2, m.inn2fow);
          html+=_histBowlTable(bat1, m.inn2bowling, m.inn2bowlingOrder||[]);
          html+='</div>';
        }
        html+='</div>';
      }
      /* Actions */
      html+='<div class="history-card-actions">'+
        '<button class="btn-secondary" style="width:auto;padding:7px 12px;font-size:12px;margin:0" data-action="use-players" data-val="'+idx+'">&#128101; Use players</button>'+
        (hasDetail?'<button class="btn-secondary" style="width:auto;padding:7px 12px;font-size:12px;margin:0" data-action="print-history" data-val="'+idx+'">&#128438; PDF</button>':'')+
      '</div>';
      html+='</div>';
    });
  }

  if(hasSaved){
    html+=
      '<div class="msg" style="background:var(--c-primary-soft);border-color:var(--c-primary)">'+
        '<div style="font-size:13px;font-weight:700;margin-bottom:6px">&#128190; Saved Progress Found</div>'+
        '<div style="font-size:12px;margin-bottom:10px;font-weight:400">You have an unfinished match saved.</div>'+
        '<button class="btn-primary" style="margin-bottom:6px" data-action="load-progress">&#9654; Continue Saved Match</button>'+
        '<button class="btn-secondary" style="margin:0" data-action="clear-progress">&#128465; Discard</button>'+
      '</div>';
  }
  html+='<button class="btn-secondary" style="margin-top:4px" data-action="back-to-setup">&#8592; Back</button></div>';
  document.getElementById('main-content').innerHTML=html;
}

