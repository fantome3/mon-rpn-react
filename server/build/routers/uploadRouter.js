"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const streamifier_1 = __importDefault(require("streamifier"));
const express_1 = __importDefault(require("express"));
exports.uploadRouter = express_1.default.Router();
const upload = (0, multer_1.default)();
exports.uploadRouter.post('/', upload.single('file'), async (req, res) => {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream((error, result) => {
                if (result) {
                    resolve(result);
                }
                else {
                    reject(error);
                }
            });
            if (!req.file)
                throw Error('req.file is null');
            streamifier_1.default.createReadStream(req.file.buffer).pipe(stream);
        });
    };
    const result = await streamUpload(req);
    res.send(result);
});
