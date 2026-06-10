// Check if opened via a share/live link
(function(){
  var hash=location.hash;
  var liveM=hash.match(/[#&]live=([A-Z0-9]{6})/);
  var stateM=hash.match(/[#&]s=([^&]+)/);
  if(liveM){
    showJoinScreen(liveM[1]);
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
