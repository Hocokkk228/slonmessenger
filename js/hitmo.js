// ════════ Интеграция Hitmo (СНГ музыка, новинки, TikTok ремиксы, полные треки) ════════
// Позволяет искать музыку, слушать полные песни в плеере SLON с караоке-текстом LRCLIB
// и в один клик добавлять треки в свою постоянную медиатеку (IndexedDB + офлайн).

async function _hmSearch(q) {
  q = String(q || '').trim();
  if (!q) return [];

  // 1. Попытка через бэкенд SLON (быстро, кэшировано в РФ, без CORS)
  try {
    const res = await api('/music/search?q=' + encodeURIComponent(q));
    if (res && res.ok && Array.isArray(res.tracks) && res.tracks.length) {
      return res.tracks;
    }
  } catch (e) {}

  // 2. Прямой поиск по зеркалам (Capacitor / Desktop или если разрешён CORS)
  const mirrors = ['https://rus.hitmotop.com', 'https://eu.hitmotop.com'];
  for (const m of mirrors) {
    try {
      const res = await fetch(m + '/search?q=' + encodeURIComponent(q), {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });
      if (res.ok) {
        const html = await res.text();
        const parsed = _hmParseHtml(html, m);
        if (parsed.length) return parsed;
      }
    } catch (e) {}
  }

  return [];
}

function _hmParseHtml(html, baseUrl) {
  const tracks = [];
  const itemRe = /<li[^>]+class=["'][^"']*tracks__item[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = itemRe.exec(html)) !== null && tracks.length < 30) {
    const block = match[1];
    const titleM = block.match(/<div class="track__title">\s*([\s\S]*?)\s*<\/div>/i);
    let title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';
    const artistM = block.match(/<div class="track__desc">\s*([\s\S]*?)\s*<\/div>/i);
    let artist = artistM ? artistM[1].replace(/<[^>]+>/g, '').trim() : '';
    const timeM = block.match(/<div class="track__fulltime">\s*([\s\S]*?)\s*<\/div>/i);
    let durStr = timeM ? timeM[1].trim() : '';
    let dur = 0;
    if (durStr && durStr.includes(':')) {
      const parts = durStr.split(':').map(Number);
      dur = parts[0] * 60 + parts[1];
    }
    const coverM = block.match(/url\(['"]?(https?:\/\/[^'")]+)['"]?\)/i);
    let cover = coverM ? coverM[1] : '';
    const dlM = block.match(/href="([^"]+\.mp3)"[^>]*class="[^"]*track__download-btn/i) ||
                block.match(/class="[^"]*track__download-btn[^"]*"[^>]*href="([^"]+\.mp3)"/i);
    let rawDl = dlM ? dlM[1] : '';
    if (rawDl && !rawDl.startsWith('http')) rawDl = baseUrl + (rawDl.startsWith('/') ? '' : '/') + rawDl;
    const idM = block.match(/data-track-id="(\d+)"/i) || block.match(/\/song\/(\d+)/i) || rawDl.match(/_(\d+)\.mp3/i);
    let id = idM ? idM[1] : 'hm_' + Math.random().toString(36).slice(2, 10);

    if (title && rawDl) {
      tracks.push({ id: 'hitmo_' + id, title, artist, dur, durStr, cover, srcUrl: rawDl });
    }
  }
  return tracks;
}

// Получение надёжной ссылки на воспроизведение (кэш в S3 с поддержкой перемотки Range)
async function _hmUrl(tr) {
  try {
    const d = await api('/music/url', { id: tr.id, srcUrl: tr.srcUrl, title: tr.title, artist: tr.artist });
    if (d && d.ok && d.url) return d.url;
  } catch (e) {}
  return tr.srcUrl;
}

// Воспроизведение трека Hitmo в основном плеере SLON
async function _hmPlay(tr, btn) {
  if (!tr) return;
  const playId = 'hm_' + tr.id;
  if (_pxAudio && _pxAudioId === playId) {
    if (_pxAudio.paused) _pxAudio.play().catch(() => {});
    else _pxAudio.pause();
    _pxBtns();
    return;
  }

  btn?.classList.add('busy');
  try {
    const streamUrl = await _hmUrl(tr);
    const playObj = {
      id: playId,
      src: 'file',
      url: streamUrl,
      title: tr.title,
      artist: tr.artist,
      cover: tr.cover || '',
      dur: tr.dur || 0
    };
    await _pxPlay(playObj, btn);
    _mmHook();
  } catch (e) {
    toast('Не удалось включить трек: ' + (e.message || 'ошибка сети'));
  } finally {
    btn?.classList.remove('busy');
    _pxBtns();
  }
}

// Добавление полного трека из Hitmo в личную медиатеку (IndexedDB)
async function _hmAdd(tr, btn) {
  if (!tr) return;
  if (btn) {
    btn.disabled = true;
    btn.classList.add('busy');
    btn.innerHTML = '<span class="hm-spin"></span> Добавление…';
  }
  try {
    const streamUrl = await _hmUrl(tr);
    const r = await fetch(streamUrl);
    if (!r.ok) throw new Error('Статус скачивания: ' + r.status);
    const audioBlob = await r.blob();
    if (!audioBlob || !audioBlob.size) throw new Error('Пустой файл');

    await _mmAddTrackBlob({
      title: tr.title,
      artist: tr.artist,
      coverUrl: tr.cover,
      audioBlob,
      dur: tr.dur
    });

    toast('✓ Трек «' + tr.title + '» добавлен в медиатеку!');
    if (btn) {
      btn.classList.remove('busy');
      btn.classList.add('added');
      btn.innerHTML = '✓ В медиатеке';
    }
  } catch (e) {
    toast('Ошибка добавления: ' + (e.message || 'попробуйте ещё раз'));
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('busy');
      btn.innerHTML = '+ В медиатеку';
    }
  }
}
