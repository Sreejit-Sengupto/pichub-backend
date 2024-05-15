class ApiError extends Error {
    constructor(status, message, errors = [], stack = '') {
        super(message);
        (this.status = status),
            (this.data = null),
            (this.message = message),
            (this.success = false),
            (this.errors = errors);

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };
