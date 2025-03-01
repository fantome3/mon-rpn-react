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
exports.UserModel = exports.User = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const uuid_1 = require("uuid");
class Infos {
}
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Infos.prototype, "residenceCountry", void 0);
__decorate([
    (0, typegoose_1.prop)({
        required: true,
        enum: [
            'student',
            'worker',
            'canadian_citizen',
            'permanent_resident',
            'visitor',
        ],
    }),
    __metadata("design:type", String)
], Infos.prototype, "residenceCountryStatus", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Infos.prototype, "postalCode", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Infos.prototype, "address", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Infos.prototype, "tel", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Boolean)
], Infos.prototype, "hasInsurance", void 0);
class Origines {
}
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Origines.prototype, "firstName", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Origines.prototype, "lastName", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Date)
], Origines.prototype, "birthDate", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Origines.prototype, "nativeCountry", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Origines.prototype, "sex", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Origines.prototype, "id_image", void 0);
class Register {
}
__decorate([
    (0, typegoose_1.prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Register.prototype, "email", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Register.prototype, "password", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Register.prototype, "newPassword", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], Register.prototype, "conditions", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, enum: ['student', 'worker'] }),
    __metadata("design:type", String)
], Register.prototype, "occupation", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Register.prototype, "institution", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Register.prototype, "otherInstitution", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Register.prototype, "studentNumber", void 0);
__decorate([
    (0, typegoose_1.prop)({ enum: ['part-time', 'full-time'] }),
    __metadata("design:type", String)
], Register.prototype, "studentStatus", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Register.prototype, "workField", void 0);
class FamilyMember {
}
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], FamilyMember.prototype, "firstName", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], FamilyMember.prototype, "lastName", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], FamilyMember.prototype, "relationship", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, default: 'active' }),
    __metadata("design:type", String)
], FamilyMember.prototype, "status", void 0);
__decorate([
    (0, typegoose_1.prop)({
        required: true,
        enum: [
            'student',
            'worker',
            'canadian_citizen',
            'permanent_resident',
            'visitor',
        ],
    }),
    __metadata("design:type", String)
], FamilyMember.prototype, "residenceCountryStatus", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Date)
], FamilyMember.prototype, "birthDate", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], FamilyMember.prototype, "tel", void 0);
class Subscription {
}
__decorate([
    (0, typegoose_1.prop)({ required: true, default: Date.now }),
    __metadata("design:type", Date)
], Subscription.prototype, "startDate", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, default: 'registered' }),
    __metadata("design:type", String)
], Subscription.prototype, "status", void 0);
let User = class User {
};
exports.User = User;
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Register)
], User.prototype, "register", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Origines)
], User.prototype, "origines", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Infos)
], User.prototype, "infos", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "rememberMe", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isAdmin", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], User.prototype, "cpdLng", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "primaryMember", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, default: [] }),
    __metadata("design:type", Array)
], User.prototype, "familyMembers", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, default: new Subscription() }),
    __metadata("design:type", Subscription)
], User.prototype, "subscription", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: () => (0, uuid_1.v4)() }) // Generate unique UUID
    ,
    __metadata("design:type", String)
], User.prototype, "referralCode", void 0);
__decorate([
    (0, typegoose_1.prop)({ ref: User, required: false }) // Reference to another User document
    ,
    __metadata("design:type", Object)
], User.prototype, "referredBy", void 0);
exports.User = User = __decorate([
    (0, typegoose_1.modelOptions)({
        schemaOptions: { timestamps: true },
        options: {
            allowMixed: typegoose_1.Severity.ALLOW,
            customName: 'users',
        },
    })
], User);
exports.UserModel = (0, typegoose_1.getModelForClass)(User);
