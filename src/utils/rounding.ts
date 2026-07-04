export function bankersRound(num: number): number {
  // Use exponential notation to safely shift the decimal without IEEE 754 precision loss
  const d = +(num + 'e+2'); 
  const i = Math.floor(d);
  const f = d - i;
  
  if (f === 0.5) {
    return (i % 2 === 0 ? i : i + 1) / 100;
  }
  
  return Math.round(d) / 100;
}