import { Router } from 'express';
import {
  executeFullRecon,
  lookupDomainInfo,
  lookupDnsEndpoint,
  lookupWhoisEndpoint,
  lookupIpEndpoint,
} from '../controllers/reconController.js';
import { authenticate } from '../middleware/auth.js';
import { reconLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Protect recon endpoints so scans are tracked and attributable
router.post('/full', authenticate, reconLimiter, executeFullRecon);
router.post('/domain', authenticate, reconLimiter, lookupDomainInfo);
router.post('/dns', authenticate, reconLimiter, lookupDnsEndpoint);
router.post('/whois', authenticate, reconLimiter, lookupWhoisEndpoint);
router.post('/ip', authenticate, reconLimiter, lookupIpEndpoint);

export default router;
