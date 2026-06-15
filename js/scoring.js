function doRuns(r){
  saveSnapshot();
  S.freeHit=false;
  var s=sc(), b=bat(), w=bowl();
  var prevRuns=b.runs;
  s.runs+=r; b.runs+=r; b.balls++; w.runs+=r;
  s.balls++; w.balls++;
  if(r===4) b.fours++;
  if(r===6) b.sixes++;
  S.thisBalls.push(String(r));
  S.partnershipRuns+=r; S.partnershipBalls++;
  // Team milestone toasts
  var prevTeamRuns=s.runs-r;
  [50,100,150,200,250,300].forEach(function(m){ if(prevTeamRuns<m && s.runs>=m) showTeamMilestone(sc(), m); });
  // Milestone toasts
  [25,50,75,100,150,200].forEach(function(m){ if(prevRuns<m && b.runs>=m) showMilestone(b.name, b.runs); });
  // Hat-trick check
  checkHatTrick(w);
  if(r%2===1) swap();
  if(legalCount()>=6) endOver();
  if(S.innings===2 && target() && sc().runs>=target()) endInnings();
  else { autoSave(); render(); }
}

function doWide(extra){
  saveSnapshot();
  var s=sc(), w=bowl(), total=1+extra;
  s.runs+=total; s.wide+=total; w.runs+=total;
  S.partnershipRuns+=total;
  S.thisBalls.push(extra>0?'WD+'+extra:'WD');
  if(extra%2===1) swap();
  S.extrasPanel=null;
  if(S.innings===2 && target() && sc().runs>=target()) endInnings();
  else { autoSave(); render(); }
}

function doNoBall(extra){
  saveSnapshot();
  S.freeHit=true;
  var s=sc(), b=bat(), w=bowl(), total=1+extra;
  s.runs+=total; s.nb+=1; w.runs+=total;
  if(extra>0){ b.runs+=extra; }
  S.partnershipRuns+=total;
  S.thisBalls.push(extra>0?'NB+'+extra:'NB');
  if(extra%2===1) swap();
  S.extrasPanel=null;
  if(S.innings===2 && target() && sc().runs>=target()) endInnings();
  else { autoSave(); render(); }
}

function doBye(r){
  saveSnapshot();
  S.freeHit=false;
  var s=sc(), w=bowl();
  s.runs+=r; s.byes=(s.byes||0)+r; w.runs+=r;
  s.balls++; w.balls++;
  S.partnershipRuns+=r; S.partnershipBalls++;
  // Team milestone toasts
  var prevTeamRuns=s.runs-r;
  [50,100,150,200,250,300].forEach(function(m){ if(prevTeamRuns<m && s.runs>=m) showTeamMilestone(sc(), m); });
  S.thisBalls.push(r>0?'B+'+r:'B');
  if(r%2===1) swap();
  S.extrasPanel=null;
  if(legalCount()>=6) endOver();
  if(S.innings===2 && target() && sc().runs>=target()) endInnings();
  else { autoSave(); render(); }
}

function doLegBye(r){
  saveSnapshot();
  S.freeHit=false;
  var s=sc(), w=bowl();
  s.runs+=r; s.legbyes=(s.legbyes||0)+r; w.runs+=r;
  s.balls++; w.balls++;
  S.partnershipRuns+=r; S.partnershipBalls++;
  // Team milestone toasts
  var prevTeamRuns=s.runs-r;
  [50,100,150,200,250,300].forEach(function(m){ if(prevTeamRuns<m && s.runs>=m) showTeamMilestone(sc(), m); });
  S.thisBalls.push(r>0?'LB+'+r:'LB');
  if(r%2===1) swap();
  S.extrasPanel=null;
  if(legalCount()>=6) endOver();
  if(S.innings===2 && target() && sc().runs>=target()) endInnings();
  else { autoSave(); render(); }
}

function doWicket(){
  // Show dismissal type picker first
  S.dismissalPending=true; S.dismissalType='';
  render();
}

