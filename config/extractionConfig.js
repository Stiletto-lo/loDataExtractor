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
 * Configuration for PAK file extraction
 * This file contains all configurable settings for the extraction process
 */

/**
 * Default configuration template
 * Copy this to create your own config file
 */
const defaultConfig = {
    // Game installation paths
    pakFiles: {
        // Main game installation directory
        gamePath: process.env.GAME_PATH || 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Last Oasis',

        // Relative path to PAK files within game directory
        pakDirectory: process.env.PAK_DIRECTORY || 'Content\\Paks',

        // Output directory for extracted files
        outputDirectory: process.env.OUTPUT_DIRECTORY || path.join(process.cwd(), 'extracted'),

        // Target directories to extract (empty array = extract all)
        // These paths are relative to the PAK content root
        targetDirectories: parseArray(process.env.TARGET_DIRECTORIES, [
            'Game/Content/Data',
            'Game/Content/Blueprints/Items',
            'Game/Content/Blueprints/Creatures',
            'Game/Content/Blueprints/Technologies',
            'Game/Content/Localization'
        ])
    },

    // Encryption settings for PAK files
    encryption: {
        // Whether PAK files are encrypted
        isEncrypted: parseBoolean(process.env.IS_ENCRYPTED, true),

        // AES encryption key (256-bit hex string)
        // This key is required for encrypted PAK files
        aesKey: process.env.AES_KEY || '',

        // Alternative key formats support
        keyFormat: 'hex', // 'hex', 'base64', 'string'

        // Key validation
        validateKey: true
    },

    // External tools configuration
    tools: {
        // Path to UnrealPak.exe (preferred extraction tool)
        unrealPakPath: process.env.UNREAL_PAK_PATH || '',

        // Path to FModel.exe (alternative extraction tool)
        fmodelPath: process.env.FMODEL_PATH || '',

        // Auto-detect tools in common locations
        autoDetectTools: true,

        // Common tool locations to check
        commonToolPaths: {
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
        }
    },

    // Extraction process settings
    extraction: {
        // Timeout for each PAK extraction (minutes)
        timeoutMinutes: parseInteger(process.env.TIMEOUT_MINUTES, 30),

        // Number of retry attempts on failure
        retryAttempts: parseInteger(process.env.RETRY_ATTEMPTS, 3),

        // Clean temporary files on start
        cleanTempOnStart: parseBoolean(process.env.CLEAN_TEMP_ON_START, true),

        // Clean temporary files on finish
        cleanTempOnFinish: parseBoolean(process.env.CLEAN_TEMP_ON_FINISH, false),

        // Validate extracted files
        validateExtractedFiles: parseBoolean(process.env.VALIDATE_EXTRACTED_FILES, true),

        // Parallel extraction (experimental)
        parallelExtraction: false,
        maxConcurrentExtractions: 2
    },

    // Logging configuration
    logging: {
        // Log level: 'error', 'warn', 'info', 'debug'
        level: process.env.LOG_LEVEL || 'info',

        // Log file path
        logFile: process.env.LOG_FILE || path.join(process.cwd(), 'logs', 'extraction.log'),

        // Console logging
        console: true,

        // File logging
        file: true,

        // Log extraction progress
        logProgress: true
    },

    // Steam integration (for future automation)
    steam: {
        // Steam installation path
        steamPath: 'C:\\Program Files (x86)\\Steam',

        // Last Oasis Steam App ID
        appId: '903950',

        // Monitor for updates
        monitorUpdates: false,

        // Auto-extract on update
        autoExtractOnUpdate: false
    },

    // Advanced settings
    advanced: {
        // Memory limit for extraction process (MB)
        memoryLimit: 4096,

        // Temporary directory for extraction
        tempDirectory: path.join(os.tmpdir(), 'lo-extraction'),

        // File system monitoring
        watchForChanges: false,

        // Compression for output files
        compressOutput: false
    }
};

/**
 * Environment-specific configurations
 */
const environments = {
    development: {
        ...defaultConfig,
        logging: {
            ...defaultConfig.logging,
            level: 'debug',
            console: true
        },
        extraction: {
            ...defaultConfig.extraction,
            cleanTempOnStart: true,
            validateExtractedFiles: true
        }
    },

    production: {
        ...defaultConfig,
        logging: {
            ...defaultConfig.logging,
            level: 'info',
            console: false
        },
        extraction: {
            ...defaultConfig.extraction,
            cleanTempOnFinish: true,
            parallelExtraction: true
        }
    }
};

/**
 * Configuration loader class
 */
class ExtractionConfig {
    constructor(environment = 'development') {
        this.environment = environment;
        this.config = this.loadConfig();
        this.validateConfig();
    }

