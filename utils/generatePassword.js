module.exports = function generateRandomPassword() {
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_-+=<>?';
  
    const allChars = lowercaseChars + uppercaseChars + numbers + specialChars;
  
    let password = '';
  
    // Ensure at least one capital letter
    password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
  
    // Generate the remaining characters
    for (let i = 1; i < 8; i++) {
        const randomChar = allChars.charAt(Math.floor(Math.random() * allChars.length));
        password += randomChar;
    }
  
    return password;
}
