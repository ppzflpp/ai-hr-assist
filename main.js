const { app, BrowserWindow, ipcMain, dialog } = require('electron/main')
const path = require('node:path')
const fs = require('fs');
const parse = require('pdf-parse');
const { shell,Menu } = require('electron')
var iconv = require('iconv-lite');
const OpenAI = require("openai");
 
const client = new OpenAI({
    apiKey: "sk-8yVVnrLlh4dhZof6XacDMuRc6Ir96gMwsepvgKEJvLi9LZJ1",    
    baseURL: "https://api.moonshot.cn/v1",
});

async function chatWithOpenAI(order,info) {
  var role1 = "你好，我目前有很多个候选人简历资料，请你按照我的要求从下面的简历中筛选出最符合要求的的简历\n"
  var result = "" 
        + '1. 结果以json格式输出(只包括json信息，其他任何信息不要输出)' 
        + '2. 当没有查询到符合要求的候选人，就输出JSON对象{code : 0}；' 
        + '3. 当查询到符合要求的候选人，请按照以下JSON格式输出每个人信息：' 
        + ' {code : 1,data : [{file:"文件名1",name:"姓名1",age:"年龄1",expr: "n年工作经验",school:"毕业学校1", reason:"推荐理由1"}，......] }'
        + "\n\n"

  var content1 = "" 
      + "候选人要求：" + order + "\n"
      + "结果输出要求:" + result + "\n"
      + "候选人信息：" + info + "\n\n\n"


  const completion = await client.chat.completions.create({
      model: "moonshot-v1-8k",         
      messages: [{ 
          role: "system", content: "你是一个资深HR，为公司筛选了很多优秀的人才。现在公司规模越来越大，候选人越来越多，需要你通过几个关键字就能精确的从候选的简历当中筛选最符合要求的候选人，进而减轻公司的人力成本。",
          role: "user", content:  role1 + content1
      }],
      temperature: 0.3
  }).catch((err) => {
    
  });;
  if(completion && completion.choices){
    return completion.choices[0].message.content
  }else{
    return {
      code : -1
    }
  }

}

var selectedFiles = []
async function handleOpenPdf() {
  // 打开文件选择对话框
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'PDFs', extensions: ['pdf'] }]
  })

  if (!canceled) {
    selectedFiles = filePaths
    return filePaths
  }

}

async function handleSendContent(queryStr){
  var content = await getFileContent()
  var content = chatWithOpenAI(queryStr,content)
  return content;
}

async function handleOpenFile(filePath){
  return shell.openPath(filePath)
}

async function handleShowMessage(msg){
  const options = {
    type: 'error',
    defaultId: 2,
    cancelId: 0,
    title: '错误',
    message: msg
}; 
  return dialog.showMessageBoxSync(options)
}



async function getFileContent(){
  var finalContent = ""
  if(selectedFiles){
    for(var i = 0 ; i < selectedFiles.length ; i++){
      var data = await fs.readFileSync(selectedFiles[i])
      var content = await parse(data)
      finalContent += ""  
        + "**********简历" + (i+1) + "**********\n" 
        + "文件名：" + selectedFiles[i] + "\n"
        + "内容：" + content.text
        + "\n\n\n"
    }
    
  }
 
  return finalContent
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname,'./images/ic_hr.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
  //win.webContents.openDevTools();
}

app.whenReady().then(() => {
  ipcMain.handle('dialog:openPdf', handleOpenPdf)
  ipcMain.handle('dialog:sendContent', async (event, ...args) => {
    const result = await handleSendContent(...args)
    return result
  })
  ipcMain.handle('pdf:openFile', async (event, ...args) => {
    const result = await handleOpenFile(...args)
    return result
  })

  ipcMain.handle('dialog:showMessage', async (event, ...args) => {
    const result = await handleShowMessage(...args)
    return result
  })


  /*隐藏electron创听的菜单栏*/
  Menu.setApplicationMenu(null)

  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
