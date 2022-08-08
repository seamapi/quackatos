import { Whereable as W } from "zapatos/schema"
import { conditions } from "zapatos/db"

export class WhereableStatement<Whereable extends W> {
  protected _whereable: Whereable = {} as Whereable

  whereIn<ColumnName extends keyof Whereable>(
    column: ColumnName,
    values: Whereable[ColumnName][]
  ): this {
    this._whereable[column] = conditions.isIn(values) as any
    return this
  }

  where(
    args:
      | ((
          builder: WhereableStatement<Whereable>
        ) => WhereableStatement<Whereable>)
      | Whereable
  ): this {
    const builder = new WhereableStatement<Whereable>()

    if (typeof args == "function") {
      const configured = args(builder)
      return this.mergeIntoThis(configured._whereable)
    }

    return this.mergeIntoThis(args)
  }

  private mergeIntoThis(whereable: Whereable): this {
    this._whereable = {
      ...this._whereable,
      ...whereable,
    }
    return this
  }
}
