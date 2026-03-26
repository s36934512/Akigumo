// import Paths from "akigumo/kernel/paths";
// import fs from 'fs-extra';

// export const Workspace = {
//     // 封裝目錄取得規則，以後改路徑規則只需改這裡
//     getPaths: (id: string) => ({
//         original: Paths.concat('TMP_PROCESS', id, 'original'),
//         extracted: Paths.concat('TMP_PROCESS', id, 'extracted'),
//         final: Paths.concat('ARTIFACTS', id), // 鋪平後的最終存放處
//     }),

//     // 封裝高風險的 I/O 操作 (搬移、清理)
//     async finalizeArtifacts(id: string, tempFiles: string[]) {
//         const paths = this.getPaths(id);
//         await fs.ensureDir(paths.final);

//         // 鋪平邏輯 (Flattening)
//         for (const file of tempFiles) {
//             await fs.move(file, path.join(paths.final, path.basename(file)));
//         }

//         // 安全清理中間產物
//         await fs.remove(Paths.concat('TMP_PROCESS', id));
//     }
// };