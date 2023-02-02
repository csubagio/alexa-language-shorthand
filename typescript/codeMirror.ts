import {StreamParser, StringStream} from "@codemirror/language";
import {HighlightStyle} from "@codemirror/language"
import {tags} from "@lezer/highlight"

export const alsHighlightStyle = HighlightStyle.define([
  {tag: tags.operator, color: "#080"},
  {tag: tags.brace, color: "#080", fontWeight: "bold"},
  {tag: tags.className, color: "#950"},
  {tag: tags.tagName, color: "#059"},
  {tag: tags.string, color: "#22F"},
  {tag: tags.keyword, color: "#539"},
  {tag: tags.comment, color: "#696", fontStyle: "italic"}
])

enum ParserThing {
  none,
  slot,
  slotType,
  intent,
  invocation
}

class ParserState {
  thing = ParserThing.none;
}


export const alsLang: StreamParser<ParserState> = {
  name: 'als',
  
  startState: () => {
    return new ParserState();
  },
  
  token: (stream: StringStream, state: ParserState): string | null => {
    if (stream.match("//")) {
      stream.skipToEnd();
      return "comment";
    }
    
    if (stream.eatSpace()) {
      return null;
    }
    
    let ch;
    switch( state.thing ) {
      case ParserThing.slot:
        ch = stream.next();
        if ( ch === '}' ) {
          state.thing = ParserThing.none;
          return "brace";
        }
        return "className";

      case ParserThing.slotType:
        stream.skipToEnd();
        state.thing = ParserThing.none;
        return "className";
      
      case ParserThing.invocation:
        stream.skipToEnd();
        state.thing = ParserThing.none;
        return "string";

      case ParserThing.intent:
        stream.skipToEnd();
        state.thing = ParserThing.none;
        return "tagName";
  
      case ParserThing.none:
      default:
        if (stream.match('SLOTTYPE')) {
          state.thing = ParserThing.slotType;
          return 'keyword';
        } 

        if (stream.match('INTENT')) {
          state.thing = ParserThing.intent;
          return 'keyword';
        } 
        
        if (stream.match('INVOCATION')) {
          state.thing = ParserThing.invocation;
          return 'keyword';
        } 
      
        ch = stream.next();
        if ( ch === '{' ) {
          state.thing = ParserThing.slot;
          return "brace";
        }
        
        if ( ch && ch.match(/[\(\)]/) ) {
          return "brace";
        }

        if ( ch && ch.match(/[+\|]/) ) {
          return "operator";
        }

        break;
    }
    
    return null;
  }
};