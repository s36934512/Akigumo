const paths = require('./paths');

console.log('TMP path:', paths.TMP);
console.log('Uploads path:', paths.UPLOADS);
console.log('Extracted path:', paths.TMP_EXTRACTED);

const fullPath = paths.concat('UPLOADS', 'example.zip');
console.log('Full path to example.zip:', fullPath);

const relativePath = paths.relative(paths.ROOT, fullPath);
console.log('Relative path from ROOT to example.zip:', relativePath);

const ext = paths.extname(fullPath);
console.log('File extension of example.zip:', ext);

const newPath = paths.changeDir(fullPath, paths.TMP);
console.log('New path in TMP directory:', newPath);

console.log('New path with .txt extension:', paths.changeExt(fullPath, '.txt'));

console.log('Basename of the file:', paths.basename(fullPath));

console.log('Directory name of the file:', paths.dirname(fullPath, 5));