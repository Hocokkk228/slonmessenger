// Мост для веб-части: сайт узнаёт, что он внутри SLON для Windows.
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('SLON_DESKTOP', { platform: 'windows', version: process.env.npm_package_version || '' });
