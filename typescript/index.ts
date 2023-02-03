#! /usr/bin/env node

import chalk from "chalk";
import * as fs from "fs";
import {parse} from "./parser";
import commandLineArgs from "command-line-args"; 
import commandLineUsage from "command-line-usage";

const optionDefinitions: commandLineArgs.OptionDefinition[] = [
  { name: 'inputFile', alias: 'i', type: String, multiple: true, defaultOption: true },
  { name: 'jsonOutput', alias: 'j', type: String, multiple: true },
  { name: 'typescriptOutput', alias: 't', type: String, multiple: true },
  { name: 'help', type: Boolean, alias: 'h' },
  { name: 'quiet', type: Boolean, alias: 'q' }
];

const helpSections: commandLineUsage.Section[] = [
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


function error(message: string) {
  console.error( chalk.red(`ERROR: ${message}`) );
}

function printHelp() {
  console.log( commandLineUsage(helpSections) );
}


const inputExtension = '.als';

let options;
try {
  options = commandLineArgs(optionDefinitions);
} catch (err: any) {
  console.error(chalk.red(err?.message || "unknown error"));
  printHelp();
  process.exit(-1);
}

const quiet: boolean = options.quiet;

function processSingleFile(inputFilename: string, outputJSON: string|undefined, outputTS: string|undefined ) {
  if ( !quiet ) {
    console.log(chalk.gray(`converting file: ${inputFilename}`));
  }
 
  let input: string = '';
  try {
    input = fs.readFileSync(inputFilename, 'utf8');
  } catch(err) {
    error(`failed to read input ${inputFilename}, ${err}`);
    process.exit(-1);
  }

  const [model, parserContext] = parse(input);

  if ( !quiet ) {
    model.logSummary();
    parserContext.logErrors();
    parserContext.logWarnings();
  }

  if ( outputJSON ) {
    fs.writeFileSync(outputJSON, JSON.stringify(model.toASKModel(),null,4));  
    if ( !quiet ) {
      console.log(chalk.gray(`wrote ask json model to: ${outputJSON}`));
    }
  }

  if ( outputTS ) {
    fs.writeFileSync(outputTS, model.toTypeScript());  
    if ( !quiet ) {
      console.log(chalk.gray(`wrote typescript model to: ${outputTS}`));
    }
  }
}



interface Job {
  input: string,
  model: string,
  ts: string
}

(function() {
  if ( options.help ) {
    console.log( commandLineUsage(helpSections) );
    process.exit(0);
  }
  
  if ( !options.inputFile ) {
    error(`no input found. You must specify one or more .als files with the -inputFiles option`);
    console.log( commandLineUsage(helpSections) );
    process.exit(-1);
  }

  let jobs: Job[] = [];
  for ( let inputIndex in options.inputFile ) {
    const name = options.inputFile[inputIndex];
    
    if ( !fs.existsSync(name) ) {
      error(`input ${name} does not appear to exist`);
      process.exit(-1);
    }
    
    if ( name.indexOf(inputExtension) < 0 ) {
      error(`input ${name} does not have the ${inputExtension} extension`);
      process.exit(-1);
    }
    
    // by default anything.als becomes anything.json
    let model = name.replace(inputExtension, '.json');
    
    // awkwardly there are occassions on which node module resolution
    // will pick anything.json instead of anything.ts when importing anything
    // so we'll make the typescript anythingModel.ts instead
    let ts = name.replace(inputExtension, 'Model.ts');
    
    if ( options.jsonOutput ) {
      model = options.jsonOutput[inputIndex];
      if ( !model ) {
        error(`jsonOutput is specified, but could not match output for input ${name}. Make sure you have the same number of jsonOutput arguments as you have input arguments`);
        process.exit(-1);
      }
    }

    if ( options.typescriptOutput ) {
      ts = options.typescriptOutput[inputIndex];
      if ( !ts ) {
        error(`typescriptOutput is specified, but could not match output for input ${name}. Make sure you have the same number of typescriptOutput arguments as you have input arguments`);
        process.exit(-1);
      }
    }

    jobs.push({
      input: name,
      model, ts
    })
  }
  
  for ( let job of jobs ) {
    processSingleFile(job.input, job.model, job.ts);
  }
})()

