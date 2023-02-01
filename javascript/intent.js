"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Intent = exports.IntentSlotInfo = void 0;
const chalk_1 = __importDefault(require("chalk"));
const utterance_1 = require("./utterance");
/**
 * Metadata to describe the properties of a named slot within an intent
 */
class IntentSlotInfo {
    constructor(pc, name, type) {
        this.pc = pc;
        this.name = name;
        this.type = type;
        this.references = [];
        this.lineNumber = pc.lineNumber;
    }
    logSummary() {
        console.log(`  slot ${chalk_1.default.greenBright(this.name)} is ${chalk_1.default.cyan(this.type)}`);
    }
    toASKIntentSlot() {
        return {
            name: this.name,
            type: this.type
        };
    }
}
exports.IntentSlotInfo = IntentSlotInfo;
/**
 * An Intent is a single unit of recognition at Alexa,
 * containing a list of sample utterances, and descriptions
 * of slots used by them.
 */
class Intent {
    constructor(pc, model, name) {
        this.pc = pc;
        this.model = model;
        this.name = name;
        this.utterances = [];
        this.slotsTypes = {};
        this.fallbackSensitivity = "MEDIUM";
        this.utteranceLimit = 2000;
        this.lineNumber = pc.lineNumber;
    }
    countAllUtteranceVariations() {
        let sum = 0;
        this.utterances.forEach(u => sum += u.alternateCount);
        return sum;
    }
    addUtterance(line) {
        this.utterances.push(new utterance_1.Utterance(this.pc, this, line));
    }
    logSummary() {
        console.log(`INTENT ${chalk_1.default.cyan(this.name)}, ${this.countAllUtteranceVariations()} utterances`);
        for (let n in this.slotsTypes) {
            this.slotsTypes[n].logSummary();
        }
        for (let u of this.utterances) {
            u.logSummary();
        }
    }
    processCommand(line) {
        // commands are lines beginning with `+` that add information to an object
        // on a prior line
        // todo: 
        // * match a little more permissively to catch errors, 
        // * validate ASK requirements
        // Match: + slotName as slotType
        const slotTypeMatch = line.match(/(\w+)\s+as\s+([\w\.]+)/i);
        if (slotTypeMatch) {
            const name = slotTypeMatch[1];
            const type = slotTypeMatch[2];
            if (name in this.slotsTypes) {
                this.pc.error(`duplicate slot type definition ${name} for intent ${this.name}`);
                return;
            }
            this.slotsTypes[name] = new IntentSlotInfo(this.pc, name, type);
            return;
        }
        // Match: + fallback sensitivity medium
        const fallbackMatch = line.match(/fallback\s+sensitivity\s+(\w+)/);
        if (fallbackMatch) {
            if (this.name !== 'AMAZON.FallbackIntent') {
                this.pc.error(`fallback sensitivity only applies to AMAZON.FallbackIntent`);
                return;
            }
            const sensitivity = fallbackMatch[1].toUpperCase();
            if (["HIGH", "MEDIUM", "LOW"].indexOf(sensitivity) < 0) {
                this.pc.error(`unknown fallback sensitivity ${sensitivity}, must be LOW, MEDIUM or HIGH`);
                return;
            }
            this.fallbackSensitivity = sensitivity;
            return;
        }
        // Match: + utterance limit 1000
        const limitMatch = line.match(/utterance\s+limit\s+(\d+)/);
        if (limitMatch) {
            let limit = parseInt(limitMatch[1]);
            if (isNaN(limit)) {
                this.pc.error(`invalid number encountred in utterance limit statement`);
                return;
            }
            this.utteranceLimit = limit;
            return;
        }
        this.pc.error(`unknown command ${line}`);
    }
    validate(model) {
        if (this.utterances.length === 0) {
            // built in utterances are allowed to be empty, their definition 
            // comes from the ASK
            if (this.name.indexOf('AMAZON.') < 0) {
                this.pc.warnAt(this.lineNumber, `intent ${this.name} has no utterances`);
            }
        }
        for (let u of this.utterances) {
            u.validate(this);
        }
        for (let name in this.slotsTypes) {
            let slot = this.slotsTypes[name];
            if (!model.isValidSlotType(slot.type, this)) {
                this.pc.errorAt(slot.lineNumber, `unknown slot type ${slot.type}`);
            }
            if (slot.references.length === 0) {
                // an unused slot definition is sketchy, could be an indicator of a typo
                this.pc.warnAt(slot.lineNumber, `unused slot definition ${slot.name}`);
            }
        }
    }
    addSlotReference(utteranceSlot) {
        // called by utterances during parsing, to let the intent know what slots are used
        const name = utteranceSlot.name;
        const slot = this.slotsTypes[name];
        if (slot) {
            slot.references.push(utteranceSlot);
        }
        else {
            this.pc.errorAt(utteranceSlot.lineNumber, `slot ${utteranceSlot.name} is not defined in the intent`);
        }
    }
    getRandomSlotValue(slotName) {
        let slot = this.slotsTypes[slotName];
        if (!slot) {
            return "BADSLOT";
        }
        return this.model.getRandomSlotValue(slot.type);
    }
    generateUtterances() {
        let samples = [];
        for (let u of this.utterances) {
            samples = samples.concat(u.generateAll());
        }
        // in the case that we have more utterances than we want to upload to 
        // the ASK, we'll cut them down by selecting a subset randomly. 
        // we select randomly to preserve as much diversity in the samples
        // as possible.
        if (samples.length > this.utteranceLimit) {
            let all = samples;
            samples = [];
            let rnd = mulberry32(0);
            for (let i = 0; i < this.utteranceLimit; ++i) {
                let i = Math.floor(rnd() * all.length);
                samples.push(all[i]);
                all.splice(i, 1);
            }
        }
        return samples;
    }
    toASKIntent() {
        let res = {
            name: this.name,
            samples: this.generateUtterances()
        };
        let slots = [];
        for (let name in this.slotsTypes) {
            slots.push(this.slotsTypes[name].toASKIntentSlot());
        }
        if (slots.length > 0) {
            res.slots = slots;
        }
        return res;
    }
}
exports.Intent = Intent;
function mulberry32(a) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
