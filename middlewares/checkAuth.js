const jwt = require("jsonwebtoken");
const { User, Role } = require("../models");
const ROLES = require('../utils/constants/userRoles')

const isAuth = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization || req.headers.Authorization;
        if (!authorization) {
            return res.status(401).json("Unauthorized");
        }

        const token = authorization.slice(7, authorization.length); // Bearer XXXXXX

        if (!token) {
            return res.status(401).json("Unauthorized");
        }
    
        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findByPk(decoded.userId);
    
            if (!user) {
                return res.status(401).json("User not found");
            }
    
            // Attach the user object to the request for further use
            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json("Unauthorized");
        }
    } catch (error) {
        return res.status(403).json("Forbidden");
    }
};

const isAdmin = async (req, res, next) => {
    try {
        const role = await Role.findByPk(req?.user?.roleId);

        if (role.roleName === ROLES.ADMIN) {
            next();
        } else {
            res.status(401).json("Unauthorized");
        }
    } catch(error) {
        res.status(500).json(error.message)
    }
};

module.exports = { isAuth, isAdmin };
