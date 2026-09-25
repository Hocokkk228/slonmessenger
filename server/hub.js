// ════════════════════════════════════════
// ── UserHub: «хаб» аккаунта (один Durable Object на юзернейм) ──
// Все устройства аккаунта держат сюда WebSocket. Хаб:
//  • доставляет сигналы от других (сообщения, «печатает», звонки) на ВСЕ устройства;
//  • если ни одно устройство не подключено — копит их в очереди (до 7 дней);
//  • хранит журнал личных сообщений аккаунта (синк между устройствами);
//  • ведёт статус «в сети»/«был(а)» в D1.
// WebSocket Hibernation: пока сообщений нет, объект спит и ничего не стоит.
// ════════════════════════════════════════
import {DurableObject} from 'cloudflare:workers';

const FB='https://slon-376b4-default-rtdb.europe-west1.firebasedatabase.app';
const QUEUE_TTL=7*24*3600e3;
// Что не должно теряться, пока адресат офлайн (остальное — «печатает» и т.п. — живо только сейчас)
const QUEUE_TYPES=new Set(['msg','read','msg_edit','msg_delete','msg_pin','chat_delete','hello','call_incoming','call_offer',
  'call_cancel','call_reject','call_end','group_invite','group_add','group_update','group_kick','group_profile_update',
  'group_msg','system_premium','system_admin_granted','system_pass_reset','system_elephant','channel_invite']);

