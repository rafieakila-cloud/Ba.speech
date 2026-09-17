const { app, BrowserWindow, shell, Menu } = require('electron');
Menu.setApplicationMenu(Menu.buildFromTemplate([
  { label: 'Edit', submenu: [
    { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
    { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
  ]}
]));
const path = require('path');
let win = null;
const lock = app.requestSingleInstanceLock();
if (!lock) { app.quit(); }
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  function create() {
    win = new BrowserWindow({
      width: 1280, height: 860, minWidth: 900, minHeight: 600,
      title: 'Bacapi', icon: path.join(__dirname, 'icon.png'),
      autoHideMenuBar: true, backgroundColor: '#FAF9F6',
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });
    win.loadFile(path.join(__dirname, 'bacapi.html'));
    win.webContents.on('context-menu', (e, params) => {
      const items = params.isEditable
        ? [{ role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }]
        : [{ role: 'copy' }];
      Menu.buildFromTemplate(items).popup();
    });
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:/.test(url)) { shell.openExternal(url); return { action: 'deny' }; }
      return { action: 'allow' };
    });
    win.on('closed', () => { win = null; });
  }
  app.whenReady().then(() => {
    create();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) create(); });
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
