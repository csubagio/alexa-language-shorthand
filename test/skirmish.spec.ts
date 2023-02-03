/**
 * Tests to validate the generated typescript model 
 */

import * as ASK from 'ask-sdk-model';
import assert from 'assert';
import * as skirmish from './skirmishModel';

function requestWithIntent( name: string, slots: Record<string, string|string[]> ): ASK.IntentRequest {
  const reqSlots: Record<string, ASK.Slot> = {};

  const req: ASK.IntentRequest = {
    type: "IntentRequest",
    requestId: "some-request-id",
    timestamp: (new Date).toUTCString(),
    dialogState: "COMPLETED",
    intent: {
      name: name,
      slots: reqSlots,
      confirmationStatus: "NONE"
    }
  }

  for ( const slotName in slots ) {
    let slot: ASK.Slot = reqSlots[slotName] = {
      name: slotName,
      confirmationStatus: "NONE",
      value: ""
    }

    if ( Array.isArray(slots[slotName]) ) {
      const slotValues: string[] = slots[slotName] as string[];
      slot.value = slotValues[0];
      slot.resolutions = {
        resolutionsPerAuthority: [
          {
            authority: "fake-static",
            status: { code: "ER_SUCCESS_MATCH" },
            values: slotValues.map( s => { return { value: {name:s, id:''} } } )
          }
        ]
      }
    } else {
      slot.value = slots[slotName] as string;
    }
  }
  
  return req;
}


describe( 'skirmish generated typescript', () => {
  it ( 'should process a fallback intent', () => {
    const request = requestWithIntent('AMAZON.FallbackIntent', {});
    const result = skirmish.parseAlexaRequest(request);
    assert.equal( result.name, 'AMAZON.FallbackIntent' );
    assert.deepEqual(result.slots, {} );
    assert.deepEqual( result.request, request );
  });
  
  it ( 'should process unexpected intents', () => {
    const request = requestWithIntent('LaunchIntent', {});
    const result = skirmish.parseAlexaRequest(request);
    assert.equal( result.name, 'LaunchIntent' );
    assert.deepEqual(result.slots, {} );
    assert.deepEqual( result.request, request );
  });
  
  it ( 'should recognize the values in slots', () => {
    // check several cases: 
    const request = requestWithIntent('moveUnitHere', {
      color: "Red",     // exact match, but different case
      type: ["horsies", "horse"],  // match in resolver
      source: "london", // unexpected value
      count: "3"        // number
    });
    const result = skirmish.parseAlexaRequest(request);
    assert.equal( result.name, 'moveUnitHere' );
    assert.deepEqual( result.request, request );
    if ( result.name === 'moveUnitHere' ) {
      const slots = result.slots;
      assert.equal( slots.color?.raw, "Red" );
      assert.equal( slots.color?.value, "red" );
      
      assert.equal( slots.type?.raw, "horsies" );
      assert.equal( slots.type?.value, "horse" );
      
      assert.equal( slots.source?.raw, "london" );
      assert.equal( slots.source?.value, undefined );

      assert.equal( slots.count?.raw, "3" );
      assert.equal( slots.count?.value, undefined );
      assert.equal( slots.count?.asNumber(), 3 );
    }
  });
})