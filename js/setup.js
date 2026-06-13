
function confirmNewBatsman(){
  var inp=document.getElementById('new-bat-inp');
  var name=inp?inp.value.trim():'';
  if(!name) return;
  // Find first unused slot in batting array
  var nextIdx=-1;
  for(var i=0;i<S.batting.length;i++){
    if(!S.batting[i].out && !S.batting[i].retiredHurt && i!==S.strikerIdx && i!==S.nonStrikerIdx){ nextIdx=i; break; }
  }
  // Push new player if no slot available (hard cap: max 12 per team)
  if(nextIdx===-1){
    if(S.batting.length>=12) return;
    S.batting.push({name:name,runs:0,balls:0,fours:0,sixes:0,out:false,howOut:''});
    nextIdx=S.batting.length-1;
  } else {
    S.batting[nextIdx].name=name;
  }
  // Track batting arrival order
  if(S.battingOrder.indexOf(nextIdx)<0) S.battingOrder.push(nextIdx);
  // Assign to the correct position (striker or non-striker)
  if(S.outIdx===S.strikerIdx){ S.strikerIdx=nextIdx; }
  else { S.nonStrikerIdx=nextIdx; }
  S.wicketPending=false; S.outIdx=-1; render();
}

function confirmBowler(){
  var inp=document.getElementById('bowler-inp');
  var name=inp?inp.value.trim():'';
  if(!name) return;
  var idx=-1;
  // Check if this name already exists in the bowling array
  for(var i=0;i<S.bowling.length;i++){ if(S.bowling[i].name===name){ idx=i; break; } }
  if(idx===-1){
    // Name not found — reuse the first unused slot (0 balls bowled, not current bowler)
    // This prevents placeholder slots ("Team 2 P3" etc.) from staying and creating 15+ players
    var unused=-1;
    for(var i=0;i<S.bowling.length;i++){
      if(S.bowling[i].balls===0 && i!==S.bowlerIdx){ unused=i; break; }
    }
    if(unused>=0){
      S.bowling[unused].name=name;
      idx=unused;
    } else if(S.bowling.length<12){
      // All 11 slots have bowled — allow one substitute (hard cap: max 12)
      S.bowling.push({name:name,overs:0,balls:0,runs:0,wickets:0});
      idx=S.bowling.length-1;
    } else {
      return; // team is full at 12
    }
  }
  if(S.bowlingOrder.indexOf(idx)<0) S.bowlingOrder.push(idx);
  S.bowlerIdx=idx; S.overDone=false; S.bowlerConfirmed=true; S.overSummary=null; render();
}

function pickBowler(idx){
  if(S.bowlingOrder.indexOf(idx)<0) S.bowlingOrder.push(idx);
  S.bowlerIdx=idx; S.overDone=false; S.bowlerConfirmed=true; S.overSummary=null; render();
}

function pickOpener(idx){
  if(S.battingOrder.length===0){
    // First pick: this player is the striker (faces first ball)
    S.strikerIdx=idx;
    S.battingOrder=[idx];
    render();
  } else if(idx!==S.strikerIdx){
    // Second pick: non-striker (other opener)
    S.nonStrikerIdx=idx;
    S.battingOrder.push(idx);
    S.openersNeeded=false;
    render();
  }
}

function pickStriker(idx){
  if(idx===S.nonStrikerIdx){
    // swap if they pick the non-striker
    swap();
  } else {
    if(S.battingOrder.indexOf(idx)<0) S.battingOrder.push(idx);
    S.strikerIdx=idx;
  }
  S.editStriker=false; render();
}

function pickBatsman(idx){
  // Clear retiredHurt flag when they return to play
  if(S.batting[idx]) S.batting[idx].retiredHurt=false;
  if(S.battingOrder.indexOf(idx)<0) S.battingOrder.push(idx);
  if(S.outIdx===S.strikerIdx){ S.strikerIdx=idx; }
  else { S.nonStrikerIdx=idx; }
  S.wicketPending=false; S.outIdx=-1;
  S.partnershipRuns=0; S.partnershipBalls=0;
  render();
}

