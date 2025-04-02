# Tech Tree Data Extraction Guide

This document explains how tech tree data is extracted from the game files, how it's structured, and how it can be implemented in future updates to the project.

## Overview

Tech trees in the game represent the progression system that players follow to unlock new items, structures, and abilities. The `loDataExtractor` project already has the foundation for extracting tech tree data, but it needs to be fully implemented and integrated into the web application.

## Data Structure

Tech tree data is stored in the game files under the path `Content/Mist/Data/TechTree`. The extraction process parses these files and converts them into structured JSON data that can be used by the web application.

### Tech Tree Item Structure

Tech tree items are represented in the exported data with the following key properties:

```json
{
  "name": "[Item Name]",
  "type": "[Item Type]",
  "parent": "[Parent Item Name]",
  "cost": {
    "name": "Fragment" or "Tablet",
    "count": [Number of Fragments/Tablets required]
  },
  "category": "[Category]"
}
```

- **name**: The display name of the tech tree item
- **type**: The internal type identifier used by the game
- **parent**: The name of the parent item in the tech tree (represents dependency)
- **cost**: The unlock cost, which includes:
  - **name**: Either "Fragment" (for lower tiers) or "Tablet" (for higher tiers)
  - **count**: The number of Fragments or Tablets required to unlock
- **category**: Often set to "Upgrades" for tech tree items

## Extraction Process

### Current Implementation

The current implementation includes:

1. **Loading Tech Tree Files**: In `index.js`, the tech tree files are loaded from the game directory:
   ```javascript
   console.info("Loading TechTree");
   loadDirData(`${CONTENT_FOLDER_PATH}Content/Mist/Data/TechTree`, "tech");
   ```

2. **Parsing Tech Data**: The `parseTechData` function in `controllers/fileParsers/itemParsers/techParser.js` handles the extraction of tech tree data:
   ```javascript
   const parseTechData = (filePath) => {
     // Read and parse the file
     const rawdata = fs.readFileSync(filePath);
     const jsonData = JSON.parse(rawdata);
     
     // Extract item data
     if (jsonData?.[1]?.Type) {
       const item = utilityFunctions.extractItemByType(jsonData[1].Type);
       
       // Extract parent data (dependencies)
       if (jsonData?.[1]?.Properties?.Requirements?.[0]?.ObjectName) {
         item.parent = translator.translateName(
           dataParser.parseName(
             translator,
             jsonData[1].Properties.Requirements[0].ObjectName,
           ),
         );
       }
       
       // Extract cost data
       if (jsonData[1]?.Properties?.Cost !== undefined) {
         const itemCost = { ...require("../../../templates/cost") };
         if (
           jsonData[1].Properties.TechTreeTier &&
           (jsonData[1].Properties.TechTreeTier.includes("Tier4") ||
             jsonData[1].Properties.TechTreeTier.includes("Tier5") ||
             jsonData[1].Properties.TechTreeTier.includes("Tier6"))
         ) {
           itemCost.name = "Tablet";
         } else {
           itemCost.name = "Fragment";
         }
         itemCost.count = jsonData[1].Properties.Cost;
         
         // Set cost data
         item.cost = itemCost;
       }
       
       // Handle hidden items
       if (jsonData[1]?.Properties?.bHidden) {
         item.onlyDevs = true;
       }
       
       if (jsonData[1]?.Properties?.bHidden && !SHOW_DEV_ITEMS) {
         item.parent = undefined;
       }
       
       // Set category
       if (item.name) {
         if (item.name.includes("Upgrades")) {
           item.category = "Upgrades";
         } else if (item.name.includes("Hook")) {
           item.category = "Grappling Hooks";
         }
       }
       
       // Add to items collection
       utilityFunctions.getAllItems().push(item);
     }
   };
   ```

### Tech Tree Tiers

The tech tree is organized into tiers, with higher tiers requiring Tablets instead of Fragments to unlock. The tier information is extracted from the `TechTreeTier` property in the game files.

## Relationships

Tech tree items have several important relationships:

1. **Parent-Child Relationships**: Each tech tree item can have a parent, which represents the prerequisite for unlocking that item. This creates a hierarchical structure that forms the tech tree.

2. **Unlockable Items**: Tech tree nodes unlock specific items, structures, or abilities in the game. These relationships are represented by the items that reference tech tree nodes as their parents.

3. **Tier Progression**: The tech tree is divided into tiers, with higher tiers requiring more valuable resources (Tablets instead of Fragments).

## Implementation Guide

To fully implement tech tree extraction and visualization, follow these steps:

### 1. Complete the Extraction Process

The current extraction process already captures the basic structure of tech tree items, but it could be enhanced to include:

- More detailed tier information
- Additional metadata about each tech tree node
- Better categorization of tech tree items

### 2. Create a Dedicated Export File

Currently, tech tree items are included in the general `items.json` export. Consider creating a dedicated `techtree.json` export that organizes the tech tree data in a more structured way, such as:

```json
{
  "tiers": [
    {
      "name": "Tier 1",
      "nodes": [
        {
          "name": "Basic Crafting",
          "cost": { "name": "Fragment", "count": 5 },
          "unlocks": ["Item1", "Item2", "Item3"]
        }
      ]
    }
  ]
}
```

### 3. Implement Visualization

The web application could include a visual representation of the tech tree, showing:

- Nodes organized by tier
- Parent-child relationships (dependencies)
- Unlock costs
- Items unlocked by each node

### 4. Export Process

To export the tech tree data:

1. Extract the tech tree data using the existing `parseTechData` function
2. Process the data to organize it by tier and establish relationships
3. Export the processed data to a dedicated JSON file
4. Include references to unlockable items

## Example Export Code

Here's an example of how you might implement a dedicated tech tree export:

```javascript
const exportTechTree = () => {
  const allItems = utilityFunctions.getAllItems();
  
  // Filter tech tree items (those with cost property)
  const techItems = allItems.filter(item => item.cost && (item.cost.name === "Fragment" || item.cost.name === "Tablet"));
  
  // Organize by tier
  const techTree = {
    tiers: {
      tier1: { nodes: [] },
      tier2: { nodes: [] },
      tier3: { nodes: [] },
      tier4: { nodes: [] },
      tier5: { nodes: [] },
      tier6: { nodes: [] }
    }
  };
  
  // Process each tech item
  techItems.forEach(item => {
    const tierLevel = item.cost.name === "Tablet" ? 
      (item.type.includes("Tier6") ? "tier6" : 
       item.type.includes("Tier5") ? "tier5" : "tier4") : 
      (item.type.includes("Tier3") ? "tier3" : 
       item.type.includes("Tier2") ? "tier2" : "tier1");
    
    // Find items that this tech unlocks
    const unlockedItems = allItems
      .filter(i => i.parent === item.name)
      .map(i => i.name);
    
    techTree.tiers[tierLevel].nodes.push({
      name: item.name,
      type: item.type,
      parent: item.parent,
      cost: item.cost,
      unlocks: unlockedItems
    });
  });
  
  // Write to file
  fs.writeFileSync(
    `${folderPatch}techtree.json`,
    JSON.stringify(techTree, null, 2)
  );
};
```

## Conclusion

The tech tree data extraction process is partially implemented in the current codebase. By enhancing the extraction process and creating a dedicated export, you can provide a comprehensive representation of the game's progression system for use in the web application.

This will allow users to visualize the tech tree, plan their progression, and understand the relationships between different technologies and the items they unlock.