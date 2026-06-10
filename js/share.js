// ── LIVE SHARE VIA URL ────────────────────────────────────────────────
function encodeShareState(){
  function pb(arr){ return arr.map(function(b){ return [b.name,b.runs,b.balls,b.fours,b.sixes,b.out?1:0,b.howOut||'',b.retiredHurt?1:0]; }); }
  function pw(arr){ return arr.filter(function(b){return b.balls>0;}).map(function(b){ return [b.name,b.balls,b.runs,b.wickets]; }); }
  function pf(arr){ return arr.map(function(f){ return [f.score,f.wkts,f.name,f.over]; }); }
  try {
    var d={
      v:1, ts:Math.floor(Date.now()/1000),
      ph:S.phase, inn:S.innings,
      mn:{t1:S.match.team1,t2:S.match.team2,bf:S.match.batFirst,ov:S.match.overs},
      s1:S.inn1score||S.t1, s2:S.t2,
      si:S.strikerIdx, ni:S.nonStrikerIdx,
      bn:S.bowling[S.bowlerIdx]?S.bowling[S.bowlerIdx].name:'',
      bat:pb(S.batting), bwl:pw(S.bowling),
      tb:S.thisBalls, fw:pf(S.fow),
      ib:pb(S.inn1batting), iw:pw(S.inn1bowling), if_:pf(S.inn1fow),
      bo:S.battingOrder, io:S.inn1battingOrder, ic:S.inn1Complete?1:0
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(d))));
  } catch(e){ return ''; }
}

// ── LIVE P2P (PeerJS WebRTC) ──────────────────────────────────────────
var LIVE={peer:null,conns:[],conn:null,code:null,hosting:false};

function _loadPeerJS(cb){
  if(window.Peer){cb();return;}
  var s=document.createElement('script');
  s.src='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
  s.onload=cb;
  s.onerror=function(){showToast('PeerJS unavailable — using link share');shareWithLink();};
  document.head.appendChild(s);
}

function _roomCode(){
  var c='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',r='';
  for(var i=0;i<6;i++) r+=c[Math.floor(Math.random()*c.length)];
  return r;
}

function _liveURL(code){
  return location.href.split('#')[0]+'#live='+code;
}

function _doShare(url,roomCode){
  var txt=S.match.team1+' vs '+S.match.team2+(roomCode?' (Room: '+roomCode+')':'');
  if(navigator.share){
    navigator.share({title:'Live Cricket Score',text:txt,url:url}).catch(function(){});
  } else if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(function(){showToast('🔗 Copied! Room: '+roomCode);}).catch(function(){prompt('Share this live link:',url);});
  } else {
    prompt('Share this live link (Room: '+roomCode+'):',url);
  }
}

function _broadcastToViewers(){
  if(!LIVE.hosting||!LIVE.conns.length) return;
  var enc=encodeShareState();
  LIVE.conns.forEach(function(c){try{if(c.open)c.send(enc);}catch(e){}});
}

function _setLiveBtn(label){
  document.querySelectorAll('[data-action="share-match"]').forEach(function(b){b.textContent=label;});
}

function startLiveRoom(){
  if(LIVE.hosting&&LIVE.code){_doShare(_liveURL(LIVE.code),LIVE.code);return;}
  showToast('Starting live room...');
  _loadPeerJS(function(){
    var code=_roomCode();
    try{
      var peer=new Peer(code,{debug:0});
      peer.on('open',function(id){
        LIVE.peer=peer; LIVE.code=id; LIVE.hosting=true;
        _setLiveBtn('📡 Room: '+id);
        updateShareHash();
        _doShare(_liveURL(id),id);
      });
      peer.on('connection',function(conn){
        LIVE.conns.push(conn);
        conn.on('open',function(){
          conn.send(encodeShareState());
          showToast('👀 Viewer connected ('+LIVE.conns.length+' watching)');
        });
        conn.on('close',function(){
          LIVE.conns=LIVE.conns.filter(function(c){return c!==conn;});
        });
      });
      peer.on('error',function(){
        showToast('Room taken — trying new code...');
        LIVE.hosting=false; LIVE.code=null;
        setTimeout(startLiveRoom,500);
      });
    }catch(e){shareWithLink();}
  });
}

function shareWithLink(){
  var enc=encodeShareState();
  if(!enc){showToast('Could not generate share link');return;}
  _doShare(location.href.split('#')[0]+'#s='+enc,'');
}

