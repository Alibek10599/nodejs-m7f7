const isEmpty = require("./IsEmpty");

module.exports = function matchUserMessage(message) {

    let errors = {};
    /*You can change this regular expression*/
    const regexEmailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

    if (!regexEmailPattern.test(message)) {
        errors.email =
            "Sorry, I don`t understand that email address";
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
}