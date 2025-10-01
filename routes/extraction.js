const express = require('express');
const router = express.Router();
const extractionController = require('../controllers/extractionController');

/**
 * PAK Extraction Routes
 * Provides REST API endpoints for managing PAK file extraction
 */

/**
 * GET /api/extraction/config
 * Get current extraction configuration
 */
router.get('/config', extractionController.getConfig.bind(extractionController));

/**
 * PUT /api/extraction/config
 * Update extraction configuration
 * Body: Configuration object with updates
 */
router.put('/config', extractionController.updateConfig.bind(extractionController));

/**
 * POST /api/extraction/config/validate
 * Validate extraction configuration
 * Body: Configuration object to validate (optional, uses current config if not provided)
 */
router.post('/config/validate', extractionController.validateConfig.bind(extractionController));

/**
 * POST /api/extraction/config/example
 * Create example configuration file
 */
router.post('/config/example', extractionController.createExampleConfig.bind(extractionController));

/**
 * POST /api/extraction/start
 * Start PAK file extraction process
 */
router.post('/start', extractionController.startExtraction.bind(extractionController));

/**
 * POST /api/extraction/stop
 * Stop current extraction process
 */
router.post('/stop', extractionController.stopExtraction.bind(extractionController));

/**
 * GET /api/extraction/status
 * Get current extraction status and progress
 */
router.get('/status', extractionController.getExtractionStatus.bind(extractionController));

/**
 * GET /api/extraction/files
 * Get list of extracted files
 */
router.get('/files', extractionController.getExtractedFiles.bind(extractionController));

/**
 * DELETE /api/extraction/files
 * Clean/remove all extracted files
 */
router.delete('/files', extractionController.cleanExtractedFiles.bind(extractionController));

/**
 * Error handling middleware for extraction routes
 */
router.use((error, req, res, next) => {
    console.error('Extraction route error:', error);
    
    res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;