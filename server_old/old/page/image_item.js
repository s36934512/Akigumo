function createImageItem(img, i, delBtnEvent) {

    const imageEl = document.createElement('img');
    const div = document.createElement('div');
    div.className = 'image-item';
    div.draggable = true;
    div.dataset.idx = i;

    // 自動重試機制（加延遲）
    let retryCount = 0;
    const maxRetry = 3;
    const retryDelay = 800; // ms
    imageEl.src = img;
    imageEl.draggable = false;
    imageEl.onerror = function () {
        if (retryCount < maxRetry) {
            retryCount++;
            setTimeout(() => {
                // 加一個 cache buster 防止瀏覽器快取
                const url = new URL(img, window.location.origin);
                url.searchParams.set('_retry', Date.now());
                imageEl.src = url.toString();
            }, retryDelay);
        } else {
            imageEl.alt = '載入失敗';
            imageEl.style.opacity = 0.3;
        }
    };

    div.appendChild(imageEl);

    // 刪除按鈕
    const delBtn = document.createElement('button');
    delBtn.draggable = false;
    delBtn.className = 'delete-btn';
    delBtn.title = '刪除';
    delBtn.innerHTML = '<i class="fa fa-trash"></i>';
    delBtn.addEventListener('click', (e) => {
        console.log(e);
        e.stopPropagation();
        console.log('Delete button clicked for index:', parseInt(div.dataset.idx));
        delBtnEvent(parseInt(div.dataset.idx));
        div.remove();
    });
    delBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // 停止事件冒泡
    });
    delBtn.addEventListener('dragstart', (e) => {
        e.preventDefault();   // 阻止拖曳啟動
    });
    div.appendChild(delBtn);

    return div;
}

export { createImageItem };