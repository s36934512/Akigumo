export const fuseConfig = {
	keys: [
		{ name: "name", weight: 2 }, // 權重較高：名稱匹配更重要
		{ name: "description", weight: 1 }, // 權重較低
	],
	threshold: 0.4, // Fuse.js 嚴格度：0.0 完美匹配，1.0 匹配所有內容
	distance: 0,
	ignoreLocation: true, // 當描述字數較長時，關閉位置敏感度可大幅提升精準度
	useExtendedSearch: true, // 啟用 7.x 進階語法（如使用 '=' 進行精確匹配）
	minMatchCharLength: 1,
};
