const validator = require("validator");
const isEmpty = require("./IsEmpty");

module.exports = function SignupValidation(data) {
    let errors = {};
    // Convert empty fields to an empty string so we can use validator
    data.email = !isEmpty(data.email) ? data.email : "";
    
    // Email checks
    if (validator.isEmpty(data.email)) {
        errors.email = "Email field is required";
    } else if (!validator.isEmail(data.email)) {
        errors.email = "Format Email required";
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};
