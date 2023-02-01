"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtteranceText = void 0;
class UtteranceText {
    constructor(text) {
        this.text = text;
        this.text = text.trim();
    }
    get isEmpty() { return this.text.length === 0; }
    ;
    trim() {
        return this;
    }
    summary() {
        return this.text;
    }
    logDebug(indent) {
        console.log(`${indent}"${this.text}"`);
    }
    pickRandom() { return this.text; }
    get alternateCount() { return 1; }
    generateUtterances(list) {
        return list.map(s => s.concat([this.text]));
    }
    generateSamples(list) {
        return list.map(s => s.concat([this.text]));
    }
    validate(intent) { }
    collectSlotNames(names) { }
}
exports.UtteranceText = UtteranceText;
