import chalk from "chalk";
import {ASKModel} from "./askModel";
import {Intent} from "./intent";
import {ParserContext} from "./parserContext";
import * as requestParserTemplate from "./requestParser";
import {SlotType} from "./slotType";

const errorInvocationString = "You haven't set INVOCATION!";


/**
 * Model represents a single parsed language model file
 */
export class Model {
  invocationName = "";
  slotTypes: Record<string, SlotType> = {};
  intents: Record<string, Intent> = {};
  
  constructor( readonly pc: ParserContext ) {}
  
  addSlotType( slot: SlotType ) : SlotType {
    if ( slot.name in this.slotTypes ) {
      this.pc.error( `double registering SLOTTYPE ${slot.name}, ignoring second definition`);
      return this.slotTypes[slot.name];
    }
    this.slotTypes[slot.name] = slot;
    return slot;
  }
  
  addIntent( intent: Intent ) : Intent {
    if ( intent.name in this.intents ) {
      this.pc.error( `double registering INTENT ${intent.name}, ignoring second definition`);
      return this.intents[intent.name];
    }
    this.intents[intent.name] = intent;
    return intent;
  }

  /**
   * Logs a report of everything that was parsed from the input file
   * including things like the count of utterances generated
   */
  logSummary() {
    for ( let name in this.slotTypes ) {
      this.slotTypes[name].logSummary();
    }

    for ( let name in this.intents ) {
      this.intents[name].logSummary();
    }

    if ( this.invocationName ) {
      console.log(chalk.green(`*** invocation: ${this.invocationName} ***`));
    } else {
      console.log(chalk.red(`*** invocation: ${errorInvocationString} ***`));
    }

    console.log(chalk.green(`${Object.keys(this.slotTypes).length} slotType(s) ${Object.keys(this.intents).length} intent(s) ${this.countAllUtteranceVariations()} utterance(s)`));
  }
  
  validate() {
    for ( let name in this.intents ) {
      this.intents[name].validate(this);
    }
    
    for ( let name in this.slotTypes ) {
      const slot = this.slotTypes[name];
      slot.validate();
      if ( slot.references.length === 0 ) {
        this.pc.warnAt( slot.lineNumber, `slot type ${slot.name} is not used by any intent`);
      }
    }
    
    // todo validate ASK limits
    // total size <= 1.5MB
    // intents count <= 250
    // slot types + intent count <= 350
    // per slot value / slot synonym character count <= 140
  }
  
  isValidSlotType( type: string, reference?: Intent ) {
    if ( type.indexOf(`AMAZON.`) === 0 ) {
      // built in types are always OK
      return true;
    }
    
    if ( type in this.slotTypes ) {
      if ( reference ) {
        // when we call this during parsing, store a reference
        // to indicate that the slot type was used somewhere
        this.slotTypes[type].references.push( reference );
      }
      return true;
    }
    
    return false;
  }
  
  countAllUtteranceVariations() {
    let sum = 0;
    for ( let name in this.intents ) {
      sum += this.intents[name].countAllUtteranceVariations();
    }
    return sum;
  }
  
  getRandomSlotValue(slotTypeName: string): string {
    if ( slotTypeName === 'AMAZON.NUMBER' ) {
      // helpful to see a number substituted in here
      return '' + Math.floor( Math.random() * 100 );
    }
    
    if ( slotTypeName.indexOf('AMAZON.') === 0 ) {
      // can't know what should be in there, 
      // so we'll just abbreviate a bit for illustration
      return `{${slotTypeName.replace('AMAZON.','')}}`;
    }
    
    const slot = this.slotTypes[slotTypeName];
    if ( !slot ) {
      // this is likely an input error
      return "BADTYPE";
    }
    
    // grab any value from the slot type
    return slot.getRandomValue();
  }
  
  /**
   * Generates the Alexa interaction model JSON, suitable for pasting into
   * the developer portal, or inclusion in an ask-cli based project
   */
  toASKModel(): ASKModel {
    let model: ASKModel = {
      interactionModel: {
        languageModel: {
          invocationName: this.invocationName || errorInvocationString,
          intents: [],
          types: [],
        }
      }
    };
    
    for ( let i in this.intents ) {
      model.interactionModel.languageModel.intents.push( this.intents[i].toASKIntent() );
    }
    
    const requiredIntents = [
      'AMAZON.CancelIntent', 
      'AMAZON.StopIntent',
      'AMAZON.HelpIntent',
    ];
    
    for ( let name of requiredIntents ) {
      if ( !(name in this.intents) ) {
        model.interactionModel.languageModel.intents.push({
          name: name,
          samples: []
        });
      }
    }
    
    for ( let i in this.slotTypes ) {
      model.interactionModel.languageModel.types.push( this.slotTypes[i].toASKSlotType() );
    }
    
    return model;
  }
  
