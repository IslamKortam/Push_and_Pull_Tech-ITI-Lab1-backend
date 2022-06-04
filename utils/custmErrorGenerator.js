
const customErrorGenerator = (status, code, msg) => {
    const error = Error(msg);
    error.status = status;
    error.code = code;

    return error;
}

module.exports = customErrorGenerator;