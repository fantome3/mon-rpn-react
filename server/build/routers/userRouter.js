"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const userModel_1 = require("../models/userModel");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const utils_1 = require("../utils");
const nodemailer_1 = __importDefault(require("nodemailer"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const accountModel_1 = require("../models/accountModel");
exports.userRouter = express_1.default.Router();
function updateUserPassword(id, newPassword) {
    return new Promise((resolve, reject) => {
        bcryptjs_1.default
            .hash(newPassword, 10)
            .then((hash) => {
            userModel_1.UserModel.findByIdAndUpdate(id, { 'register.password': hash })
                .then(() => resolve('Success'))
                .catch((err) => reject(err));
        })
            .catch((err) => reject(err));
    });
}
exports.userRouter.post('/generate-token', (0, express_async_handler_1.default)(async (req, res) => {
    const { email } = req.body;
    const token = jsonwebtoken_1.default.sign({ email }, process.env.JWT_SECRET || 'ddlfjssdmsmdkskm', { expiresIn: '1h' });
    res.json({ token });
}));
exports.userRouter.post('/verify-token', (0, express_async_handler_1.default)(async (req, res) => {
    const { token } = req.body;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'ddlfjssdmsmdkskm');
        res.json({ valid: true, decoded });
        return;
    }
    catch (error) {
        res.status(401).json({ valid: false, message: 'Invalid token' });
        return;
    }
}));
exports.userRouter.post('/reset-password/:id/:token', (0, express_async_handler_1.default)(async (req, res) => {
    const { id, token } = req.params;
    const { password, confirmPassword } = req.body;
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'ddlfjssdmsmdkskm', (error, decoded) => {
        if (error) {
            res.send({
                message: 'Error with token',
            });
            return;
        }
        else {
            if (password !== confirmPassword) {
                res.send({
                    message: 'Password Do Not Match',
                });
                return;
            }
            updateUserPassword(id, password)
                .then((status) => res.send({ Status: status }))
                .catch((error) => res.send({ Status: error }));
        }
    });
}));
exports.userRouter.post('/send-password', (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email) {
            res.status(400).send('Email Require');
            return;
        }
        if (!password) {
            res.status(400).send('Password Require');
            return;
        }
        const transporter = nodemailer_1.default.createTransport({
            service: process.env.NODEMAILER_SERVICE || 'gmail',
            host: process.env.NODEMAILER_HOST || 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.NODEMAILER_AUTH_USER || 'paiement.rpn@gmail.com',
                pass: process.env.NODEMAILER_AUTH_PASS || 'jgmw puwg usqi mcxk',
            },
        });
        const mailOptions = {
            from: process.env.NODEMAILER_AUTH_USER || 'paiement.rpn@gmail.com',
            to: email,
            subject: 'MON-RPN - Mot de passe',
            text: `
      Votre inscription sur notre plateforme MON-RPN
      s'est déroulée avec succès.

      Voici le mot de passe actuel pour vous
      connectez à votre compte:
      ${password}

      Vous pouvez modifier votre mot de passe à la
      page profile de votre plateforme MON-RPN à
      tout moment.

      Bienvenue chez vous,
      
      L'équipe MON-RPN.
      `,
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                res.status(500).send(`Erreur lors de l'envoi du mail`);
                return;
            }
            else {
                console.log(`Email envoyé: ${info.response}`);
                res.status(200).send('E-mail envoyé');
                return;
            }
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Erreur du serveur');
        return;
    }
}));
exports.userRouter.post('/new-user-notification', (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).send('Email Require');
            return;
        }
        const user = await userModel_1.UserModel.findOne({ 'register.email': email });
        if (!user) {
            res.status(404).send('Email Not Found');
            return;
        }
        const accountByUserId = await accountModel_1.AccountModel.findOne({
            userId: user?._id,
        });
        if (!accountByUserId) {
            res.status(404).send('Account Not Found');
            return;
        }
        const transporter = nodemailer_1.default.createTransport({
            service: process.env.NODEMAILER_SERVICE || 'gmail',
            host: process.env.NODEMAILER_HOST || 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.NODEMAILER_AUTH_USER || 'paiement.rpn@gmail.com',
                pass: process.env.NODEMAILER_AUTH_PASS || 'jgmw puwg usqi mcxk',
            },
        });
        const mailOptions = {
            from: process.env.NODEMAILER_AUTH_USER || 'paiement.rpn@gmail.com',
            to: 'djokojires@gmail.com',
            subject: 'Nouvelle Inscription',
            text: `Un nouvel utilisateur vient de s'inscrire sur votre plateforme MON-RPN. Voici ses informations: 
        Nom et Prénoms: ${user?.origines.lastName} ${user?.origines.firstName},
        Courriel: ${user?.register?.email},
        Pays d'origine: ${user?.origines.nativeCountry},
        Pays de résidence: ${user?.infos.residenceCountry},
        Numéro: ${user?.infos.tel},
        Méthode de paiement: ${accountByUserId?.paymentMethod},
        Solde: ${accountByUserId?.solde} $`,
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                res.status(500).send(`Erreur lors de l'envoi du mail`);
                return;
            }
            else {
                console.log(`Email envoyé: ${info.response}`);
                res.status(200).send('E-mail envoyé');
                return;
            }
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Erreur du serveur');
        return;
    }
}));
exports.userRouter.post('/forgot-password', (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel_1.UserModel.findOne({ 'register.email': email });
        if (user) {
            const token = (0, utils_1.generatePasswordToken)(email, user._id);
            const transporter = nodemailer_1.default.createTransport({
                service: process.env.NODEMAILER_SERVICE || 'gmail',
                host: process.env.NODEMAILER_HOST || 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.NODEMAILER_AUTH_USER || 'paiement.rpn@gmail.com',
                    pass: process.env.NODEMAILER_AUTH_PASS || 'jgmw puwg usqi mcxk',
                },
            });
            const mailOptions = {
                from: process.env.NODEMAILER_AUTH_USER,
                to: email,
                subject: 'Réinitialisation de mot de passe',
                text: `Cliquez sur le lien suivant pour réinitialiser votre mot de passe: http://localhost:5173/reset-password/${user._id}/${token}`,
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    res.status(500).send(`Erreur lors de l'envoi du mail`);
                    return;
                }
                else {
                    console.log(`Email envoyé: ${info.response}`);
                    res
                        .status(200)
                        .send('Consultez votre email pour obtenir des informations sur la réinitialisation de votre mot de passe.');
                    return;
                }
            });
            res.send({
                email,
                token: token,
            });
            return;
        }
        else {
            res.status(404).send('Email Introuvable');
            return;
        }
    }
    catch (error) {
        console.log(error);
    }
}));
exports.userRouter.post('/login', (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        const user = await userModel_1.UserModel.findOne({ 'register.email': email });
        if (user && bcryptjs_1.default.compareSync(password, user.register.password)) {
            res.send({
                ...user.toObject(),
                rememberMe: rememberMe,
                register: {
                    email: user.register.email,
                    conditions: user.register.conditions,
                },
                token: (0, utils_1.generateToken)(user),
            });
            return;
        }
        else {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
    }
    catch (error) {
        res.status(400).json(error);
        return;
    }
}));
exports.userRouter.post('/register', (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { register, origines, infos, rememberMe, isAdmin, cpdLng, referredBy, } = req.body;
        if (!register || !register.email || !register.password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        const existingUser = await userModel_1.UserModel.findOne({
            'register.email': register.email,
        });
        if (existingUser) {
            res.status(409).json({ message: `L'email existe déjà` });
            return;
        }
        const newUser = new userModel_1.UserModel({
            register: {
                ...register,
                password: bcryptjs_1.default.hashSync(register.password, 10),
            },
            origines,
            infos,
            rememberMe,
            isAdmin,
            cpdLng,
            referredBy,
        });
        const user = await newUser.save();
        res.send({
            ...user.toObject(),
            register: {
                email: user.register.email,
                conditions: user.register.conditions,
            },
            token: (0, utils_1.generateToken)(user),
        });
        return;
    }
    catch (error) {
        res.status(400).json({ message: 'Bad Request', error: error.message });
        return;
    }
}));
exports.userRouter.put('/:id', utils_1.isAuth, (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const user = await userModel_1.UserModel.findById(req.params.id);
        if (user) {
            Object.assign(user, req.body);
            const updatedUser = await user.save();
            res.send({
                message: 'User Updated',
                user: {
                    ...updatedUser.toObject(),
                    register: {
                        email: updatedUser.register.email,
                        conditions: updatedUser.register.conditions,
                    },
                    token: (0, utils_1.generateToken)(updatedUser),
                },
            });
            return;
        }
        else {
            res.status(404).send({
                message: 'User Not Found',
            });
            return;
        }
    }
    catch (error) {
        res.status(400).json(error);
        return;
    }
}));
exports.userRouter.get('/:referredBy/referral', utils_1.isAuth, (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const users = await userModel_1.UserModel.find({
            referredBy: req.params.referredBy,
        })
            .populate('referredBy', '_id origines.firstName origines.lastName')
            .sort({ createdAt: -1 });
        res.send(users);
        return;
    }
    catch (error) {
        res.status(400).json(error);
        return;
    }
}));
exports.userRouter.get('/all', utils_1.isAuth, utils_1.isAdmin, (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const users = await userModel_1.UserModel.find();
        const countUsers = await userModel_1.UserModel.countDocuments();
        res.send({
            users,
            countUsers,
        });
        return;
    }
    catch (error) {
        res.status(400).json(error);
        return;
    }
}));
exports.userRouter.get('/:id', utils_1.isAuth, (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const user = await userModel_1.UserModel.findById(req.params.id);
        if (user) {
            res.send(user);
            return;
        }
        else {
            res.status(404).send({ message: 'User Not Found' });
            return;
        }
    }
    catch (error) {
        res.status(400).json(error);
        return;
    }
}));
exports.userRouter.delete('/:id', utils_1.isAuth, (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const user = await userModel_1.UserModel.findById(req.params.id);
        if (user) {
            if (user.isAdmin) {
                res.status(400).send({
                    message: 'Can Not Delete Admin User',
                });
                return;
            }
            const deletedUser = await user?.deleteOne();
            res.send({
                message: 'User Deleted',
                user: deletedUser,
            });
            return;
        }
        else {
            res.status(404).send({
                message: 'User Not Found',
            });
            return;
        }
    }
    catch (error) {
        res.status(400).json(error);
        return;
    }
}));