function saveStrikerName(){
  var inp=document.getElementById('striker-edit-inp');
  var name=inp?inp.value.trim():'';
  if(name) bat().name=name;
  S.editStriker=false; render();
}

function startMatch(){
  var t1=document.getElementById('inp-t1').value.trim()||'Team 1';
  var t2=document.getElementById('inp-t2').value.trim()||'Team 2';
  S.match.team1=t1; S.match.team2=t2;
  var oversVal=parseInt(document.getElementById('inp-overs').value);
  var oversErr=document.getElementById('overs-err');
  if(!oversVal || oversVal<1 || oversVal>100 || isNaN(oversVal)){
    if(oversErr) oversErr.style.display='block';
    return;
  }
  if(oversErr) oversErr.style.display='none';
  S.match.overs=oversVal;
  var tossWon=document.getElementById('inp-toss').value==='t1'?t1:t2;
  var elects=document.getElementById('inp-elect').value;
  S.match.batFirst=(elects==='bat')?tossWon:(tossWon===t1?t2:t1);
  var batTeam=S.match.batFirst;
  var p1=[],p2=[];
  for(var i=0;i<11;i++){
    var e1=document.getElementById('t1p'+i); p1.push(e1&&e1.value.trim()?e1.value.trim():t1+' P'+(i+1));
    var e2=document.getElementById('t2p'+i); p2.push(e2&&e2.value.trim()?e2.value.trim():t2+' P'+(i+1));
  }
  var bPlayers=batTeam===t1?p1:p2;
  var wPlayers=batTeam===t1?p2:p1;
  S.batting=bPlayers.map(function(n){ return {name:n,runs:0,balls:0,fours:0,sixes:0,out:false,howOut:''}; });
  S.bowling=wPlayers.map(function(n){ return {name:n,overs:0,balls:0,runs:0,wickets:0}; });
  S.battingOrder=[0,1]; S.bowlingOrder=[];
  // Store setup temporarily for choose-players flow
  var teamSetup={t1:t1,t2:t2,overs:oversVal,batFirst:S.match.batFirst,p1:p1,p2:p2};
  S._pendingSetup=teamSetup;
  renderChoosePlayers(teamSetup);
}

function _resetMatchState(){
  S.innings=1;
  S.t1={runs:0,wickets:0,balls:0,wide:0,nb:0,byes:0,legbyes:0};
  S.t2={runs:0,wickets:0,balls:0,wide:0,nb:0,byes:0,legbyes:0};
  S.batting=[]; S.bowling=[];
  S.strikerIdx=0; S.nonStrikerIdx=1; S.bowlerIdx=0;
  S.thisBalls=[]; S.overHistory=[]; S.fow=[]; S.partnershipBreaks=[];
  S.partnershipRuns=0; S.partnershipBalls=0;
  S.wicketPending=false; S.outIdx=-1;
  S.overDone=false; S.editStriker=false; S.editBowler=false; S.extrasPanel=null; S.activeTab='live';
  S.snapshots=[]; S.inn1batting=[]; S.inn1bowling=[]; S.inn1fow=[]; S.inn1overHistory=[]; S.inn1overBowlers=[]; S.inn1score=null;
  S.battingOrder=[]; S.inn1battingOrder=[];
  S.bowlingOrder=[]; S.inn1bowlingOrder=[];
  S.overBowlers=[];
  S.bowlerConfirmed=false; S.dismissalPending=false; S.dismissalType=''; S.thisBallsRunout=[]; S.confirmEndInnings=false;
  S.inn1Complete=false; S.freeHit=false; S.overSummary=null; S._autoRestored=false; S.openersNeeded=false;
  try{ localStorage.removeItem('cricket_progress_v2'); }catch(e){}
}

function resetMatch(){
  _resetMatchState();
  S.phase='setup';
  S.match={team1:'',team2:'',overs:20,batFirst:''};
  S.prefillPlayers=null;
  render();
}



