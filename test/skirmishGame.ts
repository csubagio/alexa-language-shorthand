/**
 * Sample code of how to use a typescript file generated
 * by Alexa Language Shorthand. 
 */

import * as ASK from 'ask-sdk-model';
import * as skirmish from './skirmishModel';

export function handle( req: ASK.Request ) {
  // we can feed any Alexa request into the function
  let intent = skirmish.parseAlexaRequest(req);

  // we'll always be able to switch on name, including for errors
  switch (intent.name) {
    // auto complete should help fill these names in
    case "moveUnit": 
      // the switch statement constrained the type here
      // so the slots member should auto complete with 
      // the expected names.
      console.log(`moving: ${intent.slots.count} units`);

      // slots may be absent, the compiler enforces a null check
      if ( intent.slots.source ) {
        // the raw value is the top level slot value reported
        // by the intent, irrespective of whether that value
        // was specified in your language model. May be undefined.
        console.log(`the raw count slot is ${intent.slots.source.raw}`);

        // in the case of a slot that uses a built in type, 
        // the value field is a typed enum, or undefined.
        // for built-in types, this is a string or undefined.
        let location = intent.slots.source.value;
        switch (location) {
          case skirmish.Location.appleham:
            // valid values are defined in the enum, so the compiler 
            // can check this switch statement for invalid ones
            break;
            
          default: 
            // value won't hold anything that isn't 
            // a known value, so getting here means it's undefined. 
            // We can work with the raw value if we need to
            console.error(`unrecognized source location: ${intent.slots.source.raw}`);
        }

        // we can dig all the way into the original slot
        // and work with that instead
        const slot = intent.slots.source.slot;
        if ( slot.confirmationStatus === 'CONFIRMED' ) {
          // confirmed!
        }
        
        slot.resolutions?.resolutionsPerAuthority?.forEach( (authority) => {
          if (authority.authority.includes('amzn1.er-authority.echo-sdk.dynamic')) {
            // fish out dynamic entity matches
          }
        });
      }
      
      if ( intent.slots.count?.value ) {
        // if we expect a number, we can call the numeric helper 
        // in the event that the value is not a valid number
        // we'll get an undefined instead.
        let count = intent.slots.count.asNumber();
        
        if ( count !== undefined ) {
          // explicitly a numeric value here
        }
      }
      
      // the following would be a compile error as it's
      // not expected to be a member of the moveUnit intent 
      // console.log(`moving: ${intent.slots.flavor} units`);

      break;
      
    // the following should be a compile error as it is not
    // one of the known intent names
    // case "notAnIntent": break;
      
    default:
      // shouldn't get here if our model is comprehensive
      // but we can still write code to report on this 
      console.error(`encountered unknown intent ${intent.name}`);
      
      // note, the full original request is also in intent.request if needed
  }
}