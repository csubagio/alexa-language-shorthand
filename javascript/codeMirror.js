"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alsLang = exports.alsHighlightStyle = void 0;
const language_1 = require("@codemirror/language");
const highlight_1 = require("@lezer/highlight");
exports.alsHighlightStyle = language_1.HighlightStyle.define([
    { tag: highlight_1.tags.operator, color: "#080" },
    { tag: highlight_1.tags.brace, color: "#080", fontWeight: "bold" },
    { tag: highlight_1.tags.className, color: "#950" },
    { tag: highlight_1.tags.tagName, color: "#059" },
    { tag: highlight_1.tags.string, color: "#22F" },
    { tag: highlight_1.tags.keyword, color: "#539" },
    { tag: highlight_1.tags.comment, color: "#696", fontStyle: "italic" }
]);
var ParserThing;
(function (ParserThing) {
    ParserThing[ParserThing["none"] = 0] = "none";
    ParserThing[ParserThing["slot"] = 1] = "slot";
    ParserThing[ParserThing["slotType"] = 2] = "slotType";
    ParserThing[ParserThing["intent"] = 3] = "intent";
    ParserThing[ParserThing["invocation"] = 4] = "invocation";
})(ParserThing || (ParserThing = {}));
class ParserState {
    constructor() {
        this.thing = ParserThing.none;
    }
}
exports.alsLang = {
    name: 'als',
    startState: () => {
        return new ParserState();
    },
    token: (stream, state) => {
        if (stream.match("//")) {
            stream.skipToEnd();
            return "comment";
        }
        if (stream.eatSpace()) {
            return null;
        }
        let ch;
        switch (state.thing) {
            case ParserThing.slot:
                ch = stream.next();
                if (ch === '}') {
                    state.thing = ParserThing.none;
                    return "brace";
                }
                return "className";
            case ParserThing.slotType:
                stream.skipToEnd();
                state.thing = ParserThing.none;
                return "className";
            case ParserThing.invocation:
                stream.skipToEnd();
                state.thing = ParserThing.none;
                return "string";
            case ParserThing.intent:
                stream.skipToEnd();
                state.thing = ParserThing.none;
                return "tagName";
            case ParserThing.none:
            default:
                if (stream.match('SLOTTYPE')) {
                    state.thing = ParserThing.slotType;
                    return 'keyword';
                }
                if (stream.match('INTENT')) {
                    state.thing = ParserThing.intent;
                    return 'keyword';
                }
                if (stream.match('INVOCATION')) {
                    state.thing = ParserThing.invocation;
                    return 'keyword';
                }
                ch = stream.next();
                if (ch === '{') {
                    state.thing = ParserThing.slot;
                    return "brace";
                }
                if (ch && ch.match(/[\(\)]/)) {
                    return "brace";
                }
                if (ch && ch.match(/[+\|]/)) {
                    return "operator";
                }
                break;
        }
        return null;
    }
};
