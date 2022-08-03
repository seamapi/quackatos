import { ColumnForTable, SelectableForTable, Table } from "zapatos/schema"
import { sql, raw } from "zapatos/db"
import { UnionToIntersection } from "type-fest"

export type ColumnSpecificationsForTable<TableName extends Table> =
  | keyof SelectableForTable<TableName>
  | `${TableName}.${ColumnForTable<TableName>}`
  | `${TableName}.*`
  | "*"

export type SelectableForTableFromColumnSpecifications<
  DefaultTableName extends Table,
  ColumnSpecifiers extends ColumnSpecificationsForTable<DefaultTableName>
> = UnionToIntersection<
  ColumnSpecifiers extends `${infer TableName}.*`
    ? TableName extends Table
      ? SelectableForTable<TableName>
      : never
    : never | ColumnSpecifiers extends `${infer TableName}.${infer ColumnName}`
    ? TableName extends Table
      ? ColumnName extends keyof SelectableForTable<TableName>
        ? Pick<SelectableForTable<TableName>, ColumnName>
        : never
      : never
    : never | ColumnSpecifiers extends "*"
    ? SelectableForTable<DefaultTableName>
    :
        | never
        | ColumnSpecifiers extends keyof SelectableForTable<DefaultTableName>
    ? Pick<SelectableForTable<DefaultTableName>, ColumnSpecifiers>
    : never
>

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
