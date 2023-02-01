#! /usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const parser_1 = require("./parser");
const inputExtension = '.als';
(function () {
    // last argument is filename
    const inputFilename = process.argv[2];
    if (!inputFilename) {
        console.error(chalk_1.default.red(`no filename specified. Usage should be:`));
        console.error(chalk_1.default.yellow(`alexa-language-shorthand filename.als`));
        return;
    }
    else {
        console.log(chalk_1.default.gray(`converting file: ${inputFilename}`));
    }
    if (inputFilename.indexOf(inputExtension) < 0) {
        console.error(`filename ${inputFilename} does not contain the extension '${inputExtension}'. Input files must have that extension.`);
        return;
    }
    const input = fs.readFileSync(inputFilename, 'utf8');
    const [model, parserContext] = (0, parser_1.parse)(input);
    model.logSummary();
    parserContext.logErrors();
    parserContext.logWarnings();
    const outputFilename = inputFilename.replace(inputExtension, '.json');
    fs.writeFileSync(outputFilename, JSON.stringify(model.toASKModel(), null, 4));
    console.log(chalk_1.default.gray(`wrote output file: ${outputFilename}`));
})();
