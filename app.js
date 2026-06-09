// ── app.js ──────────────────────────────
document.addEventListener('click', function(e){
  var el=e.target;
  while(el && el!==document.body){
    if(el.dataset && el.dataset.action) break;
    el=el.parentElement;
  }
  if(!el || !el.dataset || !el.dataset.action) return;
  var action=el.dataset.action;
  var val=el.dataset.val;
  switch(action){
    case 'start-match':           startMatch(); break;
    case 'runs':                  doRuns(parseInt(val)); break;
    case 'wicket':                doWicket(); break;
    case 'open-extras':           S.extrasPanel=val; render(); break;
    case 'bye':                    doBye(parseInt(val)); break;
    case 'legbye':                 doLegBye(parseInt(val)); break;
    case 'wide':                  doWide(parseInt(val)); break;
    case 'noball':                doNoBall(parseInt(val)); break;
    case 'cancel-extras':         S.extrasPanel=null; render(); break;
    case 'swap-batters':          swap(); render(); break;
    case 'edit-striker':          S.editStriker=true; render(); break;
    case 'save-striker':          saveStrikerName(); break;
    case 'cancel-edit-striker':   S.editStriker=false; render(); break;
    case 'confirm-batsman':       confirmNewBatsman(); break;
    case 'confirm-bowler':        confirmBowler(); break;
    case 'end-innings':           S.confirmEndInnings=true; render(); break;
    case 'confirm-end-innings':   S.confirmEndInnings=false; endInnings(); break;
    case 'cancel-end-innings':    S.confirmEndInnings=false; render(); break;
    case 'new-match':             resetMatch(); break;
    case 'start-inn2':            startInn2(); break;
    case 'show-history':          S.phase='history'; renderHistory(); break;
    case 'back-to-setup':         S.phase='setup'; render(); break;
    case 'save-progress':         saveProgress(); break;
    case 'load-progress':         loadProgress(); break;
    case 'clear-progress':        clearProgress(); renderHistory(); break;
    case 'use-players':
      var hist=getMatchHistory();
      var m=hist[parseInt(val)];
      if(m){
        S.prefillPlayers={t1:m.bat1players, t2:m.bat2players};
        S.phase='setup'; render();
        showToast('Players loaded — edit names as needed');
      }
      break;
    case 'tab':                   S.activeTab=val; render(); break;
    case 'undo':                   undoLast(); break;
    case 'pick-bowler':            pickBowler(parseInt(val)); break;
    case 'pick-bowler-edit':       S.bowlerIdx=parseInt(val); S.editBowler=false; render(); break;
    case 'pick-batsman':           pickBatsman(parseInt(val)); break;
    case 'pick-striker':           pickStriker(parseInt(val)); break;
    case 'edit-bowler':            S.editBowler=true; render(); break;
    case 'save-bowler':            saveBowlerName(); break;
    case 'cancel-edit-bowler':     S.editBowler=false; render(); break;
    case 'export-pdf':             exportPDF(); break;
    case 'print-history':          printHistoryMatch(parseInt(val)); break;
    case 'set-dismissal':          S.dismissalType=val; render(); break;
    case 'confirm-dismissal':      confirmDismissal(S.dismissalType); break;
    case 'cancel-dismissal':       S.dismissalPending=false; S.dismissalType=''; render(); break;
    case 'choose-new-players':
      (function(){
        var setup=JSON.parse(decodeURIComponent(val));
        // Show player input form
        var t1inp=Array.from({length:11},function(_,i){ return '<input id="t1p'+i+'" placeholder="'+(setup.p1[i]||'Player '+(i+1))+'">'; }).join('');
        var t2inp=Array.from({length:11},function(_,i){ return '<input id="t2p'+i+'" placeholder="'+(setup.p2[i]||'Player '+(i+1))+'">'; }).join('');
        document.getElementById('main-content').innerHTML=
          '<div class="setup-panel"><h3>'+setup.t1+' &mdash; Playing XI</h3><div class="player-inputs">'+t1inp+'</div></div>'+
          '<div class="setup-panel"><h3>'+setup.t2+' &mdash; Playing XI</h3><div class="player-inputs">'+t2inp+'</div></div>'+
          '<div class="setup-panel">'+
            '<button class="btn-primary" data-action="finalize-new-players" data-val="'+val+'">&#127951; Start Match</button>'+
            '<button class="btn-secondary" style="margin-top:8px" data-action="back-to-choose" data-val="'+val+'">&#8592; Back</button>'+
          '</div>';
      })();
      break;
    case 'finalize-new-players':
      (function(){
        var setup=JSON.parse(decodeURIComponent(val));
        var p1=[],p2=[];
        for(var i=0;i<11;i++){
          var e1=document.getElementById('t1p'+i); p1.push(e1&&e1.value.trim()?e1.value.trim():setup.t1+' P'+(i+1));
          var e2=document.getElementById('t2p'+i); p2.push(e2&&e2.value.trim()?e2.value.trim():setup.t2+' P'+(i+1));
        }
        applyTeamSetup(setup,p1,p2);
      })();
      break;
    case 'choose-prev-players':
      (function(){
        var data=JSON.parse(decodeURIComponent(val));
        var hist=getMatchHistory();
        var m=hist[data.idx];
        if(!m) return;
        var p1=m.bat1players.slice(), p2=m.bat2players.slice();
        while(p1.length<11) p1.push(data.setup.t1+' P'+(p1.length+1));
        while(p2.length<11) p2.push(data.setup.t2+' P'+(p2.length+1));
        var histLabel=m.team1+' vs '+m.team2+' ('+m.date+')';
        renderBatFirstChoice(data.setup, p1, p2, histLabel);
      })();
      break;
    case 'bat-first-confirm':
      (function(){
        var setup=JSON.parse(decodeURIComponent(el.dataset.t1));
        var p1=JSON.parse(decodeURIComponent(el.dataset.p1));
        var p2=JSON.parse(decodeURIComponent(el.dataset.p2));
        var batFirst=el.dataset.batfirst;
        // Override batFirst in setup
        setup.batFirst=(batFirst==='t1')?setup.t1:setup.t2;
        applyTeamSetup(setup,p1,p2);
        showToast('Match started ✓');
      })();
      break;
    case 'back-to-choose':
      (function(){
        var setup=JSON.parse(decodeURIComponent(val));
        renderChoosePlayers(setup);
      })();
      break;
  }
});

