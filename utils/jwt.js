const jwt = require('jsonwebtoken');

// AccessToken
exports.AccessToken = (user) => {
  const tokenPayload = {
    userId: user.id,
    userName: user.userName,
    isConfirmed: user.isConfirmed,
    iin: user.iin,
    email: user.email,
    orgId: user.orgId,
    roleId: user.roleId,
    // image: user.image,
  };

  const token = jwt.sign(tokenPayload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '20m',
  });

  return token;
};

// refreshToken
exports.RefreshToken = (userId) => {
  const token = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });

  return token;
};
