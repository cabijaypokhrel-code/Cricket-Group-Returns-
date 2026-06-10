/* render.js — all screen rendering + delegated click handler */

function render(){
  var t1=S.match.team1, t2=S.match.team2;
  var logoEl=document.getElementById('header-logo');
  if(logoEl){ logoEl.src=TEAM_LOGO; logoEl.style.display=(t1&&t2?'inline-block':'none'); }
  document.getElementById('match-title').childNodes[document.getElementById('match-title').childNodes.length-1].textContent='🏏 '+(t1&&t2?t1+' vs '+t2:'Saturday Cricket Team');
  if(S.phase==='history'){
    document.getElementById('match-subtitle').textContent='Match History';
    renderHistory(); return;
  } else if(S.phase==='setup'){
    document.getElementById('match-subtitle').textContent='Set up a new match to begin';
    renderSetup();
  } else if(S.phase==='scoring' && S.inn1Complete){
    document.getElementById('match-subtitle').textContent='1st Innings Complete';
    renderInn1Complete();
  } else if(S.phase==='scoring'){
    var bt=S.match.batFirst, bw=bt===t1?t2:t1;
    var batting=S.innings===1?bt:bw;
    document.getElementById('match-subtitle').textContent='Innings '+S.innings+' — '+batting+' batting';
    renderScoring();
  } else {
    document.getElementById('match-subtitle').textContent='Match complete';
    renderResult();
  }
  if(S.phase==='scoring'||S.phase==='result') updateShareHash();
}

/* ── HOME SCREEN ─────────────────────────────────────────────────────── */
function renderSetup(){
  var hasSaved = hasSavedProgress();
  var history  = getMatchHistory();
  document.getElementById('main-content').innerHTML=
    '<div style="padding:20px 0 8px">'+

    /* Hero */
    '<div style="text-align:center;padding:28px 20px 20px">'+
      '<div style="font-size:56px;line-height:1;margin-bottom:12px">🏏</div>'+
      '<div style="font-size:22px;font-weight:800;color:var(--c-text);letter-spacing:-.02em">Saturday Cricket</div>'+
      '<div style="font-size:13px;color:var(--c-text-soft);margin-top:4px">Score. Share. Celebrate.</div>'+
    '</div>'+

    /* Primary actions */
    '<div style="padding:0 16px 16px;display:flex;flex-direction:column;gap:10px">'+
      '<button class="btn-primary" style="font-size:17px;padding:18px;letter-spacing:-.01em" data-action="new-match-wizard">'+
        '&#127951; New Match'+
      '</button>'+
      (hasSaved?
        '<button class="btn-secondary" style="border-color:var(--c-primary);color:var(--c-primary)" data-action="load-progress">'+
          '&#9654;&#65039; Continue Saved Match'+
        '</button>'
      :'')+
      '<button class="btn-secondary" data-action="show-history">'+
        '&#128202; Match History'+(history.length?' <span style="background:var(--c-primary);color:#fff;border-radius:10px;padding:1px 7px;font-size:11px;font-weight:700;margin-left:4px">'+history.length+'</span>':'')+
      '</button>'+
    '</div>'+

    /* Join live */
    '<div style="margin:0 16px 16px;border:1.5px solid var(--c-border);border-radius:var(--radius-lg);overflow:hidden">'+
      '<div style="background:var(--c-blue-soft);padding:12px 14px;display:flex;align-items:center;gap:8px">'+
        '<span style="font-size:20px">📡</span>'+
        '<span style="font-size:13.5px;font-weight:700;color:#1d4fb0">Join a Live Match</span>'+
      '</div>'+
      '<div style="padding:12px 14px;background:var(--c-surface)">'+
        '<div style="font-size:12px;color:var(--c-text-soft);margin-bottom:8px">Enter the 6-character room code from the scorer</div>'+
        '<div style="display:flex;gap:8px">'+
          '<input id="inp-join-code" class="modal-input" style="margin:0;flex:1;text-transform:uppercase;letter-spacing:3px;font-weight:700;text-align:center;font-size:18px" maxlength="6" placeholder="ABC123" autocomplete="off">'+
          '<button class="btn-primary" style="width:auto;padding:10px 20px;margin:0;font-size:14px" data-action="join-live">Join</button>'+
        '</div>'+
        '<div id="join-err" style="font-size:12px;color:#c0392b;margin-top:6px;display:none">Enter the 6-character code (letters and numbers).</div>'+
      '</div>'+
    '</div>'+

    '</div>';
}

/* ── MATCH SETUP WIZARD ──────────────────────────────────────────────── */
function renderMatchWizard(step){
  step = step || 1;
  S._wizardStep = step;
  var mc = document.getElementById('main-content');

  /* Step 1 — Teams + Overs + Toss */
  if(step===1){
    var d = S._wizardData || {};
    mc.innerHTML=
      '<div class="setup-panel">'+
        _wizardHeader('Match Setup','Step 1 of 3 — Teams & Toss')+
        '<div class="form-group"><label>Team 1 Name</label><input id="inp-t1" placeholder="e.g. Kathmandu XI" value="'+(d.t1||'')+'"></div>'+
        '<div class="form-group"><label>Team 2 Name</label><input id="inp-t2" placeholder="e.g. Bhaktapur CC" value="'+(d.t2||'')+'"></div>'+
        '<div class="form-group">'+
          '<label>Overs per innings</label>'+
          '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:6px" id="overs-quick">'+
            [5,10,15,20].map(function(o){
              var sel=(d.overs||20)===o;
              return '<button type="button" class="btn" style="padding:12px 0;font-weight:700;font-size:15px'+(sel?';background:var(--c-primary-soft);border-color:var(--c-primary);color:var(--c-primary-dark)':'')+'" data-action="set-overs" data-val="'+o+'">'+o+'</button>';
            }).join('')+
          '</div>'+
          '<input id="inp-overs" type="number" min="1" max="100" step="1" value="'+(d.overs||20)+'" placeholder="Or type overs" style="width:100%;padding:10px 12px;border-radius:var(--radius-sm);border:1.5px solid var(--c-border);font-size:15px;background:var(--c-surface);color:var(--c-text);font-family:inherit">'+
          '<div id="overs-err" style="font-size:12px;color:#c0392b;margin-top:4px;display:none">Enter a whole number 1–100.</div>'+
        '</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
          '<div class="form-group"><label>Toss won by</label><select id="inp-toss"><option value="t1">Team 1</option><option value="t2">Team 2</option></select></div>'+
          '<div class="form-group"><label>Elected to</label><select id="inp-elect"><option value="bat">Bat</option><option value="bowl">Bowl</option></select></div>'+
        '</div>'+
        '<button class="btn-primary" data-action="wizard-step2">Next &#8594;</button>'+
        '<button class="btn-cancel" style="margin-top:8px" data-action="back-to-home">&#8592; Back</button>'+
      '</div>';
    /* restore toss selects */
    if(d.toss){ var ts=document.getElementById('inp-toss'); if(ts) ts.value=d.toss; }
    if(d.elect){ var es=document.getElementById('inp-elect'); if(es) es.value=d.elect; }
    return;
  }

  /* Step 2 — Team 1 Players */
  if(step===2){
    var d=S._wizardData||{};
    var prefill=d.p1||Array(11).fill('');
    mc.innerHTML=
      '<div class="setup-panel">'+
        _wizardHeader(d.t1+' — Playing XI','Step 2 of 3 — '+d.t1+' players')+
        '<div class="player-inputs">'+
          Array.from({length:11},function(_,i){
            return '<input id="t1p'+i+'" placeholder="Player '+(i+1)+'" value="'+(prefill[i]||'')+'">';
          }).join('')+
        '</div>'+
        '<button class="btn-primary" style="margin-top:8px" data-action="wizard-step3">Next &#8594;</button>'+
        '<button class="btn-cancel" style="margin-top:8px" data-action="wizard-back1">&#8592; Back</button>'+
      '</div>';
    return;
  }

  /* Step 3 — Team 2 Players */
  if(step===3){
    var d=S._wizardData||{};
    var prefill=d.p2||Array(11).fill('');
    mc.innerHTML=
      '<div class="setup-panel">'+
        _wizardHeader(d.t2+' — Playing XI','Step 3 of 3 — '+d.t2+' players')+
        '<div class="player-inputs">'+
          Array.from({length:11},function(_,i){
            return '<input id="t2p'+i+'" placeholder="Player '+(i+1)+'" value="'+(prefill[i]||'')+'">';
          }).join('')+
        '</div>'+
        '<button class="btn-primary" style="margin-top:8px" data-action="wizard-finish">&#127951; Start Match</button>'+
        '<button class="btn-cancel" style="margin-top:8px" data-action="wizard-back2">&#8592; Back</button>'+
      '</div>';
    return;
  }
}

/* After step 1: choose new players or reuse a previous match's XI */
function renderPlayerChoice(){
  var d=S._wizardData||{};
  var history=getMatchHistory();
  var html='<div class="setup-panel">'+
    _wizardHeader(d.t1+' vs '+d.t2, d.overs+' overs — '+d.batFirst+' bat first')+
    '<div style="font-size:15px;font-weight:700;color:var(--c-text);margin-bottom:14px;text-align:center">Choose Players</div>'+
    '<button class="btn-primary" style="margin-bottom:10px" data-action="wizard-new-players">&#128101; Enter New Players</button>';
  history.forEach(function(m,idx){
    html+='<button class="btn-secondary" style="margin-bottom:8px" data-action="wizard-prev-players" data-val="'+idx+'">'+
      '&#128257; Use Players from: '+m.team1+' vs '+m.team2+' ('+m.date+')</button>';
  });
  html+='<button class="btn-cancel" style="margin-top:8px" data-action="wizard-back1">&#8592; Back</button></div>';
  document.getElementById('main-content').innerHTML=html;
}

function _wizardHeader(title, sub){
  return '<div style="margin-bottom:18px">'+
    '<div style="font-size:18px;font-weight:800;color:var(--c-text)">'+title+'</div>'+
    '<div style="font-size:12px;color:var(--c-primary);font-weight:600;margin-top:2px">'+sub+'</div>'+
  '</div>';
}

