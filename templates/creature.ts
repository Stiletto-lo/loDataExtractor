import type { Creature } from "../types";

const creature: Partial<Creature> = {
	name: undefined,
	type: undefined,
	health: undefined, // From MistAnimalMobVariationComponent.MaxHealth
	experience: undefined, // From MistAnimalMobVariationComponent.ExperienceAward
	damage: undefined, // From MistPhysicalMobAttackArea.Damage
	speed: undefined, // From MistPhysicalMobMovement (Sprint.MaxSpeed or Walk.MaxSpeed)
	lootTemplate: undefined, // From MistAnimalMobVariationComponent.Loot
	category: undefined, // Derived from folder structure
	drops: undefined, // Processed loot table data
} as const;

export default Object.freeze(creature);