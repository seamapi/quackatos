import { SQLFragment, sql, raw } from "zapatos/db"

type LeftJoin = {
  type: "leftJoin"
  table: string
  on: SQLFragment
}

export type AnyJoin = LeftJoin

export const constructJoinSQL = (joins: AnyJoin[]): SQLFragment => {
  let fragments = []
  for (const join of joins) {
    fragments.push(
      sql`${raw(join.type === "leftJoin" ? "LEFT" : "")} JOIN ${
        join.table
      } ON ${join.on}`
    )
    fragments.push(sql` `)
  }

  return sql`${fragments}`
}
