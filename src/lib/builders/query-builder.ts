import * as schema from "zapatos/schema"
import { SelectCommand } from "./commands"

export class QueryBuilder<T extends schema.Table> extends SelectCommand<T> {}
