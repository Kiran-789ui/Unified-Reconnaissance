import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ReconReport } from '../models/ReconReport.js';
import {
  exportReportAsJson,
  exportReportAsCsv,
  generateReportPdf,
} from '../services/reportExportService.js';

export const listReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const search = (req.query.q as string || '').trim();
    const status = (req.query.status as string || '').trim();

    const query: any = { userId: req.userId };

    if (search) {
      query.target = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    if (status && ['success', 'partial', 'failed'].includes(status)) {
      query.overallStatus = status;
    }

    const total = await ReconReport.countDocuments(query);
    const reports = await ReconReport.find(query)
      .sort({ lookupTimestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('target targetType lookupTimestamp overallStatus summaryStats createdAt');

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      reports,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports: ' + err.message,
    });
  }
};

export const getReportById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid report ID format.' });
      return;
    }

    const report = await ReconReport.findById(id);
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }

    // Ownership check: user can only view their own reports
    if (report.userId.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this report.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to load report: ' + err.message,
    });
  }
};

export const deleteReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid report ID format.' });
      return;
    }

    const report = await ReconReport.findById(id);
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }

    // Ownership check
    if (report.userId.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own reports.',
      });
      return;
    }

    await ReconReport.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Reconnaissance report successfully deleted.',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete report: ' + err.message,
    });
  }
};

export const exportReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const format = (req.query.format as string || 'json').toLowerCase();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid report ID format.' });
      return;
    }

    const report = await ReconReport.findById(id);
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }

    // Ownership check
    if (report.userId.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only export your own reports.',
      });
      return;
    }

    const safeTarget = report.target.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestampStr = new Date(report.lookupTimestamp).toISOString().split('T')[0];

    if (format === 'json') {
      const jsonContent = exportReportAsJson(report);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="recon_${safeTarget}_${timestampStr}.json"`);
      res.send(jsonContent);
      return;
    }

    if (format === 'csv') {
      const csvContent = exportReportAsCsv(report);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="recon_${safeTarget}_${timestampStr}.csv"`);
      res.send(csvContent);
      return;
    }

    if (format === 'pdf') {
      const pdfBuffer = await generateReportPdf(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="recon_${safeTarget}_${timestampStr}.pdf"`);
      res.send(pdfBuffer);
      return;
    }

    res.status(400).json({
      success: false,
      message: 'Unsupported export format. Supported formats are: json, csv, pdf.',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to export report: ' + err.message,
    });
  }
};