function confirmDismissal(type){
  // Called after user selects dismissal type and fills details
  // Register a fielder name into an unused bowling slot so they appear
  // as a named batsman in innings 2
  function registerFielder(name){
    if(!name) return;
    for(var fi=0;fi<S.bowling.length;fi++){
      if(S.bowling[fi].name===name) return; // already in roster
    }
    for(var fi=0;fi<S.bowling.length;fi++){
      if(S.bowling[fi].balls===0 && fi!==S.bowlerIdx){
        S.bowling[fi].name=name; return; // claim first unused slot
      }
    }
    // all 11 slots used — fielder already captured in howOut text
  }
  saveSnapshot();
  var s=sc(), b=bat(), w=bowl();
  var howOut='';
  if(type==='bowled'){
    howOut='b '+w.name;
    w.wickets++;
  } else if(type==='caught'){
    var catcher=document.getElementById('inp-catcher')?document.getElementById('inp-catcher').value.trim():'';
    if(!catcher){ alert('Enter catcher name'); return; }
    registerFielder(catcher);
    howOut='c '+catcher+' b '+w.name;
    w.wickets++;
  } else if(type==='lbw'){
    howOut='lbw b '+w.name;
    w.wickets++;
  } else if(type==='stumped'){
    var wk=document.getElementById('inp-wk')?document.getElementById('inp-wk').value.trim():'';
    if(!wk){ alert('Enter wicketkeeper name'); return; }
    registerFielder(wk);
    howOut='st '+wk+' b '+w.name;
    w.wickets++;
  } else if(type==='runout'){
    var f1=document.getElementById('inp-f1')?document.getElementById('inp-f1').value.trim():'';
    var f2=document.getElementById('inp-f2')?document.getElementById('inp-f2').value.trim():'';
    if(!f1){ alert('Enter at least one fielder name'); return; }
    registerFielder(f1); registerFielder(f2);
    var roRuns=parseInt((document.getElementById('inp-ro-runs')||{}).value)||0;
    var roWho=((document.getElementById('inp-ro-who')||{}).value)||'striker';
    var roOutIdx=(roWho==='nonstriker')?S.nonStrikerIdx:S.strikerIdx;
    var roOb=S.batting[roOutIdx];
    var roHowOut='run out ('+(f2?f1+'/'+f2:f1)+')';
    if(roRuns>0){
      s.runs+=roRuns; w.runs+=roRuns;
      bat().runs+=roRuns;
      if(roRuns===4) bat().fours++;
    }
    var roBallEntry=roRuns>0?(roRuns+'W'):'W';
    S.thisBallsRunout.push(S.thisBalls.length);
    roOb.out=true; roOb.howOut=roHowOut;
    s.wickets++;
    S.fow.push({score:s.runs,wkts:s.wickets,name:roOb.name,over:overs(s)});
    S.thisBalls.push(roBallEntry);
    s.balls++; w.balls++; bat().balls++;
    S.dismissalPending=false; S.dismissalType='';
    if(s.wickets>=10){ endInnings(); return; }
    S.wicketPending=true; S.outIdx=roOutIdx;
    if(legalCount()>=6){ S.overHistory.push(S.thisBalls.slice()); S.overBowlers.push(bowl().name); bowl().overs++; S.thisBalls=[]; S.thisBallsRunout=[]; S.overDone=true; if(S.overHistory.length>=S.match.overs){ endInnings(); return; } }
    render(); return;
  } else if(type==='hitwicket'){
    howOut='hit wicket b '+w.name;
    w.wickets++;
  } else if(type==='obstructing'){
    howOut='obstructing the field';
    S.thisBallsRunout.push(S.thisBalls.length); // no bowler credit
  } else if(type==='retiredhurt'){
    // Retired hurt: NOT out, can come back. No ball is consumed.
    var rb=bat();
    rb.retiredHurt=true;
    S.partnershipBreaks.push({score:s.runs, balls:s.balls});
    S.dismissalPending=false; S.dismissalType='';
    S.wicketPending=true; S.outIdx=S.strikerIdx;
    render(); return;
  } else if(type==='retiredout'){
    var rb2=bat();
    rb2.out=true; rb2.howOut='retired out';
    s.wickets++;
    S.fow.push({score:s.runs,wkts:s.wickets,name:rb2.name,over:overs(s)});
    S.dismissalPending=false; S.dismissalType='';
    S.wicketPending=true; S.outIdx=S.strikerIdx;
    S.thisBalls.push('W');
    s.balls++; w.balls++; rb2.balls++;
    if(legalCount()>=6){ S.overHistory.push(S.thisBalls.slice()); S.overBowlers.push(bowl().name); bowl().overs++; S.thisBalls=[]; S.thisBallsRunout=[]; S.overDone=true; if(S.overHistory.length>=S.match.overs){ endInnings(); return; } }
    render(); return;
  }
  b.out=true; b.howOut=howOut;
  s.wickets++;
  S.fow.push({score:s.runs,wkts:s.wickets,name:b.name,over:overs(s)});
  S.thisBalls.push('W');
  s.balls++; w.balls++; b.balls++;
  S.dismissalPending=false; S.dismissalType='';
  S.partnershipRuns=0; S.partnershipBalls=0;
  // Hat-trick check for bowler
  checkHatTrick(w);
  if(s.wickets>=10){ endInnings(); return; }
  S.wicketPending=true; S.outIdx=S.strikerIdx;
  if(legalCount()>=6){ S.overHistory.push(S.thisBalls.slice()); S.overBowlers.push(bowl().name); bowl().overs++; S.thisBalls=[]; S.thisBallsRunout=[]; S.overDone=true; if(S.overHistory.length>=S.match.overs){ endInnings(); return; } }
  autoSave(); render();
}

