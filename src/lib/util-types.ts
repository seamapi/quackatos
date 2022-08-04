export type NullPartial<T> = {
  [P in keyof T]: T[P] | null
}
