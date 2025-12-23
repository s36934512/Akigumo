const archive = require('./archiveUtils');
const paths = require('./paths');

const file = '(C89) [50on! (愛上陸)] 小悪魔鹿島に絞られたいっ! (艦隊これくしょん -艦これ-).zip';
const filePath = paths.concat('UPLOADS', file);

console.log('File path:', filePath);
console.log('Is archive file:', archive.isArchiveFile(filePath));

const destDir = paths.concat('UPLOADS', 'EXTRACTED');

try {
    archive.extract(filePath, destDir);
    console.log('Extraction completed successfully.');
} catch (err) {
    console.error('Extraction failed:', err.message);
}

archive.createTar(paths.concat(destDir, paths.basename(file))).then(tarPath => {
    console.log('Created tar file at:', tarPath);
}).catch(err => {
    console.error('Tar creation failed:', err.message);
});