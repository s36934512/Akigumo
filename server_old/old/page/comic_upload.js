// comic_upload.js
import { createImageItem } from './image_item.js';

// 自動將檔案名稱（不含副檔名）填入標題
const zipInput = document.getElementById('zipfileInput');
const form = document.getElementById('comicForm');
const imageList = document.getElementById('imageList');
const resultDiv = document.getElementById('result');
let lastUploadSha256 = null;
let previewImages = [];
let order = [];
let previewKey = null;

zipInput.addEventListener('change', async function (e) {
    const file = e.target.files[0];
    if (file) {
        // 自動填標題
        const name = file.name.replace(/\.[^.]+$/, '');
        const titleInput = document.getElementById('titleInput');
        if (!titleInput.value) titleInput.value = name;

        // 自動上傳並預覽
        const formData = new FormData();
        formData.append('zipfile', file);
        resultDiv.textContent = '上傳中...';
        try {
            const res = await fetch('/preview-upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok && data.images) {
                resultDiv.textContent = '解壓縮成功，預覽如下';
                previewKey = data.previewKey;
                lastUploadSha256 = data.sha256;
                console.log('Uploaded file SHA256:', lastUploadSha256);
                console.log(data);
                previewImages = data.images;
                // 初始化 order 陣列
                order = previewImages.map((img, i) => i);
                renderImages();
            } else {
                resultDiv.textContent = '錯誤：' + (data.error || '未知錯誤');
                previewImages = [];
                order = [];
                renderImages();
            }
        } catch (err) {
            resultDiv.textContent = '上傳失敗：' + err.message;
            previewImages = [];
            order = [];
            renderImages();
        }
    } else {
        previewImages = [];
        order = [];
        renderImages();
    }
});

// 建立 placeholder
const placeholder = document.createElement('div');
placeholder.className = 'image-item placeholder-item';
placeholder.style.display = 'none';

function createImageElements() {
    return order.map((idx) => {
        const img = previewImages[idx];
        const div = createImageItem(img, idx, delBtnEvent);
        makeDraggable(div, idx);
        return div;
    });
}

function renderImages() {
    imageList.innerHTML = '';
    if (!previewImages || previewImages.length === 0) {
        imageList.innerHTML = '<div style="color:#888">無圖片</div>';
        return;
    }

    const imageElements = createImageElements();
    imageElements.forEach(el => imageList.appendChild(el));
    // imageList.appendChild(placeholder);
}

function delBtnEvent(idx) {
    console.log('Current order:', order);

    const index = order.indexOf(idx);
    if (index >= 0 && index < order.length) {
        order.splice(index, 1);

        if (order.length === 0) {
            imageList.innerHTML = '<div style="color:#888">無圖片</div>';
        }
    }
};

let dragFromIdx = null;
let dragOverIdx = null;
let draggedEl = null;
let draggingEl = null;
let offsetX = 0;
let offsetY = 0;

function makeDraggable(div) {
    document.addEventListener("dragover", function (event) {
        event.preventDefault();
    });

    div.addEventListener('dragstart', (e) => {
        console.log('dragstart', div.dataset.idx);
        // dragFromIdx = order.indexOf(parseInt(div.dataset.idx));
        // draggedEl = div;

        // // clone 浮動元素
        // draggingEl = div.cloneNode(true);
        // draggingEl.style.width = div.offsetWidth + 'px';
        // draggingEl.style.height = div.offsetHeight + 'px';
        // draggingEl.style.position = 'absolute';
        // draggingEl.style.pointerEvents = 'none';
        // draggingEl.style.opacity = '0.7';
        // draggingEl.style.zIndex = '1000';
        // draggingEl.classList.add('dragging');
        // document.body.appendChild(draggingEl);

        // placeholder.style.height = div.offsetHeight + 'px';
        // placeholder.style.display = 'block';
        // div.parentNode.insertBefore(placeholder, div.nextSibling);

        // div.style.visibility = 'hidden';

        // const rect = div.getBoundingClientRect();
        // offsetX = e.clientX - rect.left;
        // offsetY = e.clientY - rect.top;
        // draggingEl.style.left = e.clientX - offsetX + 'px';
        // draggingEl.style.top = e.clientY - offsetY + 'px';

        // // dragover 處理拖曳移動
        // function onDragOver(ev) {
        //     console.log(ev);
        //     ev.preventDefault(); // 必須阻止預設，才能 drop
        //     draggingEl.style.left = ev.clientX - offsetX + 'px';
        //     draggingEl.style.top = ev.clientY - offsetY + 'px';

        //     const children = Array.from(imageList.children).filter(c => c !== placeholder);
        //     let inserted = false;
        //     for (let i = 0; i < children.length; i++) {
        //         const r = children[i].getBoundingClientRect();
        //         if (ev.clientY < r.top + r.height / 2) {
        //             dragOverIdx = i;
        //             imageList.insertBefore(placeholder, children[i]);
        //             inserted = true;
        //             break;
        //         }
        //     }
        //     if (!inserted) {
        //         dragOverIdx = children.length;
        //         imageList.appendChild(placeholder);
        //     }
        // }

        // // dragend 處理放置
        // function onDragEnd() {
        //     const moved = order.splice(dragFromIdx, 1)[0];
        //     order.splice(dragOverIdx > dragFromIdx ? dragOverIdx - 1 : dragOverIdx, 0, moved);

        //     renderImages();

        //     placeholder.style.display = 'none';
        //     if (draggingEl) document.body.removeChild(draggingEl);

        //     draggedEl.style.visibility = '';
        //     draggedEl = draggingEl = null;
        //     dragFromIdx = dragOverIdx = null;

        //     document.removeEventListener('dragover', onDragOver);
        //     document.removeEventListener('dragend', onDragEnd);
        // }

        //     document.addEventListener('dragover', onDragOver);
        // document.addEventListener('dragend', onDragEnd);
    });
}

// 確定順序按鈕
document.getElementById('confirmOrderBtn').onclick = function () {
    // 這裡記錄目前順序
    const order = previewImages.map(img => img.id || img.filename || '');
    alert('目前順序：\n' + order.join('\n'));
};

// 表單送出（只送出欄位，不再重複上傳檔案）
form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const title = document.getElementById('titleInput').value;
    // const author = document.getElementById('authorInput').value;
    // const tags = document.getElementById('tagsInput').value;
    const payload = {
        title,
        author: "author",
        tags: "tags",
        previewKey: previewKey,
        imageOrder: order.map(idx => previewImages[idx]?.filename || '')
    };
    const res = await fetch('/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
});
