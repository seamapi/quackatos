import { Table } from "zapatos/schema"
import { raw, sql, SQLFragment } from "zapatos/db"
import { UnprefixedTableName } from "~/lib/util-types"
import { mapWithSeparator } from "~/lib/builders/utils"
import { LiteralUnion } from "type-fest"

interface LockingSpec {
  for: "UPDATE" | "NO KEY UPDATE" | "SHARE" | "KEY SHARE"
  of?: LiteralUnion<UnprefixedTableName<Table>, string>[]
  wait?: "NOWAIT" | "SKIP LOCKED"
}

export class LocksBuilder {
  private _locks: LockingSpec[] = []

  forUpdate(...of: Exclude<LockingSpec["of"], undefined>): this
  forUpdate(of?: LockingSpec["of"]): this
  forUpdate(...args: any[]): this {
    this._locks.push({
      for: "UPDATE",
      of: args,
    })
    return this
  }

  forNoKeyUpdate(...of: Exclude<LockingSpec["of"], undefined>): this
  forNoKeyUpdate(of?: LockingSpec["of"]): this
  forNoKeyUpdate(...args: any[]): this {
    this._locks.push({
      for: "NO KEY UPDATE",
      of: args,
    })
    return this
  }

  forShare(...of: Exclude<LockingSpec["of"], undefined>): this
  forShare(of?: LockingSpec["of"]): this
  forShare(...args: any[]): this {
    this._locks.push({
      for: "SHARE",
      of: args,
    })
    return this
  }

  forKeyShare(...of: Exclude<LockingSpec["of"], undefined>): this
  forKeyShare(of?: LockingSpec["of"]): this
  forKeyShare(...args: any[]): this {
    this._locks.push({
      for: "KEY SHARE",
      of: args,
    })
    return this
  }

  protected compileLocks(): SQLFragment {
    const lockSQL = this._locks.map((lock) => {
      const ofTables = lock.of
      const ofClause =
        ofTables === undefined
          ? []
          : sql` OF ${mapWithSeparator(ofTables as Table[], sql`, `, (t) => t)}`

      return sql` FOR ${raw(lock.for)}${ofClause}${
        lock.wait ? sql` ${raw(lock.wait)}` : []
      }`
    })

    return sql`${lockSQL}`
  }
}
