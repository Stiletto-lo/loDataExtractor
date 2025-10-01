const PakExtractor = require('./pakExtractor');
const { ExtractionConfig } = require('../config/extractionConfig');
const dataAccess = require('./dataAccess');
const fileLoader = require('./fileLoader');
const fs = require('fs-extra');
const path = require('node:path');

/**
 * Extraction Service
 * Integrates PAK extraction with existing data processing workflow
 */
class ExtractionService {
    constructor() {
        this.config = null;
        this.pakExtractor = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the extraction service
     */
    async initialize(environment = 'development') {
        try {
            this.config = new ExtractionConfig(environment);
            this.pakExtractor = new PakExtractor(this.config.getConfig());
            this.isInitialized = true;

            console.log('Extraction service initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize extraction service:', error.message);
            return false;
        }
    }

    /**
     * Full extraction workflow: PAK extraction + data processing
     */
    async performFullExtraction() {
        if (!this.isInitialized) {
            throw new Error('Extraction service not initialized');
        }

        console.log('Starting full extraction workflow...');

        try {
            // Step 1: Extract PAK files
            console.log('Step 1: Extracting PAK files...');
            const pakResult = await this.pakExtractor.extractPakFiles();

            if (!pakResult.success) {
                throw new Error('PAK extraction failed');
            }

            console.log(`PAK extraction completed: ${pakResult.extractedFiles}/${pakResult.totalFiles} files`);

            // Step 2: Process extracted data
            console.log('Step 2: Processing extracted data...');
            const processResult = await this.processExtractedData();

            // Step 3: Export processed data
            console.log('Step 3: Exporting processed data...');
            const exportResult = await this.exportProcessedData();

            return {
                success: true,
                pakExtraction: pakResult,
                dataProcessing: processResult,
                dataExport: exportResult,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Full extraction workflow failed:', error);
            throw error;
        }
    }

    /**
     * Process extracted PAK data using existing data processing logic
     */
    async processExtractedData() {
        try {
            const config = this.config.getConfig();
            const extractedPath = config.pakFiles.outputDirectory;

            if (!await fs.pathExists(extractedPath)) {
                throw new Error('No extracted data found');
            }

            // Initialize data access system
            dataAccess.initialize();

            // Load files from extracted content
            console.log('Loading extracted files...');
            fileLoader.loadAllFiles(extractedPath);

            // Get processing statistics
            const stats = {
                items: dataAccess.getAllItems().length,
                techData: dataAccess.getAllTechData().length,
                creatures: dataAccess.getAllCreatures().length,
                lootTables: dataAccess.getAllLootTables().length,
                lootTemplates: dataAccess.getAllLootTemplates().length,
                upgrades: dataAccess.getAllUpgradesData().length
            };

            console.log('Data processing completed:', stats);

            return {
                success: true,
                statistics: stats,
                sourcePath: extractedPath
            };

        } catch (error) {
            console.error('Data processing failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Export processed data using existing export logic
     */
    async exportProcessedData() {
        try {
            const fileExporter = require('./fileExporter');
            const exportPath = './exported/';

            // Ensure export directory exists
            await fs.ensureDir(exportPath);

            // Export all processed data
            await fileExporter.saveAllFiles(exportPath);

            // Get export statistics
            const exportedFiles = await this.getExportedFileStats(exportPath);

            console.log('Data export completed:', exportedFiles);

            return {
                success: true,
                exportPath,
                files: exportedFiles
            };

        } catch (error) {
            console.error('Data export failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get statistics about exported files
     */
    async getExportedFileStats(exportPath) {
        const stats = {
            totalFiles: 0,
            totalSize: 0,
            fileTypes: {}
        };

        try {
            const files = await this.getFilesRecursively(exportPath);

            for (const file of files) {
                const fileStat = await fs.stat(file);
                const ext = path.extname(file).toLowerCase();

                stats.totalFiles++;
                stats.totalSize += fileStat.size;

                if (!stats.fileTypes[ext]) {
                    stats.fileTypes[ext] = { count: 0, size: 0 };
                }
                stats.fileTypes[ext].count++;
                stats.fileTypes[ext].size += fileStat.size;
            }
        } catch (error) {
            console.warn('Could not get export statistics:', error.message);
        }

        return stats;
    }

    /**
     * Get all files recursively from a directory
     */
    async getFilesRecursively(dirPath) {
        const files = [];

        if (!await fs.pathExists(dirPath)) {
            return files;
        }

        const items = await fs.readdir(dirPath);

        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = await fs.stat(itemPath);

            if (stats.isDirectory()) {
                const subFiles = await this.getFilesRecursively(itemPath);
                files.push(...subFiles);
            } else {
                files.push(itemPath);
            }
        }

        return files;
    }

    /**
     * Extract only PAK files without processing
     */
    async extractPakOnly() {
        if (!this.isInitialized) {
            throw new Error('Extraction service not initialized');
        }

        return await this.pakExtractor.extractPakFiles();
    }

    /**
     * Process existing extracted data without PAK extraction
     */
    async processExistingData(sourcePath = null) {
        if (!this.isInitialized) {
            throw new Error('Extraction service not initialized');
        }

        const dataPath = sourcePath || this.config.getConfig().pakFiles.outputDirectory;

        // Temporarily update the content folder path for processing
        const originalPath = process.env.CONTENT_FOLDER_PATH;
        process.env.CONTENT_FOLDER_PATH = dataPath;

        try {
            const processResult = await this.processExtractedData();
            const exportResult = await this.exportProcessedData();

            return {
                success: true,
                dataProcessing: processResult,
                dataExport: exportResult,
                sourcePath: dataPath
            };
        } finally {
            // Restore original path
            if (originalPath) {
                process.env.CONTENT_FOLDER_PATH = originalPath;
            } else {
                delete process.env.CONTENT_FOLDER_PATH;
            }
        }
    }

    /**
     * Get current extraction status
     */
    async getStatus() {
        const status = {
            initialized: this.isInitialized,
            config: this.config ? 'loaded' : 'not_loaded',
            pakExtractor: this.pakExtractor ? 'ready' : 'not_ready'
        };

        if (this.pakExtractor) {
            try {
                const pakStatus = await this.pakExtractor.getExtractionStatus();
                status.pakExtraction = pakStatus;
            } catch (error) {
                status.pakExtraction = { error: error.message };
            }
        }

        return status;
    }

    /**
     * Clean all extraction data
     */
    async cleanAll() {
        if (!this.isInitialized) {
            return;
        }

        try {
            const config = this.config.getConfig();

            // Clean extracted PAK files
            if (await fs.pathExists(config.pakFiles.outputDirectory)) {
                await fs.remove(config.pakFiles.outputDirectory);
                console.log('Cleaned extracted PAK files');
            }

            // Clean exported data
            const exportPath = './exported/';
            if (await fs.pathExists(exportPath)) {
                await fs.remove(exportPath);
                console.log('Cleaned exported data');
            }

            // Clean logs if configured
            if (config.extraction?.cleanTempOnFinish) {
                const logPath = './logs/';
                if (await fs.pathExists(logPath)) {
                    await fs.remove(logPath);
                    console.log('Cleaned log files');
                }
            }

        } catch (error) {
            console.error('Error during cleanup:', error);
            throw error;
        }
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        if (!this.config) {
            throw new Error('Configuration not initialized');
        }

        this.config.updateConfig(newConfig);

        // Reinitialize PAK extractor with new config
        this.pakExtractor = new PakExtractor(this.config.getConfig());

        console.log('Configuration updated successfully');
    }

    /**
     * Get current configuration (safe version without sensitive data)
     */
    getConfig() {
        if (!this.config) {
            return null;
        }

        const config = { ...this.config.getConfig() };

        // Hide sensitive information
        if (config.encryption?.aesKey) {
            config.encryption.aesKey = '***HIDDEN***';
        }

        return config;
    }
}

// Export singleton instance
module.exports = new ExtractionService();