export type StructureInfo = {
	type?: string | undefined;
	hp?: number | undefined;
};

export const structureInfoTemplate: StructureInfo = {
	type: undefined,
	hp: undefined,
};

Object.freeze(structureInfoTemplate);
