# Last Oasis Data Extractor - Data Sources

This document provides information about the different data sets extracted by the loDataExtractor tool, explaining what each data type represents and where it's sourced from in the game files.

## Data Types Overview

The extractor processes various types of game data from Last Oasis game files and converts them into structured JSON format for easier consumption by developers and modders.

### Items

**Description:** Game items including weapons, resources, tools, and other objects that players can interact with.

**Source Location:** 
- Primary: `Content/Mist/Data/Items`
- Additional: `Content/Mist/Data/Placeables`
- Schematics: `Content/Mist/Data/Items/Schematics`

**Processing:** Items are parsed from JSON files and enriched with additional data from other sources like translations, damage types, and trade prices.

### Tech Data

**Description:** Technology tree information including unlockable skills, research requirements, and progression paths.

**Source Location:** `Content/Mist/Data/TechTree`

**Processing:** Tech data is extracted and linked with corresponding items to create a complete technology progression system.

### Creatures

**Description:** Information about in-game creatures, including their loot tables and spawn locations.

**Source Location:** `Content/Mist/Characters/Creatures`

**Processing:** Creature data is parsed and connected with loot tables to determine what items they drop.

### Loot Tables

**Description:** Defines what items can be obtained from various sources in the game, including creatures, containers, and resource nodes.

**Source Location:**
- Tables: `Content/Mist/Data/LootTables/LootTables`
- Templates: `Content/Mist/Data/LootTables/LootTemplates`
- Blueprints: `Content/Mist/Data/LootTables`

**Processing:** Loot tables are processed to create relationships between items and their sources, including drop chances and quantities.

### Translations/Locales

**Description:** Text translations for game items, descriptions, and other text elements in different languages.

**Source Location:**
- Primary: `Content/Localization/Game/en`
- Other languages: `Content/Localization/Game`
- String tables: `Content/Mist/Data/StringTables`

**Processing:** Translation data is extracted and organized by language, with special handling for item names and descriptions.

### Blueprints

**Description:** Blueprint data that defines crafting recipes and item relationships.

**Source Location:** Various locations including loot tables

**Processing:** Blueprint data is parsed and linked to items to establish crafting relationships.

### Damage Types

**Description:** Information about different damage types in the game and how they affect various materials and objects.

**Source Location:** `Content/Mist/Data/DamageTypes`

**Processing:** Damage type data is extracted and linked to weapons and projectiles.

### Trade Prices

**Description:** Information about item trading values in the game economy.

**Source Location:** `Content/Mist/Data/Trade`

**Processing:** Trade price data is extracted and linked to corresponding items.

### Walker Upgrades

**Description:** Information about upgrades available for walker vehicles in the game.

**Source Location:** `Content/Mist/Data/Walkers`

**Processing:** Upgrade data is extracted and linked to corresponding walker items.

### Datatables

**Description:** Various game data tables that define relationships and properties for game elements.

**Source Location:** Various locations throughout the content folders

**Processing:** Datatables are processed to extract structured information about game mechanics and systems.

## Data Flow

The extraction process follows these general steps:

1. Files are loaded from the specified content folder path using the `fileLoader` service
2. Each file is processed by the appropriate parser based on its type and location
3. Parsed data is stored in memory within the `dataAccess` service
4. The `fileExporter` service processes and saves the extracted data to JSON files
5. Data is saved in both full and minimized formats for different use cases

## Output Files

The extractor generates the following main output files:

- `items.json` / `items_min.json`: Complete and minimized item data
- `tech.json` / `tech_min.json`: Complete and minimized tech tree data
- `creatures.json` / `creatures_min.json`: Complete and minimized creature data
- `locales/{language}/items.json`: Localized text for each supported language

Additionally, individual JSON files are created for each item in the `items/` subdirectory.