  /**
   * Generates a TypeScript file that exports interfaces based on the 
   * interaction model, along with a function to parse incoming requests
   */
  toTypeScript(): string {
    const file: string[] = [];

    // inject the boilerplate
    file.push( requestParserTemplate.pre + '\n' );
    
    // for each slot type we produce an enum 
    // and an dictionary of values for iteration
    for ( const slotTypeName in this.slotTypes ) {
      const values: Record<string, string[]> = {};
      const slotType = this.slotTypes[slotTypeName];
      file.push(`export enum ${slotTypeName} {`);
      for ( const valueName in slotType.values ) {
        const value = slotType.values[valueName];
        const enumName = value.name.replace(/\s/g, "_");
        file.push(`  ${enumName} = "${value.name}",`);
        values[value.name] = value.synonyms;
      }
      file.push(`}\n`);
      file.push(`export const ${slotTypeName}Values = ${JSON.stringify(values,null,2)};\n`);
    }
    
    // we'll collect an object to describe how to parse 
    // slots for the runtime parser
    const intentSlotMapping: string[] = [];

    // for each intent we produce a type
    const intentTypes: string[] = [];
    for ( const intentName in this.intents ) {
      const intent = this.intents[intentName];
      const typename = `${intentName}`.replace(/\./g, '_');
      const slotsTypename = `${typename}Slots`;
      const slotMapping: string[] = [];
      
      /*
      file.push(`interface ${slotsTypename} {`);
      for ( let slotName in intent.slotsTypes ) {
        const slotType = intent.slotsTypes[slotName];
        let type = slotType.type;
        if ( type.indexOf('AMAZON.') === 0 ) {
          // built-ins come in as generic strings
          type = 'string';
        } else {
          slotMapping.push(`    ${slotName}: ${type}Values`);
        }
        file.push(`  ${slotName}?: Slot<${type}>;`);
      }
      file.push(`}\n`);
      */

      intentTypes.push( typename );
      file.push(`export interface ${typename} {`);
      file.push(`  name: "${intentName}";`);
      file.push(`  request: ASK.Request;`);
      //file.push(`  slots: ${slotsTypename};`);
      file.push(`  slots: {`);

      for ( let slotName in intent.slotsTypes ) {
        const slotType = intent.slotsTypes[slotName];
        let type = slotType.type;
        if ( type.indexOf('AMAZON.') === 0 ) {
          // built-ins come in as generic strings
          type = 'string';
        } else {
          slotMapping.push(`    ${slotName}: ${type}Values`);
        }
        file.push(`    ${slotName}?: Slot<${type}>;`);
      }
      
      file.push(`  }`);
      
      file.push(`}\n`);


      if ( intentName.indexOf('AMAZON.') < 0 && slotMapping.length > 0 ) {
        let mapping: string[] = [];
        mapping.push(`  ${intentName}:{`);
        mapping.push(slotMapping.join(',\n'));
        mapping.push(`  }`);
        intentSlotMapping.push(mapping.join('\n'));
      }
    }
    
    // add a set of dummy types to indicate unrecognized input
    for ( const typename of ['_NotIntent', '_InvalidInput'] ) {
      intentTypes.push( typename );
      file.push(`interface ${typename} {`);
      file.push(`  name: "${typename}";`);
      file.push(`  request: ASK.Request;`);
      file.push(`  slots: Record<string,Slot<string>>;`);
      file.push(`}\n`);
    }
 
    // splice in the intent info at the end
    file.push('const intentSlotMapping: IntentSlotMapping = {');
    file.push( intentSlotMapping.join(',\n') );
    file.push('};\n');
    
    // then a union type to represent any of them
    // note: we can still end up returning unrecognized intents from 
    // the actual parsing function, but we intentionally omit that 
    // from the type definition so that auto complete functions 
    // expect us to pick from a fixed set of names.
    file.push( `type Intents = ${intentTypes.join(' | ')};\n`);
    
    file.push( requestParserTemplate.post );

    return file.join('\n');
  }
}