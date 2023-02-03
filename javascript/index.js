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
const command_line_args_1 = __importDefault(require("command-line-args"));
const command_line_usage_1 = __importDefault(require("command-line-usage"));
const optionDefinitions = [
    { name: 'inputFile', alias: 'i', type: String, multiple: true, defaultOption: true },
    { name: 'jsonOutput', alias: 'j', type: String, multiple: true },
    { name: 'typescriptOutput', alias: 't', type: String, multiple: true },
    { name: 'help', type: Boolean, alias: 'h' },
    { name: 'quiet', type: Boolean, alias: 'q' }
];
const helpSections = [
    {
        header: `Alexa Language Shorthand`,
        content: `A compiler to convert Alexa Language Shorthand into a Alexa Skill Kit interaction model and a matching typescript file that describes each Intent as an interface`
    },
    {
        header: 'Options',
        optionList: [
            {
                name: 'inputFile',
                alias: 'i',
                multiple: true,
                defaultOption: true,
                typeLabel: "{underline path...}",
                description: `One or more .als files to compile.`
            },
            {
                name: 'jsonOutput',
                alias: 'j',
                multiple: true,
                typeLabel: "{underline path...}",
                description: `Explicit output .json filenames for each input .als file. If unspecified, this will default to writing adjacent to the input, substituting the .als extension for .json.`
            },
            {
                name: 'typescriptOutput',
                alias: 't',
                multiple: true,
                typeLabel: "{underline path...}",
                description: `Explicit output .ts filenames for each input .als file. If unspecified, this will default to writing adjacent to the input, substituting the .als extension for .ts.`
            },
            {
                name: 'help',
                alias: 'h',
                typeLabel: ' ',
                description: `Print this usage guide.`
            },
            {
                name: 'quiet',
                alias: 'q',
                typeLabel: ' ',
                description: `Reduce output to the console.`
            }
        ]
    },
    {
        content: `Project home: https://github.com/csubagio/alexa-language-shorthand\nInteractive sandbox: https://csubagio.github.io/alexa-language-shorthand/ `
    }
];
function error(message) {
    console.error(chalk_1.default.red(`ERROR: ${message}`));
}
function printHelp() {
    console.log((0, command_line_usage_1.default)(helpSections));
}
const inputExtension = '.als';
let options;
try {
    options = (0, command_line_args_1.default)(optionDefinitions);
}
catch (err) {
    console.error(chalk_1.default.red((err === null || err === void 0 ? void 0 : err.message) || "unknown error"));
    printHelp();
    process.exit(-1);
}
const quiet = options.quiet;
function processSingleFile(inputFilename, outputJSON, outputTS) {
    if (!quiet) {
        console.log(chalk_1.default.gray(`converting file: ${inputFilename}`));
    }
    let input = '';
    try {
        input = fs.readFileSync(inputFilename, 'utf8');
    }
    catch (err) {
        error(`failed to read input ${inputFilename}, ${err}`);
        process.exit(-1);
    }
    const [model, parserContext] = (0, parser_1.parse)(input);
    if (!quiet) {
        model.logSummary();
        parserContext.logErrors();
        parserContext.logWarnings();
    }
    if (outputJSON) {
        fs.writeFileSync(outputJSON, JSON.stringify(model.toASKModel(), null, 4));
        if (!quiet) {
            console.log(chalk_1.default.gray(`wrote ask json model to: ${outputJSON}`));
        }
    }
    if (outputTS) {
        fs.writeFileSync(outputTS, model.toTypeScript());
        if (!quiet) {
            console.log(chalk_1.default.gray(`wrote typescript model to: ${outputTS}`));
        }
    }
}
(function () {
    if (options.help) {
        console.log((0, command_line_usage_1.default)(helpSections));
        process.exit(0);
    }
    if (!options.inputFile) {
        error(`no input found. You must specify one or more .als files with the -inputFiles option`);
        console.log((0, command_line_usage_1.default)(helpSections));
        process.exit(-1);
    }
    let jobs = [];
    for (let inputIndex in options.inputFile) {
        const name = options.inputFile[inputIndex];
        if (!fs.existsSync(name)) {
            error(`input ${name} does not appear to exist`);
            process.exit(-1);
        }
        if (name.indexOf(inputExtension) < 0) {
            error(`input ${name} does not have the ${inputExtension} extension`);
            process.exit(-1);
        }
        // by default anything.als becomes anything.json
        let model = name.replace(inputExtension, '.json');
        // awkwardly there are occassions on which node module resolution
        // will pick anything.json instead of anything.ts when importing anything
        // so we'll make the typescript anythingModel.ts instead
        let ts = name.replace(inputExtension, 'Model.ts');
        if (options.jsonOutput) {
            model = options.jsonOutput[inputIndex];
            if (!model) {
                error(`jsonOutput is specified, but could not match output for input ${name}. Make sure you have the same number of jsonOutput arguments as you have input arguments`);
                process.exit(-1);
            }
        }
        if (options.typescriptOutput) {
            ts = options.typescriptOutput[inputIndex];
            if (!ts) {
                error(`typescriptOutput is specified, but could not match output for input ${name}. Make sure you have the same number of typescriptOutput arguments as you have input arguments`);
                process.exit(-1);
            }
        }
        jobs.push({
            input: name,
            model, ts
        });
    }
    for (let job of jobs) {
        processSingleFile(job.input, job.model, job.ts);
    }
})();
