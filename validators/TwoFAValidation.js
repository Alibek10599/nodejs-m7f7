const isEmpty = require("./IsEmpty");
const speakeasy = require('speakeasy');

module.exports = function TwoFAValidation(data) {
    let errors = {};
    const { secret, otp } = data;
    const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: otp,
    });

    if (!verified){
        errors.otp = "Wrong OTP";
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
};