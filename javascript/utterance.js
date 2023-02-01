"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utterance = void 0;
const utteranceSequence_1 = require("./utteranceSequence");
class Utterance {
    constructor(pc, intent, line) {
        this.pc = pc;
        this.intent = intent;
        this.line = line;
        this.root = new utteranceSequence_1.UtteranceSequence(this.pc, intent, line);
        this.root = this.root.trim();
        //this.logDebug();
    }
    logDebug() {
        console.log(`utterance: ${this.root.summary()}`);
        this.root.logDebug("  ");
    }
    logSummary() {
        if (this.alternateCount > 1) {
            console.log(`  ${this.root.summary()} (x${this.alternateCount})`);
        }
        else {
            console.log(`  ${this.root.summary()}`);
        }
        if (this.alternateCount > 1) {
            for (let alt of shuffle(this.generateSamples()).slice(0, 5)) {
                console.log(`    e.g. ${alt}`);
            }
        }
    }
    get alternateCount() { return this.root.alternateCount; }
    generateAll() {
        let res = this.root.generateUtterances([[]]);
        return res.map(r => r.join(' '));
    }
    generateSamples() {
        let res = this.root.generateSamples([[]]);
        return res.map(r => r.join(' '));
    }
    pickRandom() {
        return this.root.pickRandom();
    }
    validate(intent) {
        this.root.validate(intent);
    }
}
exports.Utterance = Utterance;
function shuffle(arr) {
    for (let i = 0; i < arr.length; ++i) {
        for (let j = 1; j < arr.length; ++j) {
            if (Math.random() > 0.5) {
                let v = arr[i];
                arr[i] = arr[j];
                arr[j] = v;
            }
        }
    }
    return arr;
}
