const imageUtils = require('./imageUtils');
const paths = require('./paths');
const fileService = require('./fileService_unstable');

const path = 'EXTRACTED/(C89) [50on! (愛上陸)] 小悪魔鹿島に絞られたいっ! (艦隊これくしょん -艦これ-)'
outpath = paths.concat('TMP_UPLOADS', path);

async function main() {
    pathlist = await fileService.getImageFilesInDirectory(paths.concat('UPLOADS', path));

    imageUtils.convertImagesToWebp(pathlist, outpath).then(console.log).catch(console.error)
}

main();