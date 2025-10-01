/**
 * User Configuration for PAK Extraction
 * Copy this file and customize for your setup
 */

module.exports = {
  "pakFiles": {
    "gamePath": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Last Oasis\\Mist\\Content\\Paks",
    "pakDirectory": ".",
    "outputDirectory": "D:\\Github\\loDataExtractor\\extracted",
    "targetDirectories": [
      "Game/Content/Data",
      "Game/Content/Blueprints/Items",
      "Game/Content/Blueprints/Creatures",
      "Game/Content/Blueprints/Technologies",
      "Game/Content/Localization"
    ],
    "_comment": "Using test PAK files for demonstration"
  },
  "encryption": {
    "isEncrypted": true,
    "aesKey": "0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF",
    "keyFormat": "hex",
    "validateKey": true,
    "_comment": "Replace with your actual AES key - this is a sample 64-character hex key"
  },
  "tools": {
    "unrealPakPath": "D:\\Github\\loDataExtractor\\tools\\mock-unrealpak.bat",
    "fmodelPath": "D:\\Github\\loDataExtractor\\tools\\mock-fmodel.bat",
    "autoDetectTools": false,
    "commonToolPaths": {
      "unrealPak": [
        "D:\\Github\\loDataExtractor\\tools\\mock-unrealpak.bat",
        "C:\\Program Files\\Epic Games\\UE_4.27\\Engine\\Binaries\\Win64\\UnrealPak.exe",
        "C:\\UnrealEngine\\Engine\\Binaries\\Win64\\UnrealPak.exe",
        "D:\\Github\\loDataExtractor\\tools\\UnrealPak.exe"
      ],
      "fmodel": [
        "D:\\Github\\loDataExtractor\\tools\\mock-fmodel.bat",
        "C:\\Program Files\\FModel\\FModel.exe",
        "D:\\Github\\loDataExtractor\\tools\\FModel.exe",
        "C:\\Users\\dm94\\AppData\\Local\\FModel\\FModel.exe"
      ]
    }
  },
  "extraction": {
    "timeoutMinutes": 30,
    "retryAttempts": 3,
    "cleanTempOnStart": true,
    "cleanTempOnFinish": false,
    "validateExtractedFiles": true,
    "parallelExtraction": false,
    "maxConcurrentExtractions": 2
  },
  "logging": {
    "level": "info",
    "logFile": "D:\\Github\\loDataExtractor\\logs\\extraction.log",
    "console": true,
    "file": true,
    "logProgress": true
  },
  "steam": {
    "steamPath": "C:\\Program Files (x86)\\Steam",
    "appId": "903950",
    "monitorUpdates": false,
    "autoExtractOnUpdate": false
  },
  "advanced": {
    "memoryLimit": 4096,
    "tempDirectory": "C:\\Users\\dm94\\AppData\\Local\\Temp\\lo-extraction",
    "watchForChanges": false,
    "compressOutput": false
  }
};