function _wizardCollect1(){
  var t1=(document.getElementById('inp-t1')||{value:''}).value.trim()||'Team 1';
  var t2=(document.getElementById('inp-t2')||{value:''}).value.trim()||'Team 2';
  var oversVal=parseInt((document.getElementById('inp-overs')||{value:'20'}).value);
  var oversErr=document.getElementById('overs-err');
  if(!oversVal||oversVal<1||oversVal>100||isNaN(oversVal)){
    if(oversErr) oversErr.style.display='block'; return null;
  }
  if(oversErr) oversErr.style.display='none';
  var toss=(document.getElementById('inp-toss')||{value:'t1'}).value;
  var elect=(document.getElementById('inp-elect')||{value:'bat'}).value;
  var tossWon=toss==='t1'?t1:t2;
  var batFirst=elect==='bat'?tossWon:(tossWon===t1?t2:t1);
  S._wizardData=S._wizardData||{};
  S._wizardData.t1=t1; S._wizardData.t2=t2; S._wizardData.overs=oversVal;
  S._wizardData.toss=toss; S._wizardData.elect=elect; S._wizardData.batFirst=batFirst;
  return S._wizardData;
}

function _wizardCollect2(){
  var p1=Array.from({length:11},function(_,i){
    var el=document.getElementById('t1p'+i); return el&&el.value.trim()?el.value.trim():'';
  });
  S._wizardData.p1=p1;
}

function _wizardCollect3(){
  var p2=Array.from({length:11},function(_,i){
    var el=document.getElementById('t2p'+i); return el&&el.value.trim()?el.value.trim():'';
  });
  S._wizardData.p2=p2;
}

