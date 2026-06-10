function showTeamMilestone(s, milestone){
  var battingTeam=S.innings===1?S.match.batFirst:(S.match.batFirst===S.match.team1?S.match.team2:S.match.team1);
  var labels={50:'Team 50! 🏏',100:'Team Century! 💯',150:'Team 150! 🚀',200:'Team 200! 🏆',250:'Team 250! ⭐',300:'Team 300! 🔥'};
  var el=document.getElementById('milestone-toast');
  if(!el) return;
  el.innerHTML=(labels[milestone]||'Team '+milestone+'!')+' — '+battingTeam;
  el.style.background='linear-gradient(135deg,#2563eb,#1d4fb0)';
  el.style.display='block';
  el.style.animation='none';
  void el.offsetWidth;
  el.style.animation='milestonePop .4s var(--ease) forwards';
  clearTimeout(el._timer);
  el._timer=setTimeout(function(){ el.style.display='none'; el.style.background=''; }, 3000);
}

function toggleDark(){
  document.body.classList.toggle('dark');
  var btn=document.getElementById('dark-btn');
  if(btn) btn.textContent=document.body.classList.contains('dark')?'☀️ Light':'🌙 Dark';
}

function showMilestone(name, runs){
  var icons={25:'🏅',50:'⭐',75:'🔥',100:'💯',150:'🚀',200:'🏆'};
  var label={25:'Quarter Century! 🏅',50:'Half Century! ⭐',75:'75 Up! 🔥',100:'CENTURY! 💯',150:'150 Up! 🚀',200:'Double Hundred! 🏆'};
  var mil=25; [25,50,75,100,150,200].forEach(function(m){ if(runs>=m) mil=m; });
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

