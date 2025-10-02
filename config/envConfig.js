const path = require('node:path');
const os = require('node:os');
require('dotenv').config();

/**
 * Helper function to parse boolean environment variables
 */
const parseBoolean = (value, defaultValue = false) => {
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }
    return defaultValue;
};

/**
 * Helper function to parse array from comma-separated string
 */
const parseArray = (value, defaultValue = []) => {
    if (typeof value === 'string' && value.trim()) {
        return value.split(',').map(item => item.trim());
    }
    return defaultValue;
};

/**
 * Helper function to parse integer with default
 */
const parseInteger = (value, defaultValue) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Simple configuration object based on environment variables
 * This replaces the complex ExtractionConfig class with a simple object
 */
const config = {
    // Game installation paths
    pakFiles: {
        gamePath: process.env.GAME_PATH || 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Last Oasis',
        pakDirectory: process.env.PAK_DIRECTORY || 'Content\\Paks',
        outputDirectory: process.env.OUTPUT_DIRECTORY || path.join(process.cwd(), 'extracted'),
        targetDirectories: parseArray(process.env.TARGET_DIRECTORIES, [
            'Game/Content/Data',
            'Game/Content/Blueprints/Items',
            'Game/Content/Blueprints/Creatures',
            'Game/Content/Blueprints/Technologies',
            'Game/Content/Localization'
        ])
    },

    // Encryption settings
    encryption: {
        isEncrypted: parseBoolean(process.env.IS_ENCRYPTED, true),
        aesKey: process.env.AES_KEY || '',
        keyFormat: 'hex',
        validateKey: true
    },

    // External tools configuration
    tools: {
        unrealPakPath: process.env.UNREAL_PAK_PATH || '',
        fmodelPath: process.env.FMODEL_PATH || '',
        autoDetectTools: true
    },

    // Extraction process settings
    extraction: {
        timeoutMinutes: parseInteger(process.env.TIMEOUT_MINUTES, 30),
        retryAttempts: parseInteger(process.env.RETRY_ATTEMPTS, 3),
        cleanTempOnStart: parseBoolean(process.env.CLEAN_TEMP_ON_START, true),
        cleanTempOnFinish: parseBoolean(process.env.CLEAN_TEMP_ON_FINISH, false),
        validateExtractedFiles: parseBoolean(process.env.VALIDATE_EXTRACTED_FILES, true),
        parallelExtraction: false,
        maxConcurrentExtractions: 2
    },

    // Logging configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        logFile: process.env.LOG_FILE || path.join(process.cwd(), 'logs', 'extraction.log'),
        console: true,
        file: true,
        logProgress: true
    },

    // Steam integration
    steam: {
        steamPath: 'C:\\Program Files (x86)\\Steam',
        appId: '903950',
        monitorUpdates: false,
        autoExtractOnUpdate: false
    },

    // Advanced settings
    advanced: {
        memoryLimit: 4096,
        tempDirectory: path.join(os.tmpdir(), 'lo-extraction'),
        watchForChanges: false,
        compressOutput: false
    }
};

/**
 * Validate AES key format
 */
const isValidAESKey = (key) => {
    // Remove 0x prefix if present
    const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
    return /^[0-9a-fA-F]{64}$/.test(cleanKey); // 256-bit hex key
};

/**
 * Validate configuration
 */
const validateConfig = () => {
    const errors = [];

    // Validate required paths
    if (!config.pakFiles.gamePath) {
        errors.push('Game path is required (GAME_PATH environment variable)');
    }

    // Validate encryption settings
    if (config.encryption.isEncrypted && !config.encryption.aesKey) {
        errors.push('AES key is required for encrypted PAK files (AES_KEY environment variable)');
    }

    // Validate AES key format
    if (config.encryption.aesKey && config.encryption.validateKey) {
        if (!isValidAESKey(config.encryption.aesKey)) {
            errors.push('Invalid AES key format - must be 64 hex characters for 256-bit key');
        }
    }

    if (errors.length > 0) {
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
};

// Auto-detect tools if paths are not provided
const autoDetectTools = () => {
    const fs = require('node:fs');
    
    const commonToolPaths = {
        unrealPak: [
            'C:\\Program Files\\Epic Games\\UE_4.27\\Engine\\Binaries\\Win64\\UnrealPak.exe',
            'C:\\UnrealEngine\\Engine\\Binaries\\Win64\\UnrealPak.exe',
            path.join(process.cwd(), 'tools', 'UnrealPak.exe')
        ],
        fmodel: [
            'C:\\Program Files\\FModel\\FModel.exe',
            path.join(process.cwd(), 'tools', 'FModel.exe'),
            path.join(os.homedir(), 'AppData', 'Local', 'FModel', 'FModel.exe')
        ]
    };

    // Auto-detect UnrealPak
    if (!config.tools.unrealPakPath) {
        for (const toolPath of commonToolPaths.unrealPak) {
            if (fs.existsSync(toolPath)) {
                config.tools.unrealPakPath = toolPath;
                console.log(`Auto-detected UnrealPak at: ${toolPath}`);
                break;
            }
        }
    }

    // Auto-detect FModel
    if (!config.tools.fmodelPath) {
        for (const toolPath of commonToolPaths.fmodel) {
            if (fs.existsSync(toolPath)) {
                config.tools.fmodelPath = toolPath;
                console.log(`Auto-detected FModel at: ${toolPath}`);
                break;
            }
        }
    }
};

// Initialize configuration
if (config.tools.autoDetectTools) {
    autoDetectTools();
}

// Validate configuration on load
validateConfig();

module.exports = config;