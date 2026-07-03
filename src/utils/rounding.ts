export function bankersRound(num: number): number {
  // Convert to a string with 4 decimal places to ensure we have the digits to inspect
  const strVal = num.toFixed(4); 
  
  // Extract the specific decimal digits using a regular expression
  // match[1] = tenths, match[2] = pennies (hundredths), match[3] = thousandths
  const match = strVal.match(/^-?\d+\.(\d)(\d)(\d)/);
  
  if (!match) return Number(num.toFixed(2));
  
  const penny = parseInt(match[2], 10);
  const thousandth = parseInt(match[3], 10);
  
  // Isolate the base value up to the penny (e.g., "1.1150" -> "1.11")
  const baseValueStr = strVal.slice(0, strVal.indexOf('.') + 3);
  let finalValue = parseFloat(baseValueStr);

  // Rule 2: More than 5 -> Round up
  if (thousandth > 5) {
    finalValue += 0.01;
  } 
  // Rule 3: Exactly 5
  else if (thousandth === 5) {
    // Rule 3.2: If penny is odd, round up. (If even, do nothing per Rule 3.1)
    if (penny % 2 !== 0) {
      finalValue += 0.01;
    }
  }
  // Rule 1: Less than 5 -> Do nothing (implicitly rounded down by slice)

  // Use toFixed to eliminate float drift (e.g., 1.11 + 0.01 = 1.1200000000000001)
  return parseFloat(finalValue.toFixed(2));
}