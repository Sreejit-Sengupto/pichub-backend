import { Gallery } from '../models/gallery.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

// * Create a gallery (intialisation) with the name and created by
const createGallery = asyncHandler(async (req, res) => {
    const { galleryName } = req.body;

    if (!galleryName) {
        throw new ApiError(400, 'Gallery name is required');
    }

    const gallery = await Gallery.create({
        galleryName,
        members: req.user?.username,
        createdBy: req.user?._id,
    });

    if (!gallery) {
        throw new ApiError(500, 'Failed to create gallery');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, gallery, 'Gallery created successfully'));
});

// * Add members to the gallery
// Todo: Add more than one member at once
const addMembers = asyncHandler(async (req, res) => {
    const { galleryId, username } = req.body;

    if (!galleryId) {
        throw new ApiError(400, 'GalleryID is required');
    }
    if (!username) {
        throw new ApiError(400, 'Username is required');
    }

    const validUsername = await User.findOne({ username });
    if (!validUsername) {
        throw new Error(404, 'No user found with the following username');
    }

    const currentGallery = await Gallery.findById(
        new mongoose.Types.ObjectId(galleryId)
    );

    const userExists = currentGallery.members.includes(username);
    if (userExists) {
        throw new ApiError(403, 'This user already exists in the gallery');
    }

    if (currentGallery.members.length > 50) {
        throw new ApiError(
            403,
            'Limit exceeded, you cannot add more than 50 people in a gallery.'
        );
    }

    await Gallery.findByIdAndUpdate(new mongoose.Types.ObjectId(galleryId), {
        $addToSet: { members: username },
    });

    const addedMembers = await Gallery.findById(
        new mongoose.Types.ObjectId(galleryId)
    );
    if (!addedMembers) {
        throw new ApiError(500, 'Failed to add members');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, addedMembers, 'New Members added successfully')
        );
});

// * Get gallery members
const getGalleryMembers = asyncHandler(async (req, res) => {
    const { galleryId } = req.params;
    if (!galleryId) {
        throw new ApiError(400, 'Gallery id is required');
    }

    const gallery = await Gallery.findById(
        new mongoose.Types.ObjectId(galleryId)
    );
    if (!gallery) {
        throw new ApiError(404, 'No gallery found with the followind id');
    }

    const members = await Gallery.aggregate([
        {
            $match: {
                _id: gallery._id,
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'createdBy',
                foreignField: '_id',
                as: 'admin',
                pipeline: [
                    {
                        $project: {
                            username: 1,
                        },
                    },
                ],
            },
        },
        {
            $project: {
                members: 1,
                admin: 1,
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            // { members: gallery?.members },
            { galleryMembers: members[0] },
            'Members fetched successfully'
        )
    );
});

// * Get images of the gallery
const getGalleryImages = asyncHandler(async (req, res) => {
    const { galleryId } = req.params;
    if (!galleryId) {
        throw new ApiError(400, 'Gallery Id is required');
    }

    const currentGallery = await Gallery.findById(
        new mongoose.Types.ObjectId(galleryId)
    );
    if (!currentGallery) {
        throw new ApiError(404, 'No gallery found with this id');
    }
    if (!currentGallery.members.includes(req.user?.username)) {
        throw new ApiError(403, 'You are not part of this gallery');
    }

    const galleryImages = await Gallery.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(galleryId),
            },
        },
        {
            $lookup: {
                from: 'media',
                localField: '_id',
                foreignField: 'belongsToGallery',
                as: 'images',
                pipeline: [
                    {
                        $project: {
                            caption: 1,
                            mediaURL: 1,
                            resourceType: 1,
                            cloudinaryPublicId: 1,
                            uploadedBy: 1,
                        },
                    },
                ],
            },
        },
        {
            $project: {
                galleryName: 1,
                images: 1,
            },
        },
    ]);
    if (!galleryImages) {
        throw new ApiError(500, 'Failed to fetch the gallery');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                galleryImages[0],
                'Gallery images fetched successfully'
            )
        );
});

// * Delete gallery
const deleteGallery = asyncHandler(async (req, res) => {
    const { galleryId } = req.params;
    if (!galleryId) {
        throw new ApiError(400, 'Gallery id is required');
    }

    const gallery = await Gallery.findById(
        new mongoose.Types.ObjectId(galleryId)
    );
    if (!gallery) {
        throw new ApiError(
            404,
            'No gallery found with the following id, it might have been already deleted'
        );
    }

    if (!gallery.createdBy.equals(req.user?._id)) {
        throw new ApiError(403, 'Not authorized to delete. Not owner');
    }

    await Gallery.findByIdAndDelete(gallery._id);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Gallery deleted successfully'));
});
export {
    createGallery,
    addMembers,
    getGalleryImages,
    getGalleryMembers,
    deleteGallery,
};
