const express = require('express');
const router = express.Router();
const walletService = require('../services/walletService');
const { authenticateUser } = require('../middleware/auth');

// All wallet routes require an authenticated user
router.use(authenticateUser);

/**
 * GET /api/wallet/documents
 * List all secure travel wallet documents for the authenticated user
 */
router.get('/documents', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category, search, offlineOnly } = req.query;

    const documents = await walletService.getUserDocuments(userId, {
      category,
      search,
      offlineOnly
    });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/wallet/documents/:id
 * Retrieve a single wallet document
 */
router.get('/documents/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.id;

    const document = await walletService.getDocumentById(userId, documentId);

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/wallet/documents
 * Create or save a new wallet document
 */
router.post('/documents', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      category,
      doc_type,
      issuing_country,
      expiry_date,
      trip_id,
      flight_details,
      notes,
      files,
      masked_number,
      is_offline_available
    } = req.body;

    if (!title || !category || !doc_type) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'title, category, and doc_type are required fields.'
      });
    }

    const savedDoc = await walletService.saveDocument(userId, {
      title,
      category,
      doc_type,
      issuing_country,
      expiry_date,
      trip_id,
      flight_details,
      notes,
      files,
      masked_number,
      is_offline_available
    });

    res.status(201).json({
      success: true,
      message: 'Document saved to Secure Travel Wallet.',
      data: savedDoc
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/wallet/documents/:id
 * Update an existing wallet document
 */
router.put('/documents/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.id;

    const updatedDoc = await walletService.updateDocument(userId, documentId, req.body);

    res.status(200).json({
      success: true,
      message: 'Document updated successfully.',
      data: updatedDoc
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/wallet/documents/:id
 * Delete a wallet document from cloud storage
 */
router.delete('/documents/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.id;

    const result = await walletService.deleteDocument(userId, documentId);

    res.status(200).json({
      success: true,
      message: 'Document deleted from Secure Travel Wallet.',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
