import { all, constraint } from "zapatos/db"
import { Table } from "zapatos/schema"
import { QueryBuilder } from "./lib"

const q = <T extends Table>(tableName: T) => new QueryBuilder(tableName)

// Add types and helpers from Zapatos
q.all = all
q.constraint = constraint

export default q

export * from "./lib"