function shareMatch(){ startLiveRoom(); }

function joinLiveRoom(code){
  _loadPeerJS(function(){
    try{
      var peer=new Peer({debug:0});
      LIVE.peer=peer;
      peer.on('open',function(){
        var conn=peer.connect(code,{reliable:true,serialization:'raw'});
        LIVE.conn=conn;
        conn.on('open',function(){ _updateLiveDot('🟢 LIVE'); });
        conn.on('data',function(enc){
          try{
            var d=JSON.parse(decodeURIComponent(escape(atob(enc))));
            if(d&&d.v) renderSharedView(d,true);
          }catch(e){}
        });
        conn.on('close',function(){ _updateLiveDot('⚪ Scorer offline'); });
        conn.on('error',function(){ _updateLiveDot('⚪ Cannot connect'); });
      });
      peer.on('error',function(){ _updateLiveDot('⚪ Cannot connect'); });
    }catch(e){ _updateLiveDot('⚪ Cannot connect'); }
  });
}

function _updateLiveDot(label){
  var el=document.getElementById('live-dot');
  if(el) el.textContent=label;
}

function updateShareHash(){
  var enc=encodeShareState();
  if(!enc) return;
  var hash=LIVE.hosting&&LIVE.code?'#live='+LIVE.code:'#s='+enc;
  history.replaceState(null,'',location.pathname+hash);
  _broadcastToViewers();
}

