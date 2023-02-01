import chalk from "chalk";
import {ASKModel} from "./askModel";
import {Intent} from "./intent";
import {ParserContext} from "./parserContext";
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

    console.log(chalk.green(`${Object.keys(this.slotTypes).length} slotTypes ${Object.keys(this.intents).length} intents ${this.countAllUtteranceVariations()} utterances`));
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
      return '' + Math.floor( Math.random() * 100 );
    }
    
    const slot = this.slotTypes[slotTypeName];
    if ( !slot ) {
      return "BADTYPE";
    }
    return slot.getRandomValue();
  }
  
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
}