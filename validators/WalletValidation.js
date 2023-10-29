const validator = require("validator");
const isEmpty = require("./IsEmpty");

module.exports = function WalletValidation(data) {
    let regex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    let errors = {};
    // Convert empty fields to an empty string so we can use validator
    data.name = !isEmpty(data.name) ? data.name : "";
    // Name checks
    if (validator.isEmpty(data.name)) {
        errors.name = "Name field is required";
    }
    // Address checks
    if (validator.isEmpty(data.address)) {
        errors.address = "Address field is required";
    } else if (!regex.test(data.address)) {
        errors.address = "Format Address is required";
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};