import { ColumnForTable, SelectableForTable, Table } from "zapatos/schema"
import { sql, raw } from "zapatos/db"
import { UnionToIntersection } from "type-fest"
import { CommonKeysInInterface } from "~/lib/util-types"

type ColumnSpecificationsForSingleTable<TableName extends Table> =
  | keyof SelectableForTable<TableName>
  | `${TableName}.${ColumnForTable<TableName>}`
  | `${TableName}.*`
  | "*"

type ColumnSpecificationsForTableUnion<TableName extends Table> = {
  [K in TableName]: ColumnSpecificationsForSingleTable<K>
}

type CommonColumnsInTableUnion<TableName extends Table> =
  CommonKeysInInterface<{
    [K in TableName]: keyof SelectableForTable<K>
  }>

export type ColumnSpecificationsForTableWithWildcards<TableName extends Table> =
  Exclude<
    ColumnSpecificationsForTableUnion<TableName>[TableName],
    Extract<
      ColumnSpecificationsForTableUnion<TableName>[TableName],
      CommonColumnsInTableUnion<TableName>
    >
  >

export type ColumnSpecificationsForTable<TableName extends Table> = Exclude<
  ColumnSpecificationsForTableWithWildcards<TableName>,
  "*" | `${TableName}.*`
>

export type SelectableFromColumnSpecifications<
  DefaultTableName extends Table,
  ColumnSpecifiers extends ColumnSpecificationsForTableWithWildcards<DefaultTableName>,
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

// todo: optimize / simplify type
export type ColumnSpecificationValue<
  DefaultTableName extends Table,
  ColumnSpecification extends ColumnSpecificationsForTable<DefaultTableName>
> = SelectableFromColumnSpecifications<
  DefaultTableName,
  ColumnSpecification,
  Record<DefaultTableName, SelectableForTable<DefaultTableName>>
>[keyof SelectableFromColumnSpecifications<
  DefaultTableName,
  ColumnSpecification,
  Record<DefaultTableName, SelectableForTable<DefaultTableName>>
>]

export const constructColumnSelection = <TableName extends Table>(
  columnSpecifications: ColumnSpecificationsForTableWithWildcards<TableName>[]
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
      : sql``

  return columnsSQL
}
