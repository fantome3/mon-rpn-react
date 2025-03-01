"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.isAuth = exports.generateToken = exports.generatePasswordToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = require("./models/userModel");
const cache_manager_1 = require("cache-manager");
const generatePasswordToken = (email, _id) => {
    if (!email || !_id) {
        throw new Error('Invalid input data');
    }
    const expiresIn = '1h';
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT secret not found');
    }
    return jsonwebtoken_1.default.sign({ email, _id }, secret, { expiresIn });
};
exports.generatePasswordToken = generatePasswordToken;
const generateToken = (user) => {
    const expiresIn = user.rememberMe ? '30d' : '30m';
    const payload = {
        _id: user._id,
        register: {
            email: user.register.email,
            conditions: user.register.conditions,
        },
        rememberMe: user.rememberMe,
        isAdmin: user.isAdmin,
        cpdLng: user.cpdLng,
    };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn: expiresIn,
    });
};
exports.generateToken = generateToken;
const isAuth = async (req, res, next) => {
    const cache = await (0, cache_manager_1.caching)('memory', {
        max: 100,
        ttl: 2592000,
    });
    const { authorization } = req.headers;
    if (!authorization) {
        res.status(401).json({ message: 'No Token' });
    }
    const token = authorization?.slice(7, authorization.length);
    try {
        const cachedToken = await cache.get(token);
        if (cachedToken) {
            const expiresIn = cachedToken.rememberMe ? '30d' : '30m';
            if (expiresIn === '30d') {
                const exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
                if (Date.now() < exp * 1000) {
                    req.user = cachedToken;
                    next();
                }
            }
            else if (expiresIn === '30m') {
                const exp = Math.floor(Date.now() / 1000) + 30 * 60;
                if (Date.now() < exp * 1000) {
                    req.user = cachedToken;
                    next();
                }
            }
        }
        const decode = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await userModel_1.UserModel.findById(decode._id);
        if (!user) {
            res.status(401).json({ message: 'User not found' });
        }
        req.user = decode;
        const ttl = 2592000;
        await cache.set(token, decode, ttl);
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({ message: 'Token Expired' });
        }
        else if (error.name === 'JsonWebTokenError') {
            res.status(401).json({ message: 'Invalid Token' });
        }
        else {
            res.status(500).json({ message: 'Unexpected Error' });
        }
    }
};
exports.isAuth = isAuth;
const isAdmin = (req, res, next) => {
    try {
        if (req.user?.isAdmin) {
            next();
        }
        else {
            res.status(401).send({
                message: 'Invalid Admin Token',
            });
        }
    }
    catch (error) {
        res.status(500).send({
            message: 'Unexpected error',
        });
    }
};
exports.isAdmin = isAdmin;
