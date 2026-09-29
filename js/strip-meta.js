// ════════ Очистка метаданных перед отправкой (приватность) ════════
// Фото с телефона хранят в EXIF координаты места съёмки, модель телефона, время; видео — координаты
// в метаданных MP4/MOV. Раньше файлы в чат уходили как есть — по фото можно было вычислить адрес.
// Теперь перед отправкой:
//  • фото (JPEG/PNG/WebP/HEIC) перерисовываются без метаданных (поворот сохраняется);
//    не вышло (слишком большое) — у JPEG вырезаются блоки EXIF/XMP/IPTC и комментарии без пережатия;
//  • видео (MP4/MOV) — координаты (ISO 6709) в служебном блоке moov затираются нулями, видео не пережимается.
// Истории, аватарки и фото на стене и так перерисовываются — там метаданных нет.

async function _stripMeta(file){
  const t=(file.type||'').toLowerCase(),n=(file.name||'').toLowerCase();
  try{
    if(/^image\/(jpeg|jpg|png|webp|heic|heif|avif)$/.test(t)||/\.(jpe?g|png|webp|heic|heif|avif)$/.test(n)){
      const re=await _imgReencode(file);
      if(re)return re;
      if(/jpe?g/.test(t)||/\.jpe?g$/.test(n)){const s=await _jpegStrip(file);if(s)return s;}
      return file;
    }
    if(/^video\/(mp4|quicktime|3gpp|x-m4v)$/.test(t)||/\.(mp4|mov|m4v|3gp)$/.test(n))return await _mp4Strip(file);
  }catch(e){console.warn('[meta]',e);}
  return file;
}

// перерисовка: из картинки остаются только пиксели (поворот по EXIF браузер применяет при декодировании)
async function _imgReencode(file){
  let bmp;
  try{bmp=await createImageBitmap(file,{imageOrientation:'from-image'});}catch(e){return null;}
  try{
    const w=bmp.width,h=bmp.height;
    if(!w||!h||w*h>40e6)return null;                        // огромные — пусть идут через вырезание EXIF
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const png=/png/.test(file.type);
    c.getContext('2d').drawImage(bmp,0,0);
    const type=png?'image/png':/webp/.test(file.type)?'image/webp':'image/jpeg';
    const blob=await new Promise(r=>c.toBlob(r,type,.93));
    if(!blob)return null;
    let name=file.name||'photo';
    if(type==='image/jpeg'&&!/\.jpe?g$/i.test(name))name=name.replace(/\.[^.]+$/,'')+'.jpg';
    return new File([blob],name,{type,lastModified:Date.now()});
  }finally{try{bmp.close();}catch(e){}}
}

// JPEG без пережатия: выкидываем сегменты APP1 (EXIF/XMP), APP13 (IPTC) и COM (комментарии)
async function _jpegStrip(file){
  const b=new Uint8Array(await file.arrayBuffer());
  if(b[0]!==0xFF||b[1]!==0xD8)return null;
  const parts=[b.subarray(0,2)];let i=2;
  while(i+4<=b.length){
    if(b[i]!==0xFF)return null;
    const m=b[i+1];
    if(m===0xDA){parts.push(b.subarray(i));break;}            // дальше — сами данные изображения
    if(m>=0xD0&&m<=0xD7||m===0x01){parts.push(b.subarray(i,i+2));i+=2;continue;}
    const len=(b[i+2]<<8)|b[i+3];
    if(!(m===0xE1||m===0xED||m===0xFE))parts.push(b.subarray(i,i+2+len));
    i+=2+len;
  }
  return new File(parts,file.name||'photo.jpg',{type:'image/jpeg',lastModified:Date.now()});
}

// MP4/MOV: координаты хранятся строкой ISO 6709 («+55.7558+037.6173+150.000/») в ©xyz или в ключах Apple —
// внутри блока moov. Находим moov, затираем цифры координат нулями (длина та же — файл остаётся целым).
async function _mp4Strip(file){
  const rd=async(a,z)=>new Uint8Array(await file.slice(a,z).arrayBuffer());
  let pos=0,moov=null;
  while(pos+8<=file.size){
    const h=await rd(pos,pos+16),dv=new DataView(h.buffer);
    let size=dv.getUint32(0);const type=String.fromCharCode(h[4],h[5],h[6],h[7]);
    if(size===1)size=Number(dv.getBigUint64(8));else if(size===0)size=file.size-pos;
    if(size<8)break;
    if(type==='moov'){moov=[pos,pos+size];break;}
    pos+=size;
  }
  if(!moov||moov[1]-moov[0]>64*1024*1024)return file;
  const m=await rd(moov[0],moov[1]);
  let s='';for(let k=0;k<m.length;k+=8192)s+=String.fromCharCode.apply(null,m.subarray(k,k+8192));
  const re=/[+-]\d{2}(?:\.\d+)?[+-]\d{3}(?:\.\d+)?(?:[+-]\d+(?:\.\d+)?)?(?:CRS[^/]*)?\//g;
  let hit=false,x;
  while((x=re.exec(s))){hit=true;for(let k=x.index;k<x.index+x[0].length;k++)if(m[k]>=48&&m[k]<=57)m[k]=48;}
  if(!hit)return file;
  return new File([file.slice(0,moov[0]),m,file.slice(moov[1])],file.name||'video.mp4',{type:file.type||'video/mp4',lastModified:Date.now()});
}

// все файлы в чат идут через handleFile — чистим до чтения
{const f=handleFile;handleFile=async function(inp){
  const file=inp&&inp.files&&inp.files[0];
  if(!file)return f.apply(this,arguments);
  try{inp.value='';}catch(e){}
  let clean=file;
  try{clean=await _stripMeta(file);}catch(e){}
  return f.call(this,{files:[clean],value:''});
};}
