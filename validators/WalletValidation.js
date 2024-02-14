const validator = require("validator");
const isEmpty = require("./IsEmpty");

module.exports = function WalletValidation(data) {
    let errors = {};
    // Convert empty fields to an empty string so we can use validator
    data.name = !isEmpty(data.name) ? data.name : "";
    // Name checks
    if (validator.isEmpty(data.name)) {
        errors.name = "Name field is required";
    }

    data.address = !isEmpty(data.address) ? data.address : "";
    // Address checks
    if (validator.isEmpty(data.address)) {
        errors.address = "Address field is required";
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};
