// ── utils.js ──────────────────────────────
function saveSnapshot(){
  S.snapshots.push(JSON.stringify({
    t1:S.t1,t2:S.t2,
    batting:S.batting,bowling:S.bowling,
    strikerIdx:S.strikerIdx,nonStrikerIdx:S.nonStrikerIdx,bowlerIdx:S.bowlerIdx,
    thisBalls:S.thisBalls,thisBallsRunout:S.thisBallsRunout.slice(),overHistory:S.overHistory,overBowlers:S.overBowlers.slice(),fow:S.fow,battingOrder:S.battingOrder.slice(),bowlingOrder:S.bowlingOrder.slice(),
    wicketPending:S.wicketPending,outIdx:S.outIdx,
    overDone:S.overDone,innings:S.innings,
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
  S.extrasPanel=null; S.editStriker=false; S.editBowler=false; S.confirmEndInnings=false;
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

