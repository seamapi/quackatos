import { mix } from "ts-mixer"
import { sql } from "zapatos/db"
import * as schema from "zapatos/schema"
import { WhereableStatement } from "./clauses"
import { SQLCommand } from "../common/sql-command"

export interface DeleteCommand<
  TableName extends schema.Table,
  Whereable extends schema.WhereableForTable<TableName>
> extends WhereableStatement<TableName, Whereable>,
    SQLCommand<never> {}

@mix(WhereableStatement, SQLCommand)
export class DeleteCommand<
  TableName extends schema.Table,
  Whereable extends schema.WhereableForTable<TableName> = schema.WhereableForTable<TableName>
> {
  private readonly _tableName: string

  constructor(tableName: TableName) {
    this._tableName = tableName
  }

  compile() {
    this.throwIfWhereEmpty()

    return sql`DELETE FROM ${
      this._tableName
    } WHERE ${this.compileWhereable()}`.compile()
  }
}