function renderSharedView(d,skipBanner){
  function ub(arr){ return (arr||[]).map(function(b){ return {name:b[0],runs:b[1],balls:b[2],fours:b[3],sixes:b[4],out:!!b[5],howOut:b[6],retiredHurt:!!b[7]}; }); }
  function uw(arr){ return (arr||[]).map(function(b){ return {name:b[0],balls:b[1],runs:b[2],wickets:b[3]}; }); }
  function uf(arr){ return (arr||[]).map(function(f){ return {score:f[0],wkts:f[1],name:f[2],over:f[3]}; }); }
  var mn=d.mn, s1=d.s1||{runs:0,wickets:0,balls:0,wide:0,nb:0}, s2=d.s2||{runs:0,wickets:0,balls:0,wide:0,nb:0};
  var bat1=mn.bf, bat2=bat1===mn.t1?mn.t2:mn.t1;
  var batting=ub(d.bat), bowling=uw(d.bwl);
  var ib=ub(d.ib), iw=uw(d.iw), fow1=uf(d.if_), fow2=uf(d.fw);
  var striker=batting[d.si]||{name:'?',runs:0,balls:0};
  var nonStriker=batting[d.ni]||{name:'?',runs:0,balls:0};
  var isResult=d.ph==='result';
  var ts=new Date(d.ts*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  function ovStr(s){ return Math.floor(s.balls/6)+'.'+s.balls%6; }
  function rrStr(s){ return s.balls>0?((s.runs/(s.balls/6)).toFixed(2)):'0.00'; }
  var result='';
  if(isResult){
    result=s1.runs>s2.runs?bat1+' won by '+(s1.runs-s2.runs)+' run'+(s1.runs-s2.runs!==1?'s':'')
          :s2.runs>s1.runs?bat2+' won by '+(10-s2.wickets)+' wicket'+(10-s2.wickets!==1?'s':'')
          :'Match tied!';
  }
  function mkBatTbl(arr,order,s){
    if(!arr.length) return '';
    var notBat=[];
    for(var i=0;i<arr.length;i++) if(order.indexOf(i)<0) notBat.push(i);
    var idxs=order.length?order.concat(notBat):arr.map(function(_,i){return i;});
    var rows=idxs.map(function(i){
      var b=arr[i]; if(!b) return '';
      var status,sc;
      if(b.out){status=b.howOut;sc='#c0392b';}
      else if(b.retiredHurt){status='ret. hurt';sc='#aaa';}
      else if(b.balls>0){status='not out';sc='#0F6E56';}
      else{status='dnb';sc='#ccc';}
      var isStr=!isResult&&d.si===i, isNs=!isResult&&d.ni===i;
      return '<tr style="background:'+(isStr?'#E1F5EE':isNs?'#f9faf8':'')+'"><td style="padding:7px 8px;font-weight:600">'+(isStr?'&#9658; ':isNs?'&#9670; ':'')+b.name+'</td>'+
        '<td style="padding:7px 8px;font-size:11px;color:'+sc+'">'+status+'</td>'+
        '<td style="padding:7px 8px;text-align:right;font-weight:700">'+(b.balls>0?b.runs:'-')+'</td>'+
        '<td style="padding:7px 8px;text-align:right">'+(b.balls>0?b.balls:'-')+'</td>'+
        '<td style="padding:7px 8px;text-align:right">'+(b.balls>0?b.fours:'-')+'</td>'+
        '<td style="padding:7px 8px;text-align:right">'+(b.balls>0?b.sixes:'-')+'</td></tr>';
    }).join('');
    return '<table class="scorecard-table"><tr><th>Batsman</th><th>Status</th><th>R</th><th>B</th><th>4s</th><th>6s</th></tr>'+rows+'</table>'+
      (s?'<div style="font-size:11px;color:#999;margin-top:-6px;margin-bottom:6px">Extras: Wd '+(s.wide||0)+' Nb '+(s.nb||0)+'</div>':'');
  }
  function mkBwlTbl(arr){
    if(!arr.length) return '';
    return '<table class="scorecard-table"><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Econ</th></tr>'+
      arr.map(function(b){
        var isCur=!isResult&&b.name===d.bn;
        return '<tr style="background:'+(isCur?'#E1F5EE':'')+'"><td style="padding:7px 8px;font-weight:600">'+(isCur?'&#9658; ':'')+b.name+'</td>'+
          '<td style="padding:7px 8px;text-align:right">'+Math.floor(b.balls/6)+'.'+b.balls%6+'</td>'+
          '<td style="padding:7px 8px;text-align:right">'+b.runs+'</td>'+
          '<td style="padding:7px 8px;text-align:right;font-weight:700;color:#791F1F">'+b.wickets+'</td>'+
          '<td style="padding:7px 8px;text-align:right">'+(b.runs/(b.balls/6)).toFixed(1)+'</td></tr>';
      }).join('')+'</table>';
  }
  function mkFow(arr){
    if(!arr.length) return '';
    return '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">'+
      arr.map(function(f,i){ return '<span style="font-size:11px;background:#f5f5f5;border-radius:6px;padding:2px 7px;color:#555">'+(i+1)+'/'+f.score+' '+f.name+'</span>'; }).join('')+'</div>';
  }
  document.getElementById('match-subtitle').textContent=mn.t1+' vs '+mn.t2+' · '+mn.ov+' overs';
  document.getElementById('match-title').childNodes[document.getElementById('match-title').childNodes.length-1].textContent='🏏 '+mn.t1+' vs '+mn.t2;
  var html=
    '<div style="background:linear-gradient(135deg,#0F6E56,#085041);color:#fff;padding:10px 16px;border-radius:12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">'+
      '<div><div style="font-size:11px;font-weight:700;opacity:.85;text-transform:uppercase;letter-spacing:1px">📡 Live Score</div>'+
      '<div id="live-dot" style="font-size:12px;margin-top:3px;font-weight:600">⏳ Connecting...</div></div>'+
      '<div style="text-align:right"><div style="font-size:10px;opacity:.7">Snapshot: '+ts+'</div>'+
      '<button onclick="location.reload()" style="background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);color:#fff;padding:4px 10px;border-radius:6px;font-size:12px;cursor:pointer;margin-top:4px">↻</button></div>'+
    '</div>';
  if(result) html+='<div style="background:#E1F5EE;color:#0F6E56;padding:12px 16px;border-radius:12px;font-size:16px;font-weight:700;text-align:center;margin-bottom:12px">'+result+'</div>';
  html+='<div class="scoreboard" style="margin-bottom:12px">'+
    '<div class="team-names">'+
      '<span class="team-name">'+bat1+(d.inn===1&&!isResult?' &#127951;':'')+'</span>'+
      '<span class="team-name">'+bat2+(d.inn===2&&!isResult?' &#127951;':'')+'</span>'+
    '</div>'+
    '<div style="display:flex;justify-content:space-around;margin-bottom:10px">'+
      '<div style="text-align:center"><div style="font-size:38px;font-weight:900;color:#0F6E56;line-height:1">'+s1.runs+'/'+s1.wickets+'</div>'+
        '<div style="font-size:12px;color:#777;margin-top:2px">('+ovStr(s1)+' ov) · RR '+rrStr(s1)+'</div></div>'+
      ((s2.balls>0||isResult)?
        '<div style="font-size:22px;color:#ddd;align-self:center">vs</div>'+
        '<div style="text-align:center"><div style="font-size:38px;font-weight:900;color:#0F6E56;line-height:1">'+s2.runs+'/'+s2.wickets+'</div>'+
          '<div style="font-size:12px;color:#777;margin-top:2px">('+ovStr(s2)+' ov) · RR '+rrStr(s2)+'</div></div>'
      :'')+
    '</div>';
  if(d.inn===2&&!isResult&&s1.runs){
    var need=s1.runs+1-s2.runs, rb=mn.ov*6-s2.balls;
    html+='<div class="target-bar">Target: '+(s1.runs+1)+' &nbsp;•&nbsp; Need '+need+' off '+rb+' balls &nbsp;•&nbsp; RRR: '+(rb>0?((need/(rb/6)).toFixed(2)):'—')+'</div>';
  }
  if(d.tb&&d.tb.length&&!isResult){
    html+='<div class="this-over"><div class="over-label">This over</div><div class="balls-row">'+
      d.tb.map(function(b){ return '<div class="ball ball-'+ballClass(b)+'">'+b+'</div>'; }).join('')+'</div></div>';
  }
  html+='</div>';
  if(!isResult&&batting.length){
    html+='<div class="card"><div class="section-title">At the crease</div>'+
      '<div style="display:flex;gap:10px">'+
        '<div style="flex:1;background:#E1F5EE;border-radius:10px;padding:10px;border:2px solid #0F6E56">'+
          '<div style="font-size:11px;font-weight:700;color:#0F6E56">'+striker.name+' &#9658;</div>'+
          '<div style="font-size:26px;font-weight:900;color:#1a1a1a">'+striker.runs+'</div>'+
          '<div style="font-size:11px;color:#777">'+striker.balls+' balls · SR '+(striker.balls>0?((striker.runs/striker.balls)*100).toFixed(0):'0')+'</div>'+
        '</div>'+
        '<div style="flex:1;background:#f5f5f5;border-radius:10px;padding:10px">'+
          '<div style="font-size:11px;font-weight:700;color:#555">'+nonStriker.name+'</div>'+
          '<div style="font-size:26px;font-weight:900;color:#1a1a1a">'+nonStriker.runs+'</div>'+
          '<div style="font-size:11px;color:#777">'+nonStriker.balls+' balls · SR '+(nonStriker.balls>0?((nonStriker.runs/nonStriker.balls)*100).toFixed(0):'0')+'</div>'+
        '</div>'+
      '</div></div>';
  }
  if(ib.length){
    html+='<div class="card"><div class="section-title">'+bat1+' — 1st Innings Batting</div>'+mkBatTbl(ib,d.io||[],s1)+'</div>';
    if(iw.length) html+='<div class="card"><div class="section-title">'+bat2+' — Bowling (Inn. 1)</div>'+mkBwlTbl(iw)+'</div>';
    if(fow1.length) html+='<div class="card"><div class="section-title">Fall of Wickets — '+bat1+'</div>'+mkFow(fow1)+'</div>';
  }
  if(d.inn===1&&batting.length){
    html+='<div class="card"><div class="section-title">'+bat1+' — Batting</div>'+mkBatTbl(batting,d.bo||[],s1)+'</div>';
    if(bowling.length) html+='<div class="card"><div class="section-title">'+bat2+' — Bowling</div>'+mkBwlTbl(bowling)+'</div>';
    if(fow2.length) html+='<div class="card"><div class="section-title">Fall of Wickets — '+bat1+'</div>'+mkFow(fow2)+'</div>';
  }
  if((d.inn===2||isResult)&&batting.length){
    html+='<div class="card"><div class="section-title">'+bat2+' — 2nd Innings Batting</div>'+mkBatTbl(batting,d.bo||[],s2)+'</div>';
    if(bowling.length) html+='<div class="card"><div class="section-title">'+bat1+' — Bowling (Inn. 2)</div>'+mkBwlTbl(bowling)+'</div>';
    if(fow2.length) html+='<div class="card"><div class="section-title">Fall of Wickets — '+bat2+'</div>'+mkFow(fow2)+'</div>';
  }
  document.getElementById('main-content').innerHTML=html;
  if(skipBanner) _updateLiveDot('🟢 LIVE');
}
// ─────────────────────────────────────────────────────────────────────
