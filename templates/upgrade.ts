import type { Recipe } from "./recipe";
import type { UpgradeInfo } from "./upgradeInfo";

export type Upgrade = {
	name?: string;
	profile?: string;
	super?: string | { [key: string]: unknown };
	crafting?: Recipe[];
	upgradeInfo?: UpgradeInfo;
};
