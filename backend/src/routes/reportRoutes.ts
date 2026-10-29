import { Router } from 'express';
import {
  listReports,
  getReportById,
  deleteReport,
  exportReport,
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', listReports);
router.get('/:id', getReportById);
router.delete('/:id', deleteReport);
router.get('/:id/export', exportReport);

export default router;
