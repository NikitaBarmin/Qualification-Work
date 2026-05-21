export function safeDivide(dividend: number, divisor: number) {
  if (divisor === 0) {
    return 0;
  }

  return dividend / divisor;
}

export function toPercent(value: number) {
  return value * 100;
}
