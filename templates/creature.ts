export type Creature = {
	name?: string;
	type?: string;
	health?: number; // From MistAnimalMobVariationComponent.MaxHealth
	experience?: number; // From MistAnimalMobVariationComponent.ExperienceAward
	damage?: number; // From MistPhysicalMobAttackArea.Damage
	speed?: number; // From MistPhysicalMobMovement (Sprint.MaxSpeed or Walk.MaxSpeed)
	lootTemplate?: string; // From MistAnimalMobVariationComponent.Loot
	category?: string; // Derived from folder structure
	drops?: any; // Processed loot table data
	tier?: string | undefined; // Derived from folder structure
};
