import {parse} from "../typescript/parser";
import assert from "assert";
import fs from "fs";
import path from "path";

describe( 'parsing', () => {
  
  it( 'should ignore comments', () => {
    const [model, pc] = parse(`
INTENT hello // very imaginative intent name
  hello world // the standard dorky greeting
    `);
    let lines = model.intents['hello'].generateUtterances();
    assert.equal(lines[0], 'hello world');
  });
  
  it( 'should support text substitution in an utterance', () => {
    const [model, pc] = parse(`
$test = hello
INTENT hello
  $test world
    `);
    let lines = model.intents['hello'].generateUtterances();
    assert.equal(lines[0], 'hello world');
  });

  it ( 'should substitute values when generating samples', () => {
    const [model, pc] = parse(`
SLOTTYPE HelloWords
  hello

INTENT hello
  {word} world
  + word as HelloWords
    `);
    let samples = model.intents['hello'].utterances[0].generateSamples();
    assert.equal(samples[0], 'hello world');
  });
  
  it ( 'should parse the invocation name', () => {
    const [model, pc] = parse(`
INVOCATION hello new world
    `);
    assert.equal(model.invocationName, 'hello new world');
  });
  
  it ( 'should generate a valid ASK model from a non trivial input', () => {
    const input = fs.readFileSync( path.resolve(__dirname, 'skirmish.als') ,'utf-8' );
    const [model, pc] = parse(input);
    const ask = model.toASKModel();
    // not actually validating, just exercising the whole codepath
  });
  
});