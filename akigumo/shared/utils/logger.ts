export function parseErrorMessage(errorInput: unknown) {
	let parsedDetails: any;

	if (typeof errorInput === "string") {
		try {
			// 如果是字串，嘗試解析成 JSON 物件
			parsedDetails = JSON.parse(errorInput);
		} catch (e) {
			// 萬一解析失敗（真的只是普通字串），就直接用原字串
			parsedDetails = errorInput;
		}
	} else {
		// 如果本來就是物件，直接使用
		parsedDetails = errorInput;
	}

	return parsedDetails;
}
