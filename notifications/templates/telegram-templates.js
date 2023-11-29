const greetingsMessage = 'Hello, you are using our telegram bot! Please send your email to authenticate your account.';

const helpMessageCommand = 'If you want to start using our telegram bot, please send your email to authenticate your account.';

const misunderstandMessage = 'Sorry, I don\'t understand you. Please use /help to see the list of commands.';

const sendVerifiedCode = 'Check you email to complete your registration, we will send you a verification code, please write it below.'

const completeVerificationMessage = 'Your account has been verified, you can now use our telegram bot.';

const invalidVerificationMessage = 'Your verification email or code is invalid, please try again.';

module.exports = {
    greetingsMessage,
    misunderstandMessage,
    helpMessageCommand,
    sendVerifiedCode,
    completeVerificationMessage,
    invalidVerificationMessage
};