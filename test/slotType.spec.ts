import {parse} from "../typescript/parser";
import assert from "assert";


describe( 'slot types', () => {
  
  it( 'should support declaring a new slot type', () => {
    const [model, pc] = parse(`
SLOTTYPE HelloWords
  hi 
  hello
  howdy
    `);
    let types = model.slotTypes;
    assert.equal(Object.keys(types['HelloWords'].values).length, 3);
    for ( let v of ['hi', 'hello', 'howdy'] ) {
      assert.ok( v in types['HelloWords'].values );
    }
  });

  it( 'should support declaring a slot value with synonyms', () => {
    const [model, pc] = parse(`
SLOTTYPE HelloWords
  hi | hello | howdy 
    `);
    let types = model.slotTypes;
    assert.equal(Object.keys(types['HelloWords'].values).length, 1);
    let value = types['HelloWords'].values['hi'];
    assert.deepEqual( value.synonyms, ['hello', 'howdy'] );
  });

  
  
});