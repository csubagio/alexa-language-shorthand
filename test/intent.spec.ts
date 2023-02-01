import {parse} from "../typescript/parser";
import assert from "assert";


describe( 'intent', () => {
  
  it( 'should limit the total number of utterances for an intent', () => {
    const [model, pc] = parse(`
INTENT hello
  (a|b|c|d|e) (a|b|c|d|e)
  (k|l|m) (x|y|z)
  + utterance limit 5
    `);
    let lines = model.intents['hello'].generateUtterances();
    assert.equal(lines.length, 5);
  });
  
  it( 'should specify slot types', () => {
    const [model, pc] = parse(`
INTENT hello
  {greetings} {adjective} world
  + greetings as GreetingsType
  + adjective as AdjectiveType
    `);
    let intent = model.intents['hello'];
    assert.equal( intent.slotsTypes['greetings'].type, "GreetingsType" );
    assert.equal( intent.slotsTypes['adjective'].type, "AdjectiveType" );
  });
  
});