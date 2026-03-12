import { Ingredient } from "./ingredient";

export type Recipe = {
	ingredients?: Ingredient[];
	output?: number;
	station?: string;
	time?: number;
};
