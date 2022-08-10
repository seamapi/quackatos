export type NullPartial<T> = {
  [P in keyof T]: T[P] | null
}

export type CommonKeysInInterface<T> = {
  [K in keyof T]: T[K] & T[Exclude<keyof T, K>]
}[keyof T]

/**
 * Removes any schema specifier from a table name.
 * @example public.actor -> actor
 */
export type UnprefixedTableName<S extends string> =
  S extends `${infer _}.${infer Rest}` ? Rest : S
