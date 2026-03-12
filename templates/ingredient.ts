export type Ingredient = {
	name?: string;
	count?: number;
	quality?: Quality;
};

export enum Quality {
	COMMON = "COMMON",
	UNCOMMON = "UNCOMMON",
	RARE = "RARE",
	EPIC = "EPIC",
	LEGENDARY = "LEGENDARY",
}