// Skirmish is a moderately complex model for an imaginary board game
// that has units you can move around. It supports identifying 
// units by count(number), amount(non numeric), color, type, and 
// origin.

INVOCATION skirmish map

SLOTTYPE UnitType
  wizard | wizards | mage|mages | warlock|warlocks | magician|magicians | sorceror|sorcerors
  horse | horses | officer|officers | knight|knights 
  tower | towers | building|buildings | battlement|battlements | fortress|fotresses
  sword | swords | knife|knives | soldier|soldiers
  thing | things | icon|icons | unit|units | piece|pieces

SLOTTYPE Location
  lum bend | lum | the bend
  gorrick
  pullum east | east pullum 
  pullum west | west pullum
  pullum
  upton marsh | upton | the marsh | marsh
  inspeth
  flack
  dead coast
  coast | the coast
  diffle
  upper diffle
  clelan | cleveland | kleelun | cleelan 
  saffid east | saffid island east | east saffid | east saffid island
  saffid west | saffid island west | west saffid | west saffid island
  saffid | saffid island
  kell north | north kell
  kell south | south kell 
  kell point | point kell
  kell | kell island 
  appleham 

SLOTTYPE Color
  red | reds
  green | greens
  blue | blues
  
SLOTTYPE Amount 
  single | a single
  couple | a couple | a couple of
  some | some of the | a few| a few of the
  half | half of the
  many | many of the | several|several of the | most|most of the 
  half dozen | a half dozen
  dozen
  all | the | all the | all of the | every 
  
  
  
// all the different ways to specify a kind of unit, except for by location
$qualifiers = (( {color} | {count} | {amount} | {count}{color} | {amount}{color} ) ({type}|) | {type})
$moveWords = move|send|bring|shove|throw|shift|push|pull
$gatherWords = gather|collect|bring|pool
  
INTENT moveUnit
  ($moveWords) (everything|) to {destination}
  ($moveWords) (everything|) from everywhere to {destination}

  ($moveWords) $qualifiers from {source} to {destination}
  ($gatherWords) $qualifiers from {source} (to|at) {destination}

  ($moveWords) $qualifiers to {destination}
  $qualifiers to {destination}
  ($gatherWords) $qualifiers (to|at) {destination}

  (spread|split|divide) $qualifiers (across|over|along) {destination}
  muster $qualifiers (at|to) {destination}

  + type as UnitType  
  + source as Location 
  + destination as Location
  + count as AMAZON.NUMBER
  + color as Color
  + amount as Amount

INTENT moveUnitHere
  ($moveWords|$gatherWords) (everything|) (to|) (here|there)
  ($moveWords|$gatherWords) (everything|) from everywhere (to|) (here|there)

  ($moveWords) $qualifiers (here|there)
  ($gatherWords) $qualifiers (at|to|) (here|there)

  ($moveWords) $qualifiers from {source} (here|there)
  ($gatherWords) $qualifiers from {source} (at|to|) (here|there)

  muster $qualifiers (at|to) (here|there)

  + source as Location 
  + type as UnitType  
  + count as AMAZON.NUMBER
  + color as Color
  + amount as Amount


INTENT done 
  done 
  end turn 
  I'm done 
  that's enough
  send it over
  next turn

INTENT AMAZON.YesIntent
INTENT AMAZON.NoIntent
INTENT AMAZON.NavigateHomeIntent

INTENT AMAZON.FallbackIntent
  + fallback sensitivity medium