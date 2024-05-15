import mongoose, { Schema } from 'mongoose';

const gallerySchema = new Schema({
    galleryName: {
        type: String,
        required: true,
    },
    members: [
        {
            type: String,
        },
    ],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
});

export const Gallery = mongoose.model('Gallery', gallerySchema);
