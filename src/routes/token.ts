import { Router } from 'express';
import { TokenController } from '../controllers/tokenController';

const router = Router();
const tokenController = new TokenController();

router.post('/exchange', tokenController.exchangeApiKey);
router.post('/refresh', tokenController.refreshToken);
router.post('/validate', tokenController.validateToken);

export { router as tokenRouter };