export class UserHub extends DurableObject{
  constructor(ctx,env){
    super(ctx,env);
    this.sql=ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS ml(key TEXT PRIMARY KEY,rec TEXT NOT NULL,upd INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS ml_upd ON ml(upd);
      CREATE TABLE IF NOT EXISTS queue(id INTEGER PRIMARY KEY AUTOINCREMENT,msg TEXT NOT NULL,ts INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS kv(k TEXT PRIMARY KEY,v TEXT);`);
    // пинг от клиента не будит объект
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"t":"ping"}','{"t":"pong"}'));
  }
  get me(){return this._me||(this._me=[...this.sql.exec("SELECT v FROM kv WHERE k='user'")][0]?.v||'');}
  sockets(except){return this.ctx.getWebSockets().filter(w=>w!==except);}
  send(ws,o){try{ws.send(JSON.stringify(o));}catch(e){}}
  broadcast(o,except){const s=JSON.stringify(o);for(const w of this.sockets(except)){try{w.send(s);}catch(e){}}}
  hub(u){return this.env.HUB.get(this.env.HUB.idFromName(u));}

  // ── Подключение устройства (Worker уже проверил токен) ──
  async fetch(req){
    const url=new URL(req.url);
    const user=url.searchParams.get('u'),dev=url.searchParams.get('dev')||'';
    if(!this.me){this.sql.exec("INSERT OR REPLACE INTO kv(k,v) VALUES('user',?)",user);this._me=user;}
    const pair=new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1],[dev||'dev']);
    pair[1].serializeAttachment({dev,at:Date.now()});
    this.sql.exec("INSERT OR REPLACE INTO kv(k,v) VALUES('ls',?)",url.searchParams.get('ls')==='0'?'0':'1');
    await this.setPresence(true);
    // очередь, накопившаяся пока все устройства были офлайн
    const q=[...this.sql.exec('SELECT id,msg,ts FROM queue ORDER BY id')];
    const fresh=q.filter(x=>Date.now()-x.ts<QUEUE_TTL);
    if(fresh.length)this.send(pair[1],{t:'batch',items:fresh.map(x=>JSON.parse(x.msg))});
    if(q.length)this.sql.exec('DELETE FROM queue');
    return new Response(null,{status:101,webSocket:pair[0]});
  }

  async webSocketMessage(ws,raw){
    let m;try{m=JSON.parse(raw);}catch(e){return;}
    const me=this.me;
    switch(m.t){
      case 'send':{        // сигнал другому пользователю (или себе — на другие свои устройства)
        if(!m.to||!m.payload)return;
        if(m.to===me){this.broadcast({t:'data',from:me,payload:m.payload},ws);return;}
        await this.hub(m.to).deliver(me,m.payload,m.bridge!==false);
        return;}
      case 'self':         // только на другие мои устройства (синк звонка, профиля…)
        this.broadcast({t:'self',payload:m.payload},ws);return;
      case 'ml_post':{     // сообщение в журнал: себе и собеседнику
        const {key,rec,chat}=m;if(!key||!rec||!chat)return;
        this.mlPut(key,{...rec,chat,out:true,from:me},ws);
        if(chat!=='saved'){
          await this.hub(chat).mlPut(key,{...rec,chat:me,out:false,from:me});
          this.send(ws,{t:'ml_ack',key});
        }
        return;}
      case 'ml_patch':{    // правка/удаление
        const {key,patch,chat}=m;if(!key||!patch)return;
        this.mlPatch(key,patch,null);
        if(chat&&chat!=='saved'&&!patch.gone)await this.hub(chat).mlPatch(key,patch,null);
        return;}
      case 'ml_sync':{     // догоняем журнал: всё, что изменилось после since
        const since=+m.since||0;
        const rows=since?[...this.sql.exec('SELECT key,rec,upd FROM ml WHERE upd>? ORDER BY upd LIMIT 1000',since)]
          :[...this.sql.exec('SELECT key,rec,upd FROM ml ORDER BY key DESC LIMIT 400')].reverse();
        this.send(ws,{t:'ml_batch',items:rows.map(r=>({key:r.key,rec:JSON.parse(r.rec),upd:r.upd})),full:!since});
        return;}
    }
  }
  async webSocketClose(ws){try{ws.close();}catch(e){}await this.afterLeave(ws);}
  async webSocketError(ws){await this.afterLeave(ws);}
  async afterLeave(ws){if(!this.sockets(ws).length)await this.setPresence(false);}

  // ── RPC от хабов других пользователей ──
  async deliver(from,payload,bridge){
    const item={t:'data',from,payload};
    const socks=this.sockets();
    if(socks.length){this.broadcast(item);return true;}
    if(QUEUE_TYPES.has(payload.type))this.sql.exec('INSERT INTO queue(msg,ts) VALUES(?,?)',JSON.stringify(item),Date.now());
    // Переходный мост: у адресата старая версия (APK 1.0.x) — кладём и в старый inbox Firebase
    if(bridge&&this.me)await fetch(FB+'/inbox/'+this.me+'.json',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({from,payload:{...payload,_hub:1},ts:Date.now()})}).catch(()=>{});
    return false;
  }
  // Синк своего профиля: разослать всем своим устройствам
  pushSelf(payload){this.broadcast({t:'self',payload});}
  online(){return this.sockets().length>0;}

  mlPut(key,rec,except){
    const now=Date.now();
    const old=[...this.sql.exec('SELECT rec FROM ml WHERE key=?',key)][0];
    if(old){try{const o=JSON.parse(old.rec);if(o.del||o.gone)return;}catch(e){}}
    this.sql.exec('INSERT OR REPLACE INTO ml(key,rec,upd) VALUES(?,?,?)',key,JSON.stringify(rec),now);
    this.broadcast({t:'ml',key,rec,upd:now},except);
  }
  mlPatch(key,patch,except){
    const row=[...this.sql.exec('SELECT rec FROM ml WHERE key=?',key)][0];
    if(!row)return;
    const rec={...JSON.parse(row.rec),...patch},now=Date.now();
    this.sql.exec('UPDATE ml SET rec=?,upd=? WHERE key=?',JSON.stringify(rec),now,key);
    this.broadcast({t:'ml',key,rec,upd:now,chg:1},except);
  }
  async setPresence(online){
    const me=this.me;if(!me)return;
    const lsAllowed=[...this.sql.exec("SELECT v FROM kv WHERE k='ls'")][0]?.v!=='0';
    const now=Date.now();
    await this.env.DB.prepare(`INSERT INTO presence(username,online,ts,ls) VALUES(?,?,?,?)
      ON CONFLICT(username) DO UPDATE SET online=excluded.online,ts=excluded.ts,ls=excluded.ls`)
      .bind(me,online?1:0,now,lsAllowed?now:0).run();
  }
}
