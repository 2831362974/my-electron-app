const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露IPC功能给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});