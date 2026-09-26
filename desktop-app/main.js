// ════════════════════════════════════════════════════════════════
// SLON для Windows (Electron).
// • Интерфейс берётся с сайта — обновления приходят сразу, без переустановки.
//   Нет сети / сайт недоступен — открывается встроенная копия (папка offline).
// • Крестик — сворачивает в трей (уведомления продолжают приходить), как у Telegram.
// • Камера, микрофон, демонстрация экрана; ссылки — во внешнем браузере; одна копия приложения.
// ════════════════════════════════════════════════════════════════
const { app, BrowserWindow, Tray, Menu, shell, session, desktopCapturer, nativeImage, Notification } = require('electron');
const path = require('path');

const SITE = 'https://hocokkk228.github.io/slonmessenger/';
const ICON = path.join(__dirname, 'build', 'icon.png');
let win = null, tray = null, quitting = false;

app.setAppUserModelId('com.sloncomp.slon.desktop');     // имя в уведомлениях Windows
if (!app.requestSingleInstanceLock()) { app.quit(); }
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });

function createWindow() {
  win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 380, minHeight: 520,
    backgroundColor: '#0d1520', title: 'SLON', icon: ICON, show: false,
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, spellcheck: true, backgroundThrottling: false }
  });
  win.removeMenu();
  win.once('ready-to-show', () => win.show());

  // сайт → если не открылся за 8 с или ошибка — встроенная копия
  let loadedLocal = false;
  const loadLocal = () => { if (loadedLocal) return; loadedLocal = true; win.loadFile(path.join(__dirname, 'offline', 'index.html')); };
  const t = setTimeout(loadLocal, 8000);
  win.webContents.once('did-finish-load', () => clearTimeout(t));
  win.webContents.on('did-fail-load', (e, code, desc, url, isMain) => { if (isMain && !loadedLocal) { clearTimeout(t); loadLocal(); } });
  win.loadURL(SITE);

  // ссылки — во внешнем браузере
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(SITE) && !url.startsWith('file:')) { e.preventDefault(); shell.openExternal(url); } });

  // крестик — в трей
  win.on('close', e => { if (!quitting) { e.preventDefault(); win.hide(); } });
}

function createTray() {
  const img = nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 });
  tray = new Tray(img);
  tray.setToolTip('SLON');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Открыть SLON', click: () => { win.show(); win.focus(); } },
    { type: 'separator' },
    { label: 'Выйти', click: () => { quitting = true; app.quit(); } }
  ]));
  tray.on('click', () => { if (win.isVisible() && win.isFocused()) win.hide(); else { win.show(); win.focus(); } });
}

app.whenReady().then(() => {
  // камера / микрофон / уведомления — разрешаем для нашего сайта и встроенной копии
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => {
    const ok = ['media', 'notifications', 'clipboard-read', 'clipboard-sanitized-write', 'fullscreen', 'display-capture'].includes(perm);
    cb(ok);
  });
  // демонстрация экрана: показываем основной экран (как «весь экран» в браузере)
  session.defaultSession.setDisplayMediaRequestHandler((req, cb) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then(src => cb({ video: src[0], audio: 'loopback' })).catch(() => cb({}));
  }, { useSystemPicker: true });
  createWindow();
  createTray();
});
app.on('before-quit', () => { quitting = true; });
app.on('window-all-closed', () => { /* живём в трее */ });
