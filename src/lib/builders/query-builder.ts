import * as schema from "zapatos/schema"
import { SelectCommand, UpdateCommand } from "./commands"

export class QueryBuilder {
  select<T extends schema.Table>(tableName: T) {
    return new SelectCommand<T>(tableName)
  }

  update<T extends schema.Table>(tableName: T) {
    return new UpdateCommand<T>(tableName)
  }
}
