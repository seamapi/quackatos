import { Pool } from "pg"
import { SQLQuery } from "zapatos/db"

export abstract class SQLCommand<Selectable> {
  abstract compile(): SQLQuery

  async run(pool: Pool): Promise<Selectable[]> {
    const query = this.compile()

    try {
      const { rows } = await pool.query(query)
      return rows
    } catch (error) {
      // todo: create custom error class
      console.error("original query", query)
      throw error
    }
  }
}
