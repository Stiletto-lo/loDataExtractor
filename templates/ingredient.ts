export type Ingredient = {
	name?: string | undefined;
	count?: number | undefined;
	quality?: Quality | undefined;
};

export enum Quality {
	COMMON = 0,
	UNCOMMON = 1,
	RARE = 2,
	EPIC = 3,
	LEGENDARY = 4,
}