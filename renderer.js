



pdfFiles = []
var timer = null
document.getElementById('selectPdfBtn').addEventListener('click', async () => {
  const filePaths = await window.electronAPI.openPDF()
  if(filePaths){
    pdfFiles = filePaths
    addPdfToList(filePaths)
  }

});

document.getElementById('sendBtn').addEventListener('click', async function() {
  var value = document.getElementById('chatInput').value
  if(value == null || value == "" || value.trim() == "" ){
    return await window.electronAPI.showMessage("简历筛选条件不能为空")
  }else if( pdfFiles == null || pdfFiles.length == 0){
    return await window.electronAPI.showMessage("简历列表不能为空")
  }

  

  // 隐藏所有按钮
  document.getElementById('sendBtn').disabled = true;
  document.getElementById('selectPdfBtn').disabled = true;

  // 显示进度条
  const progressBar = document.getElementById('progress-bar');
  const progressBarInner = document.getElementById('progress-bar-inner');
  progressBar.style.display = 'block';
  progressBarInner.value = 0;

  timer = setInterval(() => {
    let value = progressBarInner.value + 5
    if(value < 90){
      progressBarInner.value = value
      
    }
  }, 1000); 

  var result = null;
  result = await window.electronAPI.sendContent(value).catch((err) => {console.log("=======sendContent==========",err)});

  if(result == undefined){
    result = {
      code : -1
    }
  }

  var stype = typeof result
  if(stype === "string"){
    result = JSON.parse(result);
  }

  console.log(result)

  if(result.code == 1){
    createResultCard(result.data)
  }else if(result.code == 0){
    clearInterval(timer)
    progressBarInner.value = 100;
    await window.electronAPI.showMessage("没有符合条件的候选人")
  }else{
    clearInterval(timer)
    progressBarInner.value = 100;
    await window.electronAPI.showMessage("查询太快，慢点查")
  }

  
  // 重新启用所有按钮
  document.getElementById('sendBtn').disabled = false;
  document.getElementById('selectPdfBtn').disabled = false;
  clearInterval(timer)
  progressBarInner.value = 100;
});


function createResultCard(cards){
    for(var i in cards){
      // 创建卡片并添加到列表中
      const card = document.createElement('div');
      card.className = 'card';

      const header = document.createElement('div');
      header.className = 'card-header';
      header.textContent = cards[i].name; // 这里可以添加文件名

      const age = document.createElement('div');
      age.className = 'card-age';
      age.textContent = cards[i].age; // 这里可以添加文件名

      const school = document.createElement('div');
      school.className = 'card-school';
      school.textContent = cards[i].school; // 这里可以添加文件名

      const expr = document.createElement('div');
      expr.className = 'card-expr';
      expr.textContent = cards[i].expr; // 这里可以添加文件名

      const content = document.createElement('div');
      content.className = 'card-content';
      content.textContent = cards[i].reason; // 这里可以添加文件内容

      card.appendChild(header);
      card.appendChild(age);
      card.appendChild(school);
      card.appendChild(expr);
      card.appendChild(content);

      // 添加点击事件监听器
      card.addEventListener('click', function() {
        // 使用 shell.openItem 方法打开 PDF 文件
        window.electronAPI.openFile(cards[i].file);
      });

      const results = document.getElementById('results');
      results.appendChild(card);
    }
  }


function addPdfToList(filePaths) {
  //处理列表
  filePaths = processList(filePaths)
  //清除原有列表
  clearList();
  var i = 0
  //添加新的列表
  filePaths.forEach(filePath => {
    const pdfList = document.querySelector('.pdf-list');
    const pdfItem = document.createElement('div');
    pdfItem.className = 'pdf-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'pdf-checkbox';
    checkbox.checked = true;
    checkbox.disabled  = true;
    pdfItem.appendChild(checkbox);

    const label = document.createElement('label');
    label.textContent = getPdfName(filePath);
    pdfItem.appendChild(label);

    pdfList.appendChild(pdfItem);
   
  });
  
}

function processList(list){
  if(list && list.length >= 5){
    return list.slice(0,5)
  }else{
    return list
  }
}

function clearList(){
    const pdfList = document.querySelector('.pdf-list');
    pdfList.innerHTML = "";
}

function getPdfName(filePath){
  return filePath.replace(/^.*[\\\/]/, '')
}

