import { Pool, QueryResult } from "pg"
import { SQLQuery } from "zapatos/db"

export abstract class SQLCommand<Result> {
  abstract compile(): SQLQuery

  protected abstract transformResult?: (result: QueryResult) => Result

  async run(pool: Pool): Promise<Result> {
    const query = this.compile()

    try {
      const result = await pool.query(query)
      if (this.transformResult) {
        return this.transformResult(result) as any
      }

      return result.rows as any
    } catch (error) {
      // todo: create custom error class
      console.error("original query", query)
      throw error
    }
  }
}