document.addEventListener('keydown', function(e){
  if(e.key!=='Enter') return;
  var id=document.activeElement?document.activeElement.id:'';
  if(id==='new-bat-inp')          confirmNewBatsman();
  else if(id==='bowler-inp')      confirmBowler();
  else if(id==='striker-edit-inp') saveStrikerName();
  else if(id==='inp-t1'||id==='inp-t2') return;
});


// ═══════════════════════════════════════════════
// MATCH HISTORY & SAVE/LOAD (localStorage)
// ═══════════════════════════════════════════════

(function(){
  var hash=location.hash;
  var liveM=hash.match(/[#&]live=([A-Z0-9]{6})/);
  var stateM=hash.match(/[#&]s=([^&]+)/);
  if(liveM){
    var code=liveM[1];
    document.getElementById('main-content').innerHTML=
      '<div class="setup-panel" style="text-align:center;padding:40px 20px">'+
      '<div style="font-size:52px;margin-bottom:14px">🏏</div>'+
      '<div style="font-size:18px;font-weight:800;margin-bottom:8px">Connecting to live score...</div>'+
      '<div style="background:#E1F5EE;color:#0F6E56;border-radius:12px;padding:12px 20px;display:inline-block;font-size:28px;font-weight:900;letter-spacing:4px;margin:10px 0">'+code+'</div>'+
      '<div style="font-size:13px;color:#aaa;margin-top:10px">Waiting for scorer&#8230;</div>'+
      '<div id="live-dot" style="font-size:13px;color:#0F6E56;font-weight:600;margin-top:8px">⏳ Connecting...</div>'+
      '</div>';
    joinLiveRoom(code);
    return;
  }
  if(stateM){
    try{
      var d2=JSON.parse(decodeURIComponent(escape(atob(stateM[1]))));
      if(d2&&d2.v){ renderSharedView(d2); return; }
    }catch(e){}
  }
  render();
})();

window.addEventListener('beforeunload', function(e){
  if(S.phase==='scoring' || S.phase==='result'){
    e.preventDefault();
    e.returnValue='Match in progress! Are you sure you want to leave? All data will be lost.';
    return e.returnValue;
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js');
  });
}
