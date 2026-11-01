import Pango from 'gi://Pango';
import PangoCairo from 'gi://PangoCairo';
import Cairo from 'cairo';

// Один Pango layout: переносы, обводка и последовательная заливка каждой строки.
export function prepare(cr,text,width){
    const layout=PangoCairo.create_layout(cr);
    layout.set_font_description(Pango.FontDescription.from_string('Sans Bold 19'));
    layout.set_width(Math.max(40,width-10)*Pango.SCALE);
    layout.set_wrap(Pango.WrapMode.WORD_CHAR);
    layout.set_spacing(5*Pango.SCALE);layout.set_text(text,-1);
    const bytes=new TextEncoder().encode(text),rows=[],it=layout.get_iter();
    do{const line=it.get_line_readonly(),[,r]=it.get_line_extents();
        rows.push({x:r.x/Pango.SCALE,y:r.y/Pango.SCALE,w:r.width/Pango.SCALE,h:r.height/Pango.SCALE,
            n:new TextDecoder().decode(bytes.slice(line.start_index,line.start_index+line.length)).replace(/\s/g,'').length});
    }while(it.next_line());
    const [,h]=layout.get_pixel_size();return {layout,rows,height:h+10,total:rows.reduce((a,r)=>a+r.n,0)||1};
}
export function paint(cr,p,progress,color,phase){
    const m=/^#([a-f\d]{6})$/i.exec(color||'');const hex=m?parseInt(m[1],16):0xb7ccff;
    const rgb=[(hex>>16)/255,((hex>>8)&255)/255,(hex&255)/255];
    cr.translate(5,5);
    PangoCairo.layout_path(cr,p.layout);cr.setSourceRGBA(1,1,1,.38);cr.setLineWidth(.8);cr.strokePreserve();
    cr.setSourceRGBA(.85,.9,1,.25);cr.fill();
    let left=Math.max(0,Math.min(1,progress))*p.total;
    for(const r of p.rows){
        const q=Math.max(0,Math.min(1,left/Math.max(1,r.n)));left-=r.n;if(!q)continue;
        cr.save();cr.rectangle(r.x-1,r.y-2,(r.w+2)*q,r.h+4);cr.clip();
        const grad=new Cairo.LinearGradient(0,r.y,0,r.y+r.h);
        grad.addColorStopRGBA(0,...rgb.map(v=>v+(1-v)*.48),1);grad.addColorStopRGBA(.55,...rgb,1);grad.addColorStopRGBA(1,...rgb.map(v=>v*.8),1);
        cr.setSource(grad);PangoCairo.show_layout(cr,p.layout);
        // Медленный блик поверх акцентного цвета, как kwFlow в Слоне.
        const center=(1-phase)* (r.w+160)-80;
        const shine=new Cairo.LinearGradient(center-65,0,center+65,25);
        shine.addColorStopRGBA(0,1,1,1,0);shine.addColorStopRGBA(.5,1,1,1,.65);shine.addColorStopRGBA(1,1,1,1,0);
        cr.setSource(shine);PangoCairo.show_layout(cr,p.layout);cr.restore();
    }
}
