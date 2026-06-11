function _buildSaveData(){
  return {
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
      inn1Complete:S.inn1Complete, freeHit:S.freeHit, overSummary:S.overSummary||null,
      partnershipRuns:S.partnershipRuns, partnershipBalls:S.partnershipBalls,
      partnershipBreaks:S.partnershipBreaks
    },
    savedAt: new Date().toLocaleString()
  };
}

function autoSave(){
  if(S.phase!=='scoring' && S.phase!=='result') return;
  try { localStorage.setItem('cricket_progress', JSON.stringify(_buildSaveData())); } catch(e){}
}

function saveProgress(){
  try {
    localStorage.setItem('cricket_progress', JSON.stringify(_buildSaveData()));
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
      inn2bowlingOrder: S.bowlingOrder.slice(),
      inn1overHistory: JSON.parse(JSON.stringify(S.inn1overHistory||[])),
      inn2overHistory: JSON.parse(JSON.stringify((S.innings===2||S.phase==='result')?S.overHistory:[])),
      inn1fow2: JSON.parse(JSON.stringify(fow1)),
      inn2fow2: JSON.parse(JSON.stringify(fow2))
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

