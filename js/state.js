var S = {
  phase:'setup',
  match:{team1:'',team2:'',overs:20,batFirst:''},
  innings:1,
  t1:{runs:0,wickets:0,balls:0,wide:0,nb:0,byes:0,legbyes:0},
  t2:{runs:0,wickets:0,balls:0,wide:0,nb:0,byes:0,legbyes:0},
  batting:[],bowling:[],
  strikerIdx:0,nonStrikerIdx:1,bowlerIdx:0,
  thisBalls:[],overHistory:[],overBowlers:[],fow:[],partnershipBreaks:[],
  partnershipRuns:0,partnershipBalls:0,
  wicketPending:false,outIdx:-1,
  overDone:false,
  editStriker:false,editBowler:false,
  extrasPanel:null,
  activeTab:'live',
  snapshots:[],
  inn1batting:[],inn1bowling:[],inn1fow:[],inn1overHistory:[],inn1score:null,
  battingOrder:[],inn1battingOrder:[],
  bowlingOrder:[],inn1bowlingOrder:[],
  bowlerConfirmed:false,
  dismissalPending:false, dismissalType:'',
  thisBallsRunout:[],
  confirmEndInnings:false,
  inn1Complete:false,
  freeHit:false,
  prefillPlayers:null,
  choosePlayersPhase:false
};

function saveSnapshot(){
  S.snapshots.push(JSON.stringify({
    t1:S.t1,t2:S.t2,
    batting:S.batting,bowling:S.bowling,
    strikerIdx:S.strikerIdx,nonStrikerIdx:S.nonStrikerIdx,bowlerIdx:S.bowlerIdx,
    thisBalls:S.thisBalls,thisBallsRunout:S.thisBallsRunout.slice(),overHistory:S.overHistory,overBowlers:S.overBowlers.slice(),fow:S.fow,battingOrder:S.battingOrder.slice(),bowlingOrder:S.bowlingOrder.slice(),
    wicketPending:S.wicketPending,outIdx:S.outIdx,
    overDone:S.overDone,innings:S.innings,
    freeHit:S.freeHit,
    partnershipRuns:S.partnershipRuns,partnershipBalls:S.partnershipBalls
  }));
  if(S.snapshots.length>50) S.snapshots.shift();
}

function undoLast(){
  if(!S.snapshots.length) return;
  var prev=JSON.parse(S.snapshots.pop());
  S.t1=prev.t1; S.t2=prev.t2;
  S.batting=prev.batting; S.bowling=prev.bowling;
  S.strikerIdx=prev.strikerIdx; S.nonStrikerIdx=prev.nonStrikerIdx; S.bowlerIdx=prev.bowlerIdx;
  S.thisBalls=prev.thisBalls; S.thisBallsRunout=prev.thisBallsRunout||[]; S.overHistory=prev.overHistory; S.overBowlers=prev.overBowlers||[]; S.fow=prev.fow;
  S.wicketPending=prev.wicketPending; S.outIdx=prev.outIdx;
  S.overDone=prev.overDone; S.innings=prev.innings;
  S.partnershipRuns=prev.partnershipRuns||0; S.partnershipBalls=prev.partnershipBalls||0;
  S.battingOrder=prev.battingOrder||S.battingOrder;
  S.bowlingOrder=prev.bowlingOrder||S.bowlingOrder;
  S.extrasPanel=null; S.editStriker=false; S.editBowler=false; S.confirmEndInnings=false; S.freeHit=prev.freeHit||false;
  render();
}

function sc(){ return S.innings===1 ? S.t1 : S.t2; }
function bat(){ return S.batting[S.strikerIdx]; }
function ns(){ return S.batting[S.nonStrikerIdx]; }
function bowl(){ return S.bowling[S.bowlerIdx]; }
function legalCount(){ return S.thisBalls.filter(function(b){ return !b.startsWith('WD')&&!b.startsWith('NB'); }).length; }
function overs(s){ return Math.floor(s.balls/6)+'.'+(s.balls%6); }
function rr(s){ return s.balls===0?'0.00':(s.runs/(s.balls/6)).toFixed(2); }
function target(){ return S.innings===2 ? S.t1.runs+1 : null; }
function ballClass(b){
  if(b==='W') return 'W';
  if(b.length>1 && b.endsWith('W')) return 'W'; // run-out with runs e.g. '1W','2W'
  if(b.indexOf('WD')===0) return 'WD';
  if(b.indexOf('NB')===0) return 'NB';
  if(b.indexOf('LB')===0) return 'WD';
  if(b.indexOf('B')===0) return 'WD';
  if(b==='4') return '4';
  if(b==='6') return '6';
  if(b==='0') return '0';
  return '1';
}
function swap(){ var t=S.strikerIdx; S.strikerIdx=S.nonStrikerIdx; S.nonStrikerIdx=t; }

