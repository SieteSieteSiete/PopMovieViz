// src/utils/textWrapper.js
import { LABEL } from '../constants';

export const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  
  return lines.slice(0, LABEL.MAX_LINES).map((line, i) => 
    i === LABEL.MAX_LINES - 1 && lines.length > LABEL.MAX_LINES
      ? line.slice(0, -3) + '...'
      : line
  );
};