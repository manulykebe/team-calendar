import { Router } from "express";
import { existsSync } from "fs";
import { join, basename, normalize } from "path";
import { AuthRequest } from "../types.js";
import { readSiteData } from "../utils.js";

const router = Router();

// Get on-duty schedule PDF document for a specific site and quarter
router.get("/:site/on-duty-schedule/:filename", async (req: AuthRequest, res) => {
  try {
    const { site, filename } = req.params;

    // Validate site exists
    try {
      await readSiteData(site);
    } catch (error) {
      return res.status(404).json({
        message: req.i18n.t('common.siteNotFound') || 'Site not found'
      });
    }

    // Security: Validate filename to prevent directory traversal
    const normalizedFilename = normalize(filename).replace(/^(\.\.(\/|\\|$))+/, '');
    const safeFilename = basename(normalizedFilename);

    // Only allow PDF files
    if (!safeFilename.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({
        message: req.i18n.t('documents.invalidFileType') || 'Invalid file type. Only PDF files are allowed.'
      });
    }

    // Validate filename format (YYYY QX - month-month.pdf)
    const validFilenamePattern = /^\d{4} Q[1-4] - [a-z]+-[a-z]+\.pdf$/i;
    if (!validFilenamePattern.test(safeFilename)) {
      return res.status(400).json({
        message: req.i18n.t('documents.invalidFilename') || 'Invalid filename format.'
      });
    }

    // Construct safe file path
    const filePath = join(process.cwd(), 'server', 'data', 'sites', site, 'docs', safeFilename);

    // Check if file exists
    if (!existsSync(filePath)) {
      return res.status(404).json({
        message: req.i18n.t('documents.fileNotFound') || 'Document not found.'
      });
    }

    // Set appropriate headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

    // Send file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            message: req.i18n.t('documents.failedToDownload') || 'Failed to download document.'
          });
        }
      }
    });
  } catch (error) {
    console.error("Error downloading document:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: req.i18n.t('documents.failedToDownload') || 'Failed to download document.'
      });
    }
  }
});

// List available on-duty schedule documents for a site
router.get("/:site/on-duty-schedules", async (req: AuthRequest, res) => {
  try {
    const { site } = req.params;

    // Validate site exists
    try {
      await readSiteData(site);
    } catch (error) {
      return res.status(404).json({
        message: req.i18n.t('common.siteNotFound') || 'Site not found'
      });
    }

    const docsPath = join(process.cwd(), 'server', 'data', 'sites', site, 'docs');

    // Check if docs directory exists
    if (!existsSync(docsPath)) {
      return res.json({ documents: [] });
    }

    // Read directory and filter PDF files
    const fs = await import('fs/promises');
    const files = await fs.readdir(docsPath);

    const pdfFiles = files
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(file => ({
        filename: file,
        downloadUrl: `/api/documents/${site}/on-duty-schedule/${file}`
      }));

    res.json({ documents: pdfFiles });
  } catch (error) {
    console.error("Error listing documents:", error);
    res.status(500).json({
      message: req.i18n.t('documents.failedToListDocuments') || 'Failed to list documents.'
    });
  }
});

export { router as documentsRouter };
