function _saveMsgToSaved(msg){
  if(!chatHist.saved)chatHist.saved=[];
  const copy={...msg};
  copy.id='sv'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  copy.sender='me';
  copy.ts=Date.now();
  copy.time=fmtTime(copy.ts);
  delete copy.pinned;delete copy.readSent;delete copy.edited;
  chatHist.saved.push(copy);
  saveAll();
  if(activeChat==='saved'){appendMsg(copy);scrollDown();}
  updatePreview('saved',copy.text?copy.text.slice(0,28):'📎 Медиа',copy.ts);
  toast('⭐ Сохранено в Избранном');
}

function _clearSavedChat(){
  showModal(`<div class="m-title">Очистить Избранное?</div>
    <div class="m-info">Все сохранённые сообщения будут удалены безвозвратно.</div>
    <div class="m-btns">
      <button class="btn-cancel" onclick="closeModal()">Отмена</button>
      <button class="btn-danger" onclick="_doClearSaved()">Очистить</button>
    </div>`);
}

function _doClearSaved(){
  chatHist.saved=[];
  saveAll();
  closeModal();
  if(activeChat==='saved')renderChat('saved');
  updatePreview('saved','Заметки для себя');
  toast('Избранное очищено');
}
