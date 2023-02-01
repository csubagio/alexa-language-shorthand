# Alexa Language Shorthand

This utility defines a shorthand text format for authoring language models for the [Alexa Skills Kit](https://developer.amazon.com/en-US/alexa/alexa-skills-kit), and provides a command line compiler that converts that into the ASK JSON format, ready for pasting into the Alexa Developer Portal, or uploading with the ASK CLI tool.

> Note: this package is under development and is provided as is. It is very likely to change as it's used in production skills. Happy to hear about what people might need though, feel free to leave an issue or come find me in the Alexa Community Slack. - Chris.


## Getting Started

Alexa Language Shorthand is available as an npm package. You can either install it locally in a project or globally.

```JavaScript
npm install -g alexa-language-shorthand
```

Once installed, you author an `.als` text file, here's a minimal `example.als`:

```Javascript
INVOCATION favorite color
SLOTTYPE Color 
  red 
  blue
  green 
  
INTENT FavoriteColor
  (my|our) (best|favorite) color is {aColor}
  + aColor as Color
```

You can compile this into an `example.json` in the same directory by invoking the compiler:

```Javascript
  alexa-language-shorthand example.als
```

If you're working with the Alexa developer portal, you can copy paste the contents of the generated JSON file into the JSON editor.

If you're using the ASK CLI tools, the simplest thing to do it store your `als` files along side the JSON files in the `./skill-package/interactionModels/custom` folder, and then compile them before doing an `ask deploy`. 

### White space
ALS is a white space dependent format, much like a python or YAML file. Indented lines implictly relate to the first line above them that has less indentation. You can use spaces or tabs for indentation, as long as you're consistent from line to line.

```
This line is at indent 0, let's call it Adam
  This line "belongs" to the line above
  Meet this line, Bob. It also belongs to Adam
    This line is further indented, so it belongs to Bob
    This one is at the same indentation, so it's Bob's
  This line stepped back and belongs to Adam
  
This line is a new thing
  This line belongs to the new thing
```

### Comments 
You can leave yourself comments in your ALS files using the `//` symbol. Everything after `//` on each line will be ignored by the compiler

```
// todo: come back and add more utterances here
INTENT hello 
```

## Invocation 

Your users invoke your skill by using an invocation phrase, usually the name of your skill. You must specify this in your language model, without he Alexa wake word. In ALS, you do this with a line starting with `INVOCATION` followed by the speech you expect. So if you expect your users to say something like *"Alexa, open my cool skill"*, you'd add the following to your `.als` file:

```
INVOCATION my cool skill
```

## Slot Types

To recognize variables in an intent, Alexa provides the concept of slots. You create a slot type by defining all the values you expect your skill users might specify, and then refer to that slot in your intent's example utterances.

To define a slot type in ALS:

```
SLOTTYPE Color 
  red | reddish | rouge
  blue | blueish | sky
  green | grenish | emerald
```

The first line defines a new slot type, followed by its name.

Each subsequently indented line represents a single value, followed by synonyms for that value, separated by the `|` character. 

## Intents 

Intents are named commands that Alexa will categorize your users' speech into. Because there are usually different ways someone can express the same idea verbally, intents let you specify several alternate utterances that you intend to mean the same thing to your skill.

```
INTENT Hello
  good morning 
  good evening
  hello
  hello you
  hi
  what's up
```

The first line defines a new intent, and its name. This is the identifier you'll use in your skill endpoint code to identify what to do.

Each subsequently indented line provides an alternative way the user might express this intent.

### Alternation

Often, you'll want to define groups of utterances for intents that are largely the same structure with minor variations. To simplify generating these, ALS provides alternation using the `|` character, which you can apply to a subset of a single utterance by isolating it with `()` brackets.

```
INTENT Hello
  good (morning|evening)
  hello (you|)
  hi
  what's up
```

This rework shortens the sample we had earlier. Note that the form `(you|)` means the user might say "you" or nothing at that point in the utterance. You can use several alternations per utterance, and nest them where necessary.

We can broaden our example above to match more speech:

```
INTENT Hello
  (good (morning|afternoon|evening|day) | (hello|hi|yo)) (you|y'all|friend|bud|guy|dude|)
  what's (up|going on)
```

That long line is beginning to get difficult to read, with the multiple nested alternations, so we might want to split it back into two:

```
INTENT Hello
  good (morning|afternoon|evening|day) (you|y'all|friend|bud|guy|dude|)
  hello|hi|yo (you|y'all|friend|bud|guy|dude|)
  what's (up|going on)
```

But now we have that large duplication of the second half of the both utterances. To help manage this, ALS provides text substition below.

### Slots 
We defined slot types earlier, now we want to use them in intents. You may want to use a single slot type in more than one place in an utterance, for instance in *"I want to travel from London to Bangkok"* both "London" and "Bangkok" would be locations, so in an utterance we specify slots *names*, and then later we define what *type* each name should expect. Later when Alexa delivers the intent, we'll be able to inspect each slot by name to discover what the user intended.

Slots are placed into an utterance with the `{}` brackets. Slots types are specified in ALS by adding a line beginning with the `+` command symbol, followed by the statement `slotName as slotType`

```
SLOTTYPE Color
  red
  green
  blue
  
INTENT Gradient 
  make a gradient from {source} to {destination}
  + source as Color
  + destination as Color
``` 

### Utterance limiting
The ALS compiler will generate every permutation of your alternations, potentially generating thousands of utterances for each intent. To keep your language model within the ASK limits, by default ALS will only include up to 2000 utterance for each intent. The utterances are selected pseudo randomly to minimize the amount of information lost.

You can modify the utterance limit per intent with the `+ utterance limit` command.

```
INTENT TransferUnit
  (transfer|move|exchange) {count} units from {source} to {destination}
  + count as AMAZON.NUMBER
  + source as Location
  + destination as Location  
  + utterance limit 100
```

### Required Intents 
The ASK requires that `AMAZON.StopIntent`, `AMAZON.CancelIntent`, and `AMAZON.HelpIntent` be present in all models, so if you don't specify these they will be added for you automatically. You can specify them explicitly if you intend to enhance them with further utterances.

### Built in intents and slot types
There are a number of useful predefined Alexa intents and slots in the ASK. You can use these in ALS the same as any intents and slot types you define, omitting the definition for any built-in slot types that you want to use verbatim.

```
INTENT AMAZON.FallbackIntent

INTENT pickNumber
  I choose {number}
  + number as AMAZON.NUMBER
```

### Fallback Intent
`AMAZON.FallbackIntent` allows you to specify a "sink" for all the things your users might say that don't match any of your explicit intents. You can tune how strong this effect is in ALS with the `+ fallback sensitivity medium` command. You can specify the values "low", "medium", and "high".

```
INTENT AMAZON.FallbackIntent
  + fallback sensitivity medium
```

## Text Substitution
ALS supports a uniform text substitution syntax, applied before each line is processed. Substitutions are defined by a line starting with `$`, followed by a name, an equals sign, and the text to replace. On any other line, a symbol starting with `$` will be replaced by that content.

From the alternation example above, we can simplify it with text substituation as so:

```
$appelations = (you|y'all|friend|bud|guy|dude|)
INTENT Hello
  good (morning|afternoon|evening|day) $appellations
  hello|hi|yo $appellations
  what's (up|going on)
```

