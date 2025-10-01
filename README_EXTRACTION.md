# PAK File Extraction Documentation

This document describes the PAK file extraction functionality for the Last Oasis Data Extractor.

## Overview

The PAK extraction system allows you to automatically extract encrypted PAK files from Last Oasis, process the data, and export it in various formats. The system is designed to be configurable and can handle encrypted PAK files with custom encryption keys.

## Features

- **Configurable PAK file paths**: Set custom paths for game installation and PAK files
- **Encryption support**: Handle encrypted PAK files with configurable encryption keys
- **Multiple extraction modes**: Full extraction, PAK-only, or process-only modes
- **Steam integration**: Monitor for game updates and trigger automatic extractions
- **CLI interface**: Command-line tools for easy automation
- **Logging**: Comprehensive logging with configurable levels
- **Error handling**: Robust error handling with retry mechanisms

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

```bash
# Game paths
LO_GAME_PATH=C:\Program Files (x86)\Steam\steamapps\common\Last Oasis
LO_PAK_PATH=C:\Program Files (x86)\Steam\steamapps\common\Last Oasis\Content\Paks

# Output directories
LO_OUTPUT_DIR=./extracted
LO_EXPORT_DIR=./exported
```

### Configuration File

You can also use a JSON configuration file. Copy `config/extraction.example.json` to `config/extraction.json` and customize:

```json
{
  "gamePath": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Last Oasis",
  "pakPath": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Last Oasis\\Content\\Paks",
  "encryptionKey": "YOUR_ENCRYPTION_KEY_HERE",
  "outputDir": "./extracted",
  "exportDir": "./exported"
}
```

## CLI Usage

### Initialize Configuration

```bash
npm run extract:init
```

This will create default configuration files and validate your setup.

### Extract PAK Files

```bash
# Full extraction (PAK extraction + data processing + export)
npm run extract

# PAK extraction only
node cli/extraction-cli.js extract --pak-only

# Process already extracted data
node cli/extraction-cli.js extract --process-only
```

### Check Status

```bash
npm run extract:status
```

### Validate Configuration

```bash
npm run extract:validate
```

### Clean Up

```bash
# Clean extracted files
npm run extract:clean

# Clean exported files
node cli/extraction-cli.js clean --exported

# Clean both
node cli/extraction-cli.js clean --all
```

## Programmatic Usage

### Basic Usage

```javascript
const { ExtractionService } = require("./services/extractionService");

const service = new ExtractionService();

// Initialize the service
await service.initialize();

// Perform full extraction
const result = await service.extractFull();

if (result.success) {
  console.log("Extraction completed successfully");
  console.log("Extracted files:", result.extractedFiles);
  console.log("Exported data:", result.exportedData);
} else {
  console.error("Extraction failed:", result.error);
}
```

### Advanced Usage

```javascript
const { PakExtractor } = require("./services/pakExtractor");
const { ExtractionConfig } = require("./config/extractionConfig");

// Load custom configuration
const config = new ExtractionConfig("./config/custom-extraction.json");
await config.load();

// Create extractor with custom config
const extractor = new PakExtractor(config);

// Extract specific PAK files
const result = await extractor.extractPakFiles([
  "LastOasis-WindowsNoEditor.pak",
  "LastOasis-WindowsNoEditor_0_P.pak",
]);
```

## Tool Requirements

The extraction system requires external tools:

### UnrealPak

- **Purpose**: Extract PAK files
- **Auto-detection**: The system will try to find UnrealPak.exe automatically
- **Manual setup**: Set `LO_UNREALPAK_PATH` environment variable

### FModel (Optional)

- **Purpose**: Advanced PAK file analysis and extraction
- **Auto-detection**: The system will try to find FModel.exe automatically
- **Manual setup**: Set `LO_FMODEL_PATH` environment variable

## Directory Structure

After extraction, the following directory structure will be created:

```
extracted/
├── Game/
│   ├── Content/
│   │   ├── Data/           # Game data files
│   │   ├── Blueprints/     # Blueprint files
│   │   └── Localization/   # Localization files
│   └── ...
└── logs/
    └── extraction.log      # Extraction logs

exported/
├── creatures.json          # Processed creature data
├── items.json             # Processed item data
├── tech.json              # Processed technology data
└── ...
```

## Error Handling

The system includes comprehensive error handling:

- **Retry mechanism**: Failed extractions are retried up to 3 times by default
- **Timeout protection**: Extractions timeout after 5 minutes by default
- **Validation**: Extracted files are validated for integrity
- **Logging**: All errors are logged with detailed information

## Steam Integration

The system can monitor Steam for game updates:

```json
{
  "steam": {
    "enabled": true,
    "appId": "903950",
    "checkUpdates": true,
    "updateInterval": 3600000
  }
}
```

When enabled, the system will:

- Check for game updates every hour
- Automatically trigger extraction when updates are detected
- Log update information

## Performance Considerations

- **Parallel extractions**: Configure `parallelExtractions` to control concurrent operations
- **Cleanup**: Enable `cleanupAfterExtraction` to save disk space
- **Compression**: Adjust `compressionLevel` for balance between speed and size
- **Memory usage**: Large PAK files may require significant memory

## Troubleshooting

### Common Issues

1. **Encryption key not working**

   - Verify the encryption key is correct
   - Check that the key matches the PAK file version

2. **UnrealPak not found**

   - Install Unreal Engine or set `LO_UNREALPAK_PATH` manually
   - Ensure the path points to the correct UnrealPak.exe

3. **Permission errors**

   - Run as administrator if accessing system directories
   - Check file permissions on output directories

4. **Extraction timeout**
   - Increase `LO_EXTRACTION_TIMEOUT` for large files
   - Check available disk space

### Debug Mode

Enable debug logging for detailed information:

```bash
LO_LOG_LEVEL=debug npm run extract
```

## API Reference

### ExtractionService

- `initialize()`: Initialize the service
- `extractFull()`: Perform full extraction and processing
- `extractPakOnly()`: Extract PAK files only
- `processOnly()`: Process already extracted data
- `getStatus()`: Get current extraction status
- `cleanup()`: Clean up temporary files

### PakExtractor

- `extractPakFiles(files)`: Extract specific PAK files
- `validateTools()`: Validate required tools
- `getAvailablePakFiles()`: List available PAK files
- `verifyEncryption()`: Verify encryption key

### ExtractionConfig

- `load()`: Load configuration from file
- `validate()`: Validate configuration
- `save()`: Save configuration to file
- `get(key)`: Get configuration value
- `set(key, value)`: Set configuration value

## Contributing

When contributing to the extraction functionality:

1. Follow the existing code style and patterns
2. Add comprehensive error handling
3. Include logging for debugging
4. Update documentation for new features
5. Add tests for new functionality

## License

This extraction functionality is part of the Last Oasis Data Extractor project and follows the same MIT license.
