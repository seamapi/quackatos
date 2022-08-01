import { cols, sql, vals } from "zapatos/db";
import {mix} from 'ts-mixer'
import { WhereableStatement } from "./common/where";
import { SQLCommand } from "./types";

export interface UpdateCommand<Updatable, Whereable> extends WhereableStatement<Whereable>, SQLCommand<void>  {}

@mix(WhereableStatement, SQLCommand)
export class UpdateCommand<Updatable, Whereable> {
  private readonly _tableName: string;
  private _values: Partial<Updatable> = {}

  constructor(tableName: string) {
    this._tableName = tableName
  }

  set<T extends keyof Updatable>(columnName: T, value: Updatable[T]): this
  set(values: Partial<Updatable>): this
  set(...args: any): this {
    if (Array.isArray(args) && args.length === 2) {
      this._values[args[0] as keyof Updatable] = args[1]
    } else if (args.length === 1) {
      this._values = {
        ...args[0]
      }
    }

    return this
  }

  compile() {
    return sql`UPDATE ${this._tableName} SET (${cols(this._values)}) = ROW(${vals(this._values)}) WHERE ${this._whereable}`.compile()
  }
}
