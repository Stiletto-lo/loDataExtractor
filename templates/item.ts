import type { WeaponInfo } from "./weaponInfo";
import type { Walker } from "./walker";
import type { UpgradeInfo } from "./upgradeInfo";

export type Item = {
	category?: string | undefined;
	cost?: number | undefined;
	crafting?: any | undefined;
	name?: string | undefined;
	parent?: string | undefined;
	trade_price?: number | undefined;
	translation?: string | undefined;
	type?: string | undefined;
	description?: string | undefined;
	projectileDamage?: number | undefined;
	experiencieReward?: number | undefined;
	stackSize?: number | undefined;
	weight?: number | undefined;
	durability?: number | undefined;
	weaponInfo?: WeaponInfo | undefined;
	toolInfo?: any | undefined;
	moduleInfo?: any | undefined;
	schematicName?: string | undefined;
	armorInfo?: any | undefined;
	movementSpeedReduction?: number | undefined;
	drops?: any | undefined;
	structureInfo?: any | undefined;
	wikiVisibility?: boolean | undefined;
	onlyDevs?: boolean | undefined;
	learn?: unknown;
	walkerInfo?: Walker | undefined;
	upgradeInfo?: UpgradeInfo | undefined;
	whereToFarm?: unknown;
};

export const itemTemplate: Item = {
	category: undefined,
	cost: undefined,
	crafting: undefined,
	name: undefined,
	parent: undefined,
	trade_price: undefined,
	translation: undefined,
	type: undefined,
	description: undefined,
	projectileDamage: undefined,
	experiencieReward: undefined,
	stackSize: undefined,
	weight: undefined,
	durability: undefined,
	weaponInfo: undefined,
	toolInfo: undefined,
	moduleInfo: undefined,
	schematicName: undefined,
	armorInfo: undefined,
	movementSpeedReduction: undefined,
	drops: undefined,
	structureInfo: undefined,
	wikiVisibility: undefined,
};

Object.freeze(itemTemplate);
