import { asyncHandler } from '../utils/asyncHandler.js';

const test = asyncHandler(async (req, res) => {
    const { name } = req.body;
    console.log(name);

    return res.status(200).json({
        status: 200,
        message: `Hello ${name}! it seems to be all good 😃`,
    });
});

export { test };
