import mongoose from 'mongoose';
import { Media } from '../models/media.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
    deleteFromCloudinary,
    uploadToCloudinary,
} from '../utils/cloudinary.js';
import { Gallery } from '../models/gallery.model.js';

//* Upload media controller
const uploadMedia = asyncHandler(async (req, res) => {
    const mediaLocalPath = req.file?.path;
    const { galleryId } = req.body;
    const { caption } = req.body;
    console.log(mediaLocalPath);
    console.log(caption);

    if (!mediaLocalPath) {
        throw new ApiError(400, 'No media files received');
    }

    const uploadedMedia = await uploadToCloudinary(mediaLocalPath);
    console.log(uploadedMedia);

    if (!uploadedMedia.url) {
        throw new ApiError(500, 'Error while uploading media');
    }

    // Add to MongoDB
    const media = await Media.create({
        caption: caption || ' ',
        mediaURL: uploadedMedia?.secure_url || ' ',
        resourceType: uploadedMedia?.resource_type,
        cloudinaryPublicId: uploadedMedia?.public_id,
        uploadedBy: req.user?.username,
    });

    if (!media) {
        throw new Error(500, { message: 'Failed to save image to Database' });
    }

    if (galleryId) {
        media.belongsToGallery.push(new mongoose.Types.ObjectId(galleryId));
        await media.save();
    }

    return res
        .status(200)
        .json(new ApiResponse(200, media, 'Media uploaded successfully'));
});

// * Add media to a gallery
const addToGallery = asyncHandler(async (req, res) => {
    // const { galleryId, mediaId } = req.body;
    const galleryId = req.params.galleryId;
    const mediaId = req.body.mediaId;

    if (!galleryId) {
        throw new ApiError(400, 'Gallery id is required');
    }
    if (!mediaId) {
        throw new ApiError(400, 'Gallery id is required');
    }

    // Todo: Check if the current user is the part of gallery
    const gallery = await Gallery.findById(
        new mongoose.Types.ObjectId(galleryId)
    );
    const validGalleryMember = gallery.members.includes(req.user?.username);
    if (!validGalleryMember) {
        throw new ApiError(403, 'You are not a member of this gallery');
    }

    const media = await Media.findById(new mongoose.Types.ObjectId(mediaId));
    if (!media) {
        throw new ApiError(
            404,
            'No media found with the following id, it might have been deleted'
        );
    }
    if (
        media &&
        media.belongsToGallery.includes(new mongoose.Types.ObjectId(galleryId))
    ) {
        throw new ApiError(
            400,
            'This media file is already in the provided gallery'
        );
    }

    media.belongsToGallery.push(new mongoose.Types.ObjectId(galleryId));
    await media.save();

    const updatedMedia = await Media.findById(media._id).select(
        '-belongsToGallery'
    );
    if (!updatedMedia) {
        throw new ApiError(500, 'Failed to add the media to gallery');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedMedia, 'Added to gallery successfully')
        );
});

// * Get media file details
const getMedia = asyncHandler(async (req, res) => {
    const mediaId = req.params.mediaId;
    if (!mediaId) {
        throw new ApiError(400, 'Media id is required');
    }

    const media = await Media.findById(mediaId);
    // const media = await Media.find(new mongoose.Types.ObjectId(mediaId));
    if (!media) {
        throw new Error(404, { message: 'Not found' });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, media, 'Media fetched successfully'));
});

// * Delete media file from cloudinary as well as MongoDB
const deleteMedia = asyncHandler(async (req, res) => {
    const mediaId = req.params.mediaId;
    if (!mediaId) {
        throw new ApiError(400, 'Media id is required');
    }

    const media = await Media.findById(new mongoose.Types.ObjectId(mediaId));
    if (!media) {
        throw new ApiError(404, 'No media was found with the following id');
    }
    if (media.uploadedBy !== req.user?.username) {
        throw new ApiError(403, "You cannot delete someone else's media");
    }

    const deleteStatus = await deleteFromCloudinary(
        media.cloudinaryPublicId,
        media.resourceType
    );
    if (!deleteStatus) {
        throw new ApiError(500, 'Failed to delete media');
    }

    const deleteFromDB = await Media.findByIdAndDelete(media._id);
    if (!deleteFromDB) {
        throw new ApiError(
            500,
            'There was some problem while deleting media file from the database'
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Media file deleted successfully'));
});

// TODO: Just remove from gallery

export { uploadMedia, getMedia, addToGallery, deleteMedia };
