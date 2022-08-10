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

class BaseBuilder {
  protected _locks: LockingSpec[] = []
}

class WaitBuilder<Parent> extends BaseBuilder {
  noWait(): Parent {
    const lastLock = this._locks[this._locks.length - 1]
    if (lastLock) {
      lastLock.wait = "NOWAIT"
    }
    return this._removeOwnMethods()
  }

  skipLocked(): Parent {
    const lastLock = this._locks[this._locks.length - 1]
    if (lastLock) {
      lastLock.wait = "SKIP LOCKED"
    }
    return this._removeOwnMethods()
  }

  static createFromParent<Parent>(
    parent: Parent
  ): Parent & WaitBuilder<Parent> {
    const builder = new WaitBuilder<Parent>()
    return builder._addOwnMethods(parent)
  }

  private _removeOwnMethods(): Parent {
    const ownMethods = Object.getOwnPropertyNames(WaitBuilder.prototype)
    ownMethods.forEach((method) => {
      delete (this as any)[method]
    })

    return this as any
  }

  private _addOwnMethods(parent: Parent): Parent & WaitBuilder<Parent> {
    const ownMethods = Object.getOwnPropertyNames(WaitBuilder.prototype)
    for (const method of ownMethods) {
      ;(parent as any)[method] = (this as any)[method]
    }

    return parent as any
  }
}

export class LocksBuilder extends BaseBuilder {
  forUpdate(
    ...of: Exclude<LockingSpec["of"], undefined>
  ): this & WaitBuilder<this>
  forUpdate(of?: LockingSpec["of"]): this & WaitBuilder<this>
  forUpdate(...args: any[]): this & WaitBuilder<this> {
    this._locks.push({
      for: "UPDATE",
      of: args,
    })
    return WaitBuilder.createFromParent(this)
  }

  forNoKeyUpdate(
    ...of: Exclude<LockingSpec["of"], undefined>
  ): this & WaitBuilder<this>
  forNoKeyUpdate(of?: LockingSpec["of"]): this & WaitBuilder<this>
  forNoKeyUpdate(...args: any[]): this & WaitBuilder<this> {
    this._locks.push({
      for: "NO KEY UPDATE",
      of: args,
    })
    return WaitBuilder.createFromParent(this)
  }

  forShare(
    ...of: Exclude<LockingSpec["of"], undefined>
  ): this & WaitBuilder<this>
  forShare(of?: LockingSpec["of"]): this & WaitBuilder<this>
  forShare(...args: any[]): this & WaitBuilder<this> {
    this._locks.push({
      for: "SHARE",
      of: args,
    })
    return WaitBuilder.createFromParent(this)
  }

  forKeyShare(
    ...of: Exclude<LockingSpec["of"], undefined>
  ): this & WaitBuilder<this>
  forKeyShare(of?: LockingSpec["of"]): this & WaitBuilder<this>
  forKeyShare(...args: any[]): this & WaitBuilder<this> {
    this._locks.push({
      for: "KEY SHARE",
      of: args,
    })
    return WaitBuilder.createFromParent(this)
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
