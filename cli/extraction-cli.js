#!/usr/bin/env node

const { program } = require('commander');
const extractionService = require('../services/extractionService');
const { ExtractionConfig } = require('../config/extractionConfig');
const fs = require('fs-extra');
const path = require('node:path');

/**
 * CLI Interface for PAK Extraction
 * Provides command-line access to extraction functionality
 */

program
    .name('lo-extractor')
    .description('Last Oasis Data Extractor - PAK file extraction and processing')
    .version('1.0.0');

/**
 * Initialize configuration command
 */
program
    .command('init')
    .description('Initialize extraction configuration')
    .option('-f, --force', 'Overwrite existing configuration')
    .action(async (options) => {
        try {
            const configPath = path.join(process.cwd(), 'config', 'user-extraction.config.js');

            if (await fs.pathExists(configPath) && !options.force) {
                console.log('Configuration file already exists. Use --force to overwrite.');
                return;
            }

            ExtractionConfig.createExampleConfig(configPath);
            console.log(`Configuration file created at: ${configPath}`);
            console.log('Please edit the configuration file with your settings before running extraction.');

        } catch (error) {
            console.error('Failed to initialize configuration:', error.message);
            process.exit(1);
        }
    });

/**
 * Validate configuration command
 */
program
    .command('validate')
    .description('Validate extraction configuration')
    .option('-c, --config <path>', 'Path to configuration file')
    .action(async (options) => {
        try {
            let config;

            if (options.config) {
                const configData = require(path.resolve(options.config));
                config = new ExtractionConfig();
                config.updateConfig(configData);
            } else {
                config = new ExtractionConfig();
            }

            console.log('✓ Configuration is valid');
            console.log('Configuration summary:');

            const configData = config.getConfig();
            console.log(`  Game Path: ${configData.pakFiles.gamePath}`);
            console.log(`  PAK Directory: ${configData.pakFiles.pakDirectory}`);
            console.log(`  Output Directory: ${configData.pakFiles.outputDirectory}`);
            console.log(`  Encryption: ${configData.encryption.isEncrypted ? 'Enabled' : 'Disabled'}`);
            console.log(`  Tools: ${configData.tools.unrealPakPath ? 'UnrealPak' : ''} ${configData.tools.fmodelPath ? 'FModel' : ''}`);

        } catch (error) {
            console.error('✗ Configuration validation failed:', error.message);
            process.exit(1);
        }
    });

/**
 * Extract PAK files command
 */
program
    .command('extract')
    .description('Extract PAK files')
    .option('-c, --config <path>', 'Path to configuration file')
    .option('--pak-only', 'Extract PAK files only, skip data processing')
    .option('--process-only', 'Process existing extracted data only')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options) => {
        try {
            console.log('Initializing extraction service...');

            // Initialize service
            const initialized = await extractionService.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize extraction service');
            }

            // Load custom config if provided
            if (options.config) {
                const configData = require(path.resolve(options.config));
                extractionService.updateConfig(configData);
            }

            let result;

            if (options.processOnly) {
                console.log('Processing existing extracted data...');
                result = await extractionService.processExistingData();
            } else if (options.pakOnly) {
                console.log('Extracting PAK files only...');
                result = await extractionService.extractPakOnly();
            } else {
                console.log('Starting full extraction workflow...');
                result = await extractionService.performFullExtraction();
            }

            if (result.success) {
                console.log('✓ Extraction completed successfully');

                if (options.verbose) {
                    console.log('Results:', JSON.stringify(result, null, 2));
                } else {
                    if (result.pakExtraction) {
                        console.log(`  PAK Files: ${result.pakExtraction.extractedFiles}/${result.pakExtraction.totalFiles} extracted`);
                    }
                    if (result.dataProcessing?.statistics) {
                        const stats = result.dataProcessing.statistics;
                        console.log(`  Data Processed: ${stats.items} items, ${stats.creatures} creatures, ${stats.techData} tech items`);
                    }
                    if (result.dataExport?.files) {
                        console.log(`  Files Exported: ${result.dataExport.files.totalFiles} files`);
                    }
                }
            } else {
                console.error('✗ Extraction failed:', result.error || 'Unknown error');
                process.exit(1);
            }

        } catch (error) {
            console.error('✗ Extraction failed:', error.message);
            if (options.verbose) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    });

/**
 * Status command
 */
