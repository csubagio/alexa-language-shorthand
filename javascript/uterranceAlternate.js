"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtteranceAlternate = void 0;
const utteranceSequence_1 = require("./utteranceSequence");
class UtteranceAlternate {
    constructor(pc, intent) {
        this.pc = pc;
        this.intent = intent;
        this.alternates = [];
    }
    get isEmpty() { return this.alternates.length === 0; }
    ;
    trim() {
        this.alternates = this.alternates.map(a => a.trim());
        // we never drop empty alternates, they're syntactically intentional
        //this.alternates = this.alternates.filter( a => !a.isEmpty );
        if (this.alternates.length === 1) {
            return this.alternates[0];
        }
        return this;
    }
    pushItem(item) {
        let last = this.alternates[this.alternates.length - 1];
        if (!last || !(last instanceof utteranceSequence_1.UtteranceSequence)) {
            last = new utteranceSequence_1.UtteranceSequence(this.pc, this.intent);
            this.alternates.push(last);
        }
        last.parts.push(item);
    }
    startAlternate() {
        this.alternates.push(new utteranceSequence_1.UtteranceSequence(this.pc, this.intent));
    }
    summary() {
        if (this.alternates.length != 1) {
            return '(' + this.alternates.map(a => a.summary()).join('|') + ')';
        }
        else {
            return this.alternates[0].summary();
        }
    }
    logDebug(indent) {
        console.log(`${indent}ALT ${this.alternateCount}x`);
        for (let alt of this.alternates) {
            alt.logDebug(indent + "+ ");
        }
    }
    pickRandom() {
        let i = Math.floor(Math.random() * this.alternates.length);
        return this.alternates[i].pickRandom();
    }
    get alternateCount() {
        let count = 0;
        this.alternates.forEach(a => count += a.alternateCount);
        return count;
    }
    generateUtterances(list) {
        let res = [];
        for (let a of this.alternates) {
            res = res.concat(a.generateUtterances(list));
        }
        return res;
    }
    generateSamples(list) {
        let res = [];
        for (let a of this.alternates) {
            res = res.concat(a.generateSamples(list));
        }
        return res;
    }
    validate(intent) {
        for (let a of this.alternates) {
            a.validate(intent);
        }
    }
    collectSlotNames(names) {
        this.alternates.forEach(a => a.collectSlotNames(names));
    }
}
exports.UtteranceAlternate = UtteranceAlternate;
