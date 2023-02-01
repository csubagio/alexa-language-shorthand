import chalk from "chalk";

class LineText {
  constructor(
    public lineNumber: number,
    public text: string
  ){}
}

function logList( list: LineText[], color: (s:string) => string, singular: string, plural: string ) {
  if ( list.length === 0 ) {
    console.log(chalk.green(`0 ${plural}!`));
    return;
  }
  
  if ( list.length > 1 ) {
    console.log(color(`${list.length} ${plural} :(`));
  } else {
    console.log(color(`1 ${singular} :(`));
  }
  list.sort( (a,b) => b.lineNumber - a.lineNumber );
  list.forEach( l => console.error( color(`[${l.lineNumber+1}] ${l.text}`) ) );
}


/**
 * ParserContext is passed down to child objects during parsing 
 * to describe position, and collect warnings and errors 
 */
export class ParserContext {
  lineNumber: number = 0;
  errors: LineText[] = [];
  warnings: LineText[] = [];
  
  error(text: string) : void {
    this.errors.push( new LineText(this.lineNumber, text) );
  }
  
  errorAt(lineNumber: number, text: string): void {
    this.errors.push( new LineText(lineNumber, text) );
  }

  warn(text: string) : void {
    this.warnings.push( new LineText(this.lineNumber, text) );
  }
  
  warnAt(lineNumber: number, text: string): void {
    this.warnings.push( new LineText(lineNumber, text) );
  }

  
  logErrors() {
    logList(this.errors, chalk.red, 'error', 'errors');
  }
  
  logWarnings() {
    logList(this.warnings, chalk.magenta, 'warning', 'warnings');
  }
}