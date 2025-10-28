export type Rig = {
	medium?: any | undefined;
	small?: any | undefined;
	large?: any | undefined;
	edgeLarge?: any | undefined;
	edgeMedium?: any | undefined;
	edgeSmall?: any | undefined;
};

export const rigTemplate: Rig = {
	medium: undefined,
	small: undefined,
	large: undefined,
	edgeLarge: undefined,
	edgeMedium: undefined,
	edgeSmall: undefined,
};

Object.freeze(rigTemplate);
