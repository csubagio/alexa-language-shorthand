"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlotType = exports.SlotValue = void 0;
const chalk_1 = __importDefault(require("chalk"));
class SlotValue {
    constructor(line) {
        this.synonyms = [];
        // expect alternates to be separated by |
        let parts = line.split('|');
        this.name = parts[0].trim();
        for (let i = 1; i < parts.length; ++i) {
            let s = parts[i].trim();
            if (s) {
                this.synonyms.push(s);
            }
        }
    }
    logSummary() {
        if (this.synonyms.length > 0) {
            console.log(`    ${chalk_1.default.yellow(this.name)} or ${this.synonyms.join('/')}`);
        }
        else {
            console.log(`    ${chalk_1.default.yellow(this.name)}`);
        }
    }
    toAskSlotValue() {
        const res = {
            name: {
                value: this.name
            }
        };
        if (this.synonyms.length > 0) {
            res.name.synonyms = this.synonyms.slice(0);
        }
        return res;
    }
    getRandom() {
        if (this.synonyms.length === 0 || Math.random() * this.synonyms.length < 1) {
            return this.name;
        }
        let i = Math.floor(Math.random() * this.synonyms.length);
        return this.synonyms[i];
    }
}
exports.SlotValue = SlotValue;
class SlotType {
    constructor(pc, name) {
        this.pc = pc;
        this.name = name;
        this.values = {};
        this.references = [];
        this.lineNumber = pc.lineNumber;
    }
    addValue(line) {
        let value = new SlotValue(line);
        this.values[value.name] = value;
        return value;
    }
    logSummary() {
        console.log(`SLOT TYPE  ${chalk_1.default.cyan(this.name)}`);
        for (let name in this.values) {
            this.values[name].logSummary();
        }
    }
    processCommand(line) {
    }
    validate() {
        if (Object.keys(this.values).length === 0) {
            this.pc.errorAt(this.lineNumber, `slot type ${this.name} has no values`);
        }
    }
    getRandomValue() {
        const keys = Object.keys(this.values);
        if (keys.length === 0) {
            return "NOVALUE";
        }
        const i = Math.floor(Math.random() * keys.length);
        return this.values[keys[i]].getRandom();
    }
    toASKSlotType() {
        const res = {
            name: this.name,
            values: []
        };
        for (let name in this.values) {
            res.values.push(this.values[name].toAskSlotValue());
        }
        return res;
    }
}
exports.SlotType = SlotType;
