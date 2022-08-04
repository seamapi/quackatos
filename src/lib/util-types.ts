export type NullPartial<T> = {
  [P in keyof T]: T[P] | null
}

export type CommonKeysInInterface<T> = {
  [K in keyof T]: T[K] & T[Exclude<keyof T, K>]
}[keyof T]