function endOver(){
  var justBowled=S.thisBalls.slice();
  S.overHistory.push(justBowled);
  S.overBowlers.push(bowl().name);
  bowl().overs++;
  // DO NOT reset bowl().balls — keep accumulating so total balls = overs*6 + partial
  S.overSummary={balls:justBowled, bowler:bowl().name, overNum:S.overHistory.length, runs:justBowled.reduce(function(a,b){ var n=parseInt(b); return a+(isNaN(n)?0:n); },0)};
  S.thisBalls=[]; S.thisBallsRunout=[]; swap(); S.overDone=true;
  // End innings if all overs bowled
  if(S.overHistory.length>=S.match.overs){ endInnings(); return; }
  autoSave(); render();
}

function endInnings(){
  S.confirmEndInnings=false;
  if(S.innings===1){
    S.inn1batting=JSON.parse(JSON.stringify(S.batting));
    S.inn1bowling=JSON.parse(JSON.stringify(S.bowling));
    S.inn1fow=JSON.parse(JSON.stringify(S.fow));
    S.inn1overHistory=JSON.parse(JSON.stringify(S.overHistory));
    S.inn1overBowlers=S.overBowlers.slice();
    S.inn1score=JSON.parse(JSON.stringify(S.t1));
    S.inn1battingOrder=S.battingOrder.slice();
    S.inn1bowlingOrder=S.bowlingOrder.slice();
    // Show innings complete screen before starting inn2
    S.inn1Complete=true;
    render();
  } else {
    S.phase='result';
    render();
  }
}

function startInn2(){
  S.inn1Complete=false;
  S.confirmEndInnings=false;
  S.innings=2;
  // Inn.2: the team that was BOWLING in Inn.1 now BATS
  //        the team that was BATTING in Inn.1 now BOWLS
  var newBatters = S.inn1bowling.map(function(b){
    return {name:b.name, runs:0, balls:0, fours:0, sixes:0, out:false, howOut:''};
  });
  var newBowlers = S.inn1batting.map(function(b){
    return {name:b.name, overs:0, balls:0, runs:0, wickets:0};
  });
  S.batting  = newBatters;
  S.bowling  = newBowlers;
  S.strikerIdx=0; S.nonStrikerIdx=1; S.bowlerIdx=0;
  S.battingOrder=[]; S.bowlingOrder=[];
  S.openersNeeded=true;
  S.thisBalls=[]; S.overHistory=[]; S.overBowlers=[]; S.fow=[]; S.partnershipBreaks=[];
  S.partnershipRuns=0; S.partnershipBalls=0;
  S.wicketPending=false; S.overDone=false; S.editStriker=false; S.editBowler=false; S.extrasPanel=null;
  S.snapshots=[]; S.bowlerConfirmed=false; S.dismissalPending=false; S.dismissalType=''; S.thisBallsRunout=[]; S.freeHit=false;
  render();
}

function saveBowlerName(){
  var inp=document.getElementById('bowler-edit-inp');
  var name=inp?inp.value.trim():'';
  if(name) bowl().name=name;
  S.editBowler=false; render();
}

function orderedNames(arr, order){
  if(!order || !order.length) return arr.map(function(b){ return b.name; });
  var rest=[];
  for(var i=0;i<arr.length;i++){ if(order.indexOf(i)<0) rest.push(i); }
  return order.concat(rest).map(function(i){ return arr[i]&&arr[i].name; }).filter(Boolean);
}

function orderedBowlers(arr, order){
  if(!order || !order.length) return arr;
  var rest=[];
  for(var i=0;i<arr.length;i++){ if(order.indexOf(i)<0) rest.push(i); }
  return order.concat(rest).map(function(i){ return arr[i]; }).filter(Boolean);
}
