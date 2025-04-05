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

## Data Quality Issues and Roadmap

After analyzing the current state of the extracted data, particularly the `items.json` file, several issues have been identified that need to be addressed to improve data quality and consistency. This section outlines a roadmap for enhancing the data extraction process and fixing these issues.

### Current Issues with `items.json`

1. **Inconsistent Property Naming**
   - Inconsistent casing (e.g., `experiencieReward` vs. `experienceReward`)
   - Spelling errors in property names
   - Inconsistent naming conventions across similar properties

2. **Missing Properties**
   - Some items lack properties that should be present based on their category
   - Incomplete data for certain item types
   - Inconsistent presence of optional properties

3. **Structural Inconsistencies**
   - Varying data structures for similar item types
   - Inconsistent array formats for properties like `drops`, `learn`, and `crafting`
   - Nested objects with inconsistent structures

4. **Data Type Inconsistencies**
   - Numeric values sometimes stored as strings
   - Boolean values represented inconsistently
   - Inconsistent handling of null/undefined values

5. **Redundant Data**
   - Duplicate information across related items
   - Unnecessary properties that could be derived or normalized

### Roadmap for Improvement

#### Phase 1: Data Audit and Schema Definition (1-2 weeks)

1. **Comprehensive Data Audit**
   - Perform a complete audit of all items in the database
   - Identify all unique properties and their expected data types
   - Document frequency and distribution of properties across item categories
   - Identify outliers and anomalies in the data

2. **Schema Definition**
   - Create a formal JSON schema for each item category
   - Define required vs. optional properties for each item type
   - Standardize property names and data types
   - Document the schema with examples and explanations

#### Phase 2: Parser Improvements (2-3 weeks)

1. **Refactor Item Parsing Logic**
   - Implement consistent property naming in the parser code
   - Fix the `experiencieReward` typo to `experienceReward`
   - Standardize casing conventions (camelCase for all properties)
   - Create specialized parsers for different item categories

2. **Validation Mechanisms**
   - Implement schema validation during the parsing process
   - Add warning/error logging for data inconsistencies
   - Create data quality metrics to track improvement over time
   - Implement automated tests for parser functions

3. **Property Normalization**
   - Normalize property values to consistent formats
   - Ensure numeric values are stored as numbers, not strings
   - Standardize boolean representations
   - Handle null/undefined values consistently

#### Phase 3: Data Enrichment and Relationships (2-3 weeks)

1. **Enhance Relationship Handling**
   - Improve the tech tree item unifier to better handle relationships
   - Ensure consistent bidirectional relationships between items
   - Validate that all referenced items exist in the database
   - Fix incomplete or incorrect `learn` arrays in schematics

2. **Data Completeness**
   - Identify and fill gaps in item properties where data is available
   - Implement fallback mechanisms for missing data
   - Add derived properties where beneficial for consumers
   - Ensure all items have appropriate category assignments

#### Phase 4: Output Format Improvements (1-2 weeks)

1. **Output Format Options**
   - Provide multiple output format options (full, minimal, specialized)
   - Implement configurable property inclusion/exclusion
   - Add versioning to the output files
   - Consider offering different serialization formats (JSON, YAML, CSV)

2. **Documentation and Examples**
   - Create comprehensive documentation for the data format
   - Provide example queries and use cases
   - Document known limitations and edge cases
   - Create a data dictionary explaining all properties

### Implementation Priorities

1. **High Priority**
   - Fix inconsistent property naming (especially the `experiencieReward` typo)
   - Standardize data types for numeric and boolean values
   - Ensure all items have required properties for their category

2. **Medium Priority**
   - Enhance relationship handling between items
   - Improve validation during parsing
   - Refactor parser code for better maintainability

3. **Lower Priority**
   - Implement additional output formats
   - Add derived properties
   - Create comprehensive documentation

### Maintenance Strategy

To ensure ongoing data quality:

1. **Automated Testing**
   - Implement unit tests for all parser functions
   - Add schema validation tests for output files
   - Create integration tests for the full extraction pipeline

2. **Monitoring and Metrics**
   - Track data quality metrics over time
   - Monitor for new inconsistencies or issues
   - Create dashboards for data completeness and quality

3. **Documentation**
   - Keep schema documentation up to date
   - Document known issues and workarounds
   - Provide clear examples for data consumers