export const recipeTemplate = {
	ingredients: [] as { name: string; count: number }[],
	output: undefined as number | undefined,
	station: undefined as string | undefined,
	time: undefined as number | undefined,
};

Object.freeze(recipeTemplate);
