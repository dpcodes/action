/*
 * returns a subset of a bezier curve from (u, 1),
 * where u is how much of the curve has been completed
 * https://stackoverflow.com/questions/25722680/can-i-make-a-half-bezier-from-full-bezier
 * */
const getDeCasteljau = (u: number, startingCurve: string) => {
  // get everything between the parens
  const re = /\(([^)]+)\)/
  const [P0, P1, P2, P3] = re
    .exec(startingCurve)![1]
    .split(',')
    .map(Number)
  const Q0 = (1 - u) * P0 + u * P1
  const Q1 = (1 - u) * P1 + u * P2
  const Q2 = (1 - u) * P2 + u * P3
  const R0 = (1 - u) * Q0 + u * Q1
  const R1 = (1 - u) * Q1 + u * Q2
  const S0 = (1 - u) * R0 + u * R1
  const points = [S0, R1, Q2, P3].map((n) => Math.round(n * 1e5) / 1e5)
  return `cubic-bezier(${points.join(', ')})`
}

export default getDeCasteljau
