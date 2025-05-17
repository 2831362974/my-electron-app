const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 数据库初始化
let db = new sqlite3.Database(path.join(__dirname, 'todo.db'), (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the todo database.');

  // 创建待办事项表（如果不存在）
  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
});

function createWindow() {
  // 创建浏览器窗口
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 指定预加载脚本
      contextIsolation: true, // 启用上下文隔离
      nodeIntegration: false, // 禁用Node.js集成
    }
  });

  // 加载index.html文件
  win.loadFile('index.html');

  // 打开开发者工具
  win.webContents.openDevTools();
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 当所有窗口关闭时退出应用程序（Windows & Linux）
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') app.quit();
});

// IPC通信处理（保持不变）
ipcMain.handle('get-todos', () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM todos ORDER BY created_at DESC', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

// 添加待办事项
ipcMain.handle('add-todo', (event, title) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO todos (title) VALUES (?)', [title], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
});

// 更新待办事项
ipcMain.handle('update-todo', (event, id, title, completed) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE todos SET title = ?, completed = ? WHERE id = ?', [title, completed, id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
});

// 删除待办事项
ipcMain.handle('delete-todo', (event, id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
});
