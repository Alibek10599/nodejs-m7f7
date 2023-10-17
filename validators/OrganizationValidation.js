const validator = require("validator");
const isEmpty = require("./IsEmpty");

module.exports = function SignupValidation(data) {
    let errors = {};
    // Convert empty fields to an empty string so we can use validator
    data.name = !isEmpty(data.name) ? data.name : "";
    // Name checks
    if (validator.isEmpty(data.name)) {
        errors.name = "Name field is required";
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};
