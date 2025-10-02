const fs = require('fs-extra');
const path = require('node:path');
const { spawn } = require('node:child_process');
const winston = require('winston');

/**
 * PAK File Extractor Service
 * Handles extraction of encrypted PAK files from Last Oasis
 */
class PakExtractor {
    constructor(config) {
        this.config = config;
        // Ensure logs directory exists before setting up logger
        fs.ensureDirSync('./logs');
        this.logger = this.setupLogger();
        this.validateConfig();
    }

    /**
     * Setup Winston logger for extraction process
     */
    setupLogger() {
        return winston.createLogger({
            level: this.config.logging?.level || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                }),
                new winston.transports.File({
                    filename: this.config.logging?.logFile || './logs/extraction.log',
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 5
                })
            ]
        });
    }

    /**
     * Validate configuration settings
     */
    validateConfig() {
        const required = ['pakFiles.gamePath', 'pakFiles.pakDirectory'];

        for (const key of required) {
            const value = this.getNestedValue(this.config, key);
            if (!value) {
                throw new Error(`Missing required configuration: ${key}`);
            }
        }

        // Validate paths exist
        const gamePath = this.config.pakFiles.gamePath;
        const pakPath = path.join(gamePath, this.config.pakFiles.pakDirectory);

        if (!fs.existsSync(gamePath)) {
            throw new Error(`Game path does not exist: ${gamePath}`);
        }

        if (!fs.existsSync(pakPath)) {
            throw new Error(`PAK directory does not exist: ${pakPath}`);
        }

        this.logger.info('Configuration validated successfully');
    }

    /**
     * Get nested object value by dot notation
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Main extraction method
     */
    async extractPakFiles() {
        try {
            this.logger.info('Starting PAK file extraction process');

            await this.prepareDirectories();
            const pakFiles = await this.findPakFiles();

            if (pakFiles.length === 0) {
                throw new Error('No PAK files found in the specified directory');
            }

            this.logger.info(`Found ${pakFiles.length} PAK files to extract`);

            const results = [];
            for (const pakFile of pakFiles) {
                try {
                    const result = await this.extractSinglePak(pakFile);
                    results.push(result);
                } catch (error) {
                    this.logger.error(`Failed to extract ${pakFile}:`, error);
                    if (this.config.extraction?.retryAttempts > 0) {
                        this.logger.info(`Retrying extraction of ${pakFile}`);
                        const retryResult = await this.retryExtraction(pakFile);
                        results.push(retryResult);
                    }
                }
            }

            await this.filterExtractedContent();
            this.logger.info('PAK extraction completed successfully');

            return {
                success: true,
                extractedFiles: results.filter(r => r.success).length,
                totalFiles: pakFiles.length,
                outputPath: this.config.pakFiles.outputDirectory
            };

        } catch (error) {
            this.logger.error('PAK extraction failed:', error);
            throw error;
        }
    }

    /**
     * Prepare extraction directories
     */
    async prepareDirectories() {
        const outputDir = this.config.pakFiles.outputDirectory;

        if (this.config.extraction?.cleanTempOnStart && fs.existsSync(outputDir)) {
            this.logger.info('Cleaning existing output directory');
            await fs.remove(outputDir);
        }

        await fs.ensureDir(outputDir);
        await fs.ensureDir('./logs');

        this.logger.info(`Output directory prepared: ${outputDir}`);
    }

    /**
     * Find all PAK files in the game directory
     */
    async findPakFiles() {
        const pakPath = path.join(
            this.config.pakFiles.gamePath,
            this.config.pakFiles.pakDirectory
        );

        const files = await fs.readdir(pakPath);
        const pakFiles = files
            .filter(file => file.endsWith('.pak'))
            .map(file => path.join(pakPath, file));

        this.logger.info(`Found PAK files: ${pakFiles.map(f => path.basename(f)).join(', ')}`);
        return pakFiles;
    }

    /**
     * Extract a single PAK file
     */
    async extractSinglePak(pakFilePath) {
        const pakName = path.basename(pakFilePath, '.pak');
        const outputPath = path.join(this.config.pakFiles.outputDirectory, pakName);

        this.logger.info(`Extracting ${pakName}...`);

        try {
            // Try UnrealPak first if available
            if (this.config.tools?.unrealPakPath && fs.existsSync(this.config.tools.unrealPakPath)) {
                return await this.extractWithUnrealPak(pakFilePath, outputPath);
            }

            // Fallback to FModel if available
            if (this.config.tools?.fmodelPath && fs.existsSync(this.config.tools.fmodelPath)) {
                return await this.extractWithFModel(pakFilePath, outputPath);
            }

            throw new Error('No extraction tools available. Please configure UnrealPak or FModel paths.');

        } catch (error) {
            this.logger.error(`Failed to extract ${pakName}:`, error);
            return { success: false, pakFile: pakFilePath, error: error.message };
        }
    }

    /**
     * Extract PAK using UnrealPak tool
     */
    async extractWithUnrealPak(pakFilePath, outputPath) {
        await fs.ensureDir(outputPath);
        
        return new Promise((resolve, reject) => {
            
            const args = [pakFilePath, '-Extract', outputPath];

            // Add AES key if encryption is enabled
            if (this.config.encryption?.isEncrypted && this.config.encryption?.aesKey) {
                args.push(`-AESKey=${this.config.encryption.aesKey}`);
            }

            // Handle Windows batch files
            let command = this.config.tools.unrealPakPath;
            let spawnArgs = args;
            let spawnOptions = {};

            if (process.platform === 'win32' && command.endsWith('.bat')) {
                // For Windows batch files, use shell: true and construct the full command
                const quotedArgs = args.map(arg => {
                    // Quote arguments that contain spaces or special characters
                    if (arg.includes(' ') || arg.includes('&') || arg.includes('(') || arg.includes(')')) {
                        return `"${arg}"`;
                    }
                    return arg;
                });
                
                // Build the full command string for shell execution
                const fullCommand = `"${command}" ${quotedArgs.join(' ')}`;
                command = fullCommand;
                spawnArgs = [];
                spawnOptions = { shell: true };
            }

            // Debug logging - log the exact command construction
            this.logger.info(`Executing command: ${command}`);
            this.logger.info(`With arguments: ${JSON.stringify(spawnArgs)}`);
            this.logger.info(`Full command would be: ${command} ${spawnArgs.join(' ')}`);
            this.logger.info(`PAK file path: "${pakFilePath}"`);
            this.logger.info(`Output path: "${outputPath}"`);

            const unrealPak = spawn(command, spawnArgs, spawnOptions);
            let stdout = '';
            let stderr = '';

            unrealPak.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            unrealPak.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            unrealPak.on('close', (code) => {
                if (code === 0) {
                    this.logger.info(`Successfully extracted ${path.basename(pakFilePath)} with UnrealPak`);
                    resolve({ success: true, pakFile: pakFilePath, tool: 'UnrealPak' });
                } else {
                    this.logger.error(`UnrealPak extraction failed with code ${code}: ${stderr}`);
                    reject(new Error(`UnrealPak failed: ${stderr}`));
                }
            });

            unrealPak.on('error', (error) => {
                this.logger.error("UnrealPak spawn error:", error);
                reject(error);
            });

            // Set timeout
            const timeout = setTimeout(() => {
                unrealPak.kill();
                reject(new Error('Extraction timeout'));
            }, (this.config.extraction?.timeoutMinutes || 30) * 60 * 1000);

            unrealPak.on('close', () => clearTimeout(timeout));
        });
    }

    /**
     * Extract PAK using FModel tool
     */
    async extractWithFModel(pakFilePath, outputPath) {
        return new Promise((resolve, reject) => {
            // Quote paths if they contain spaces for Windows batch files
            const quotedPakPath = pakFilePath.includes(' ') ? `"${pakFilePath}"` : pakFilePath;
            const quotedOutputPath = outputPath.includes(' ') ? `"${outputPath}"` : outputPath;
            
            // FModel command line arguments
            const args = [
                '--paksdir', path.dirname(quotedPakPath),
                '--output', quotedOutputPath,
                '--export',
                '--bulk'
            ];

            // Add AES key if encryption is enabled
            if (this.config.encryption?.isEncrypted && this.config.encryption?.aesKey) {
                args.push('--aeskey', this.config.encryption.aesKey);
            }

            // Handle Windows batch files
            let command = this.config.tools.fmodelPath;
            let spawnArgs = args;

            if (process.platform === 'win32' && command.endsWith('.bat')) {
                spawnArgs = ['/c', command, ...args];
                command = 'cmd';
            }

            // Debug logging
            this.logger.info(`Executing FModel command: ${command}`);
            this.logger.info(`With FModel arguments: ${JSON.stringify(spawnArgs)}`);

            const fmodel = spawn(command, spawnArgs);
            let stdout = '';
            let stderr = '';

            fmodel.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            fmodel.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            fmodel.on('close', (code) => {
                if (code === 0) {
                    this.logger.info(`Successfully extracted ${path.basename(pakFilePath)} with FModel`);
                    resolve({ success: true, pakFile: pakFilePath, tool: 'FModel' });
                } else {
                    this.logger.error(`FModel extraction failed with code ${code}: ${stderr}`);
                    reject(new Error(`FModel failed: ${stderr}`));
                }
            });

            fmodel.on('error', (error) => {
                this.logger.error("FModel spawn error:", error);
                reject(error);
            });

            // Set timeout
            const timeout = setTimeout(() => {
                fmodel.kill();
                reject(new Error('Extraction timeout'));
            }, (this.config.extraction?.timeoutMinutes || 30) * 60 * 1000);

            fmodel.on('close', () => clearTimeout(timeout));
        });
    }

    /**
     * Retry extraction with different parameters
     */
    async retryExtraction(pakFilePath) {
        const maxRetries = this.config.extraction?.retryAttempts || 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.logger.info(`Retry attempt ${attempt}/${maxRetries} for ${path.basename(pakFilePath)}`);

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt));

                const result = await this.extractSinglePak(pakFilePath);
                if (result.success) {
                    return result;
                }
            } catch (error) {
                this.logger.warn(`Retry ${attempt} failed:`, error.message);
                if (attempt === maxRetries) {
                    throw error;
                }
            }
        }

        throw new Error(`All retry attempts failed for ${pakFilePath}`);
    }

    /**
     * Filter extracted content to only keep target directories
     */
    async filterExtractedContent() {
        const outputDir = this.config.pakFiles.outputDirectory;
        const targetDirs = this.config.pakFiles.targetDirectories || [];

        if (targetDirs.length === 0) {
            this.logger.info('No target directories specified, keeping all extracted content');
            return;
        }

        this.logger.info('Filtering extracted content to target directories');

        const extractedDirs = await fs.readdir(outputDir);

        for (const dir of extractedDirs) {
            const dirPath = path.join(outputDir, dir);
            const stats = await fs.stat(dirPath);

            if (stats.isDirectory()) {
                await this.filterDirectory(dirPath, targetDirs);
            }
        }
    }

    /**
     * Filter a directory to keep only target paths
     */
    async filterDirectory(dirPath, targetDirs) {
        const items = await fs.readdir(dirPath);

        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const relativePath = path.relative(this.config.pakFiles.outputDirectory, itemPath);

            // For PAK extractions, the path includes the PAK name directory
            // We need to check if the path (after removing the PAK directory) matches target directories
            const pathParts = relativePath.split(path.sep);
            const pathWithoutPakDir = pathParts.length > 1 ? pathParts.slice(1).join(path.sep) : relativePath;

            this.logger.debug(`Checking path: ${relativePath}, without PAK dir: ${pathWithoutPakDir}`);

            const shouldKeep = targetDirs.some(targetDir => {
                const normalizedTargetDir = targetDir.replace(/\//g, path.sep);
                const matchesWithoutPakDir = pathWithoutPakDir.startsWith(normalizedTargetDir);
                const matchesWithPakDir = relativePath.startsWith(normalizedTargetDir);

                // Also check if this item is within a target directory (for files within target dirs)
                const isWithinTargetDir = normalizedTargetDir.startsWith(pathWithoutPakDir) || normalizedTargetDir.startsWith(relativePath);

                this.logger.debug(`  Target: ${normalizedTargetDir}, matches without PAK: ${matchesWithoutPakDir}, matches with PAK: ${matchesWithPakDir}, is within target: ${isWithinTargetDir}`);

                return matchesWithoutPakDir || matchesWithPakDir || isWithinTargetDir;
            });

            this.logger.debug(`  Should keep: ${shouldKeep}`);

            if (shouldKeep) {
                // If this is a directory that should be kept, recursively process its contents
                // but don't apply filtering - keep everything within target directories
                const stats = await fs.stat(itemPath);
                if (stats.isDirectory()) {
                    this.logger.debug(`Keeping target directory and all its contents: ${relativePath}`);
                    // Don't filter contents of target directories - keep everything
                }
            } else {
                const stats = await fs.stat(itemPath);
                if (stats.isDirectory()) {
                    // Check if any subdirectories should be kept
                    const hasTargetContent = await this.hasTargetContent(itemPath, targetDirs);
                    if (!hasTargetContent) {
                        await fs.remove(itemPath);
                        this.logger.debug(`Removed non-target directory: ${relativePath}`);
                    } else {
                        // Recursively filter subdirectories
                        await this.filterDirectory(itemPath, targetDirs);
                    }
                } else {
                    await fs.remove(itemPath);
                    this.logger.debug(`Removed non-target file: ${relativePath}`);
                }
            }
        }
    }

    /**
     * Check if directory contains target content
     */
    async hasTargetContent(dirPath, targetDirs) {
        const items = await fs.readdir(dirPath);

        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const relativePath = path.relative(this.config.pakFiles.outputDirectory, itemPath);

            // For PAK extractions, check both with and without PAK directory prefix
            const pathParts = relativePath.split(path.sep);
            const pathWithoutPakDir = pathParts.length > 1 ? pathParts.slice(1).join(path.sep) : relativePath;

            const isTarget = targetDirs.some(targetDir => {
                const normalizedTargetDir = targetDir.replace(/\//g, path.sep);
                return pathWithoutPakDir.startsWith(normalizedTargetDir) ||
                    relativePath.startsWith(normalizedTargetDir);
            });

            if (isTarget) {
                return true;
            }

            const stats = await fs.stat(itemPath);
            if (stats.isDirectory()) {
                const hasContent = await this.hasTargetContent(itemPath, targetDirs);
                if (hasContent) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Validate extracted files
     */
    async validateExtractedFiles() {
        if (!this.config.extraction?.validateExtractedFiles) {
            return true;
        }

        const outputDir = this.config.pakFiles.outputDirectory;
        const targetDirs = this.config.pakFiles.targetDirectories || [];

        this.logger.info('Validating extracted files');

        for (const targetDir of targetDirs) {
            const targetPath = path.join(outputDir, targetDir.replace(/\//g, path.sep));

            if (!fs.existsSync(targetPath)) {
                this.logger.warn(`Target directory not found: ${targetDir}`);
                return false;
            }

            const files = await this.getFilesRecursively(targetPath);
            if (files.length === 0) {
                this.logger.warn(`No files found in target directory: ${targetDir}`);
                return false;
            }

            this.logger.info(`Found ${files.length} files in ${targetDir}`);
        }

        this.logger.info('File validation completed successfully');
        return true;
    }

    /**
     * Get all files recursively from a directory
     */
    async getFilesRecursively(dirPath) {
        const files = [];
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
     * Clean up temporary files
     */
    async cleanup() {
        if (this.config.extraction?.cleanTempOnFinish) {
            this.logger.info('Cleaning up temporary files');
            await fs.remove(this.config.pakFiles.outputDirectory);
        }
    }

    /**
     * Get extraction status and statistics
     */
    async getExtractionStatus() {
        const outputDir = this.config.pakFiles.outputDirectory;

        if (!fs.existsSync(outputDir)) {
            return { status: 'not_started', files: 0, size: 0 };
        }

        const files = await this.getFilesRecursively(outputDir);
        let totalSize = 0;

        for (const file of files) {
            const stats = await fs.stat(file);
            totalSize += stats.size;
        }

        return {
            status: 'completed',
            files: files.length,
            size: totalSize,
            sizeFormatted: this.formatBytes(totalSize),
            outputPath: outputDir
        };
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
    }
}

module.exports = PakExtractor;