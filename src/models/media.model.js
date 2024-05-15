import mongoose, { Schema } from 'mongoose';

const mediaSchema = new Schema(
    {
        caption: {
            type: String,
        },
        mediaURL: {
            type: String,
            required: true,
        },
        resourceType: {
            type: String,
            required: true,
        },
        cloudinaryPublicId: {
            type: String,
            required: true,
        },
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        belongsToGallery: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Gallery',
            },
        ],
    },
    { timestamps: true }
);

export const Media = mongoose.model('Media', mediaSchema);
