"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deathAnnouncementRouter = void 0;
const express_1 = __importDefault(require("express"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const utils_1 = require("../utils");
const deathAnnouncement_1 = require("../models/deathAnnouncement");
exports.deathAnnouncementRouter = express_1.default.Router();
exports.deathAnnouncementRouter.post('/new', utils_1.isAuth, utils_1.isAdmin, (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const newDeathAnnouncement = new deathAnnouncement_1.DeathAnnouncementModel(req.body);
        await newDeathAnnouncement.save();
        res.send(newDeathAnnouncement.toObject());
    }
    catch (error) {
        res.status(400).json(error);
    }
}));
exports.deathAnnouncementRouter.get('/all', 
//isAuth,
//isAdmin,
(0, express_async_handler_1.default)(async (req, res) => {
    try {
        const deathAnnouncements = await deathAnnouncement_1.DeathAnnouncementModel.find();
        res.send(deathAnnouncements.reverse());
    }
    catch (error) {
        res.status(400).json(error);
    }
}));
exports.deathAnnouncementRouter.put('/:id', 
//isAuth,
//isAdmin,
(0, express_async_handler_1.default)(async (req, res) => {
    try {
        const deathAnnouncement = await deathAnnouncement_1.DeathAnnouncementModel.findById(req.params.id);
        if (deathAnnouncement) {
            Object.assign(deathAnnouncement, req.body);
            const updatedDeathAnnouncement = deathAnnouncement.save();
            res.send({
                message: 'Announcement Updated',
                deathAnnouncement: updatedDeathAnnouncement,
            });
        }
    }
    catch (error) {
        res.status(400).json(error);
    }
}));
exports.deathAnnouncementRouter.get('/summary', (0, express_async_handler_1.default)(async (req, res) => {
    const deaths = await deathAnnouncement_1.DeathAnnouncementModel.aggregate([
        {
            $group: {
                _id: null,
                numDeaths: { $sum: 1 },
            },
        },
    ]);
    const date = new Date();
    const y = date.getFullYear();
    const m = date.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDate = new Date(y, m + 1, 0);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date();
    tomorrow.setUTCHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date();
    yesterday.setUTCHours(0, 0, 0, 0);
    yesterday.setDate(yesterday.getDate() - 1);
    const currentMonthPrevieww = await deathAnnouncement_1.DeathAnnouncementModel.aggregate([
        {
            $facet: {
                month: [
                    {
                        $match: {
                            createdAt: {
                                $gte: firstDay,
                                $lt: lastDate,
                            },
                        },
                    },
                    {
                        $group: {
                            _id: 'currentMonth',
                            totalDeaths: {
                                $sum: 1,
                            },
                        },
                    },
                ],
                today: [
                    {
                        $match: {
                            createdAt: {
                                $gte: today,
                                $lt: tomorrow,
                            },
                        },
                    },
                    {
                        $group: {
                            _id: 'today',
                            totalDeaths: {
                                $sum: 1,
                            },
                        },
                    },
                ],
                yesterday: [
                    {
                        $match: {
                            createdAt: {
                                $gte: yesterday,
                                $lt: today,
                            },
                        },
                    },
                    {
                        $group: {
                            _id: 'yesterday',
                            totalDeaths: {
                                $sum: 1,
                            },
                        },
                    },
                ],
            },
        },
    ]);
    const year = new Date().getFullYear();
    const yearfirstDay = new Date(year, 0, 1);
    const yearlastDay = new Date(year, 12, 0);
    const totalMonthly = await deathAnnouncement_1.DeathAnnouncementModel.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: yearfirstDay,
                    $lt: yearlastDay,
                },
            },
        },
        {
            $group: {
                _id: {
                    $month: '$createdAt',
                },
                totalDeaths: {
                    $sum: 1,
                },
            },
        },
        {
            $project: {
                x: '$_id',
                y: '$totalDeaths',
            },
        },
        {
            $sort: { _id: 1 },
        },
    ]).exec();
    res.send({
        totalMonthly,
        currentMonthPrevieww,
        deaths,
    });
}));
