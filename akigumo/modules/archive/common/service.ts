import { prisma } from "#akigumo/db/prisma.js";

export async function getOrCreateDefaultExt() {
	return await prisma.fileExtension.upsert({
		where: { code: "unknown" },
		update: {},
		create: {
			code: "unknown",
			name: "未知格式",
			category: {
				connectOrCreate: {
					where: { code: "other" },
					create: {
						code: "other",
						name: "其他",
						description: "二進位檔或無法辨識的格式",
					},
				},
			},
		},
	});
}