/* ── SCORING SCREEN ─────────────────────────────────────────────────── */
function renderScoring(){
  var s=sc(), tgt=target();
  var reqR=tgt?tgt-s.runs:null;
  var reqB=tgt?(S.match.overs*6)-s.balls:null;
  var reqRR=reqB&&reqB>0?(reqR/(reqB/6)).toFixed(2):'0.00';
  var bt=S.match.batFirst, bw=bt===S.match.team1?S.match.team2:S.match.team1;
  var battingTeam=S.innings===1?bt:bw;

  var emptyBalls=Math.max(0,6-legalCount());
  var ballsHtml=S.thisBalls.map(function(b){ return '<div class="ball ball-'+ballClass(b)+'">'+b+'</div>'; }).join('');
  for(var e=0;e<emptyBalls;e++) ballsHtml+='<div class="ball ball-empty"></div>';

  var targetBar='';
  if(tgt){
    if(s.runs>=tgt){
      var wicketsLeft=10-s.wickets;
      targetBar='<div class="target-bar" style="background:#E1F5EE;color:#0F6E56;font-weight:700;font-size:14px;border:1px solid #9FE1CB">&#127942; '+battingTeam+' won by '+wicketsLeft+' wicket'+(wicketsLeft===1?'':'s')+'!</div>';
    } else {
      var chasePct=Math.min(100,Math.round((s.runs/tgt)*100));
      var curRRnum=parseFloat(rr(s)), reqRRnum=parseFloat(reqRR);
      var meterColor=reqRRnum>curRRnum+3?'#791F1F':reqRRnum>curRRnum?'#633806':'#0F6E56';
      targetBar=
        '<div class="target-bar" style="padding:10px 12px">'+
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'+
            '<span style="font-size:13px;font-weight:700">&#127919; Need '+reqR+' off '+reqB+'b</span>'+
            '<span style="font-size:12px;font-weight:700;color:'+meterColor+'">Req RR: '+reqRR+'</span>'+
          '</div>'+
          '<div style="background:rgba(0,0,0,0.12);border-radius:8px;height:8px;overflow:hidden">'+
            '<div style="background:linear-gradient(90deg,'+meterColor+','+meterColor+'cc);width:'+chasePct+'%;height:100%;border-radius:8px;transition:width 0.4s ease"></div>'+
          '</div>'+
          '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--c-text-soft);margin-top:4px">'+
            '<span>'+s.runs+' scored</span>'+
            '<span>Target: '+tgt+'</span>'+
          '</div>'+
        '</div>';
    }
  }

  var html=
    '<div class="scoreboard">'+
      '<div class="team-names"><span class="team-name"><img src="'+TEAM_LOGO+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:6px">'+battingTeam+' &#127951;</span><span style="font-size:13px;color:#888">Inn.'+S.innings+'</span></div>'+
      '<div class="score-main">'+
        '<div class="score-runs">'+s.runs+'/'+s.wickets+'</div>'+
        '<div class="score-info"><div class="score-overs">'+overs(s)+' overs</div><div class="score-rr">RR: '+rr(s)+'</div></div>'+
      '</div>'+
      targetBar+
      '<div class="this-over"><div class="over-label">This over</div><div class="balls-row">'+ballsHtml+'</div></div>'+
    '</div>';

  if(S.confirmEndInnings){
    html+=
      '<div class="modal-box" style="border:1px solid #F7C1C1;background:#FFF5F5;margin-bottom:12px">'+
        '<div style="font-size:15px;font-weight:700;color:#791F1F;margin-bottom:8px">&#9888;&#65039; End Innings?</div>'+
        '<div style="font-size:13px;color:#555;margin-bottom:14px">Current score: <strong>'+s.runs+'/'+s.wickets+'</strong> ('+overs(s)+' ov). This cannot be undone.</div>'+
        '<button class="btn-primary" style="background:#791F1F;margin-bottom:8px" data-action="confirm-end-innings">&#9989; Yes, End Innings</button>'+
        '<button class="btn-cancel" data-action="cancel-end-innings">Cancel</button>'+
      '</div>';
  } else if(S.dismissalPending){
    var bname=bat().name;
    var wname=bowl().name;
    var types=[
      {id:'bowled',    icon:'<img src="'+BOWLED_IMG+'" style="width:44px;height:44px;object-fit:cover;border-radius:8px;display:block;margin:0 auto 2px">', label:"Bowled",      desc:"Ball hits stumps"},
      {id:'caught',    icon:'<img src="'+CAUGHT_IMG+'" style="width:44px;height:44px;object-fit:cover;border-radius:8px;display:block;margin:0 auto 2px">', label:"Caught",     desc:"Fielder/keeper catch"},
      {id:'stumped',   icon:'<img src="'+STUMPED_IMG+'" style="width:44px;height:44px;object-fit:cover;border-radius:8px;display:block;margin:0 auto 2px">', label:"Stumped",    desc:"Keeper hits stumps"},
      {id:'runout',    icon:'<img src="'+RUNOUT_IMG+'" style="width:44px;height:44px;object-fit:cover;border-radius:8px;display:block;margin:0 auto 2px">', label:"Run Out",    desc:"Direct / relay throw"},
      {id:'hitwicket', icon:'<svg viewBox="0 0 32 32" width="22" height="22"><rect x="20" y="12" width="3" height="10" rx="1" fill="#c8a96e"/><rect x="24" y="12" width="3" height="10" rx="1" fill="#c8a96e"/><rect x="20" y="11" width="7" height="2" rx="1" fill="#e8d5a3"/><path d="M6 26 Q10 18 16 12" fill="none" stroke="#c8a96e" stroke-width="4" stroke-linecap="round"/><path d="M14 14 Q18 10 20 13" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round"/></svg>', label:"Hit Wicket",  desc:"Bat hits stumps"},
      {id:'retiredhurt',icon:'&#129657;',label:'Retired Hurt',   desc:'Injury — can return'},
      {id:'retiredout', icon:'&#128683;',label:'Retired Out',    desc:'Voluntary — cannot return'},
    ];
    var dt=S.dismissalType;
    var typeGrid=types.map(function(t){
      var sel=(dt===t.id);
      return '<button class="dism-btn'+(sel?' dism-btn-sel':'')+'" data-action="set-dismissal" data-val="'+t.id+'" title="'+t.desc+'">'+
        '<span class="dism-icon">'+t.icon+'</span>'+
        '<span class="dism-label">'+t.label+'</span>'+
        '<span class="dism-desc">'+t.desc+'</span>'+
      '</button>';
    }).join('');

    var detailHtml='';
    var fieldingChips=S.bowling.map(function(b,i){
      return '<button type="button" class="bowler-chip bowler-chip-used" style="min-width:80px" onclick="document.getElementById(this.dataset.inp).value=this.dataset.name" data-inp="" data-name="'+b.name+'">'+
        '<span class="chip-name">'+b.name+'</span>'+
      '</button>';
    });
    function fielderChipRow(inputId){
      return '<div class="bowler-chip-grid" style="margin-bottom:6px">'+
        fieldingChips.map(function(c){ return c.replace('data-inp=""','data-inp="'+inputId+'"'); }).join('')+
      '</div>';
    }
    if(dt==='caught'){
      detailHtml=
        '<div class=\"dism-detail\">'+
          '<div class=\"dism-field\"><label>Caught by</label>'+
            fielderChipRow('inp-catcher')+
            '<input id=\"inp-catcher\" class=\"modal-input\" placeholder=\"Or type fielder / keeper name\" style=\"margin:0\">'+
          '</div>'+
          '<div class=\"dism-hint\">Wicket credited to current bowler: <strong>'+wname+'</strong></div>'+
        '</div>';
    } else if(dt==='stumped'){
      detailHtml=
        '<div class="dism-detail">'+
          '<div class="dism-field"><label>Stumped by (WK)</label>'+
            fielderChipRow('inp-wk')+
            '<input id="inp-wk" class="modal-input" placeholder="Or type wicketkeeper name" style="margin:0">'+
          '</div>'+
          '<div class="dism-hint">Bowler credit: '+wname+'</div>'+
        '</div>';
    } else if(dt==='runout'){
      var roSname=bat().name, roNsname=ns().name;
      detailHtml=
        '<div class="dism-detail">'+
          '<div class="dism-field"><label>Who is out?</label>'+
            '<div style="display:flex;gap:8px;margin-bottom:6px">'+
              '<button type="button" id="ro-striker-btn" onclick="document.getElementById(\'inp-ro-who\').value=\'striker\';document.getElementById(\'ro-striker-btn\').style.background=\'#FCEBEB\';document.getElementById(\'ro-striker-btn\').style.borderColor=\'#791F1F\';document.getElementById(\'ro-ns-btn\').style.background=\'#fff\';document.getElementById(\'ro-ns-btn\').style.borderColor=\'#ddd\';document.getElementById(\'ro-ns-btn\').style.color=\'#1a1a1a\'" style="flex:1;padding:10px;border-radius:10px;border:2px solid #791F1F;background:#FCEBEB;cursor:pointer;font-size:13px;font-weight:700;color:#791F1F">&#11088; '+roSname+'<br><span style="font-size:11px;font-weight:400">Striker</span></button>'+
              '<button type="button" id="ro-ns-btn" onclick="document.getElementById(\'inp-ro-who\').value=\'nonstriker\';document.getElementById(\'ro-ns-btn\').style.background=\'#FCEBEB\';document.getElementById(\'ro-ns-btn\').style.borderColor=\'#791F1F\';document.getElementById(\'ro-ns-btn\').style.color=\'#791F1F\';document.getElementById(\'ro-striker-btn\').style.background=\'#fff\';document.getElementById(\'ro-striker-btn\').style.borderColor=\'#ddd\';document.getElementById(\'ro-striker-btn\').style.color=\'#1a1a1a\'" style="flex:1;padding:10px;border-radius:10px;border:2px solid #ddd;background:#fff;cursor:pointer;font-size:13px;font-weight:700;color:#1a1a1a">'+roNsname+'<br><span style="font-size:11px;font-weight:400">Non-Striker</span></button>'+
            '</div>'+
            '<input type="hidden" id="inp-ro-who" value="striker">'+
          '</div>'+
          '<div class="dism-field" style="margin-top:8px"><label>Runs scored</label>'+
            '<div style="display:flex;gap:6px;margin-bottom:6px" id="ro-runs-row">'+
              [0,1,2,3,4].map(function(r){
                return '<button type="button" onclick="document.getElementById(\'inp-ro-runs\').value=\''+r+'\';Array.from(document.getElementById(\'ro-runs-row\').querySelectorAll(\'button\')).forEach(function(b){b.style.background=\'#fff\';b.style.borderColor=\'#ddd\'});this.style.background=\'#E1F5EE\';this.style.borderColor=\'#0F6E56\'" style="flex:1;padding:10px;border-radius:10px;border:2px solid '+(r===0?'#0F6E56':'#ddd')+';background:'+(r===0?'#E1F5EE':'#fff')+';cursor:pointer;font-size:16px;font-weight:700">'+r+'</button>';
              }).join('')+
            '</div>'+
            '<input type="hidden" id="inp-ro-runs" value="0">'+
          '</div>'+
          '<div class="dism-field" style="margin-top:8px"><label>Fielder 1</label>'+
            fielderChipRow('inp-f1')+
            '<input id="inp-f1" class="modal-input" placeholder="Or type primary fielder" style="margin:0">'+
          '</div>'+
          '<div class="dism-field" style="margin-top:8px"><label>Fielder 2 (relay — optional)</label>'+
            fielderChipRow('inp-f2')+
            '<input id="inp-f2" class="modal-input" placeholder="Or type relay fielder" style="margin:0">'+
          '</div>'+
          '<div class="dism-hint">Run out does not credit a wicket to any bowler</div>'+
        '</div>';
    } else if(dt==='bowled'){
      detailHtml='<div class="dism-hint" style="margin-top:6px">&#127992; Wicket credited to '+wname+'</div>';
    } else if(dt==='hitwicket'){
      detailHtml='<div class="dism-hint" style="margin-top:6px">&#128296; Wicket credited to '+wname+'</div>';
    } else if(dt==='retiredhurt'){
      detailHtml='<div class="dism-hint" style="background:#FFF8E1;color:#7B5800;border-color:#FFD54F;margin-top:6px">&#129657; Not counted as a wicket. '+bname+' can return to bat later.</div>';
    } else if(dt==='retiredout'){
      detailHtml='<div class="dism-hint" style="background:#FCEBEB;color:#791F1F;border-color:#F7C1C1;margin-top:6px">&#128683; Counted as a wicket. '+bname+' cannot return.</div>';
    }

    var canConfirm = dt && dt!=='';
    html+=
      '<div class="modal-box modal-red">'+
        '<div class="modal-title-red">&#128308; How was '+bname+' dismissed?</div>'+
        '<div class="dism-grid">'+typeGrid+'</div>'+
        detailHtml+
        (canConfirm?
          '<button class="btn-primary" style="margin-top:10px" data-action="confirm-dismissal">Confirm Dismissal</button>'
          :'<div style="font-size:12px;color:#aaa;text-align:center;margin-top:8px">Select a dismissal type above</div>'
        )+
        '<button class="btn-cancel" style="margin-top:6px" data-action="cancel-dismissal">Cancel</button>'+
      '</div>';
  } else if(S.wicketPending){
    var activeSlots=[S.outIdx===S.strikerIdx?S.nonStrikerIdx:S.strikerIdx];
    var retiredHurt=[], notYet=[];
    S.batting.forEach(function(b,i){
      if(b.out) return;
      if(activeSlots.indexOf(i)>=0) return;
      if(b.retiredHurt) retiredHurt.push({b:b,i:i});
      else notYet.push({b:b,i:i});
    });
    var rhChips=retiredHurt.map(function(o){
      return '<button class="bowler-chip" style="border-color:#FFD54F;background:#FFF8E1" data-action="pick-batsman" data-val="'+o.i+'">'+
        '<span class="chip-name">&#129657; '+o.b.name+'</span>'+
        '<span class="chip-stat">'+o.b.runs+'r ('+o.b.balls+'b) — retired hurt</span>'+
      '</button>';
    }).join('');
    var freshChips=notYet.map(function(o){
      return '<button class="bowler-chip" style="border-color:#F7C1C1;background:#FFF5F5" data-action="pick-batsman" data-val="'+o.i+'">'+
        '<span class="chip-name">'+o.b.name+'</span>'+
        '<span class="chip-stat">'+(o.b.balls>0?o.b.runs+'r ('+o.b.balls+'b)':'yet to bat')+'</span>'+
      '</button>';
    }).join('');
    var remaining=notYet.length+retiredHurt.length;
    html+=
      '<div class="modal-box modal-red">'+
        '<div class="modal-title-red">&#128308; Next Batsman <span style="font-size:12px;font-weight:400;color:#aaa">('+remaining+' remaining)</span></div>'+
        (rhChips?'<div class="chip-label" style="color:#7B5800">&#129657; Retired hurt — can return</div><div class="bowler-chip-grid" style="margin-bottom:10px">'+rhChips+'</div>':'')+
        (freshChips?'<div class="chip-label">Batting order</div><div class="bowler-chip-grid" style="margin-bottom:10px">'+freshChips+'</div>':'')+
        (!freshChips&&!rhChips?'<div class="chip-label" style="color:#aaa">All listed players have batted</div>':'')+
        '<div class="chip-label" style="margin-top:4px">&#43; Add substitute / new player</div>'+
        '<div style="display:flex;gap:6px">'+
          '<input id="new-bat-inp" class="modal-input" style="margin-bottom:0;flex:1" placeholder="Player name (not in XI)">'+
          '<button class="btn-primary" style="width:auto;padding:10px 14px;margin:0;font-size:13px" data-action="confirm-batsman">&#10003;</button>'+
        '</div>'+
      '</div>';
  } else if(S.overDone||!S.bowlerConfirmed){
    var lastBowlerIdx=(S.bowlerConfirmed && bowl().balls>0) ? S.bowlerIdx : -1;
    var bowled=[], notBowled=[];
    S.bowling.forEach(function(b,i){
      if(i===lastBowlerIdx) return;
      if(b.balls>0) bowled.push({b:b,i:i});
      else notBowled.push({b:b,i:i});
    });
    bowled.sort(function(a,b){ return b.b.balls-a.b.balls; });
    var prevChips=bowled.map(function(o){
      var b=o.b; var ovStr=Math.floor(b.balls/6)+'.'+b.balls%6;
      return '<button class="bowler-chip bowler-chip-used" data-action="pick-bowler" data-val="'+o.i+'">'+
        '<span class="chip-name">'+b.name+'</span>'+
        '<span class="chip-stat">'+ovStr+'ov '+b.runs+'r '+b.wickets+'w</span>'+
      '</button>';
    }).join('');
    var freshChips=notBowled.map(function(o){
      var b=o.b;
      return '<button class="bowler-chip bowler-chip-fresh" data-action="pick-bowler" data-val="'+o.i+'">'+
        '<span class="chip-name">'+b.name+'</span>'+
        '<span class="chip-stat">new</span>'+
      '</button>';
    }).join('');
    html+=
      '<div class="modal-box modal-blue">'+
        '<div class="modal-title-blue" style="display:flex;align-items:center;gap:8px">'+(S.overDone?'<span>&#9989; Over complete! Pick next bowler</span>':'<img src="'+BOWLER_IMG+'" style="width:44px;height:44px;object-fit:cover;border-radius:50%;border:2px solid #B5D4F4;flex-shrink:0"><span>Who is bowling the first over?</span>')+'</div>'+
        (prevChips?'<div class="chip-label">Previously bowled</div><div class="bowler-chip-grid">'+prevChips+'</div>':'')+
        (freshChips?'<div class="chip-label" style="margin-top:8px">Available (new)</div><div class="bowler-chip-grid">'+freshChips+'</div>':'')+
        '<div class="chip-label" style="margin-top:10px">Or type a name</div>'+
        '<div style="display:flex;gap:6px">'+
          '<input id="bowler-inp" class="modal-input" style="margin-bottom:0;flex:1" placeholder="Bowler name">'+
          '<button class="btn-primary" style="width:auto;padding:10px 14px;margin:0;font-size:13px" data-action="confirm-bowler">&#10003;</button>'+
        '</div>'+
      '</div>';
  } else if(S.extrasPanel){
    var isWD=S.extrasPanel==='WD';
    var isNB=S.extrasPanel==='NB';
    var isBYE=S.extrasPanel==='BYE';
    var isLB=S.extrasPanel==='LB';
    var extAction=isWD?'wide':isNB?'noball':isBYE?'bye':'legbye';
    var extStyle=isBYE?'background:#E8F0FE;color:#185FA5;border-color:#B5D4F4':(isLB?'background:#EDE8FE;color:#4A2FA5;border-color:#C4B5F4':'');
    var extBtns=[0,1,2,3,4,5,6].map(function(r){
      return '<button class="btn '+(isWD||isNB?'btn-wd':'')+'" '+(extStyle?'style="'+extStyle+';padding:12px 0;font-size:15px"':'style="padding:12px 0;font-size:15px"')+' data-action="'+extAction+'" data-val="'+r+'">'+(r===0?'0':'+'+r)+'</button>';
    }).join('');
    var extTitle=isWD?'&#127937; Wide':isNB?'&#128992; No Ball':isBYE?'&#128518; Byes':'&#129461; Leg Byes';
    html+=
      '<div class="modal-box" style="border:1px solid '+(isWD||isNB?'#FAC775':isBYE?'#B5D4F4':'#C4B5F4')+';background:'+(isWD||isNB?'#FFFBF2':isBYE?'#EFF6FD':'#F5F0FF')+';margin-bottom:12px">'+
        '<div class="modal-title-amber" style="color:'+(isWD||isNB?'#633806':isBYE?'#185FA5':'#4A2FA5')+'">'+extTitle+' &mdash; how many runs?</div>'+
        '<div class="extras-grid">'+extBtns+'</div>'+
        '<button class="btn-cancel" data-action="cancel-extras">Cancel</button>'+
      '</div>';
  } else {
    var strikerContent;
    if(S.editStriker){
      var allBatChips = S.batting.map(function(b,i){
        if(b.out) return null;
        return '<button class="bowler-chip" style="border-color:#9FE1CB;background:#E1F5EE;margin-bottom:2px" data-action="pick-striker" data-val="'+i+'">'+
          '<span class="chip-name">'+b.name+'</span>'+
          '<span class="chip-stat">'+(b.balls>0?b.runs+'r ('+b.balls+'b)':'yet to bat')+'</span>'+
        '</button>';
      }).filter(Boolean).join('');
      strikerContent=
        '<div style="font-size:11px;color:#0F6E56;font-weight:600;margin-bottom:6px">&#9999; Select or rename striker</div>'+
        (allBatChips?'<div class="bowler-chip-grid" style="margin-bottom:8px">'+allBatChips+'</div>':'')+
        '<input id="striker-edit-inp" class="modal-input" style="margin-bottom:6px" value="'+bat().name+'" placeholder="Or type new name">'+
        '<div class="flex-row">'+
          '<button class="btn-primary flex-1" style="margin:0;font-size:13px;padding:8px" data-action="save-striker">Save Name</button>'+
          '<button class="btn-cancel flex-1" style="margin-left:6px" data-action="cancel-edit-striker">Cancel</button>'+
        '</div>';
    } else {
      strikerContent=
        '<button class="edit-btn" data-action="edit-striker" title="Edit name">&#9999;&#65039;</button>'+
        '<div data-action="swap-batters" style="cursor:pointer">'+
          '<div class="batter-name">* '+bat().name+'</div>'+
          '<div class="batter-score">'+bat().runs+' ('+bat().balls+'b) '+bat().fours+'&times;4 '+bat().sixes+'&times;6</div>'+
        '</div>';
    }
    html+=
      '<div class="scoring-panel">'+
        '<div class="batters-row">'+
          '<div class="batter-card striker">'+strikerContent+'</div>'+
          '<div class="batter-card" data-action="swap-batters">'+
            '<div class="batter-name">'+ns().name+'</div>'+
            '<div class="batter-score">'+ns().runs+' ('+ns().balls+'b) '+ns().fours+'&times;4 '+ns().sixes+'&times;6</div>'+
          '</div>'+
        '</div>'+
        (function(){
          var lastFow=S.fow.length>0?S.fow[S.fow.length-1]:null;
          var lastFowParts=(lastFow?lastFow.over:'0.0').split('.');
          var lastFowBalls=parseInt(lastFowParts[0])*6+parseInt(lastFowParts[1]||0);
          var baseScore=lastFow?lastFow.score:0, baseBalls=lastFow?lastFowBalls+1:0;
          var lastBreak=S.partnershipBreaks.length?S.partnershipBreaks[S.partnershipBreaks.length-1]:null;
          if(lastBreak && lastBreak.balls>=baseBalls){ baseScore=lastBreak.score; baseBalls=lastBreak.balls; }
          var partRuns=s.runs-baseScore;
          var partBalls=s.balls-baseBalls;
          var pRR=partBalls>0?(partRuns/(partBalls/6)).toFixed(2):'0.00';
          return '<div style="display:flex;justify-content:space-between;align-items:center;background:#F0FDF9;border:1px solid #9FE1CB;border-radius:10px;padding:8px 12px;margin-bottom:10px">'+
            '<span style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.5px">&#129309; Partnership</span>'+
            '<span style="font-size:16px;font-weight:800;color:#0F6E56">'+partRuns+' runs</span>'+
            '<span style="font-size:11px;color:#888">'+partBalls+' balls &bull; RR '+pRR+'</span>'+
          '</div>';
        })()+
        (S.editBowler?
          '<div style="background:#EFF6FD;border:1px solid #B5D4F4;border-radius:10px;padding:10px;margin-bottom:10px">'+
            '<div style="font-size:11px;color:#185FA5;font-weight:600;margin-bottom:8px">&#9999; Select or rename bowler</div>'+
            '<div class="bowler-chip-grid" style="margin-bottom:8px">'+
              S.bowling.map(function(b,i){
                var isCur=(i===S.bowlerIdx);
                return '<button class="bowler-chip'+(isCur?' bowler-chip-used':' bowler-chip-fresh')+'" data-action="pick-bowler-edit" data-val="'+i+'">'+
                  '<span class="chip-name">'+(isCur?'&#9658; ':'')+b.name+'</span>'+
                  '<span class="chip-stat">'+(b.balls>0?Math.floor(b.balls/6)+'.'+b.balls%6+'ov '+b.runs+'r '+b.wickets+'w':'new')+'</span>'+
                '</button>';
              }).join('')+
            '</div>'+
            '<div style="font-size:11px;color:#888;margin-bottom:5px">Or rename current bowler:</div>'+
            '<div style="display:flex;gap:6px">'+
              '<input id="bowler-edit-inp" style="flex:1;padding:7px 10px;border-radius:8px;border:1px solid #ddd;font-size:14px;background:#fff;color:#1a1a1a" value="'+bowl().name+'" placeholder="Bowler name">'+
              '<button class="btn-primary" style="width:auto;padding:7px 12px;font-size:13px;margin:0" data-action="save-bowler">Save</button>'+
              '<button class="btn-cancel" style="width:auto;padding:7px 10px" data-action="cancel-edit-bowler">✕</button>'+
            '</div>'+
          '</div>'
          :
          '<div class="bowler-bar" style="display:flex;align-items:center;justify-content:space-between">'+
            '<span><svg width="15" height="15" viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:3px;display:inline-block"><circle cx="7.5" cy="7.5" r="7" fill="#ffffff" stroke="#999" stroke-width="0.8"/><path d="M7.5 0.5 C9.8 3.5 9.8 11.5 7.5 14.5" fill="none" stroke="#cc0000" stroke-width="1.1" stroke-linecap="round"/><path d="M7.5 0.5 C5.2 3.5 5.2 11.5 7.5 14.5" fill="none" stroke="#cc0000" stroke-width="1.1" stroke-linecap="round"/><line x1="8.2" y1="2" x2="9.3" y2="2.4" stroke="#cc0000" stroke-width="0.55"/><line x1="8.5" y1="4" x2="9.6" y2="4.4" stroke="#cc0000" stroke-width="0.55"/><line x1="8.6" y1="6" x2="9.7" y2="6.4" stroke="#cc0000" stroke-width="0.55"/><line x1="8.6" y1="8" x2="9.7" y2="8.4" stroke="#cc0000" stroke-width="0.55"/><line x1="8.5" y1="10" x2="9.6" y2="10.4" stroke="#cc0000" stroke-width="0.55"/><line x1="8.2" y1="12" x2="9.3" y2="12.4" stroke="#cc0000" stroke-width="0.55"/><line x1="6.8" y1="2" x2="5.7" y2="2.4" stroke="#cc0000" stroke-width="0.55"/><line x1="6.5" y1="4" x2="5.4" y2="4.4" stroke="#cc0000" stroke-width="0.55"/><line x1="6.4" y1="6" x2="5.3" y2="6.4" stroke="#cc0000" stroke-width="0.55"/><line x1="6.4" y1="8" x2="5.3" y2="8.4" stroke="#cc0000" stroke-width="0.55"/><line x1="6.5" y1="10" x2="5.4" y2="10.4" stroke="#cc0000" stroke-width="0.55"/><line x1="6.8" y1="12" x2="5.7" y2="12.4" stroke="#cc0000" stroke-width="0.55"/></svg>'+bowl().name+' &mdash; '+Math.floor(bowl().balls/6)+'.'+bowl().balls%6+'-'+bowl().runs+'-'+bowl().wickets+'</span>'+
            '<button style="background:none;border:none;cursor:pointer;font-size:14px;padding:2px 4px" data-action="edit-bowler" title="Edit bowler name">&#9999;&#65039;</button>'+
          '</div>'
        )+
        '<div class="btn-grid">'+
          '<button class="btn" data-action="runs" data-val="0">0</button>'+
          '<button class="btn" data-action="runs" data-val="1">1</button>'+
          '<button class="btn" data-action="runs" data-val="2">2</button>'+
          '<button class="btn" data-action="runs" data-val="3">3</button>'+
          '<button class="btn btn-4" data-action="runs" data-val="4">4</button>'+
          '<button class="btn btn-6" data-action="runs" data-val="6">6</button>'+
          '<button class="btn btn-W" data-action="wicket" style="font-size:11px;font-weight:800;color:#791F1F;letter-spacing:.5px">WICKET</button>'+
          '<button class="btn btn-wd" data-action="open-extras" data-val="WD">Wide</button>'+
        '</div>'+
        '<div class="extras-row">'+
          '<button class="btn btn-nb" data-action="open-extras" data-val="NB">No Ball</button>'+
          '<button class="btn" style="background:#F0F7FF;color:#185FA5;border-color:#B5D4F4;font-size:12px" data-action="open-extras" data-val="BYE">Byes</button>'+
          '<button class="btn" style="background:#F5F0FF;color:#4A2FA5;border-color:#C4B5F4;font-size:12px" data-action="open-extras" data-val="LB">Leg Byes</button>'+
        '</div>'+
        '<div class="action-row">'+
          '<button class="btn-undo" data-action="undo" '+(S.snapshots.length===0?'disabled':'')+'>&#8630; Undo</button>'+
          '<button class="btn" style="flex:1;font-size:12px;padding:10px 2px" data-action="save-progress">&#128190; Save</button>'+
          '<button class="btn btn-danger" style="flex:1;font-size:12px;padding:10px 2px" data-action="end-innings">End Inn.</button>'+
        '</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'+
          '<button class="btn" style="background:var(--c-blue-soft);color:#1d4fb0;border-color:#c7d8fb;font-size:12px;font-weight:700;padding:10px 4px" data-action="share-match">&#128225; Share</button>'+
          '<button class="btn" style="background:var(--c-amber-soft);color:var(--c-amber);border-color:#f5dca0;font-size:12px;font-weight:700;padding:10px 4px" data-action="export-pdf">&#128438; Export PDF</button>'+
        '</div>'+
        (function(){
          var dotCnt=0,fourCnt=0,sixCnt=0,extraCnt=0,runsCnt=0;
          S.thisBalls.forEach(function(b){
            if(b==='0') dotCnt++;
            else if(b==='4'){ fourCnt++; runsCnt+=4; }
            else if(b==='6'){ sixCnt++; runsCnt+=6; }
            else if(b.indexOf('WD')===0||b.indexOf('NB')===0) extraCnt++;
            else if(!isNaN(parseInt(b))&&b.indexOf('W')<0) runsCnt+=parseInt(b);
          });
          if(S.thisBalls.length===0) return '';
          return '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;background:#f8faf7;border:1px solid #e8ede8;border-radius:10px;padding:8px;margin-bottom:6px;text-align:center">'+
            '<div><div style="font-size:16px;font-weight:800;color:#aaa">'+dotCnt+'</div><div style="font-size:10px;color:#bbb;margin-top:1px">Dots</div></div>'+
            '<div><div style="font-size:16px;font-weight:800;color:#0F6E56">'+fourCnt+'</div><div style="font-size:10px;color:#bbb;margin-top:1px">Fours</div></div>'+
            '<div><div style="font-size:16px;font-weight:800;color:#185FA5">'+sixCnt+'</div><div style="font-size:10px;color:#bbb;margin-top:1px">Sixes</div></div>'+
            '<div><div style="font-size:16px;font-weight:800;color:#633806">'+extraCnt+'</div><div style="font-size:10px;color:#bbb;margin-top:1px">Extras</div></div>'+
          '</div>';
        })()+
        (function(){
          var pr=S.partnershipRuns, pb=S.partnershipBalls;
          if(pb===0&&pr===0) return '<div class="hint">Tap batter cards to swap strike</div>';
          var psr=pb>0?((pr/pb)*100).toFixed(0):'0';
          return '<div class="partnership-chip">'+
            '<span>Partnership</span>'+
            '<span><b>'+pr+'</b> runs &nbsp;·&nbsp; <b>'+pb+'</b> balls &nbsp;·&nbsp; SR <b>'+psr+'</b></span>'+
          '</div>'+
          '<div class="hint">Tap batter cards to swap strike</div>';
        })()+
      '</div>';
  }

  var tabNames={live:'Live',batting:'Batting',bowling:'Bowling',fow:'FoW',overs:'Overs'};
  var tabsHtml='<div class="tabs">';
  ['live','batting','bowling','fow','overs'].forEach(function(t){
    tabsHtml+='<div class="tab'+(S.activeTab===t?' active':'')+'" data-action="tab" data-val="'+t+'">'+tabNames[t]+'</div>';
  });
  tabsHtml+='</div>';
  html+=tabsHtml;

  if(S.activeTab==='live'){
    html+=
      '<div class="card"><div class="section-title">At the crease</div>'+
        '<div class="info-row"><span>Striker &#11088;</span><span>'+bat().name+' &mdash; '+bat().runs+'* ('+bat().balls+'b) SR '+(bat().balls>0?((bat().runs/bat().balls)*100).toFixed(0):'—')+'</span></div>'+
        '<div class="info-row"><span>Non-striker</span><span>'+ns().name+' &mdash; '+ns().runs+' ('+ns().balls+'b) SR '+(ns().balls>0?((ns().runs/ns().balls)*100).toFixed(0):'—')+'</span></div>'+
        '<div class="info-row"><span>Bowler</span><span>'+bowl().name+' &mdash; '+Math.floor(bowl().balls/6)+'.'+bowl().balls%6+'-'+bowl().runs+'-'+bowl().wickets+'</span></div>'+
        '<div class="info-row"><span>Partnership</span><span>'+S.partnershipRuns+' runs ('+S.partnershipBalls+'b)'+(S.partnershipBalls>0?' SR '+((S.partnershipRuns/S.partnershipBalls)*100).toFixed(0):'')+'</span></div>'+
        '<div class="info-row"><span>Extras</span><span>WD:'+s.wide+' NB:'+s.nb+' B:'+(s.byes||0)+' LB:'+(s.legbyes||0)+'</span></div>'+
        (S.innings===1&&s.balls>0?'<div class="info-row" style="background:var(--c-blue-soft)"><span style="color:var(--c-blue);font-weight:600">Projected</span><span style="color:var(--c-blue);font-weight:700">'+Math.round((s.runs/(s.balls/6))*S.match.overs)+' — '+Math.round(((s.runs+5)/(s.balls/6))*S.match.overs)+' (est.)</span></div>':'')+
        (S.overHistory.length>=3?(function(){
          var last3=S.overHistory.slice(-3);
          var r3=last3.reduce(function(a,ov){ return a+ov.reduce(function(b2,x){ return b2+(x==='W'||x.indexOf('WD')>=0||x.indexOf('NB')>=0?0:parseInt(x)||0); },0); },0);
          return '<div class="info-row"><span>Last 3 overs</span><span>'+r3+' runs ('+((r3/3)*6/6).toFixed(1)+' RR)</span></div>';
        })():'')+
      '</div>';
  } else if(S.activeTab==='batting'){
    var active=[S.strikerIdx,S.nonStrikerIdx];
    function makeBatRows(arr, activeIdxs, strikerI, nonStrikerI, orderArr){
      var order=orderArr||[];
      var notBatted=[];
      for(var ii=0;ii<arr.length;ii++){
        if(order.indexOf(ii)<0) notBatted.push(ii);
      }
      var sortedIdxs=order.concat(notBatted);
      return sortedIdxs.map(function(i){
        var b=arr[i];
        var isStriker=(i===strikerI);
        var isNonStriker=(i===nonStrikerI);
        var isActive=activeIdxs&&activeIdxs.indexOf(i)>=0;
        var statusText='';
        var statusStyle='';
        if(b.out){
          statusText=b.howOut;
          statusStyle='color:#791F1F;font-weight:500';
        } else if(b.retiredHurt){
          statusText='&#129657; retired hurt';
          statusStyle='color:#aaa;font-weight:500';
        } else if(isStriker){
          statusText='not out *';
          statusStyle='color:#0F6E56;font-weight:600';
        } else if(isNonStriker){
          statusText='not out *';
          statusStyle='color:#0F6E56;font-weight:600';
        } else if(b.balls>0){
          statusText='not out';
          statusStyle='color:#0F6E56;font-weight:500';
        } else {
          statusText='did not bat';
          statusStyle='color:#aaa;font-style:italic';
        }
        var nameDisplay=b.name+(isStriker?' *':isNonStriker?' *':'');
        return '<tr class="'+(isActive?'batting-row-active':'')+'">'+
          '<td>'+nameDisplay+'<br><span class="out-text" style="'+statusStyle+'">'+statusText+'</span></td>'+
          '<td>'+b.runs+'</td><td>'+b.balls+'</td><td>'+b.fours+'</td><td>'+b.sixes+'</td>'+
          '<td>'+(b.balls>0?((b.runs/b.balls)*100).toFixed(0):'-')+'</td></tr>';
      }).join('');
    }
    var bat1label=S.match.batFirst;
    var bat2label=S.match.batFirst===S.match.team1?S.match.team2:S.match.team1;
    var inn1BatRows='';
    if(S.innings===2||S.phase==='result'){
      inn1BatRows=makeBatRows(S.inn1batting,[], -1, -1, S.inn1battingOrder);
    }
    var inn2BatRows=makeBatRows(S.batting, (S.innings===2?active:[]), (S.innings===2?S.strikerIdx:-1), (S.innings===2?S.nonStrikerIdx:-1), S.battingOrder);
    function extrasRow(sc){
      var tot=(sc.wide||0)+(sc.nb||0)+(sc.byes||0)+(sc.legbyes||0);
      return '<tr style="background:#FAEEDA"><td style="font-weight:600;color:#633806">Extras</td>'+
        '<td style="font-weight:700;color:#633806">'+tot+'</td>'+
        '<td colspan="4" style="font-size:11px;color:#888">WD:'+(sc.wide||0)+' NB:'+(sc.nb||0)+' B:'+(sc.byes||0)+' LB:'+(sc.legbyes||0)+'</td></tr>';
    }
    html+='<div class="card">';
    if(inn1BatRows){
      html+=
        '<div class="section-title">'+bat1label+' Batting — Inn. 1</div>'+
        '<table class="scorecard-table"><tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>'+inn1BatRows+extrasRow(S.inn1score||S.t1)+'</table>'+
        '<div class="section-title" style="margin-top:12px">'+bat2label+' Batting — Inn. 2</div>'+
        '<table class="scorecard-table"><tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>'+inn2BatRows+extrasRow(S.t2)+'</table>';
    } else {
      html+=
        '<div class="section-title">Batting scorecard</div>'+
        '<table class="scorecard-table"><tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>'+inn2BatRows+extrasRow(S.t1)+'</table>';
    }
    html+='</div>';
  } else if(S.activeTab==='bowling'){
    var curOverLegal=legalCount();
    function getBowlerOverHistory(bname, overHistArr, overBowlArr){
      var result=[];
      overHistArr.forEach(function(ov,i){
        if(overBowlArr[i]===bname){
          var rs=0;
          ov.forEach(function(b){ if(b!=='W'&&b.indexOf('WD')<0&&b.indexOf('NB')<0) rs+=parseInt(b)||0; });
          var wkts=ov.filter(function(b){return b==='W';}).length;
          result.push({ovNum:i+1,balls:ov,runs:rs,wickets:wkts});
        }
      });
      return result;
    }
    function makeBowlerRow(b,i,isCurrent,label){
      var dispBalls=b.balls+(isCurrent?curOverLegal:0);
      var liveWkts=0;
      if(isCurrent){ S.thisBalls.forEach(function(x,xi){ if(x==='W' && S.thisBallsRunout.indexOf(xi)<0) liveWkts++; }); }
      var liveRuns=isCurrent?S.thisBalls.reduce(function(acc,x){
        if(x==='W') return acc;
        if(x.indexOf('WD')===0) return acc+(x.length>2?parseInt(x.slice(3))||0:0)+1;
        if(x.indexOf('NB')===0) return acc+(x.length>2?parseInt(x.slice(3))||0:0)+1;
        return acc+(parseInt(x)||0);
      },0):0;
      var dispRuns=b.runs+liveRuns;
      var dispWkts=b.wickets+liveWkts;
      var ovStr=Math.floor(dispBalls/6)+'.'+(dispBalls%6);
      var econ=dispBalls>0?(dispRuns/(dispBalls/6)).toFixed(2):'-';
      var sr=dispWkts>0?(dispBalls/dispWkts).toFixed(1):'-';
      var ovHist = !label ? getBowlerOverHistory(b.name, S.overHistory, S.overBowlers) : [];
      var histHtml='';
      if(ovHist.length>0){
        histHtml='<tr><td colspan="6" style="padding:0 8px 8px 20px">'+
          '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">'+
          ovHist.map(function(oh){
            var miniB=oh.balls.map(function(b){ return '<div class="ball ball-'+ballClass(b)+'" style="width:22px;height:22px;font-size:9px">'+b+'</div>'; }).join('');
            return '<div style="background:#f7f7f5;border-radius:8px;padding:4px 7px;font-size:10px;display:flex;align-items:center;gap:5px">'+
              '<span style="color:#888;font-weight:600;min-width:32px">Ov '+oh.ovNum+'</span>'+
              '<div style="display:flex;gap:3px">'+miniB+'</div>'+
              '<span style="color:#333;font-weight:700;margin-left:4px">'+oh.runs+'r'+(oh.wickets?' <span style="color:#791F1F">'+oh.wickets+'w</span>':'')+'</span>'+
            '</div>';
          }).join('')+
          '</div></td></tr>';
      }
      return '<tr class="'+(isCurrent?'batting-row-active':'')+'">'+
        '<td style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+
          (isCurrent?'<span style="color:#0F6E56;font-weight:700">&#9658; </span>':'')+
          b.name+(label?'<br><span style="font-size:10px;color:#aaa">'+label+'</span>':'')+
        '</td>'+
        '<td style="font-weight:'+(isCurrent?'700':'400')+'">'+ovStr+'</td>'+
        '<td>'+dispRuns+'</td>'+
        '<td>'+dispWkts+'</td>'+
        '<td style="font-weight:600;color:'+(parseFloat(econ)<6?'#0F6E56':parseFloat(econ)>9?'#791F1F':'#333')+'">'+econ+'</td>'+
        '<td>'+sr+'</td>'+
      '</tr>'+histHtml;
    }
    var s_cur=sc();
    var extrasTotalWide=s_cur.wide||0, extrasTotalNB=s_cur.nb||0;
    var extrasTotalByes=s_cur.byes||0, extrasTotalLB=s_cur.legbyes||0;
    var extrasTotal=extrasTotalWide+extrasTotalNB+extrasTotalByes+extrasTotalLB;
    var extrasRowHtml=
      '<tr style="background:#FAEEDA">'+
        '<td style="font-weight:600;color:#633806" colspan="2">Extras</td>'+
        '<td style="font-weight:700;color:#633806">'+extrasTotal+'</td>'+
        '<td colspan="3" style="font-size:11px;color:#888">WD:'+extrasTotalWide+' NB:'+extrasTotalNB+' B:'+extrasTotalByes+' LB:'+extrasTotalLB+'</td>'+
      '</tr>';
    var bowlOrderIdxs=S.bowlingOrder.concat(S.bowling.map(function(_,i){return i;}).filter(function(i){return S.bowlingOrder.indexOf(i)<0;}));
    var brows=bowlOrderIdxs.map(function(i){
      var b=S.bowling[i];
      var isCurrent=(i===S.bowlerIdx && S.bowlerConfirmed);
      return (b.balls>0||isCurrent)?makeBowlerRow(b,i,isCurrent,''):null;
    }).filter(Boolean).join('');
    var inn1rows='';
    if(S.innings===2||S.phase==='result'){
      var inn1BowlOrderIdxs=S.inn1bowlingOrder.concat(S.inn1bowling.map(function(_,i){return i;}).filter(function(i){return S.inn1bowlingOrder.indexOf(i)<0;}));
      inn1rows=inn1BowlOrderIdxs.map(function(i){
        var b=S.inn1bowling[i];
        return b.balls>0?makeBowlerRow(b,i,false,'Inn.1'):'';
      }).join('');
    }
    var bt2label=S.match.batFirst===S.match.team1?S.match.team2:S.match.team1;
    var bt1label=S.match.batFirst;
    html+=
      '<div class="card">'+
        (inn1rows?
          '<div class="section-title">'+bt2label+' Bowling — Inn. 1</div>'+
          '<table class="scorecard-table"><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Econ</th><th>SR</th></tr>'+inn1rows+'</table>'+
          '<div class="section-title" style="margin-top:12px">'+bt1label+' Bowling — Inn. 2</div>'
          :
          '<div class="section-title">Bowling figures</div>'
        )+
        '<table class="scorecard-table"><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Econ</th><th>SR</th></tr>'+brows+extrasRowHtml+'</table>'+
        '<div style="font-size:11px;color:#aaa;margin-top:6px">&#9658; = currently bowling &nbsp;|&nbsp; Econ: <span style="color:#0F6E56">green &lt;6</span> / <span style="color:#791F1F">red &gt;9</span></div>'+
      '</div>';
  } else if(S.activeTab==='fow'){
    html+='<div class="card"><div class="section-title">Fall of wickets</div>';
    if(!S.fow.length){ html+='<p style="font-size:13px;color:#aaa">No wickets fallen yet.</p>'; }
    else {
      var fowRows=S.fow.map(function(f,i){
        return '<tr><td>'+(i+1)+'</td><td>'+f.score+'/'+f.wkts+'</td><td>'+f.name+'</td><td>'+f.over+'</td></tr>';
      }).join('');
      html+='<table class="fow-table"><tr><th>Wkt</th><th>Score</th><th>Batsman</th><th>Over</th></tr>'+fowRows+'</table>';
    }
    html+='</div>';
  } else if(S.activeTab==='overs'){
    html+='<div class="card"><div class="section-title">Over log</div>';
    if(!S.overHistory.length){ html+='<p style="font-size:13px;color:#aaa">No completed overs yet.</p>'; }
    else {
      var overRuns=S.overHistory.map(function(ov){
        return ov.reduce(function(a,b){ return a+(b==='W'||b.indexOf('WD')>=0||b.indexOf('NB')>=0?0:parseInt(b)||0); },0);
      });
      var maxOvR=Math.max.apply(null,overRuns)||1;
      html+='<div style="margin-bottom:14px">'+
        '<div style="font-size:10px;font-weight:700;color:var(--c-text-faint);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Runs per over</div>'+
        '<div class="manhattan">';
      overRuns.forEach(function(r,i){
        var pct=Math.round((r/maxOvR)*60);
        var col=r>=12?'var(--c-purple)':r>=8?'var(--c-blue)':r>=5?'var(--c-primary)':'var(--c-text-faint)';
        html+='<div class="manhattan-bar" style="height:'+Math.max(pct,4)+'px;background:'+col+'" title="Ov '+(i+1)+': '+r+'r">'+
          '<div class="manhattan-bar-val">'+r+'</div>'+
          '<div class="manhattan-bar-label">'+(i+1)+'</div>'+
        '</div>';
      });
      html+='</div></div>';
      S.overHistory.forEach(function(ov,i){
        var bowlerName=S.overBowlers[i]||'';
        var runsInOv=ov.reduce(function(a,b){ return a+(b==='W'||b.indexOf('WD')>=0||b.indexOf('NB')>=0?0:parseInt(b)||0); },0);
        var wkts=ov.filter(function(b){return b==='W';}).length;
        html+='<div class="over-entry">'+
          '<span style="font-size:11px;font-weight:700;color:#aaa;min-width:36px">Ov '+(i+1)+'</span>'+
          '<div class="balls-row" style="flex:1">'+ov.map(function(b){ return '<div class="ball ball-'+ballClass(b)+'" style="width:28px;height:28px;font-size:10px">'+b+'</div>'; }).join('')+'</div>'+
          '<span style="font-size:12px;font-weight:700;color:#333;min-width:28px;text-align:right">'+runsInOv+'r'+(wkts?' <span style="color:#791F1F">'+wkts+'w</span>':'')+'</span>'+
          (bowlerName?'<span style="font-size:10px;color:#aaa;margin-left:4px">'+bowlerName+'</span>':'')+
        '</div>';
      });
    }
    html+='</div>';
  }

  document.getElementById('main-content').innerHTML=html;
}

