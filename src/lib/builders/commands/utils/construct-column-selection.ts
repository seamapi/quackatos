import { ColumnForTable, SelectableForTable, Table } from "zapatos/schema"
import { sql, raw } from "zapatos/db"

export type ColumnSpecificationsForTable<TableName extends Table> =
  | keyof SelectableForTable<TableName>
  | `${TableName}.${ColumnForTable<TableName>}`
  | `${TableName}.*`
  | "*"

type ResolveWildcards<
  TableName extends Table,
  ColumnSpecifiers extends ColumnSpecificationsForTable<TableName>
> =
  | Extract<ColumnSpecifiers, keyof SelectableForTable<TableName>>
  | (ColumnSpecifiers extends `${TableName}.${infer ColumnName}`
      ? ColumnName extends keyof SelectableForTable<TableName>
        ? ColumnName
        : never
      : never)
  | (ColumnSpecifiers extends `${TableName}.*`
      ? keyof SelectableForTable<TableName>
      : never)
  | (ColumnSpecifiers extends "*" ? keyof SelectableForTable<TableName> : never)

export type SelectableForTableFromColumnSpecifications<
  TableName extends Table,
  ColumnSpecifiers extends ColumnSpecificationsForTable<TableName>
> = {
  [ColumnName in ResolveWildcards<
    TableName,
    ColumnSpecifiers
  >]: SelectableForTable<TableName>[ColumnName]
}

export const constructColumnSelection = <TableName extends Table>(
  columnSpecifications: ColumnSpecificationsForTable<TableName>[]
) => {
  const wildcardColumnsSQL = columnSpecifications
    .filter((c) => c.toString().includes("*"))
    .map((c) => c.toString())
  const specificColumnsSQL =
    columnSpecifications.length > 0
      ? columnSpecifications.filter((c) => !c.toString().includes("*"))
      : []
  const columnsSQL =
    wildcardColumnsSQL.length > 0 || specificColumnsSQL.length > 0
      ? sql`${raw([...wildcardColumnsSQL, ...specificColumnsSQL].join(", "))}`
      : sql`*`

  return columnsSQL
}