function renderBatFirstChoice(setup, p1, p2, histLabel){
  var t1=setup.t1, t2=setup.t2;
  document.getElementById('main-content').innerHTML=
    '<div class="setup-panel" style="text-align:center">'+
      '<div style="font-size:18px;font-weight:700;color:#1a1a1a;margin-bottom:4px">&#127951; '+t1+' vs '+t2+'</div>'+
      '<div style="font-size:13px;color:#888;margin-bottom:6px">'+setup.overs+' overs</div>'+
      (histLabel?'<div style="font-size:12px;color:#0F6E56;margin-bottom:16px;font-weight:600">&#128101; Players from: '+histLabel+'</div>':'')+
      '<div style="font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:14px">Who bats first?</div>'+
      '<button class="btn-primary" style="margin-bottom:10px" data-action="bat-first-confirm" data-t1="'+encodeURIComponent(JSON.stringify(setup))+'" data-p1="'+encodeURIComponent(JSON.stringify(p1))+'" data-p2="'+encodeURIComponent(JSON.stringify(p2))+'" data-batfirst="t1">&#127951; '+t1+' bats first</button>'+
      '<button class="btn-primary" style="margin-bottom:10px;background:#185FA5" data-action="bat-first-confirm" data-t1="'+encodeURIComponent(JSON.stringify(setup))+'" data-p1="'+encodeURIComponent(JSON.stringify(p1))+'" data-p2="'+encodeURIComponent(JSON.stringify(p2))+'" data-batfirst="t2">&#127951; '+t2+' bats first</button>'+
      '<button class="btn-cancel" style="margin-top:8px" data-action="back-to-setup">&#8592; Back</button>'+
    '</div>';
}

function renderChoosePlayers(teamSetup){
  // teamSetup = {t1,t2,overs,tossWon,elects,p1,p2,batFirst}
  var history=getMatchHistory();
  var hasPrev = history.length>0;
  var html='<div class="setup-panel" style="text-align:center">'+
    '<div style="font-size:18px;font-weight:700;color:#1a1a1a;margin-bottom:4px">&#127951; '+teamSetup.t1+' vs '+teamSetup.t2+'</div>'+
    '<div style="font-size:13px;color:#888;margin-bottom:20px">'+teamSetup.overs+' overs &nbsp;|&nbsp; '+teamSetup.batFirst+' bat first</div>'+
    '<div style="font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:14px">Choose Players</div>'+
    '<button class="btn-primary" style="margin-bottom:10px" data-action="choose-new-players" data-val="'+encodeURIComponent(JSON.stringify(teamSetup))+'">&#128101; Enter New Players</button>';
  if(hasPrev){
    history.forEach(function(m,idx){
      html+='<button class="btn-secondary" style="margin-bottom:8px" data-action="choose-prev-players" data-val="'+encodeURIComponent(JSON.stringify({idx:idx,setup:teamSetup}))+'">'+
        '&#128257; Use Players from: '+m.team1+' vs '+m.team2+' ('+m.date+')</button>';
    });
  }
  html+='<button class="btn-cancel" style="margin-top:8px" data-action="back-to-setup">&#8592; Back</button></div>';
  document.getElementById('main-content').innerHTML=html;
}

function applyTeamSetup(teamSetup, p1override, p2override){
  _resetMatchState(); // wipe any previous/restored game so scores start at 0
  var t1=teamSetup.t1, t2=teamSetup.t2;
  S.match.team1=t1; S.match.team2=t2;
  S.match.overs=teamSetup.overs;
  S.match.batFirst=teamSetup.batFirst;
  var p1 = p1override || teamSetup.p1;
  var p2 = p2override || teamSetup.p2;
  var batTeam=S.match.batFirst;
  var bPlayers=batTeam===t1?p1:p2;
  var wPlayers=batTeam===t1?p2:p1;
  S.batting=bPlayers.map(function(n){ return {name:n,runs:0,balls:0,fours:0,sixes:0,out:false,howOut:''}; });
  S.bowling=wPlayers.map(function(n){ return {name:n,overs:0,balls:0,runs:0,wickets:0}; });
  S.battingOrder=[]; S.bowlingOrder=[];
  S.openersNeeded=true;
  S.phase='scoring'; render();
}

