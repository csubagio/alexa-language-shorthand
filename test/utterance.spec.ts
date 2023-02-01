import assert, {equal} from "assert";
import {Intent} from "../typescript/intent";
import {Model} from "../typescript/model";
import {ParserContext} from "../typescript/parserContext";
import {Utterance} from "../typescript/utterance";

function preamble(): [ParserContext, Intent] {
  const pc = new ParserContext();
  const model = new Model(pc);
  const intent = new Intent(pc, model, "testIntent");
  return [pc, intent];
}

function validateOutput(input: string, outputs: string[], expectedSlots?: string[]) { 
  const [pc, intent] = preamble();
  const utterance = new Utterance(pc,intent,input);
  
  equal(utterance.alternateCount, outputs.length);
  const generated = utterance.generateAll();
  for ( let i=0; i<outputs.length; ++i ) {
    equal(generated[i], outputs[i]);
  }
  
  if ( expectedSlots ) {
    const slots: Record<string,number> = {};
    utterance.root.collectSlotNames(slots);
    equal( Object.keys(slots).length, expectedSlots?.length );
    for ( let name of expectedSlots ) {
      assert.ok( name in slots );
    }
  }
}

describe('utterance', () => {
  it( 'should parse a simple text utterance', () => {
    validateOutput('hello world', ['hello world']);
  })
  
  it ( 'should generate top level alternation', () => {
    validateOutput('hello|hi', ['hello', 'hi']);
  })
  
  it ( 'should generate a bracketed alternation', () => {
    validateOutput('(hello|hi)', ['hello', 'hi']);
  })

  it ( 'should mix top level text with alternation', () => {
    validateOutput('hello (mr|mrs) person', ['hello mr person', 'hello mrs person']);
  })

  it ( 'should support empty alternates', () => {
    validateOutput('hello (mr|mrs|) person', ['hello mr person', 'hello mrs person', 'hello person']);
  })

  it ( 'should support multiple alternations', () => {
    validateOutput('(I|we) (would like|want) a potato', 
    [
      'I would like a potato', 
      'we would like a potato',
      'I want a potato', 
      'we want a potato'
    ]);
  })
  
  it ( 'should support nested alternation', () => {
    validateOutput('a (b (c|d) | e)', [
      'a b c',
      'a b d',
      'a e'
    ]);
  })
  
  it ( 'should support specifying a slot', () => {
    validateOutput(`I want {count} potatoes`, [`I want {count} potatoes`], ['count']);
  })
  
  it ( 'should support specifying multiple slots', () => {
    validateOutput(`I want {count} {quality} potatoes`, 
      [`I want {count} {quality} potatoes`], 
      ['count', 'quality']
    );
  })

  it ( 'should support slots in alternation', () => {
    validateOutput(`I want ({count}{quality}|{count}|{quality}) potatoes`, 
      [
        `I want {count} {quality} potatoes`,
        `I want {count} potatoes`,
        `I want {quality} potatoes`,
      ], 
      ['count', 'quality']
    );
  })
  
}); 