    /**
     * Load configuration based on environment
     */
    loadConfig() {
        let config = environments[this.environment] || defaultConfig;

        // Try to load user config file
        try {
            const userConfigPath = path.join(process.cwd(), 'config', 'user-extraction.config.js');
            if (require('node:fs').existsSync(userConfigPath)) {
                const userConfig = require(userConfigPath);
                config = this.mergeConfigs(config, userConfig);
            }
        } catch (error) {
            console.warn('Could not load user config file:', error.message);
        }

        // Auto-detect tools if enabled
        if (config.tools.autoDetectTools) {
            config = this.autoDetectTools(config);
        }

        return config;
    }

    /**
     * Merge configuration objects deeply
     */
    mergeConfigs(defaultConfig, userConfig) {
        const merged = { ...defaultConfig };

        for (const key in userConfig) {
            if (userConfig[key] && typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key])) {
                merged[key] = this.mergeConfigs(merged[key] || {}, userConfig[key]);
            } else {
                merged[key] = userConfig[key];
            }
        }

        return merged;
    }

    /**
     * Auto-detect extraction tools
     */
    autoDetectTools(config) {
        const fs = require('node:fs');
        const newConfig = { ...config };

        // Auto-detect UnrealPak
        if (!newConfig.tools.unrealPakPath) {
            for (const toolPath of newConfig.tools.commonToolPaths.unrealPak) {
                if (fs.existsSync(toolPath)) {
                    newConfig.tools.unrealPakPath = toolPath;
                    console.log(`Auto-detected UnrealPak at: ${toolPath}`);
                    break;
                }
            }
        }

        // Auto-detect FModel
        if (!newConfig.tools.fmodelPath) {
            for (const toolPath of newConfig.tools.commonToolPaths.fmodel) {
                if (fs.existsSync(toolPath)) {
                    newConfig.tools.fmodelPath = toolPath;
                    console.log(`Auto-detected FModel at: ${toolPath}`);
                    break;
                }
            }
        }

        return newConfig;
    }

    /**
     * Validate configuration
     */
    validateConfig() {
        const errors = [];

        // Validate required paths
        if (!this.config.pakFiles.gamePath) {
            errors.push('Game path is required');
        }

        // Validate encryption settings
        if (this.config.encryption.isEncrypted && !this.config.encryption.aesKey) {
            errors.push('AES key is required for encrypted PAK files');
        }

        // Validate AES key format
        if (this.config.encryption.aesKey && this.config.encryption.validateKey) {
            if (!this.isValidAESKey(this.config.encryption.aesKey)) {
                errors.push('Invalid AES key format');
            }
        }

        // Validate tools
        if (!this.config.tools.unrealPakPath && !this.config.tools.fmodelPath) {
            errors.push('At least one extraction tool (UnrealPak or FModel) must be configured');
        }

        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }
    }

    /**
     * Validate AES key format
     */
    isValidAESKey(key) {
        switch (this.config.encryption.keyFormat) {
            case 'hex':
                return /^[0-9a-fA-F]{64}$/.test(key); // 256-bit hex key
            case 'base64':
                return /^[A-Za-z0-9+/]{43}=$/.test(key); // Base64 encoded 256-bit key
            case 'string':
                return key.length >= 32; // At least 32 characters
            default:
                return false;
        }
    }

    /**
     * Get configuration
     */
    getConfig() {
        return this.config;
    }

    /**
     * Update configuration
     */
    updateConfig(updates) {
        this.config = this.mergeConfigs(this.config, updates);
        this.validateConfig();
    }

    /**
     * Save configuration to file
     */
    saveConfig(filePath) {
        const fs = require('fs-extra');
        const configContent = `module.exports = ${JSON.stringify(this.config, null, 2)};`;
        fs.writeFileSync(filePath, configContent);
    }

    /**
     * Create example configuration file
     */
    static createExampleConfig(filePath) {
        const fs = require('fs-extra');
        const exampleConfig = {
            ...defaultConfig,
            pakFiles: {
                ...defaultConfig.pakFiles,
                gamePath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Last Oasis',
                // Add comment about customization
                _comment: 'Customize these paths for your installation'
            },
            encryption: {
                ...defaultConfig.encryption,
                aesKey: 'YOUR_AES_KEY_HERE_64_HEX_CHARACTERS_FOR_256BIT_ENCRYPTION_KEY',
                _comment: 'Replace with your actual AES key'
            }
        };

        const content = `/**
 * User Configuration for PAK Extraction
 * Copy this file and customize for your setup
 */

module.exports = ${JSON.stringify(exampleConfig, null, 2)};`;

        fs.writeFileSync(filePath, content);
    }
}

module.exports = {
    ExtractionConfig,
    defaultConfig,
    environments
};