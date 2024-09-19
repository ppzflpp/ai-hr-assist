const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openPDF: () => ipcRenderer.invoke('dialog:openPdf'),
  sendContent: (arg1) => ipcRenderer.invoke('dialog:sendContent',arg1),
  openFile: (arg1) => ipcRenderer.invoke('pdf:openFile',arg1),
  showMessage: (arg1) => ipcRenderer.invoke('dialog:showMessage',arg1)
});



