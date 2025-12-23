const hashService = require('./hashService');
const paths = require('./paths');

const file = '(C89) [50on! (愛上陸)] 小悪魔鹿島に絞られたいっ! (艦隊これくしょん -艦これ-).zip';
const file2 = '(C89) [50on! (愛上陸)] 小悪魔鹿島に絞られたいっ! (艦隊これくしょん -艦これ-).rar';
const filePath = paths.concat('UPLOADS', file);
const filePath2 = paths.concat('UPLOADS', file2);
const hashTest = new hashService(require('./database'));


hashTest.getFileSHA256(filePath).then(sha256 => {
    console.log('SHA256:', sha256);
    return Promise.all([Promise.resolve(sha256), hashTest.checkDuplicate(filePath)]);
}).then(([sha256, isDuplicate]) => {
    console.log('Is Duplicate:', isDuplicate);
    hashTest.setSHA256(sha256, filePath);
}).catch(err => {
    console.error('Error:', err);
});


hashTest.getFileSHA256(filePath2).then(sha256 => {
    console.log('SHA256:', sha256);
    return hashTest.checkDuplicate(filePath2);
}).then(isDuplicate => {
    console.log('Is Duplicate:', isDuplicate);
}).catch(err => {
    console.error('Error:', err);
});