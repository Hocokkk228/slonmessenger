// ════════ Музыка: Ремиксы (⚡ Speed Up & 🌙 Slowed + Reverb) ════════
(function(){
  window._mmRemixMode = 'normal';
  let _audioCtx = null;
  let _mediaSource = null;
  let _reverbNode = null;
  let _wetGain = null;
  let _dryGain = null;
  let _hookedAudio = null;

  // Синтетический импульс ревербератора (атмосферный пространственный хвост)
  function _buildImpulse(ctx, duration = 2.6, decay = 2.1) {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const factor = Math.exp(- (i / rate) * decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  function _setupWebAudio(audio) {
    if (!audio || _hookedAudio === audio) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!_audioCtx) _audioCtx = new AudioCtx();
      if (_audioCtx.state === 'suspended') {
        const resume = () => { _audioCtx.resume(); document.removeEventListener('pointerdown', resume); };
        document.addEventListener('pointerdown', resume, { once: true });
      }

      // Пробуем подключить MediaElementSourceNode
      if (!_mediaSource) {
        _mediaSource = _audioCtx.createMediaElementSource(audio);
        _dryGain = _audioCtx.createGain();
        _wetGain = _audioCtx.createGain();
        _wetGain.gain.value = 0;

        _reverbNode = _audioCtx.createConvolver();
        _reverbNode.buffer = _buildImpulse(_audioCtx);

        // Dry путь: источник -> dryGain -> динамики
        _mediaSource.connect(_dryGain);
        _dryGain.connect(_audioCtx.destination);

        // Wet путь: источник -> reverb -> wetGain -> динамики
        _mediaSource.connect(_reverbNode);
        _reverbNode.connect(_wetGain);
        _wetGain.connect(_audioCtx.destination);
      }
      _hookedAudio = audio;
    } catch (e) {
      // Если браузер или CORS блокирует Web Audio — сохраняем штатную работу
      console.warn('[Remix Audio] WebAudio reverb fallback:', e.message);
    }
  }

  window._setAudioRemix = function(mode) {
    window._mmRemixMode = mode || 'normal';
    _applyRemix();
    _updateRemixUI();
    if (typeof toast === 'function') {
      toast(mode === 'speedup' ? '⚡ Режим Speed Up' : mode === 'slowed' ? '🌙 Режим Slowed + Reverb' : 'Обычное звучание');
    }
  };

  function _applyRemix() {
    const a = typeof _pxAudio !== 'undefined' ? _pxAudio : null;
    if (!a) return;
    const mode = window._mmRemixMode;

    if (mode === 'speedup') {
      a.playbackRate = 1.28;
      a.preservesPitch = false;
      if (a.mozPreservesPitch !== undefined) a.mozPreservesPitch = false;
      if (a.webkitPreservesPitch !== undefined) a.webkitPreservesPitch = false;
      if (_wetGain && _audioCtx) _wetGain.gain.setValueAtTime(0, _audioCtx.currentTime);
    } else if (mode === 'slowed') {
      a.playbackRate = 0.85;
      a.preservesPitch = false;
      if (a.mozPreservesPitch !== undefined) a.mozPreservesPitch = false;
      if (a.webkitPreservesPitch !== undefined) a.webkitPreservesPitch = false;
      _setupWebAudio(a);
      if (_wetGain && _audioCtx) {
        try {
          if (_audioCtx.state === 'suspended') _audioCtx.resume();
          _wetGain.gain.setValueAtTime(0.48, _audioCtx.currentTime);
        } catch(e) {}
      }
    } else {
      a.playbackRate = 1.0;
      a.preservesPitch = true;
      if (a.mozPreservesPitch !== undefined) a.mozPreservesPitch = true;
      if (a.webkitPreservesPitch !== undefined) a.webkitPreservesPitch = true;
      if (_wetGain && _audioCtx) _wetGain.gain.setValueAtTime(0, _audioCtx.currentTime);
    }
  }

  function _updateRemixUI() {
    const cur = window._mmRemixMode;
    document.querySelectorAll('.remix-chip').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === cur);
    });
  }

  // Хукаем play на аудио, чтобы применять выбранный ремикс автоматически
  setInterval(() => {
    const a = typeof _pxAudio !== 'undefined' ? _pxAudio : null;
    if (a && !a._remixHooked) {
      a._remixHooked = true;
      a.addEventListener('play', () => _applyRemix());
    }
  }, 1000);
})();
