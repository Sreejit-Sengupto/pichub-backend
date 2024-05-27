import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import generateTokens from '../utils/generateTokens.js';
import jwt from 'jsonwebtoken';

// * User registration
const registerUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);

    if (!username) {
        throw new ApiError(400, 'Username is required');
    }

    if (!password) {
        throw new ApiError(400, 'Password is required');
    }

    // Check if user is already registered
    const existingUser = await User.findOne({
        username: username,
    });

    if (existingUser) {
        throw new ApiError(409, 'User with this username already exist');
    }

    // Register user
    const createdUser = await User.create({
        username: username.toLowerCase(),
        password,
    });

    if (!createdUser) {
        throw new ApiError(
            500,
            'Failed to register the user, please try again later.'
        );
    }

    const newUser = await User.findById(createdUser._id).select(
        '-password -refreshTokens'
    );

    if (!newUser) {
        throw new ApiError(500, 'Registration failed');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newUser, 'User registered successfully'));
});

// * User Login
const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username) {
        throw new ApiError(400, 'Username is required');
    }
    if (!password) {
        throw new ApiError(400, 'Password is required');
    }

    const user = await User.findOne({
        username,
    });
    if (!user) {
        throw new ApiError(404, 'No user found');
    }

    const validPassword = await user.isCorrectPassword(password);
    if (!validPassword) {
        throw new ApiError(401, 'Invalid user credentials');
    }

    const { accessTokens, refreshTokens } = await generateTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        '-password -refreshTokens'
    );

    const options = {
        httpOnly: true,
        // secure: true,
        sameSite: 'none',
        // domain: 'https://pichub-app.vercel.app/',
    };

    return res
        .status(200)
        .cookie('accessTokens', accessTokens, options)
        .cookie('refreshTokens', refreshTokens, options)
        .json(
            new ApiResponse(
                200,
                loggedInUser,
                'User authenticated successfully'
            )
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshTokens;
    if (!incomingRefreshToken) {
        throw new ApiError(401, 'Unauthorized access');
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(404, 'Invalid refresh token');
        }

        if (user?.refreshTokens !== incomingRefreshToken) {
            throw new ApiError(403, 'Refresh token invalid');
        }

        const options = {
            httpOnly: true,
            // secure: true,
            sameSite: 'none',
            // domain: 'https://pichub-app.vercel.app/',
        };

        const { accessTokens, refreshTokens } = await generateTokens(user._id);

        return res
            .status(200)
            .cookie('accessTokens', accessTokens, options)
            .cookie('refreshTokens', refreshTokens, options)
            .json(
                new ApiResponse(
                    200,
                    { refreshTokens },
                    'Access Tokens refreshed'
                )
            );
    } catch (error) {
        throw new ApiError(500, 'Failed to refresh tokens');
    }
});

// * Logout User
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset: {
                refreshTokens: 1,
            },
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        // secure: true,
        sameSite: 'none',
        // domain: 'https://pichub-app.vercel.app/',
    };

    return res
        .status(200)
        .clearCookie('accessTokens', options)
        .clearCookie('refreshTokens', options)
        .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

// * Get user
const getUser = asyncHandler(async (req, res) => {
    const userDetails = await User.aggregate([
        {
            $match: {
                username: req.user?.username,
            },
        },
        {
            $lookup: {
                from: 'media',
                localField: 'username',
                foreignField: 'uploadedBy',
                as: 'uploads',
            },
        },
        {
            $lookup: {
                from: 'galleries',
                localField: 'username',
                foreignField: 'members',
                as: 'galleries',
            },
        },
        {
            $project: {
                username: 1,
                uploads: 1,
                galleries: 1,
            },
        },
    ]);

    if (!userDetails) {
        throw new ApiError(500, 'Failed to fetch user details');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, userDetails[0], 'User fetched successfully')
        );
});

const getUserbyId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userDetails = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
            },
        },
        {
            $lookup: {
                from: 'media',
                localField: 'username',
                foreignField: 'uploadedBy',
                as: 'uploads',
            },
        },
        {
            $lookup: {
                from: 'galleries',
                localField: 'username',
                foreignField: 'members',
                as: 'galleries',
            },
        },
        {
            $project: {
                username: 1,
                uploads: 1,
                galleries: 1,
            },
        },
    ]);

    if (!userDetails) {
        throw new ApiError(500, 'Failed to fetch user details');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, userDetails[0], 'User fetched successfully')
        );
});

const userStatus = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, 'User is logged in'));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    getUser,
    getUserbyId,
    userStatus,
    refreshAccessToken,
};
