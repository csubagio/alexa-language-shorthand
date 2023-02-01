"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
const chalk_1 = __importDefault(require("chalk"));
const errorInvocationString = "You haven't set INVOCATION!";
/**
 * Model represents a single parsed language model file
 */
class Model {
    constructor(pc) {
        this.pc = pc;
        this.invocationName = "";
        this.slotTypes = {};
        this.intents = {};
    }
    addSlotType(slot) {
        if (slot.name in this.slotTypes) {
            this.pc.error(`double registering SLOTTYPE ${slot.name}, ignoring second definition`);
            return this.slotTypes[slot.name];
        }
        this.slotTypes[slot.name] = slot;
        return slot;
    }
    addIntent(intent) {
        if (intent.name in this.intents) {
            this.pc.error(`double registering INTENT ${intent.name}, ignoring second definition`);
            return this.intents[intent.name];
        }
        this.intents[intent.name] = intent;
        return intent;
    }
    /**
     * Logs a report of everything that was parsed from the input file
     * including things like the count of utterances generated
     */
    logSummary() {
        for (let name in this.slotTypes) {
            this.slotTypes[name].logSummary();
        }
        for (let name in this.intents) {
            this.intents[name].logSummary();
        }
        if (this.invocationName) {
            console.log(chalk_1.default.green(`*** invocation: ${this.invocationName} ***`));
        }
        else {
            console.log(chalk_1.default.red(`*** invocation: ${errorInvocationString} ***`));
        }
        console.log(chalk_1.default.green(`${Object.keys(this.slotTypes).length} slotType(s) ${Object.keys(this.intents).length} intent(s) ${this.countAllUtteranceVariations()} utterance(s)`));
    }
    validate() {
        for (let name in this.intents) {
            this.intents[name].validate(this);
        }
        for (let name in this.slotTypes) {
            const slot = this.slotTypes[name];
            slot.validate();
            if (slot.references.length === 0) {
                this.pc.warnAt(slot.lineNumber, `slot type ${slot.name} is not used by any intent`);
            }
        }
        // todo validate ASK limits
        // total size <= 1.5MB
        // intents count <= 250
        // slot types + intent count <= 350
        // per slot value / slot synonym character count <= 140
    }
    isValidSlotType(type, reference) {
        if (type.indexOf(`AMAZON.`) === 0) {
            // built in types are always OK
            return true;
        }
        if (type in this.slotTypes) {
            if (reference) {
                // when we call this during parsing, store a reference
                // to indicate that the slot type was used somewhere
                this.slotTypes[type].references.push(reference);
            }
            return true;
        }
        return false;
    }
    countAllUtteranceVariations() {
        let sum = 0;
        for (let name in this.intents) {
            sum += this.intents[name].countAllUtteranceVariations();
        }
        return sum;
    }
    getRandomSlotValue(slotTypeName) {
        if (slotTypeName === 'AMAZON.NUMBER') {
            return '' + Math.floor(Math.random() * 100);
        }
        const slot = this.slotTypes[slotTypeName];
        if (!slot) {
            return "BADTYPE";
        }
        return slot.getRandomValue();
    }
    toASKModel() {
        let model = {
            interactionModel: {
                languageModel: {
                    invocationName: this.invocationName || errorInvocationString,
                    intents: [],
                    types: [],
                }
            }
        };
        for (let i in this.intents) {
            model.interactionModel.languageModel.intents.push(this.intents[i].toASKIntent());
        }
        const requiredIntents = [
            'AMAZON.CancelIntent',
            'AMAZON.StopIntent',
            'AMAZON.HelpIntent',
        ];
        for (let name of requiredIntents) {
            if (!(name in this.intents)) {
                model.interactionModel.languageModel.intents.push({
                    name: name,
                    samples: []
                });
            }
        }
        for (let i in this.slotTypes) {
            model.interactionModel.languageModel.types.push(this.slotTypes[i].toASKSlotType());
        }
        return model;
    }
}
exports.Model = Model;
