import { Router } from 'express';
import {
    addToGallery,
    deleteMedia,
    getMedia,
    uploadMedia,
} from '../controller/media.controller.js';
import { upload } from '../middleware/multer.middleware.js';
import verifyJWT from '../middleware/auth.middleware.js';

const router = Router();

// ! Secured routes
router.use(verifyJWT);
router.route('/upload').post(upload.single('media'), uploadMedia);
router.route('/add-to-gallery/:galleryId').post(addToGallery);
router.route('/bring/:mediaId').get(getMedia);
router.route('/delete/:mediaId').delete(deleteMedia);

export default router;