/* ── INN1 COMPLETE ──────────────────────────────────────────────────── */
function renderInn1Complete(){
  var s=S.inn1score||S.t1;
  var bt=S.match.batFirst, bw=bt===S.match.team1?S.match.team2:S.match.team1;
  var topBat=S.inn1batting.slice().sort(function(a,b){return b.runs-a.runs;})[0];
  var topBowl=S.inn1bowling.filter(function(b){return b.wickets>0;}).sort(function(a,b){return b.wickets-a.wickets||a.runs-b.runs;})[0];
  document.getElementById('main-content').innerHTML=
    '<div class="setup-panel" style="text-align:center">'+
      '<div style="font-size:42px;margin-bottom:8px">&#127951;</div>'+
      '<div style="font-size:20px;font-weight:800;color:var(--c-text);margin-bottom:4px">1st Innings Complete</div>'+
      '<div style="font-size:28px;font-weight:900;color:var(--c-primary);margin:12px 0">'+s.runs+'/'+s.wickets+'</div>'+
      '<div style="font-size:13px;color:var(--c-text-soft);margin-bottom:4px">'+Math.floor(s.balls/6)+'.'+s.balls%6+' ov &nbsp;·&nbsp; RR: '+(s.balls>0?(s.runs/(s.balls/6)).toFixed(2):'0.00')+'</div>'+
      (topBat?'<div style="font-size:13px;margin-bottom:4px">&#11088; '+topBat.name+' — '+topBat.runs+' ('+topBat.balls+'b)</div>':'')+
      (topBowl?'<div style="font-size:13px;margin-bottom:16px">&#127992; '+topBowl.name+' — '+topBowl.wickets+'/'+(topBowl.runs)+'</div>':'')+
      '<div style="background:var(--c-blue-soft);border-radius:var(--radius-md);padding:14px;margin-bottom:16px">'+
        '<div style="font-size:13px;color:#1d4fb0;font-weight:600">'+bw+' need <strong>'+(s.runs+1)+'</strong> to win</div>'+
        '<div style="font-size:12px;color:#4b72c0;margin-top:2px">in '+S.match.overs+' overs</div>'+
      '</div>'+
      '<button class="btn-primary" data-action="start-inn2">&#127951; Start 2nd Innings</button>'+
    '</div>';
}

