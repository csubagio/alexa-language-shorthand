"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtteranceSequence = void 0;
const uterranceAlternate_1 = require("./uterranceAlternate");
const utteranceSlot_1 = require("./utteranceSlot");
const utteranceText_1 = require("./utteranceText");
class UtteranceSequence {
    get isEmpty() { return this.parts.length === 0; }
    ;
    constructor(pc, intent, text) {
        this.pc = pc;
        this.intent = intent;
        this.parts = [];
        this.parsedText = "";
        if (text) {
            this.parse(text);
        }
    }
    pushText(text) {
        text = text.trim();
        if (text.length === 0) {
            return;
        }
        this.pushItem(new utteranceText_1.UtteranceText(text));
    }
    pushItem(item) {
        let last = this.parts[this.parts.length - 1];
        if (!(last instanceof uterranceAlternate_1.UtteranceAlternate)) {
            last = new uterranceAlternate_1.UtteranceAlternate(this.pc, this.intent);
            this.parts.push(last);
        }
        last.pushItem(item);
    }
    parse(text) {
        this.parsedText = text;
        text = text.trim();
        let head = 0;
        let depth = 0;
        /* scan through each character in this input, looking for
          features like alternation groups, alternates, and slots.
          To support recursion, we only recognize features at our
          level, and otherwise collect all characters to pass to our
          descendants.
        */
        for (let i = 0; i < text.length; ++i) {
            let c = text[i];
            if (depth === 0) {
                if (c === '{') {
                    this.pushText(text.substring(head, i));
                    head = i + 1;
                }
                if (c === '}') {
                    this.pushItem(new utteranceSlot_1.UtteranceSlot(this.pc, this.intent, text.substring(head, i)));
                    head = i + 1;
                }
            }
            if (c === '(') {
                if (depth === 0) {
                    if (head < i) {
                        this.pushText(text.substring(head, i));
                    }
                    head = i + 1;
                }
                depth++;
            }
            if (c === ')') {
                if (depth === 1) {
                    this.pushItem(new UtteranceSequence(this.pc, this.intent, text.substring(head, i)));
                    head = i + 1;
                }
                depth--;
            }
            if (c === '|') {
                if (depth === 0) {
                    this.pushText(text.substring(head, i));
                    head = i + 1;
                    let last = this.parts[this.parts.length - 1];
                    if (last instanceof uterranceAlternate_1.UtteranceAlternate) {
                        last.startAlternate();
                    }
                }
            }
        }
        if (head < text.length) {
            this.pushText(text.substring(head, text.length));
        }
    }
    trim() {
        this.parts = this.parts.map(p => p.trim());
        this.parts = this.parts.filter(p => !p.isEmpty);
        if (this.parts.length === 1) {
            return this.parts[0];
        }
        return this;
    }
    get alternateCount() {
        let count = 1;
        this.parts.forEach(p => count = count * p.alternateCount);
        return count;
    }
    logDebug(indent) {
        console.log(`${indent}SEQ ${this.parsedText} ${this.alternateCount}x`);
        this.parts.forEach(p => p.logDebug(indent + '. '));
    }
    summary() {
        return this.parts.map(p => p.summary()).join(' ');
    }
    pickRandom() {
        return this.parts.map(p => p.pickRandom()).join(' ');
    }
    generateUtterances(list) {
        this.parts.forEach(p => {
            list = p.generateUtterances(list);
        });
        return list;
    }
    generateSamples(list) {
        this.parts.forEach(p => {
            list = p.generateSamples(list);
        });
        return list;
    }
    validate(intent) {
        this.parts.forEach(p => p.validate(intent));
    }
    collectSlotNames(names) {
        this.parts.forEach(p => p.collectSlotNames(names));
    }
}
exports.UtteranceSequence = UtteranceSequence;
