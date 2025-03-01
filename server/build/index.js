"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const userRouter_1 = require("./routers/userRouter");
const accountRouter_1 = require("./routers/accountRouter");
const deathAnnoucementRouter_1 = require("./routers/deathAnnoucementRouter");
const uploadRouter_1 = require("./routers/uploadRouter");
dotenv.config();
mongoose_1.default.set('strictQuery', true);
const MONGODB_URI = process.env.MONGODB_URI ||
    'mongodb+srv://mory:mory@cluster0.hpxrt.mongodb.net/monrpn';
mongoose_1.default
    .connect(MONGODB_URI)
    .then(() => {
    console.log('Connected to MongoDB');
})
    .catch(() => {
    console.log('Error MongoDB');
});
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    credentials: true,
    origin: ['http://localhost:5173'],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/users', userRouter_1.userRouter);
app.use('/api/accounts', accountRouter_1.accountRouter);
app.use('/api/announcements', deathAnnoucementRouter_1.deathAnnouncementRouter);
app.use('/api/upload', uploadRouter_1.uploadRouter);
app.use(express_1.default.static(path_1.default.join(__dirname, '../dist')));
app.get('*', (req, res) => res.sendFile(path_1.default.join(__dirname, '../dist/index.html')));
const PORT = parseInt((process.env.PORT || '5010'), 10);
app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
