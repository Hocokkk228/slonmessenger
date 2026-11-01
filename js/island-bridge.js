// Локальный мост в GNOME: готовый текст и часы именно текущего плеера Слона.
(()=>{
  if(!/Linux/i.test(navigator.platform)||/Android/i.test(navigator.userAgent))return;
  let busy=false,key='',hit=null,color='#b7ccff',retry=0,lastLyrics='',artSource='',art='',artBusy=false,artRetry=0,lastArt='',refresh=0,ack=0;
  async function tick(){
    if(busy||typeof _islTr==='undefined'||!_islTr||typeof _pxAudio==='undefined'||!_pxAudio)return;
    busy=true;
    try{
      const tr=_islTr,k=_lrcKey(tr);
      if(k!==key){key=k;hit=null;color='#b7ccff';retry=0;lastLyrics='';art='';artSource='';lastArt='';artRetry=0;
        if(tr.cover&&typeof _covColor==='function')_covColor(tr.cover).then(c=>{if(key===k&&c){const x=document.createElement("canvas").getContext("2d");x.fillStyle=c;color=x.fillStyle;}}).catch(()=>{});
      }
      if(!hit&&Date.now()>retry){retry=Date.now()+10000;
        _lrcGet(k).then(x=>{if(key===k&&x)hit=x;}).catch(()=>{});
      }
      const src=String(tr.cover||'');
      if(src&&!artBusy&&(src!==artSource||!art&&Date.now()>artRetry)){
        artBusy=true;artSource=src;artRetry=Date.now()+10000;
        // blob: существует только в Слоне, поэтому передаём небольшую готовую картинку.
        (async()=>{try{const r=await fetch(src,{signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('cover');
          const blob=await r.blob();if(blob.size>10000000)throw Error('cover size');const image=await createImageBitmap(blob);
          try{const canvas=document.createElement('canvas');canvas.width=canvas.height=160;
            canvas.getContext('2d').drawImage(image,0,0,160,160);const data=canvas.toDataURL('image/jpeg',.8);
            if(key===k&&artSource===src)art=data;
          }finally{image.close();}
        }catch(e){if(key===k&&artSource===src&&/^https?:/.test(src))art=src;}finally{artBusy=false;}})();
      }
      const synced=hit?.syncedLyrics||'',plain=hit?.plainLyrics||'';
      const signature=synced+'\n'+plain;
      const data={v:1,ack,key:k,title:tr.title||'',artist:tr.artist||'',color,
        position:Number(_pxAudio.currentTime)||0,duration:Number(_pxAudio.duration)||0,
        rate:Number(_pxAudio.playbackRate)||1,playing:!_pxAudio.paused,offset:typeof _fpOff==='function'?_fpOff()||0:0};
      const full=Date.now()-refresh>5000;
      if(signature!==lastLyrics||!lastLyrics||full){data.synced=synced;data.plain=plain;}
      if(art&&(art!==lastArt||full))data.cover=art;
      const r=await fetch('http://127.0.0.1:38479/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(1500)});
      if(r.ok){
        if(r.status===200){const reply=await r.json();
          for(const cmd of (Array.isArray(reply.commands)?reply.commands:[])){
            if(!Number.isSafeInteger(cmd.id)||cmd.id<=ack)continue;ack=cmd.id;
            if(cmd.key!==key||key!==k)continue;
            if(cmd.action==='play-pause'&&typeof _islToggle==='function')_islToggle();
            else if(cmd.action==='next'&&typeof _mmStep==='function')_mmStep(1);
            else if(cmd.action==='previous'&&typeof _mmStep==='function')_mmStep(-1);
          }
        }
        lastLyrics=signature;if(data.cover)lastArt=data.cover;if(full)refresh=Date.now();}
    }catch(e){}finally{busy=false;}
  }
  setInterval(tick,500);
})();