program
    .command('status')
    .description('Get extraction status')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options) => {
        try {
            const initialized = await extractionService.initialize();
            if (!initialized) {
                console.log('Extraction service not initialized');
                return;
            }

            const status = await extractionService.getStatus();

            console.log('Extraction Service Status:');
            console.log(`  Initialized: ${status.initialized ? '✓' : '✗'}`);
            console.log(`  Configuration: ${status.config === 'loaded' ? '✓' : '✗'}`);
            console.log(`  PAK Extractor: ${status.pakExtractor === 'ready' ? '✓' : '✗'}`);

            if (status.pakExtraction && options.verbose) {
                console.log('PAK Extraction Status:');
                console.log(`  Status: ${status.pakExtraction.status}`);
                console.log(`  Files: ${status.pakExtraction.files}`);
                console.log(`  Size: ${status.pakExtraction.sizeFormatted || status.pakExtraction.size}`);
            }

        } catch (error) {
            console.error('Failed to get status:', error.message);
            process.exit(1);
        }
    });

/**
 * Clean command
 */
program
    .command('clean')
    .description('Clean extracted and exported files')
    .option('--extracted', 'Clean only extracted PAK files')
    .option('--exported', 'Clean only exported data files')
    .option('-f, --force', 'Force cleanup without confirmation')
    .action(async (options) => {
        try {
            if (!options.force) {
                const readline = require('node:readline');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                const answer = await new Promise(resolve => {
                    rl.question('Are you sure you want to clean the files? (y/N): ', resolve);
                });

                rl.close();

                if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
                    console.log('Cleanup cancelled');
                    return;
                }
            }

            const initialized = await extractionService.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize extraction service');
            }

            if (options.extracted || options.exported) {
                const config = extractionService.getConfig();

                if (options.extracted) {
                    const extractedPath = config.pakFiles.outputDirectory;
                    if (await fs.pathExists(extractedPath)) {
                        await fs.remove(extractedPath);
                        console.log('✓ Cleaned extracted PAK files');
                    }
                }

                if (options.exported) {
                    const exportedPath = './exported/';
                    if (await fs.pathExists(exportedPath)) {
                        await fs.remove(exportedPath);
                        console.log('✓ Cleaned exported data files');
                    }
                }
            } else {
                await extractionService.cleanAll();
                console.log('✓ All files cleaned');
            }

        } catch (error) {
            console.error('Cleanup failed:', error.message);
            process.exit(1);
        }
    });

/**
 * Config command group
 */
const configCmd = program
    .command('config')
    .description('Configuration management commands');

configCmd
    .command('show')
    .description('Show current configuration')
    .option('--sensitive', 'Show sensitive information (encryption keys)')
    .action(async (options) => {
        try {
            const initialized = await extractionService.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize extraction service');
            }

            let config = extractionService.getConfig();

            if (options.sensitive) {
                // Load full config with sensitive data
                const fullConfig = new ExtractionConfig();
                config = fullConfig.getConfig();
            }

            console.log('Current Configuration:');
            console.log(JSON.stringify(config, null, 2));

        } catch (error) {
            console.error('Failed to show configuration:', error.message);
            process.exit(1);
        }
    });

configCmd
    .command('set <key> <value>')
    .description('Set configuration value')
    .action(async (key, value) => {
        try {
            const initialized = await extractionService.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize extraction service');
            }

            // Parse nested key (e.g., "pakFiles.gamePath")
            const keys = key.split('.');
            const update = {};
            let current = update;

            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;

            extractionService.updateConfig(update);
            console.log(`✓ Configuration updated: ${key} = ${value}`);

        } catch (error) {
            console.error('Failed to update configuration:', error.message);
            process.exit(1);
        }
    });

/**
 * Tools command
 */
program
    .command('tools')
    .description('Check and manage extraction tools')
    .action(async () => {
        try {
            const initialized = await extractionService.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize extraction service');
            }

            const config = extractionService.getConfig();

            console.log('Extraction Tools Status:');

            // Check UnrealPak
            if (config.tools.unrealPakPath) {
                const exists = await fs.pathExists(config.tools.unrealPakPath);
                console.log(`  UnrealPak: ${exists ? '✓' : '✗'} ${config.tools.unrealPakPath}`);
            } else {
                console.log('  UnrealPak: Not configured');
            }

            // Check FModel
            if (config.tools.fmodelPath) {
                const exists = await fs.pathExists(config.tools.fmodelPath);
                console.log(`  FModel: ${exists ? '✓' : '✗'} ${config.tools.fmodelPath}`);
            } else {
                console.log('  FModel: Not configured');
            }

            // Show common tool locations
            console.log('\nCommon tool locations to check:');
            console.log('UnrealPak:');
            for (const toolPath of config.tools.commonToolPaths.unrealPak) {
                const exists = await fs.pathExists(toolPath);
                console.log(`  ${exists ? '✓' : '✗'} ${toolPath}`);
            }

            console.log('FModel:');
            for (const toolPath of config.tools.commonToolPaths.fmodel) {
                const exists = await fs.pathExists(toolPath);
                console.log(`  ${exists ? '✓' : '✗'} ${toolPath}`);
            }

        } catch (error) {
            console.error('Failed to check tools:', error.message);
            process.exit(1);
        }
    });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}