"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountRouter = void 0;
const express_1 = __importDefault(require("express"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const accountModel_1 = require("../models/accountModel");
const utils_1 = require("../utils");
exports.accountRouter = express_1.default.Router();
exports.accountRouter.post('/new', (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const newAccount = new accountModel_1.AccountModel(req.body);
        await newAccount.save();
        res.send(newAccount.toObject());
    }
    catch (error) {
        res.status(400).json(error);
    }
}));
exports.accountRouter.get('/all', 
//isAuth,
//isAdmin,
(0, express_async_handler_1.default)(async (req, res) => {
    try {
        const accounts = await accountModel_1.AccountModel.find();
        res.send(accounts);
    }
    catch (error) {
        res.status(400).json(error);
    }
}));
exports.accountRouter.get('/:userId/all', 
//isAuth,
//isAdmin,
(0, express_async_handler_1.default)(async (req, res) => {
    try {
        const accountsByUserId = await accountModel_1.AccountModel.find({
            userId: req.params.userId,
        })
            .populate('userId', '_id infos origines')
            .exec();
        res.send(accountsByUserId);
    }
    catch (error) {
        res.status(400).json(error);
    }
}));
exports.accountRouter.put('/:id', utils_1.isAuth, 
//isAdmin,
(0, express_async_handler_1.default)(async (req, res) => {
    try {
        const account = await accountModel_1.AccountModel.findById(req.params.id);
        if (account) {
            Object.assign(account, req.body);
            const updatedAccount = await account.save();
            res.send({
                message: 'Accound Updated',
                account: updatedAccount,
            });
        }
        else {
            res.status(404).send({
                message: 'Account Not Found',
            });
        }
    }
    catch (error) {
        res.status(400).json(error);
    }
}));
exports.accountRouter.get('/:id', utils_1.isAuth, (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const account = await accountModel_1.AccountModel.findById(req.params.id);
        if (account) {
            res.send(account);
        }
        else {
            res.status(404).send({
                message: 'Account Not Found',
            });
        }
    }
    catch (error) {
        res.status(400).json(error);
    }
}));
