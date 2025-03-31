# WAY-FORWARD: Data Extraction Enhancement and Maintenance

This document outlines how to leverage and enhance the extracted game data from the Mist folder. The loDataExtractor project already processes and organizes game data into structured JSON files that are currently being used in an existing web implementation.


## Available Data Resources

The extraction process generates several key data files in the `exported/` directory:

### 1. Items Database (`items.json`)

Contains detailed information about all in-game items including:
- Equipment and weapons
- Resources and materials
- Crafting components
- Schematics and blueprints
- Structures and placeables

Each item includes properties such as:
- Category and type
- Name and description
- Crafting requirements
- Trade prices
- Weight and stack size
- Weapon/tool/armor statistics
- Durability information

### 2. Creatures Database (`creatures.json`)

Contains information about all creatures in the game:
- Name and type
- Health values
- Experience rewards
- Associated loot tables

### 3. Loot Tables

Defines what items can be obtained from creatures, resources, and containers:
- Drop rates and probabilities
- Min/max quantities
- Special conditions

### 4. Tech Trees and Progression

Details the technology progression system:
- Unlock requirements
- Dependency relationships
- Cost and prerequisites