import {parse} from "./parser";

const outputDiv = document.getElementById('output') as HTMLDivElement;
const inputDiv = document.getElementById('input') as HTMLDivElement;
const modelDiv = document.getElementById('model') as HTMLDivElement;

// inital input
const sampleInput = `// a super basic example, change me!
INVOCATION hello world

SLOTTYPE Colors
  red | ruby
  green | emerald
  blue | saphire

INTENT MyNameIs
  (my|our) name is {name}
  + name as AMAZON.FIRST_NAME
  
INTENT FavoriteColor
  (my|our) (favorite|best|most loved|obsession) (color|) is {color}
  + color as Colors
  
INTENT AMAZON.FallbackIntent
  + fallback sensitivity medium
`;

// usurp the console to capture the tool output
const oldLog = console.log;
console.log = (...args: any[]) => {
  let p = document.createElement('p');
  p.innerText = args.join(' ');
  outputDiv.append(p);
  oldLog.apply(null, args);
}

const oldError = console.error;
console.error = (...args: any[]) => {
  let p = document.createElement('p');
  p.innerText = args.join(' ');
  p.classList.add('error');
  outputDiv.append(p);
  oldError.apply(null, args);
}

// function to build the input into the output
let lastInput: string = '';
function build(input?: string) {
  if ( input ) {
    lastInput = input;
  }
  try {
    outputDiv.innerText = '';
    const [model, pc] = parse(lastInput);
    if ( modelModeIsJSON ) {
      modelDiv.innerText = JSON.stringify(model.toASKModel(), null, 2);
    } else {
      modelDiv.innerText = model.toTypeScript();
    }
    pc.logErrors();
    pc.logWarnings();
    model.logSummary();
  } catch (err) {
    console.error( err );
  }
}

import {EditorView, basicSetup} from "codemirror";
import {ViewPlugin, ViewUpdate, keymap} from "@codemirror/view";
import {LanguageDescription, StreamLanguage, syntaxHighlighting} from "@codemirror/language";
import {alsHighlightStyle, alsLang} from "./codeMirror";
import {indentWithTab} from "@codemirror/commands";

const fixedHeightEditor = EditorView.theme({
  "&": {height: "100%"},
  ".cm-scroller": {overflow: "auto"}
})

let editor = new EditorView({
  extensions: [
    basicSetup, 
    EditorView.lineWrapping,
    fixedHeightEditor,
    ViewPlugin.fromClass( class{
      update(u: ViewUpdate): void {
        if (!u.docChanged) { return }
        let value = u.state.doc.toString();
        build(value);
      } 
    }),
    StreamLanguage.define(alsLang),
    syntaxHighlighting(alsHighlightStyle),
    keymap.of([indentWithTab]),
  ],
  parent: inputDiv
});

editor.dispatch( editor.state.update({
  changes: {from: 0, insert: sampleInput}
}) ); 


const copyButton = document.getElementById('copy-button') as HTMLDivElement;
copyButton.addEventListener('click', () => {
  const text = modelDiv.innerText;
  navigator.clipboard.writeText(text);
  copyButton.innerText = 'copied!';
  setTimeout( () => {
    copyButton.innerText = 'copy';
  }, 3000);
});

let modelModeIsJSON = true;
function setModelMode( json: boolean ) {
  modelModeIsJSON = json;
  if ( json ) {
    jsonButton.classList.add('header-button-selected');
    typescriptButton.classList.remove('header-button-selected');
  } else {
    jsonButton.classList.remove('header-button-selected');
    typescriptButton.classList.add('header-button-selected');
  }
  build();
}

const jsonButton = document.getElementById('json-button') as HTMLDivElement;
jsonButton.addEventListener('click', () => setModelMode(true) );

const typescriptButton = document.getElementById('typescript-button') as HTMLDivElement;
typescriptButton.addEventListener('click', () => setModelMode(false) );

setModelMode( true );