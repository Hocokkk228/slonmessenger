function _tryLocalMath(txt){
  let s=txt.toLowerCase();
  s=s.replace(/сколько (будет|это|равно|получится)|посчитай|вычисли|реши(ть)?|what'?s|calculate|equals?/gi,'');
  s=s.replace(/[?!.]/g,'');
  s=s.replace(/,/g,'.');
  s=s.replace(/\^/g,'**');
  s=s.trim();
  if(!s)return null;
  // Разрешаем только цифры, операторы, скобки, точку, пробелы, **
  if(!/^[0-9+\-*/().\s]+$/.test(s))return null;
  if(!/[0-9]/.test(s)||!/[+\-*/]/.test(s))return null;
  try{
    const result=Function('"use strict";return ('+s+')')();
    if(typeof result==='number'&&isFinite(result)){
      const rounded=Math.round(result*1e6)/1e6;
      return String(rounded);
    }
  }catch(e){}
  return null;
}

async function _callHfChatRouter(userText){
  for(const model of HF_CHAT_MODELS){
    try{
      const ctrl=new AbortController();
      const timeoutId=setTimeout(()=>ctrl.abort(),12000);
      const resp=await fetch('https://router.huggingface.co/v1/chat/completions',{
        method:'POST',
        headers:{'Authorization':'Bearer '+HF_API_TOKEN,'Content-Type':'application/json'},
        signal:ctrl.signal,
        body:JSON.stringify({
          model,
          messages:[
            {role:'system',content:SLON_AI_SYSTEM_PROMPT},
            {role:'user',content:userText}
          ],
          max_tokens:220,
          temperature:0.6
        })
      });
      clearTimeout(timeoutId);
      if(!resp.ok)continue;
      const data=await resp.json();
      const text=data?.choices?.[0]?.message?.content;
      if(text&&text.trim().length>1)return text.trim();
    }catch(e){
      console.warn('[SLON AI] router модель не сработала:',model,e.message);
    }
  }
  return null;
}

async function _callHfAi(userText){
  const prompt=`<s>[INST] ${SLON_AI_SYSTEM_PROMPT}\n\nВопрос пользователя: ${userText} [/INST]`;
  const resp=await fetch('https://api-inference.huggingface.co/models/'+HF_MODEL,{
    method:'POST',
    headers:{'Authorization':'Bearer '+HF_API_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify({
      inputs:prompt,
      parameters:{max_new_tokens:220,temperature:0.7,return_full_text:false},
      options:{wait_for_model:true}
    })
  });
  if(!resp.ok){
    const errTxt=await resp.text().catch(()=>'');
    throw new Error('HF API '+resp.status+': '+errTxt.slice(0,120));
  }
  const data=await resp.json();
  if(Array.isArray(data)&&data[0]?.generated_text){
    return data[0].generated_text.trim();
  }
  if(data?.error)throw new Error(data.error);
  throw new Error('Unexpected HF response shape');
}

async function aiReply(txt){
  const mathResult=_tryLocalMath(txt);
  if(mathResult!==null)return txt.trim()+' = '+mathResult+' 🐘';

  try{
    const reply=await _callHfChatRouter(txt);
    if(reply)return reply;
  }catch(e){console.warn('[SLON AI] chat router error:',e.message);}

  try{
    const reply2=await _callHfAi(txt);
    if(reply2&&reply2.length>1)return reply2;
  }catch(e){console.warn('[SLON AI] classic API недоступен, использую заготовку:',e.message);}

  return _aiReplyFallback(txt);
}

function _aiReplyFallback(txt){
  const t=txt.toLowerCase();
  if(t.includes('привет')||t.includes('здравствуй')||t.includes('хай'))
    return'Привет! 🐘 Чем могу помочь?';
  if(t.includes('как дела')||t.includes('как ты'))
    return'Отлично, спасибо что спросил! Всегда готов помочь 🐘';
  if(t.includes('slon')||t.includes('слон'))
    return'SLON — это мессенджер с чатами, звонками, каналами и группами! 🐘';
  if(t.includes('помог')||t.includes('help')||t.includes('что умеешь'))
    return'Я СЛОН AI! Спроси меня про любую кнопку или функцию мессенджера — разберёмся 🐘';
  if(t.includes('звонок')||t.includes('позвони'))
    return'Для звонка открой чат с контактом и нажми на иконку телефона или камеры в шапке 📞';
  if(t.includes('канал'))
    return'Канал создаётся через кнопку ➕ снизу справа в списке чатов → "Новый канал" 📢';
  if(t.includes('группа'))
    return'Группа создаётся через кнопку ➕ → "Новая группа", сначала выбираешь участников, потом название 👥';
  if(t.includes('тема')||t.includes('цвет')||t.includes('оформлен'))
    return'Тему можно сменить через ☰ → Тема — там 19 вариантов! 🎨';
  if(t.includes('пока')||t.includes('до свидания')||t.includes('bye'))
    return'Пока-пока! 🐘 Возвращайся!';
  if(t.includes('спасибо')||t.includes('благодар'))
    return'Всегда пожалуйста! 🐘';
  const replies=[
    'Интересно! Расскажи подробнее 🐘',
    'Понял тебя! Что-то ещё? 🐘',
    'Хм, дай подумаю... 🤔🐘',
    'Отличная мысль! 🐘',
    'Я весь внимание! 🐘',
    'Спроси меня про любую функцию мессенджера 🐘',
  ];
  return replies[Math.floor(Math.random()*replies.length)];
}
