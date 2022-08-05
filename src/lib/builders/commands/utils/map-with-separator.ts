// Taken from Zapatos
/**
 * Map an input array to an output array, interspersing a constant separator value
 * between the mapped values.
 * @param arr Input array
 * @param separator Separator value
 * @param cb Mapping function
 */
export const mapWithSeparator = <TIn, TSep, TOut>(
  arr: TIn[],
  separator: TSep,
  cb: (x: TIn, i: number, a: TIn[]) => TOut
): (TOut | TSep)[] => {
  const result: (TOut | TSep)[] = []
  for (let i = 0, len = arr.length; i < len; i++) {
    if (i > 0) result.push(separator)
    result.push(cb(arr[i], i, arr))
  }
  return result
}
