import { Router } from 'express';
import {
    getUser,
    getUserbyId,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    userStatus,
} from '../controller/user.controller.js';
import verifyJWT from '../middleware/auth.middleware.js';

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/refresh-tokens').post(refreshAccessToken);

//! Secure Route
router.route('/status').get(verifyJWT, userStatus);
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/get').get(verifyJWT, getUser);
router.route('/get/:id').get(verifyJWT, getUserbyId);

export default router;
