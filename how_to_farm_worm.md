# How to Farm the Worm

This document explains what is obtained when farming the "Worm" character and what tools are necessary, based on the analysis of the game files.

## Farmable Parts of the Worm

The worm has several parts that can be farmed to obtain different resources:

### 1. Worm Scales (HarvestableWormScale)

**Source File:** `Mist\Content\Mist\Characters\Worm\HarvestableWormScale.json`

When farming worm scales, the following items can be obtained:

*   **Worm Scale (WormScale_C):** A Tier 4 resource.
*   **Chitin Shell (ChitinShell_C):** A Tier 3 resource.

**Necessary Tools and Effectiveness:**

The effectiveness and quantity of items obtained may vary depending on the tool used. The following tools can be used to farm the scales:

*   **TreeCutting Tool (EEquipmentTool::TreeCutting):**
    *   Worm Scale: 0.5 probability, 1 at a time.
    *   Chitin Shell: 1.0 probability, 1-3 at a time.
*   **Mining Tool (EEquipmentTool::Mining):**
    *   Worm Scale: 0.5 probability, 1 at a time.
    *   Chitin Shell: 1.0 probability, 3-5 at a time.
*   **Scythe (EEquipmentTool::Scythe):**
    *   Worm Scale: 0.3 probability, 1 at a time.
    *   Chitin Shell: 0.25 probability, 1-2 at a time.
*   **Sawblade (EEquipmentTool::Sawblade):**
    *   Worm Scale: (Probability and quantity information not fully visible in the excerpt, but it is expected to be effective).
    *   Chitin Shell: (Probability and quantity information not fully visible in the excerpt).

### 2. Worm Mandibles (WormHarvestableMandibleComponent)

**Source File:** `Mist\Content\Mist\Characters\Worm\WormHarvestableMandibleComponent.json`

When farming worm mandibles, the following items can be obtained:

*   **Bone Splinter (BoneSplinter_C):** A Tier 2 resource.
*   **Worm Fang (WormFang_C):** A Tier 4 resource.

**Necessary Tools and Effectiveness:**

*   **TreeCutting Tool (EEquipmentTool::TreeCutting):**
    *   Bone Splinter: 1.0 probability, 1-3 at a time.
    *   Worm Fang: 0.25 probability, 1 at a time.
*   **Mining Tool (EEquipmentTool::Mining):**
    *   Bone Splinter: 1.0 probability, 1-3 at a time.
    *   Worm Fang: 0.2 probability, 1 at a time.
*   **Sawblade (EEquipmentTool::Sawblade):**
    *   Bone Splinter: 1.0 probability, 1-2 at a time (with tool level bonus).
    *   Worm Fang: 0.4 probability, 1-2 at a time.

### 3. Worm Silk Drop (WormSilkDrop)

**Source File:** `Mist\Content\Mist\Characters\Worm\WormSilkDrop.json`

The worm can also drop "Silk Drops" (`WormSilkDrop_C`). These appear to be separate entities that can be collected.

*   **Obtained Item:** When interacting with the silk drop, `WormSilkSlimeFoliage_C` (Worm Silk Slime Foliage) is obtained.
*   **Necessary Tools:** The `WormSilkDrop.json` file does not specify concrete tools but indicates it is a harvestable actor (`MistHarvestableActor`) and has a foliage type (`WormSilkSlimeFoliage_C`). This suggests direct interaction or use of a generic foliage harvesting tool.

## Summary of Tools

To efficiently farm the worm, it is recommended to have the following tools, preferably of a good level:

*   **TreeCutting Tool** (for Scales and Mandibles)
*   **Mining Tool** (for Scales and Mandibles, appears to be more effective for Chitin Shell and has a good probability for Fangs)
*   **Scythe** (mainly for Scales, although with lower probability)
*   **Sawblade** (for Scales and Mandibles, appears to be very effective for Fangs and Bone Splinters)

It is important to note that the tool level (`ToolLevel`) can influence the quantity and probability of obtaining certain resources.