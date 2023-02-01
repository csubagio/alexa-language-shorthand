"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtteranceSlot = void 0;
const chalk_1 = __importDefault(require("chalk"));
class UtteranceSlot {
    constructor(pc, intent, name) {
        this.pc = pc;
        this.intent = intent;
        this.name = name;
        this.lineNumber = pc.lineNumber;
        this.name = this.name.trim();
    }
    summary() { return chalk_1.default.greenBright(`{${this.name}}`); }
    get isEmpty() { return this.name.length === 0; }
    trim() { return this; }
    logDebug(indent) {
        console.log(`${indent}{${this.name}}`);
    }
    pickRandom() { return `{${this.name}}`; }
    get alternateCount() { return 1; }
    generateUtterances(list) {
        return list.map(s => s.concat([`{${this.name}}`]));
    }
    generateSamples(list) {
        return list.map(s => s.concat([this.intent.getRandomSlotValue(this.name)]));
    }
    validate(intent) {
        intent.addSlotReference(this);
    }
    collectSlotNames(names) {
        if (!(this.name in names)) {
            names[this.name] = 0;
        }
        names[this.name]++;
    }
}
exports.UtteranceSlot = UtteranceSlot;
