import Router from 'express';
import verifyJWT from '../middleware/auth.middleware.js';
import {
    addMembers,
    createGallery,
    deleteGallery,
    getGalleryImages,
    getGalleryMembers,
} from '../controller/gallery.controller.js';

const router = Router();

// ! Secured routes
router.use(verifyJWT);
router.route('/create').post(createGallery);
router.route('/add-member').post(addMembers);
router.route('/get-members/:galleryId').get(getGalleryMembers);
router.route('/get-images/:galleryId').get(getGalleryImages);
router.route('/delete/:galleryId').delete(deleteGallery);

export default router;
