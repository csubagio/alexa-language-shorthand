#! /usr/bin/env node

import chalk from "chalk";
import * as fs from "fs";
import {parse} from "./parser";

const inputExtension = '.als';

(function() {
  // last argument is filename
  const inputFilename = process.argv[2];
  if (!inputFilename) {
    console.error(chalk.red(`no filename specified. Usage should be:`));
    console.error(chalk.yellow(`alexa-language-shorthand filename.als`));
    return;
  } else {
    console.log(chalk.gray(`converting file: ${inputFilename}`));
  }
  
  if (inputFilename.indexOf(inputExtension) < 0) {
    console.error(`filename ${inputFilename} does not contain the extension '${inputExtension}'. Input files must have that extension.`);
    return;
  }

  const input = fs.readFileSync(inputFilename, 'utf8');

  const [model, parserContext] = parse(input);

  model.logSummary();
  parserContext.logErrors();
  parserContext.logWarnings();

  const outputFilename = inputFilename.replace(inputExtension,'.json');
  fs.writeFileSync(outputFilename, JSON.stringify(model.toASKModel(),null,4));  
  console.log(chalk.gray(`wrote output file: ${outputFilename}`));
})();