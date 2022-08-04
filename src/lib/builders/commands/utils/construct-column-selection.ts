import { ColumnForTable, SelectableForTable, Table } from "zapatos/schema"
import { sql, raw } from "zapatos/db"
import { UnionToIntersection } from "type-fest"

export type ColumnSpecificationsForTable<TableName extends Table> =
  | keyof SelectableForTable<TableName>
  | `${TableName}.${ColumnForTable<TableName>}`
  | `${TableName}.*`
  | "*"

// todo: this shouldn't be possible
// type f = ColumnSpecificationsForTable<'film' | 'actor'>
// type g = Extract<f, 'actor.description'>

export type SelectableFromColumnSpecifications<
  DefaultTableName extends Table,
  ColumnSpecifiers extends ColumnSpecificationsForTable<DefaultTableName>,
  OverriddenSelectableMap extends Record<DefaultTableName, any>
> = UnionToIntersection<
  ColumnSpecifiers extends `${infer TableName}.*`
    ? TableName extends keyof OverriddenSelectableMap
      ? OverriddenSelectableMap[TableName]
      : never
    : never | ColumnSpecifiers extends `${infer TableName}.${infer ColumnName}`
    ? TableName extends keyof OverriddenSelectableMap
      ? ColumnName extends keyof OverriddenSelectableMap[TableName]
        ? Pick<OverriddenSelectableMap[TableName], ColumnName>
        : never
      : never
    : never | ColumnSpecifiers extends "*"
    ? OverriddenSelectableMap[DefaultTableName]
    :
        | never
        | ColumnSpecifiers extends keyof OverriddenSelectableMap[DefaultTableName]
    ? Pick<OverriddenSelectableMap[DefaultTableName], ColumnSpecifiers>
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
