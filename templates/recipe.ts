export type Recipe = {
	ingredients?: { name: string | undefined; count: number | undefined }[];
	output?: number;
	station?: string;
	time?: number;
};
