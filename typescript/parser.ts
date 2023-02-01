import {Intent} from "./intent";
import {Model} from "./model";
import {ParserContext} from "./parserContext";
import {SlotType} from "./slotType";

type ParsingItemType = Intent | SlotType | undefined;

class IndentTracker {
  constructor(
    public prefix: number,
    public item: ParsingItemType 
  ){}
}

class Substition {
  test: RegExp;
  constructor( public name: string, public contents: string ) {
    this.test = new RegExp(`\\${name}`);
  }
  
  process( line: string ): string {
    return line.replace(this.test, this.contents);
  }
}


/**
 * Main parser function, takes in plain text from an .als and
 * produces a model. Also returns the parser context object, which 
 * contains any warnings or errors found while parsing.
 */
export function parse( input: string ): [Model, ParserContext] {
  // this grammar works on a line by line basis
  const inputLines = input.split('\n');

  // keep track of what object is present at each indentation level
  let indentStack: IndentTracker[] = [ new IndentTracker(0, undefined) ];

  const pc = new ParserContext;
  const model = new Model(pc);

  function getPrefix( line: string ): number {
    const match = line.match(/^\s+/);
    if ( !match ) {
      return 0;
    }
    return match[0].length;
  }

  // keep track of all $ substitutions defined
  const substitutions: Substition[] = [];
  
  for ( pc.lineNumber = 0; pc.lineNumber<inputLines.length; ++pc.lineNumber ) {
    let line = inputLines[pc.lineNumber];

    // comments are to end of line
    let commentPos = line.indexOf('//');
    if ( commentPos >= 0 ) {
      line = line.substring(0, commentPos);
    } 

    // apply all known substitutions
    substitutions.forEach( s => line = s.process(line) );
    // todo: check if there are any unsubstituted $ tokens
    
    // check to see there's any relevant remaining content
    const trimmedLine = line.trim();
    if ( trimmedLine.length === 0 ) {
      continue;
    }
    
    const prefix = getPrefix(line);
    const words = line.trim().split(/\s+/);
    
    if ( prefix > indentStack[indentStack.length-1].prefix ) {
      indentStack.push( new IndentTracker(prefix, undefined) );
    } 
    
    while ( indentStack.length > 1 && prefix < indentStack[indentStack.length-1].prefix ) {
      indentStack.pop();
    }

    if ( prefix !== indentStack[indentStack.length-1].prefix ) {
      pc.error(`white space mismatch, cannot match any previous indentation level, ignoring line`);
      continue;
    }
    
    const parentIndent = indentStack[indentStack.length-2];
    const currentIndent = indentStack[indentStack.length-1];
    
    // lines that begin with a $ are always a substitution definition
    if ( trimmedLine[0] === '$' ) {
      const match = trimmedLine.match( /(\$\w+)\s*=\s*(.*)\s*/ );
      if ( match ) {
        substitutions.push( new Substition(match[1], match[2].trim()) );
      } else {
        pc.error(`could not determine name and contents for substitution. Name must be alpha numeric characters only, declaration should be in the form $yourName = any content you like`);
      }
      continue;
    }
    
    // for most of the rest of the lines, the first token determines what to do
    switch ( words[0] ) {
      case 'INVOCATION': 
        model.invocationName = line.substring( currentIndent.prefix + words[0].length ).trim(); 
      break;
      
      case 'SLOTTYPE':
        if ( words.length > 2 ) {
          pc.error(`Too many words, SLOTTYPE name may not have any spaces in it, igoring everything after ${words[1]}`);
        }
        currentIndent.item = model.addSlotType( new SlotType(pc, words[1]) ); 
      break;
      
      case 'INTENT':
        currentIndent.item = model.addIntent( new Intent(pc, model, words[1]) );
      break;
      
      case '+':
        // this is a "command" and is passed to the object in the parent indentation
        if ( parentIndent.item ) {
          parentIndent.item.processCommand( line.substring(currentIndent.prefix + 1).trim() );
        } else {
          pc.error(`no parent item to apply this command to`);
        }
      break;
      
      default: 
        // handling of remaining input varies depending on current thing
        if ( !parentIndent ) {
          // nothing to apply this to?
          pc.error(`cannot find anything to apply this line to. Is the indentation correct?`);
          continue;
        }
        if ( parentIndent.item instanceof SlotType ) {
          parentIndent.item.addValue(line);
        }
        if ( parentIndent.item instanceof Intent ) {
          parentIndent.item.addUtterance(line);
        }
      break;  
    }
  }

  model.validate();
  
  return [model, pc];
}