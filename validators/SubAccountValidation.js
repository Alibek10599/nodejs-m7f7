const validator = require("validator");
const isEmpty = require("./IsEmpty");

module.exports = function SubAccountValidation(data) {
    let errors = {};
    // Convert empty fields to an empty string so we can use validator
    data.name = !isEmpty(data.name) ? data.name : "";
    // Name checks
    if (validator.isEmpty(data.name)) {
        errors.name = "Name field is required";
    }

    data.walletName = !isEmpty(data.walletName) ? data.walletName : "";
    // Name checks
    if (validator.isEmpty(data.walletName)) {
        errors.name = "Wallet is required";
    }

    data.walletAddress = !isEmpty(data.walletAddress) ? data.walletAddress : "";
    // Address checks
    if (validator.isEmpty(data.walletAddress)) {
        errors.address = "Address field is required";
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};
