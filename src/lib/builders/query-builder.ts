import * as schema from "zapatos/schema"
import { SelectCommand } from "./commands"

export class QueryBuilder {
  select<T extends schema.Table>(tableName: T) {
    return new SelectCommand<
      schema.SelectableForTable<T>,
      schema.WhereableForTable<T>
    >(tableName)
  }
}
