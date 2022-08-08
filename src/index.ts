import { Table } from "zapatos/schema"
import { QueryBuilder } from "./lib"

const q = <T extends Table>(tableName: T) => new QueryBuilder(tableName)

export default q

export * from "./lib"
