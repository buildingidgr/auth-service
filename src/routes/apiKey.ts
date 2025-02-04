import { Router } from 'express';
import { ApiKeyController } from '../controllers/apiKeyController';
import { validateApiSecret } from '../middleware/validateApiSecret';

const router = Router();
const apiKeyController = new ApiKeyController();

router.post('/store', validateApiSecret, (req, res, next) => apiKeyController.storeApiKey(req, res, next));

export { router as apiKeyRouter }; 