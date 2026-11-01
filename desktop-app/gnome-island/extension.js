import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';
import Soup from 'gi://Soup?version=3.0';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {parseLrc, lineAt, choosePlayer} from './logic.js';
import {prepare, paint} from './renderer.js';

const SEP='\u001f';
const FORMAT=['{{playerInstance}}','{{status}}','{{title}}','{{artist}}','{{mpris:artUrl}}','{{position}}','{{mpris:length}}'].join(SEP);
const seconds=()=>GLib.get_monotonic_time()/1000000;
function command(args, cancellable, callback) {
    try {
        const p=Gio.Subprocess.new(args,Gio.SubprocessFlags.STDOUT_PIPE|Gio.SubprocessFlags.STDERR_SILENCE);
        p.communicate_utf8_async(null,cancellable,(proc,result)=>{
            try {const [,out]=proc.communicate_utf8_finish(result);callback(proc.get_successful()?out:'');}
            catch(e) {if(!cancellable.is_cancelled())callback('');}
        });
    } catch(e) {callback('');}
}
function label(text,style) {
    const l=new St.Label({text,style_class:style,x_expand:true});
    l.clutter_text.ellipsize=Pango.EllipsizeMode.END;
    l.clutter_text.single_line_mode=true;
    return l;
}
function multiline(l){l.clutter_text.ellipsize=Pango.EllipsizeMode.NONE;l.clutter_text.single_line_mode=false;l.clutter_text.line_wrap=true;l.clutter_text.line_wrap_mode=Pango.WrapMode.WORD_CHAR;}


