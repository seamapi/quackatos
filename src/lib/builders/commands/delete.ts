import { mix } from "ts-mixer"
import { sql } from "zapatos/db"
import * as schema from "zapatos/schema"
import { WhereableStatement } from "../common"
import { SQLCommand } from "../types"

export interface DeleteCommand<
  TableName extends schema.Table,
  Whereable extends schema.WhereableForTable<TableName>
> extends WhereableStatement<Whereable>,
    SQLCommand<never> {}

@mix(WhereableStatement, SQLCommand)
export class DeleteCommand<
  TableName extends schema.Table,
  Whereable extends schema.WhereableForTable<TableName>
> {
  private readonly _tableName: string

  constructor(tableName: TableName) {
    this._tableName = tableName
  }

  compile() {
    return sql`DELETE FROM ${this._tableName} WHERE ${this._whereable}`.compile()
  }
}
