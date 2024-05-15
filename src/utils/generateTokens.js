import { User } from '../models/user.model.js';
import { ApiError } from './ApiError.js';

const generateTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessTokens = user.generateAccessTokens();
        const refreshTokens = user.generateRefershTokens();

        user.refreshTokens = refreshTokens;
        await user.save({ validateBeforeSave: false });
        return { accessTokens, refreshTokens };
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while generating tokens');
    }
};

export default generateTokens;
