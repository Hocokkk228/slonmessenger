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

async function _callPollinationsAi(userText){
  const ctrl=new AbortController();
  const timeoutId=setTimeout(()=>ctrl.abort(),12000);
  const sys=typeof SLON_AI_SYSTEM_PROMPT!=='undefined'?SLON_AI_SYSTEM_PROMPT:'Ты — СЛОН AI, встроенный помощник мессенджера SLON.';
  try{
    const resp=await fetch('https://text.pollinations.ai/',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      signal:ctrl.signal,
      body:JSON.stringify({
        messages:[
          {role:'system',content:sys},
          {role:'user',content:userText}
        ],
        model:'openai',
        temperature:0.7
      })
    });
    clearTimeout(timeoutId);
    if(resp.ok){
      const text=await resp.text();
      if(text&&text.trim().length>1)return text.trim();
    }
  }catch(e){
    clearTimeout(timeoutId);
  }

  // Запасной GET запрос на случай проблем с POST
  try{
    const getResp=await fetch(`https://text.pollinations.ai/${encodeURIComponent(userText)}?system=${encodeURIComponent(sys)}&model=openai`);
    if(getResp.ok){
      const t=await getResp.text();
      if(t&&t.trim().length>1)return t.trim();
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
  if(mathResult!==null)return txt.trim()+' = '+mathResult+'';

  try{
    const reply=await _callPollinationsAi(txt);
    if(reply)return reply;
  }catch(e){console.warn('[SLON AI] smart AI error:',e.message);}

  try{
    const replyRouter=await _callHfChatRouter(txt);
    if(replyRouter)return replyRouter;
  }catch(e){console.warn('[SLON AI] chat router error:',e.message);}

  try{
    const reply2=await _callHfAi(txt);
    if(reply2&&reply2.length>1)return reply2;
  }catch(e){console.warn('[SLON AI] classic API недоступен, использую заготовку:',e.message);}

  return _aiReplyFallback(txt);
}

function _aiReplyFallback(txt){
  return 'Я СЛОН AI. Кажется, сейчас возникли временные трудности с подключением к нейросети. Проверь интернет-соединение и напиши мне снова!';
}
