// import { CreateFileEvents } from './contract';
// import { fileReceiverMachine } from './machine';

// function verify() {
//     const machineEventNames = Object.keys(fileReceiverMachine.config.on || {});
//     const contractEventNames = Object.values(CreateFileEvents);

//     let hasError = false;

//     contractEventNames.forEach(evt => {
//         if (!machineEventNames.includes(evt)) {
//             console.error(`❌ 錯誤：契約中的事件 "${evt}" 在狀態機中沒有定義！`);
//             hasError = true;
//         }
//     });

//     if (!hasError) {
//         console.log('✅ 驗證通過：契約與狀態機名稱完全一致！');
//     } else {
//         process.exit(1); // 失敗時讓指令回傳錯誤代碼
//     }
// }

// verify();