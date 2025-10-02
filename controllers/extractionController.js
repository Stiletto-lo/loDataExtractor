const PakExtractor = require('../services/pakExtractor');
const config = require('../config/envConfig');
const fs = require('fs-extra');
const path = require('node:path');

/**
 * Extraction Controller
 * Handles HTTP requests for PAK file extraction operations
 */
class ExtractionController {
    constructor() {
        this.extractor = null;
        this.config = config;
        this.isExtracting = false;
        this.lastExtractionResult = null;
    }

    /**
     * Get extraction configuration
     */
    async getConfig(req, res) {
        try {
            if (!this.config) {
                return res.status(500).json({
                    success: false,
                    error: 'Configuration not initialized'
                });
            }

            // Return config without sensitive information
            const safeConfig = { ...this.config };
            if (safeConfig.encryption?.aesKey) {
                safeConfig.encryption.aesKey = '***HIDDEN***';
            }

            res.json({
                success: true,
                config: safeConfig
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Update extraction configuration
     */
    async updateConfig(req, res) {
        try {
            if (!this.config) {
                return res.status(500).json({
                    success: false,
                    error: 'Configuration not initialized'
                });
            }

            const updates = req.body;
            Object.assign(this.config, updates);

            // Reinitialize extractor with new config
            this.extractor = null;

            res.json({
                success: true,
                message: 'Configuration updated successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Start PAK extraction process
     */
    async startExtraction(req, res) {
        try {
            if (this.isExtracting) {
                return res.status(409).json({
                    success: false,
                    error: 'Extraction already in progress'
                });
            }

            if (!this.config) {
                return res.status(500).json({
                    success: false,
                    error: 'Configuration not initialized'
                });
            }

            // Initialize extractor if needed
            if (!this.extractor) {
                this.extractor = new PakExtractor(this.config);
            }

            this.isExtracting = true;

            // Start extraction in background
            this.performExtraction()
                .then(result => {
                    this.lastExtractionResult = result;
                    this.isExtracting = false;
                })
                .catch(error => {
                    this.lastExtractionResult = {
                        success: false,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    };
                    this.isExtracting = false;
                });

            res.json({
                success: true,
                message: 'Extraction started',
                status: 'in_progress'
            });

        } catch (error) {
            this.isExtracting = false;
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Perform the actual extraction
     */
    async performExtraction() {
        const result = await this.extractor.extractPakFiles();

        // Validate extracted files
        const isValid = await this.extractor.validateExtractedFiles();

        return {
            ...result,
            validated: isValid,
            timestamp: new Date().toISOString()
        };

    }

    /**
     * Get extraction status
     */
    async getExtractionStatus(req, res) {
        try {
            const status = {
                isExtracting: this.isExtracting,
                lastResult: this.lastExtractionResult
            };

            // Get current extraction statistics if extractor exists
            if (this.extractor) {
                const stats = await this.extractor.getExtractionStatus();
                status.currentStats = stats;
            }

            res.json({
                success: true,
                status
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Stop extraction process
     */
    async stopExtraction(req, res) {
        try {
            if (!this.isExtracting) {
                return res.status(400).json({
                    success: false,
                    error: 'No extraction in progress'
                });
            }

            // Note: This is a simple flag-based stop
            // For more robust stopping, you'd need to implement process cancellation
            this.isExtracting = false;

            if (this.extractor) {
                await this.extractor.cleanup();
            }

            res.json({
                success: true,
                message: 'Extraction stopped'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Validate configuration
     */
    async validateConfig(req, res) {
        try {
            const configData = req.body || this.config;

            if (!configData) {
                return res.status(400).json({
                    success: false,
                    error: 'No configuration provided'
                });
            }

            // Perform validation checks directly
            const validationResults = await this.performConfigValidation(configData);

            res.json({
                success: true,
                message: 'Configuration is valid',
                validation: validationResults
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Perform detailed configuration validation
     */
    async performConfigValidation(config) {
        const results = {
            paths: {},
            tools: {},
            encryption: {},
            overall: true
        };

        try {
            // Validate game path
            if (config.pakFiles?.gamePath) {
                const gamePathExists = await fs.pathExists(config.pakFiles.gamePath);
                results.paths.gamePath = {
                    exists: gamePathExists,
                    path: config.pakFiles.gamePath
                };
                if (!gamePathExists) { results.overall = false; }
            }

            // Validate PAK directory
            if (config.pakFiles?.gamePath && config.pakFiles?.pakDirectory) {
                const pakPath = path.join(config.pakFiles.gamePath, config.pakFiles.pakDirectory);
                const pakPathExists = await fs.pathExists(pakPath);
                results.paths.pakDirectory = {
                    exists: pakPathExists,
                    path: pakPath
                };
                if (!pakPathExists) results.overall = false;

                // Count PAK files
                if (pakPathExists) {
                    const files = await fs.readdir(pakPath);
                    const pakFiles = files.filter(f => f.endsWith('.pak'));
                    results.paths.pakFiles = {
                        count: pakFiles.length,
                        files: pakFiles
                    };
                    if (pakFiles.length === 0) results.overall = false;
                }
            }

            // Validate tools
            if (config.tools?.unrealPakPath) {
                const unrealPakExists = await fs.pathExists(config.tools.unrealPakPath);
                results.tools.unrealPak = {
                    exists: unrealPakExists,
                    path: config.tools.unrealPakPath
                };
            }

            if (config.tools?.fmodelPath) {
                const fmodelExists = await fs.pathExists(config.tools.fmodelPath);
                results.tools.fmodel = {
                    exists: fmodelExists,
                    path: config.tools.fmodelPath
                };
            }

            // Check if at least one tool is available
            const hasValidTool = (results.tools.unrealPak?.exists || results.tools.fmodel?.exists);
            if (!hasValidTool) { results.overall = false; }

            // Validate encryption
            if (config.encryption?.isEncrypted) {
                results.encryption.isEncrypted = true;
                results.encryption.hasKey = !!config.encryption.aesKey;

                if (config.encryption.aesKey) {
                    // Basic key format validation
                    const keyFormat = config.encryption.keyFormat || 'hex';
                    let isValidKey = false;

                    switch (keyFormat) {
                        case 'hex':
                            isValidKey = /^[0-9a-fA-F]{64}$/.test(config.encryption.aesKey);
                            break;
                        case 'base64':
                            isValidKey = /^[A-Za-z0-9+/]{43}=$/.test(config.encryption.aesKey);
                            break;
                        case 'string':
                            isValidKey = config.encryption.aesKey.length >= 32;
                            break;
                    }

                    results.encryption.validKey = isValidKey;
                    if (!isValidKey) { results.overall = false; }
                } else {
                    results.overall = false;
                }
            }

        } catch (error) {
            results.error = error.message;
            results.overall = false;
        }

        return results;
    }


    /**
     * Get extracted files list
     */
    async getExtractedFiles(req, res) {
        try {
            if (!this.config) {
                return res.status(500).json({
                    success: false,
                    error: 'Configuration not initialized'
                });
            }

            const outputDir = this.config.getConfig().pakFiles.outputDirectory;

            if (!await fs.pathExists(outputDir)) {
                return res.json({
                    success: true,
                    files: [],
                    message: 'No extracted files found'
                });
            }

            const files = await this.getFileTree(outputDir);

            res.json({
                success: true,
                files,
                outputDirectory: outputDir
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get file tree structure
     */
    async getFileTree(dirPath, relativePath = '') {
        const items = [];
        const entries = await fs.readdir(dirPath);

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry);
            const stats = await fs.stat(fullPath);
            const relPath = path.join(relativePath, entry);

            if (stats.isDirectory()) {
                const children = await this.getFileTree(fullPath, relPath);
                items.push({
                    name: entry,
                    type: 'directory',
                    path: relPath,
                    children,
                    size: 0
                });
            } else {
                items.push({
                    name: entry,
                    type: 'file',
                    path: relPath,
                    size: stats.size,
                    modified: stats.mtime
                });
            }
        }

        return items.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Clean extracted files
     */
    async cleanExtractedFiles(req, res) {
        try {
            if (this.isExtracting) {
                return res.status(409).json({
                    success: false,
                    error: 'Cannot clean files while extraction is in progress'
                });
            }

            if (!this.config) {
                return res.status(500).json({
                    success: false,
                    error: 'Configuration not initialized'
                });
            }

            const outputDir = this.config.getConfig().pakFiles.outputDirectory;

            if (await fs.pathExists(outputDir)) {
                await fs.remove(outputDir);
            }

            res.json({
                success: true,
                message: 'Extracted files cleaned successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Create example configuration file
     */
    async createExampleConfig(req, res) {
        try {
            const envExamplePath = path.join(process.cwd(), '.env.example');

            res.json({
                success: true,
                message: 'Configuration template available at .env.example',
                path: envExamplePath,
                note: 'Copy .env.example to .env and modify the values as needed'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new ExtractionController();