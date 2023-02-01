"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserContext = void 0;
const chalk_1 = __importDefault(require("chalk"));
class LineText {
    constructor(lineNumber, text) {
        this.lineNumber = lineNumber;
        this.text = text;
    }
}
function logList(list, color, singular, plural) {
    if (list.length === 0) {
        console.log(chalk_1.default.green(`0 ${plural}!`));
        return;
    }
    if (list.length > 1) {
        console.log(color(`${list.length} ${plural} :(`));
    }
    else {
        console.log(color(`1 ${singular} :(`));
    }
    list.sort((a, b) => b.lineNumber - a.lineNumber);
    list.forEach(l => console.error(color(`[${l.lineNumber + 1}] ${l.text}`)));
}
class ParserContext {
    constructor() {
        this.lineNumber = 0;
        this.errors = [];
        this.warnings = [];
    }
    error(text) {
        this.errors.push(new LineText(this.lineNumber, text));
    }
    errorAt(lineNumber, text) {
        this.errors.push(new LineText(lineNumber, text));
    }
    warn(text) {
        this.warnings.push(new LineText(this.lineNumber, text));
    }
    warnAt(lineNumber, text) {
        this.warnings.push(new LineText(lineNumber, text));
    }
    logErrors() {
        logList(this.errors, chalk_1.default.red, 'error', 'errors');
    }
    logWarnings() {
        logList(this.warnings, chalk_1.default.magenta, 'warning', 'warnings');
    }
}
exports.ParserContext = ParserContext;