/* ── RESULT SCREEN ──────────────────────────────────────────────────── */
function renderResult(){
  var s1=S.inn1score||S.t1, s2=S.t2;
  var bt=S.match.batFirst, bw=bt===S.match.team1?S.match.team2:S.match.team1;
  var result=s1.runs>s2.runs?bt+' won by '+(s1.runs-s2.runs)+' run'+(s1.runs-s2.runs!==1?'s':'')
            :s2.runs>s1.runs?bw+' won by '+(10-s2.wickets)+' wicket'+(10-s2.wickets!==1?'s':'')
            :'Match tied!';
  saveMatchToHistory();
  function makeFow(fow){
    if(!fow||!fow.length) return '';
    return '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">'+
      fow.map(function(f,i){ return '<span style="font-size:11px;background:var(--c-surface-alt);border-radius:6px;padding:2px 7px;color:var(--c-text-soft)">'+(i+1)+'/'+f.score+' '+f.name+'</span>'; }).join('')+
    '</div>';
  }
  function makeBatTable(batting, order, score){
    if(!batting.length) return '';
    var notBatted=[];
    for(var i=0;i<batting.length;i++) if(order.indexOf(i)<0) notBatted.push(i);
    var idxs=order.length?order.concat(notBatted):batting.map(function(_,i){return i;});
    return '<table class="scorecard-table"><tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>'+
      idxs.map(function(i){
        var b=batting[i]; if(!b) return '';
        var status=b.out?b.howOut:(b.retiredHurt?'ret.hurt':(b.balls>0?'not out':'dnb'));
        var sc2=b.out?'#791F1F':(b.balls>0?'#0F6E56':'#aaa');
        return '<tr><td>'+b.name+'<br><span style="font-size:10px;color:'+sc2+'">'+status+'</span></td>'+
          '<td>'+(b.balls>0?b.runs:'-')+'</td><td>'+(b.balls>0?b.balls:'-')+'</td>'+
          '<td>'+(b.balls>0?b.fours:'-')+'</td><td>'+(b.balls>0?b.sixes:'-')+'</td>'+
          '<td>'+(b.balls>0?((b.runs/b.balls)*100).toFixed(0):'-')+'</td></tr>';
      }).join('')+
      '<tr style="background:var(--c-amber-soft)"><td style="font-weight:600;color:var(--c-amber)">Extras</td>'+
        '<td style="font-weight:700;color:var(--c-amber)">'+((score.wide||0)+(score.nb||0)+(score.byes||0)+(score.legbyes||0))+'</td>'+
        '<td colspan="4" style="font-size:10px;color:var(--c-text-faint)">WD:'+(score.wide||0)+' NB:'+(score.nb||0)+' B:'+(score.byes||0)+' LB:'+(score.legbyes||0)+'</td></tr>'+
    '</table>';
  }
  function makeBowlTable(bowling, order){
    return '<table class="scorecard-table"><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Econ</th></tr>'+
      orderedBowlers(bowling,order).filter(function(b){return b.balls>0;}).map(function(b){
        return '<tr><td>'+b.name+'</td><td>'+Math.floor(b.balls/6)+'.'+b.balls%6+'</td><td>'+b.runs+'</td><td>'+b.wickets+'</td><td>'+(b.runs/(b.balls/6)).toFixed(2)+'</td></tr>';
      }).join('')+
    '</table>';
  }
  var html=
    '<div class="card" style="border-top:4px solid var(--c-primary)">'+
      '<div style="text-align:center;padding:8px 0 14px">'+
        '<div style="font-size:36px;margin-bottom:6px">&#127942;</div>'+
        '<div style="font-size:18px;font-weight:800;color:var(--c-text)">'+result+'</div>'+
        '<div style="font-size:12px;color:var(--c-text-soft);margin-top:4px">'+S.match.team1+' vs '+S.match.team2+' &nbsp;·&nbsp; '+S.match.overs+' overs</div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:4px">'+
        '<div style="text-align:center;background:var(--c-surface-alt);border-radius:var(--radius-md);padding:10px">'+
          '<div style="font-size:11px;font-weight:600;color:var(--c-text-soft)">'+bt+'</div>'+
          '<div style="font-size:24px;font-weight:900;color:var(--c-primary)">'+s1.runs+'/'+s1.wickets+'</div>'+
          '<div style="font-size:11px;color:var(--c-text-faint)">'+Math.floor(s1.balls/6)+'.'+s1.balls%6+' ov</div>'+
        '</div>'+
        '<div style="text-align:center;background:var(--c-surface-alt);border-radius:var(--radius-md);padding:10px">'+
          '<div style="font-size:11px;font-weight:600;color:var(--c-text-soft)">'+bw+'</div>'+
          '<div style="font-size:24px;font-weight:900;color:var(--c-primary)">'+s2.runs+'/'+s2.wickets+'</div>'+
          '<div style="font-size:11px;color:var(--c-text-faint)">'+Math.floor(s2.balls/6)+'.'+s2.balls%6+' ov</div>'+
        '</div>'+
      '</div>'+
    '</div>'+

    '<div class="tabs" id="result-tabs" style="overflow-x:auto;white-space:nowrap;display:flex;scrollbar-width:none">'+
      ['inn1bat','inn1bowl','inn2bat','inn2bowl','analysis'].map(function(t,i){
        var labels=['1st Bat','1st Bowl','2nd Bat','2nd Bowl','📊 Charts'];
        return '<div class="tab'+(i===0?' active':'')+'" style="flex-shrink:0" data-action="result-tab" data-val="'+t+'">'+labels[i]+'</div>';
      }).join('')+
    '</div>'+
    '<div id="result-tab-content" class="card">'+
      '<div class="section-title">'+bt+' — Batting</div>'+makeBatTable(S.inn1batting,S.inn1battingOrder,s1)+
      (makeFow(S.inn1fow)?'<div class="section-title" style="margin-top:8px">Fall of Wickets</div>'+makeFow(S.inn1fow):'')+
    '</div>'+

    '<button class="btn-export" data-action="export-pdf" style="margin-bottom:8px">&#128438; Export Match Report (PDF)</button>'+
    '<button class="btn-export" data-action="share-match" style="margin-bottom:8px;background:var(--c-primary)">&#128225; Share Result</button>'+
    '<button class="btn-secondary" data-action="new-match">&#128260; New Match</button>';

  /* store batting/bowling tables for tab switching */
  var oh1=S.inn1overHistory.length?S.inn1overHistory:S.overHistory;
  var oh2=S.overHistory;
  S._resultTabs={
    inn1bat:'<div class="section-title">'+bt+' — Batting</div>'+makeBatTable(S.inn1batting,S.inn1battingOrder,s1)+(makeFow(S.inn1fow)?'<div class="section-title" style="margin-top:8px">Fall of Wickets</div>'+makeFow(S.inn1fow):''),
    inn1bowl:'<div class="section-title">'+bw+' — Bowling (Inn. 1)</div>'+makeBowlTable(S.inn1bowling,S.inn1bowlingOrder),
    inn2bat:'<div class="section-title">'+bw+' — Batting</div>'+makeBatTable(S.batting,S.battingOrder,s2)+(makeFow(S.fow)?'<div class="section-title" style="margin-top:8px">Fall of Wickets</div>'+makeFow(S.fow):''),
    inn2bowl:'<div class="section-title">'+bt+' — Bowling (Inn. 2)</div>'+makeBowlTable(S.bowling,S.bowlingOrder),
    analysis: buildAnalysisHTML(S.match,s1,s2,oh1,oh2,S.inn1fow,S.fow),
  };
  document.getElementById('main-content').innerHTML=html;
}

