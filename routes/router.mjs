import { Router } from 'express';
import { identifyContact } from '../controllers/identification-controller.mjs';

const router = Router();

// Route handler for /identify
router.post('/identify', identifyContact);

export default router;