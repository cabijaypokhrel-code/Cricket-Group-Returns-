// Check if opened via a share/live link
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
