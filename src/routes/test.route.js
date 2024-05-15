import { Router } from 'express';
import { test } from '../controller/test.controller.js';

const router = Router();

router.route('/test').get(test);

export default router;
