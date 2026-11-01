// Локальный мост в GNOME: готовый текст и часы именно текущего плеера Слона.
(()=>{
  if(!/Linux/i.test(navigator.platform)||/Android/i.test(navigator.userAgent))return;
  let busy=false,key='',hit=null,color='#b7ccff',retry=0,lastLyrics='';
  async function tick(){
    if(busy||typeof _islTr==='undefined'||!_islTr||typeof _pxAudio==='undefined'||!_pxAudio)return;
    busy=true;
    try{
      const tr=_islTr,k=_lrcKey(tr);
      if(k!==key){key=k;hit=null;color='#b7ccff';retry=0;lastLyrics='';
        if(tr.cover&&typeof _covColor==='function')_covColor(tr.cover).then(c=>{if(key===k&&c){const x=document.createElement("canvas").getContext("2d");x.fillStyle=c;color=x.fillStyle;}}).catch(()=>{});
      }
      if(!hit&&Date.now()>retry){retry=Date.now()+10000;
        _lrcGet(k).then(x=>{if(key===k&&x)hit=x;}).catch(()=>{});
      }
      const synced=hit?.syncedLyrics||'',plain=hit?.plainLyrics||'';
      const signature=synced+'\n'+plain;
      const data={v:1,key:k,title:tr.title||'',artist:tr.artist||'',cover:tr.cover||'',color,
        position:Number(_pxAudio.currentTime)||0,duration:Number(_pxAudio.duration)||0,
        rate:Number(_pxAudio.playbackRate)||1,playing:!_pxAudio.paused,offset:typeof _fpOff==='function'?_fpOff()||0:0};
      if(signature!==lastLyrics||!lastLyrics){data.synced=synced;data.plain=plain;}
      const r=await fetch('http://127.0.0.1:38479/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(1500)});
      if(r.ok)lastLyrics=signature;
    }catch(e){}finally{busy=false;}
  }
  setInterval(tick,500);
})();