/* ── SINGLE DELEGATED CLICK HANDLER ─────────────────────────────────── */
document.addEventListener('click', function(e){
  var el=e.target;
  while(el && !el.dataset.action) el=el.parentElement;
  if(!el) return;
  var action=el.dataset.action, val=el.dataset.val;

  /* result scorecard tabs */
  if(action==='result-tab'){
    document.querySelectorAll('#result-tabs .tab').forEach(function(t){ t.classList.remove('active'); });
    el.classList.add('active');
    var tc=document.getElementById('result-tab-content');
    if(tc && S._resultTabs) tc.innerHTML=S._resultTabs[val]||'';
    return;
  }
  /* overs quick-pick */
  if(action==='set-overs'){
    var inp=document.getElementById('inp-overs'); if(inp) inp.value=val;
    document.querySelectorAll('#overs-quick .btn').forEach(function(b){
      var active=(b.dataset.val===val);
      b.style.background=active?'var(--c-primary-soft)':'';
      b.style.borderColor=active?'var(--c-primary)':'';
      b.style.color=active?'var(--c-primary-dark)':'';
    });
    return;
  }
  /* wizard navigation */
  if(action==='new-match-wizard'){ S._wizardData={}; renderMatchWizard(1); return; }
  if(action==='back-to-home'){ S.phase='setup'; render(); return; }
  if(action==='wizard-step2'){
    if(!_wizardCollect1()) return;
    if(getMatchHistory().length>0){ renderPlayerChoice(); return; }
    renderMatchWizard(2); return;
  }
  if(action==='wizard-new-players'){
    S._wizardData.p1=Array(11).fill(''); S._wizardData.p2=Array(11).fill('');
    renderMatchWizard(2); return;
  }
  if(action==='wizard-prev-players'){
    var phm=getMatchHistory()[parseInt(val)];
    if(phm){
      /* Show assignment screen: user picks which old team's players go to each new team */
      var d=S._wizardData;
      var oldA=phm.inn1batting.map(function(b){return b.name;});
      var oldB=phm.inn1bowling.map(function(b){return b.name;});
      var oldAname=phm.batFirst||phm.team1;
      var oldBname=phm.batFirst===phm.team1?phm.team2:phm.team1;
      var encA=encodeURIComponent(JSON.stringify({p1:oldA,p2:oldB}));
      var encB=encodeURIComponent(JSON.stringify({p1:oldB,p2:oldA}));
      document.getElementById('main-content').innerHTML=
        '<div class="setup-panel">'+
          '<div style="font-size:16px;font-weight:800;color:var(--c-text);margin-bottom:4px">Assign Players</div>'+
          '<div style="font-size:12px;color:var(--c-text-soft);margin-bottom:18px">Which players go to which team?</div>'+
          '<button class="btn-primary" style="margin-bottom:10px" data-action="wizard-assign-players" data-val="'+encA+'">'+
            '<strong>'+d.t1+'</strong> gets '+oldAname+' players<br>'+
            '<span style="font-size:11px;opacity:.8">'+oldA.slice(0,3).join(', ')+'…</span>'+
          '</button>'+
          '<button class="btn-primary" style="margin-bottom:10px;background:#185FA5" data-action="wizard-assign-players" data-val="'+encB+'">'+
            '<strong>'+d.t1+'</strong> gets '+oldBname+' players<br>'+
            '<span style="font-size:11px;opacity:.8">'+oldB.slice(0,3).join(', ')+'…</span>'+
          '</button>'+
          '<button class="btn-cancel" style="margin-top:4px" data-action="back-to-player-choice">&#8592; Back</button>'+
        '</div>';
    }
    return;
  }
  if(action==='wizard-assign-players'){
    var assign=JSON.parse(decodeURIComponent(val));
    S._wizardData.p1=assign.p1; S._wizardData.p2=assign.p2;
    renderMatchWizard(2); return;
  }
  if(action==='back-to-player-choice'){ renderPlayerChoice(); return; }
  if(action==='wizard-back1'){ renderMatchWizard(1); return; }
  if(action==='wizard-step3'){
    _wizardCollect2();
    renderMatchWizard(3); return;
  }
  if(action==='wizard-back2'){ renderMatchWizard(2); return; }
  if(action==='wizard-finish'){
    _wizardCollect3();
    var d=S._wizardData;
    var t1=d.t1, t2=d.t2;
    var p1=d.p1.map(function(n,i){ return n||t1+' P'+(i+1); });
    var p2=d.p2.map(function(n,i){ return n||t2+' P'+(i+1); });
    applyTeamSetup({t1:t1,t2:t2,overs:d.overs,batFirst:d.batFirst},p1,p2);
    return;
  }

  switch(action){
    case 'runs':              doRuns(parseInt(val)); break;
    case 'wicket':            doWicket(); break;
    case 'wide':              doWide(parseInt(val)); break;
    case 'noball':            doNoBall(parseInt(val)); break;
    case 'bye':               doBye(parseInt(val)); break;
    case 'legbye':            doLegBye(parseInt(val)); break;
    case 'open-extras':       S.extrasPanel=val; render(); break;
    case 'cancel-extras':     S.extrasPanel=null; render(); break;
    case 'undo':              undoLast(); break;
    case 'swap-batters':      swap(); render(); break;
    case 'edit-striker':      S.editStriker=true; render(); break;
    case 'cancel-edit-striker': S.editStriker=false; render(); break;
    case 'save-striker':      saveStrikerName(); break;
    case 'pick-striker':      pickStriker(parseInt(val)); break;
    case 'edit-bowler':       S.editBowler=true; render(); break;
    case 'cancel-edit-bowler':S.editBowler=false; render(); break;
    case 'save-bowler':       saveBowlerName(); break;
    case 'pick-bowler':       pickBowler(parseInt(val)); break;
    case 'pick-bowler-edit':  pickBowler(parseInt(val)); break;
    case 'confirm-bowler':    confirmBowler(); break;
    case 'confirm-batsman':   confirmNewBatsman(); break;
    case 'pick-batsman':      pickBatsman(parseInt(val)); break;
    case 'set-dismissal':     S.dismissalType=val; render(); break;
    case 'confirm-dismissal': confirmDismissal(S.dismissalType); break;
    case 'cancel-dismissal':  S.dismissalPending=false; S.dismissalType=''; render(); break;
    case 'end-innings':       S.confirmEndInnings=true; render(); break;
    case 'confirm-end-innings': endInnings(); break;
    case 'cancel-end-innings':  S.confirmEndInnings=false; render(); break;
    case 'start-inn2':        startInn2(); break;
    case 'tab':               S.activeTab=val; render(); break;
    case 'start-match':       startMatch(); break;
    case 'new-match':         resetMatch(); break;
    case 'show-history':      S.phase='history'; renderHistory(); break;
    case 'back-to-setup':     S.phase='setup'; render(); break;
    case 'save-progress':     saveProgress(); break;
    case 'share-match':       shareMatch(); break;
    case 'join-live':         joinFromInput(); break;
    case 'load-progress':     loadProgress(); break;
    case 'clear-progress':    clearProgress(); renderHistory(); break;
    case 'use-players':
      var hist=getMatchHistory(), m=hist[parseInt(val)];
      if(m){
        var setup=S._pendingSetup||{t1:S.match.team1,t2:S.match.team2,overs:S.match.overs,batFirst:S.match.batFirst};
        var op1=m.batFirst===m.team1?m.inn1batting.map(function(b){return b.name;}):m.inn1bowling.map(function(b){return b.name;});
        var op2=m.batFirst===m.team1?m.inn1bowling.map(function(b){return b.name;}):m.inn1batting.map(function(b){return b.name;});
        applyTeamSetup(setup, op1, op2);
      }
      break;
    case 'print-history':     printHistoryMatch(parseInt(val)); break;
    case 'export-pdf':        exportPDF(); break;
    case 'choose-new-players':
      var ts=JSON.parse(decodeURIComponent(val));
      S.prefillPlayers=null;
      S._wizardData=S._wizardData||{};
      S._wizardData.t1=ts.t1; S._wizardData.t2=ts.t2;
      S._wizardData.overs=ts.overs; S._wizardData.batFirst=ts.batFirst;
      S._wizardData.p1=ts.p1||Array(11).fill('');
      S._wizardData.p2=ts.p2||Array(11).fill('');
      renderMatchWizard(2);
      break;
    case 'choose-prev-players':
      var parsed=JSON.parse(decodeURIComponent(val));
      var hm=getMatchHistory()[parsed.idx];
      if(hm){
        var ps=parsed.setup;
        var pp1=hm.batFirst===hm.team1?hm.inn1batting.map(function(b){return b.name;}):hm.inn1bowling.map(function(b){return b.name;});
        var pp2=hm.batFirst===hm.team1?hm.inn1bowling.map(function(b){return b.name;}):hm.inn1batting.map(function(b){return b.name;});
        renderChoosePlayers(Object.assign({},ps,{p1:pp1,p2:pp2}));
      }
      break;
    case 'bat-first-confirm':
      var bfSetup=JSON.parse(decodeURIComponent(el.dataset.t1));
      var bfP1=JSON.parse(decodeURIComponent(el.dataset.p1));
      var bfP2=JSON.parse(decodeURIComponent(el.dataset.p2));
      bfSetup.batFirst=el.dataset.batfirst==='t1'?bfSetup.t1:bfSetup.t2;
      applyTeamSetup(bfSetup,bfP1,bfP2);
      break;
  }
});
