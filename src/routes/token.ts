import { Router } from 'express';
import { TokenController } from '../controllers/tokenController';

const router = Router();
const tokenController = new TokenController();

router.post('/exchange', (req, res, next) => tokenController.exchangeApiKey(req, res, next));
router.post('/refresh', (req, res, next) => tokenController.refreshToken(req, res, next));
router.post('/validate', (req, res, next) => tokenController.validateToken(req, res, next));
router.post('/clerk/exchange', (req, res, next) => tokenController.exchangeClerkSession(req, res, next));

export { router as tokenRouter };

