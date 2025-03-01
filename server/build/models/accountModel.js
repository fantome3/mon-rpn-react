"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountModel = exports.Account = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const userModel_1 = require("./userModel");
class Interac {
}
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Number)
], Interac.prototype, "amountInterac", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Interac.prototype, "refInterac", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Interac.prototype, "dateInterac", void 0);
class Card {
}
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Card.prototype, "network", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Card.prototype, "cvv", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Card.prototype, "expiry_date", void 0);
__decorate([
    (0, typegoose_1.prop)({}),
    __metadata("design:type", String)
], Card.prototype, "card_holder_name", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Card.prototype, "credit_card_number", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Card.prototype, "dateCard", void 0);
let Account = class Account {
};
exports.Account = Account;
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Number)
], Account.prototype, "solde", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Account.prototype, "paymentMethod", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: () => [Card], default: [] }),
    __metadata("design:type", Array)
], Account.prototype, "card", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: () => Interac, default: [] }),
    __metadata("design:type", Array)
], Account.prototype, "interac", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Account.prototype, "firstName", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Account.prototype, "userTel", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Account.prototype, "userResidenceCountry", void 0);
__decorate([
    (0, typegoose_1.prop)({ ref: userModel_1.User, required: false }),
    __metadata("design:type", Object)
], Account.prototype, "userId", void 0);
exports.Account = Account = __decorate([
    (0, typegoose_1.modelOptions)({
        schemaOptions: { timestamps: true },
    })
], Account);
exports.AccountModel = (0, typegoose_1.getModelForClass)(Account);
