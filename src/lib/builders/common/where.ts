import { Whereable } from "zapatos/schema"
import { conditions, SQLFragment, AllType, all, sql, raw } from "zapatos/db"
import { mapWithSeparator } from "~/lib/builders/utils/map-with-separator"

type WhereableConditions<W extends Whereable> = Array<{
  bool: "AND" | "OR"
  where?: W | SQLFragment | AllType
  nested?: WhereableConditions<W>
}>

export class WhereableStatement<W extends Whereable> {
  protected _whereable: WhereableConditions<W> = []

  whereIn<ColumnName extends keyof W>(
    column: ColumnName,
    values: W[ColumnName][]
  ): this {
    this._whereable.push({
      bool: "AND",
      where: {
        [column]: conditions.isIn(values),
      } as any,
    })

    return this
  }

  where(
    args:
      | ((
          builder: WhereableStatement<Whereable>
        ) => WhereableStatement<Whereable>)
      | WhereableConditions<W>[number]["where"]
      | WhereableConditions<W>[number]
  ): this {
    const builder = new WhereableStatement<Whereable>()

    if (typeof args == "function") {
      const configured = args(builder)
      return this.mergeIntoThis(configured._whereable)
    } else if (args === all) {
      this._whereable.push({ bool: "AND", where: args })
      return this
    } else if (Array.isArray(args)) {
      return this.mergeIntoThis(args)
    }

    this._whereable.push({ bool: "AND", where: args as any })
    return this
  }

  protected compileWhereable(): SQLFragment {
    return sql`${mapWithSeparator(
      this._whereable,
      sql`AND `,
      (where) => sql`${where.where! === all ? raw("TRUE") : where.where!}`
    )}`
  }

  protected throwIfWhereEmpty(msg = "There are no WHERE conditions") {
    if (this.isWhereEmpty()) {
      throw new Error(msg)
    }
  }

  protected isWhereEmpty() {
    return this.compileWhereable().compile().text.length === 0
  }

  private mergeIntoThis(whereable: WhereableConditions<any>): this {
    this._whereable = [...this._whereable, ...whereable]
    return this
  }
}