export default class SlonIsland extends Extension {
    enable() {
        this._alive=true;this._cancel=new Gio.Cancellable();this._session=new Soup.Session({timeout:8});
        this._track=null;this._lines=[];this._lyricsKey='';this._requestId=0;this._pollBusy=false;
        this._lastPosition=0;this._positionAt=seconds();this._currentIndex=-2;
        this._button=new PanelMenu.Button(0.5,'SLON Island',false);
        this._button.add_style_class_name('slon-island-panel');
        const panelBox=new St.BoxLayout({style_class:'slon-island-pill',y_align:Clutter.ActorAlign.CENTER});
        this._miniCover=new St.Icon({icon_name:'audio-x-generic-symbolic',icon_size:18,style_class:'slon-island-mini-cover'});
        this._miniTitle=label('Музыка не играет','slon-island-mini-title');this._miniTitle.width=140;
        panelBox.add_child(this._miniCover);panelBox.add_child(this._miniTitle);this._button.add_child(panelBox);
        this._button.menu.box.add_style_class_name('slon-island-menu');
        const item=new PopupMenu.PopupBaseMenuItem({reactive:false,can_focus:false});
        const box=new St.BoxLayout({orientation:Clutter.Orientation.VERTICAL,style_class:'slon-island-card'});this._card=box;
        const head=new St.BoxLayout({style_class:'slon-island-head'});
        this._cover=new St.Icon({icon_name:'audio-x-generic-symbolic',icon_size:66,style_class:'slon-island-cover'});
        const info=new St.BoxLayout({orientation:Clutter.Orientation.VERTICAL,x_expand:true,y_align:Clutter.ActorAlign.CENTER});
        this._title=label('Музыка не играет','slon-island-title');this._artist=label('Включи трек в Слоне','slon-island-artist');
        info.add_child(this._title);info.add_child(this._artist);head.add_child(this._cover);head.add_child(info);box.add_child(head);
        const lyricBox=new St.BoxLayout({orientation:Clutter.Orientation.VERTICAL,style_class:'slon-island-lyrics'});
        this._prev=label('','slon-island-neighbour');this._next=label('','slon-island-neighbour');multiline(this._prev);multiline(this._next);
        this._lyricBase=label('Включи музыку','slon-island-lyric-base');multiline(this._lyricBase);
        this._lyricFill=this._lyricBase; // Статус; таймированный текст рисуется отдельно.
        this._lyricCanvas=new St.DrawingArea({x_expand:true,height:42});
        this._lyricCanvas.connect('repaint',area=>{
            const cr=area.get_context();
            try{const width=area.width;if(width<10)return;
                if(!this._drawing||this._drawingText!==this._currentText||this._drawingWidth!==width){
                    this._drawing=prepare(cr,this._currentText||'',width);this._drawingText=this._currentText;this._drawingWidth=width;
                    if(area.height!==this._drawing.height)area.height=this._drawing.height;
                }
                paint(cr,this._drawing,this._progress||0,this._accent||'#b7ccff',(seconds()%2.2)/2.2);
            }finally{cr.$dispose();}
        });
        this._lyricCanvas.hide();
        lyricBox.add_child(this._prev);lyricBox.add_child(this._lyricBase);lyricBox.add_child(this._lyricCanvas);lyricBox.add_child(this._next);box.add_child(lyricBox);
        const controls=new St.BoxLayout({style_class:'slon-island-controls',x_align:Clutter.ActorAlign.CENTER});
        controls.add_child(this._control('media-skip-backward-symbolic','Предыдущий','previous'));
        this._play=this._control('media-playback-start-symbolic','Воспроизвести или поставить на паузу','play-pause');
        this._play.add_style_class_name('slon-island-play');controls.add_child(this._play);
        controls.add_child(this._control('media-skip-forward-symbolic','Следующий','next'));box.add_child(controls);
        item.add_child(box);this._button.menu.addMenuItem(item);
        this._button.menu.connect('open-state-changed',(_menu,open)=>{if(open){this._poll();this._tick();}});
        Main.panel.addToStatusArea('slon-island',this._button,1,'center');
        this._startBridge();
        this._poll();this._pollTimer=GLib.timeout_add(GLib.PRIORITY_DEFAULT,1200,()=>{this._poll();return GLib.SOURCE_CONTINUE;});
        this._animTimer=GLib.timeout_add(GLib.PRIORITY_DEFAULT,16,()=>{if(this._button.menu.isOpen)this._tick();return GLib.SOURCE_CONTINUE;});
    }
    _startBridge(){
        this._bridge=new Soup.Server();
        this._bridge.add_handler('/state',(_server,msg)=>{
            const origin=msg.get_request_headers().get_one('Origin')||'';
            if(origin!=='https://hocokkk228.github.io'&&!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)){msg.set_status(403,null);return;}
            const h=msg.get_response_headers();h.replace('Access-Control-Allow-Origin',origin);h.replace('Vary','Origin');
            h.replace('Access-Control-Allow-Methods','POST, OPTIONS');h.replace('Access-Control-Allow-Headers','Content-Type');
            h.replace('Access-Control-Allow-Private-Network','true');
            if(msg.get_method()==='OPTIONS'){msg.set_status(204,null);return;}
            if(msg.get_method()!=='POST'||msg.get_request_body().length>200000){msg.set_status(400,null);return;}
            try{
                const d=JSON.parse(new TextDecoder().decode(msg.get_request_body().flatten().get_data()));
                if(d.v!==1||typeof d.key!=='string'||!Number.isFinite(d.position)||!Number.isFinite(d.duration)||d.position<0||d.duration<0)throw Error('state');
                const now=seconds(),changed=this._lyricsKey!==d.key;
                const projected=this._lastPosition+(this._track?.status==='Playing'?(now-this._positionAt)*(this._track.rate||1):0);
                // Малые поправки часов не откатывают заливку; перемотка применяется сразу.
                this._lastPosition=!changed&&d.playing&&this._track?.status==='Playing'&&Math.abs(projected-d.position)<0.8?Math.max(projected,d.position):d.position;
                this._positionAt=now;this._bridgeAt=now;
                this._track={...this._track,title:String(d.title||''),artist:String(d.artist||''),duration:d.duration,status:d.playing?'Playing':'Paused',rate:Math.max(.25,Math.min(4,d.rate||1)),offset:Number(d.offset)||0};
                this._title.text=this._track.title;this._miniTitle.text=this._track.title;this._artist.text=this._track.artist;
                this._play.child.icon_name=d.playing?'media-playback-pause-symbolic':'media-playback-start-symbolic';
                if(changed){this._artReady=false;this._artUri='';this._cover.gicon=null;this._cover.icon_name='audio-x-generic-symbolic';this._miniCover.gicon=null;this._miniCover.icon_name='audio-x-generic-symbolic';this._lyricBase.show();this._lyricCanvas.hide();this._lyricsKey=d.key;this._requestId++;this._lines=[];this._currentIndex=-2;}
                const art=String(d.cover||'');if(art&&(art!==this._artUri||!this._artReady)&&!this._artBusy)this._setArt(art,this._requestId);
                if(typeof d.synced==='string'){this._lines=parseLrc(d.synced.slice(0,120000));if(!this._lines.length){this._prev.text='';this._next.text='';this._lyricBase.text=String(d.plain||'Текст ещё не загружен в Слоне').split('\n')[0];this._lyricFill.text=this._lyricBase.text;this._lyricFill.remove_clip();}}
                if(typeof d.color==='string'&&/^(#[a-f0-9]{3,8}|hsla?\([\d.,%\s]+\)|rgba?\([\d.,%\s]+\))$/i.test(d.color))this._setAccent(d.color);
                this._tick();
                this._commands=(this._commands||[]).filter(c=>c.id>Number(d.ack||0)&&c.until>seconds());
                msg.set_status(200,null);msg.set_response('application/json',Soup.MemoryUse.COPY,JSON.stringify({commands:this._commands}));
            }catch(e){msg.set_status(400,null);}
        });
        try{this._bridge.listen_local(38479,Soup.ServerListenOptions.IPV4_ONLY);}catch(e){console.error('SLON Island local bridge:',e);}
    }
    _setAccent(color){
        if(this._accent===color)return;this._accent=color;
        const m=/^#([a-f0-9]{6})$/i.exec(color);if(!m)return;
        const n=parseInt(m[1],16),rgb=[n>>16,(n>>8)&255,n&255];
        const tint=(k,b)=>rgb.map(v=>Math.round(v*k+b)).join(',');
        this._card.set_style(`background-gradient-direction: vertical;background-gradient-start: rgba(${tint(.35,15)},0.97);background-gradient-end: rgba(${tint(.10,9)},0.97);border-color: rgba(${rgb.join(',')},0.28);`);
        this._play.set_style(`background-color: rgba(${rgb.join(',')},0.32);border: 1px solid rgba(${rgb.join(',')},0.4);`);
    }
    _control(icon,accessible,action) {
        const b=new St.Button({style_class:'slon-island-control',can_focus:true,accessible_name:accessible,child:new St.Icon({icon_name:icon,icon_size:20})});
        b.connect('clicked',()=>{
            if(seconds()-(this._bridgeAt||0)<4){
                this._commandSeq=(this._commandSeq||Date.now())+1;
                this._commands=(this._commands||[]).slice(-19);this._commands.push({id:this._commandSeq,action,key:this._lyricsKey,until:seconds()+5});return;
            }
            if(this._track?.instance)command(['playerctl','-p',this._track.instance,action],this._cancel,()=>this._poll());});
        return b;
    }
    _poll() {
        if(!this._alive||this._pollBusy||seconds()-(this._bridgeAt||0)<4)return;this._pollBusy=true;
        const requestedAt=seconds();
        command(['playerctl','-a','metadata','--format',FORMAT],this._cancel,out=>{
            this._pollBusy=false;if(!this._alive||seconds()-(this._bridgeAt||0)<4)return;
            const rows=out.split('\n').map(line=>{const [instance,status,title,artist,art,position,length]=line.split(SEP);return {instance,status,title,artist,art,position:(Number(position)||0)/1e6,duration:(Number(length)||0)/1e6};});
            const tr=choosePlayer(rows,this._track?.instance);if(!tr){this._setIdle();return;}
            const key=[tr.instance,tr.title,tr.artist].join('\u0000');
            const changed=key!==this._lyricsKey;
            const now=seconds(), measured=tr.position+(tr.status==='Playing'?Math.max(0,now-requestedAt)/2:0);
            const projected=this._lastPosition+(this._track?.status==='Playing'?Math.max(0,now-this._positionAt):0);
            // Не дёргаем строку из-за небольшой погрешности опроса; перемотку применяем сразу.
            this._lastPosition=!changed&&this._track?.status===tr.status&&Math.abs(measured-projected)<0.65
                ? projected+(measured-projected)*0.15 : measured;
            this._positionAt=now;this._track=tr;
            this._miniTitle.text=tr.title;this._title.text=tr.title;this._artist.text=tr.artist||'Неизвестный исполнитель';
            this._play.child.icon_name=tr.status==='Playing'?'media-playback-pause-symbolic':'media-playback-start-symbolic';
            if(changed){this._lyricsKey=key;this._requestId++;this._lines=[];this._currentIndex=-2;this._setArt(tr.art,this._requestId);this._lyricBase.text='Открой Слон для передачи текста';this._lyricFill.text=this._lyricBase.text;}
            this._tick();
        });
    }
    _setIdle(){
        if(!this._track)return;this._lyricCanvas.hide();this._lyricBase.show();this._requestId++;this._track=null;this._lyricsKey='';this._lines=[];
        this._miniTitle.text='Музыка не играет';this._title.text='Музыка не играет';this._artist.text='Включи трек в Слоне';
        this._cover.gicon=null;this._cover.icon_name='audio-x-generic-symbolic';this._miniCover.gicon=null;this._miniCover.icon_name='audio-x-generic-symbolic';
        this._prev.text='';this._next.text='';this._lyricBase.text='Включи музыку';this._lyricFill.text='Включи музыку';
    }
    _read(url,cb) {
        try{
            const msg=Soup.Message.new('GET',url);if(!msg){cb(null);return;}
            this._session.send_and_read_async(msg,GLib.PRIORITY_DEFAULT,this._cancel,(session,result)=>{
                try{const bytes=session.send_and_read_finish(result);cb(msg.get_status()===200&&bytes.get_size()<5*1024*1024?bytes:null);}catch(e){if(this._alive)cb(null);}
            });
        }catch(e){cb(null);}
    }
    _setArt(uri,seq){
        if(!uri)return;this._artBusy=true;this._artUri=uri;this._artReady=false;
        const apply=file=>{if(!this._alive||seq!==this._requestId){this._artBusy=false;return;}
            const icon=new Gio.FileIcon({file});this._cover.gicon=icon;this._miniCover.gicon=icon;this._artReady=true;this._artBusy=false;};
        const save=bytes=>{if(!bytes||!this._alive||seq!==this._requestId){this._artBusy=false;return;}
            try{const dir=GLib.build_filenamev([GLib.get_user_cache_dir(),'slon-island']);GLib.mkdir_with_parents(dir,0o700);
                const path=GLib.build_filenamev([dir,'cover-'+seq+'.img']);GLib.file_set_contents(path,bytes);
                if(this._coverPath&&this._coverPath!==path)GLib.unlink(this._coverPath);this._coverPath=path;apply(Gio.File.new_for_path(path));}catch(e){this._artBusy=false;}};
        if(uri.startsWith('data:image/')){try{const at=uri.indexOf(',');if(at<0||uri.length>180000)throw Error('cover');save(GLib.base64_decode(uri.slice(at+1)));}catch(e){this._artBusy=false;}return;}
        // Пути файлов от страницы не принимаем: через мост передаются только картинки.
        if(!/^https?:\/\//i.test(uri)){this._artBusy=false;return;}
        this._read(uri,bytes=>save(bytes?.get_data()));
    }
    _tick(){
        if(!this._track||!this._lines.length)return;
        const t=this._lastPosition+(this._track.status==='Playing'?Math.max(0,seconds()-this._positionAt)*(this._track.rate||1):0);
        const {index}=lineAt(this._lines,t+(this._track.offset||0),this._track.duration);
        this._lyricBase.hide();this._lyricCanvas.show();
        if(index!==this._currentIndex){this._currentIndex=index;
            this._prev.text=index>0?this._lines[index-1].text:'';
            this._currentText=index<0?'':this._lines[index].text||'♪';
            this._next.text=this._lines[index+1]?.text||'';
            for(const actor of [this._prev,this._lyricCanvas,this._next]){actor.remove_all_transitions();actor.opacity=80;actor.translation_y=13;actor.ease({opacity:255,translation_y:0,duration:320,mode:Clutter.AnimationMode.EASE_OUT_CUBIC});}
        }
        // Тот же расчёт продолжительности пропевания, что _fpSungDur в Слоне.
        if(index>=0){const l=this._lines[index],gap=Math.max(.3,(this._lines[index+1]?.time??l.time+4)-l.time);
            const dur=Math.max(.7,Math.min(gap*.92,l.text.replace(/\s/g,'').length/13+.35));
            this._progress=Math.max(0,Math.min(1,(t+(this._track.offset||0)-l.time)/dur));
        }else this._progress=0;
        this._lyricCanvas.queue_repaint();
    }

    disable(){
        this._bridge?.disconnect();this._bridge=null;this._alive=false;this._requestId++;this._cancel?.cancel();this._session?.abort();
        if(this._pollTimer)GLib.source_remove(this._pollTimer);if(this._animTimer)GLib.source_remove(this._animTimer);
        if(this._coverPath){try{GLib.unlink(this._coverPath);}catch(e){}}
        this._button?.destroy();this._button=null;this._track=null;this._lines=[];
    }
}
