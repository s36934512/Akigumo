import {
	DecodeMessagesSchema,
	type JobDict,
	type Messages,
} from "./schema/index.js";

export function get_Jobs(messages: Messages): JobDict[] {
	const jobs: JobDict[] = [];

	for (const [id, fields] of messages) {
		const job = DecodeMessagesSchema.parse([id, fields]);
		jobs.push(job);
	}

	return jobs;
}
