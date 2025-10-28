export type UpgradeInfo = {
	engineTorqueMultiplier?: number | undefined;
	sprintingTorqueDiscount?: number | undefined;
	additionalParts?: any | undefined;
	sdditionalSlots?: any | undefined;
	containerSlots?: number | undefined;
	stackSizeOverride?: number | undefined;
	bonusHp?: number | undefined;
};

export const upgradeInfoTemplate: UpgradeInfo = {
	engineTorqueMultiplier: undefined,
	sprintingTorqueDiscount: undefined,
	additionalParts: undefined,
	sdditionalSlots: undefined,
	containerSlots: undefined,
	stackSizeOverride: undefined,
	bonusHp: undefined,
};

Object.freeze(upgradeInfoTemplate);
