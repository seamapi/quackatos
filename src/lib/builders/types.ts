import { Pool } from "pg";
import { SQLQuery } from "zapatos/db";

export abstract class SQLCommand<Selectable> {
  abstract compile(): SQLQuery

  async run(pool: Pool): Promise<Selectable[]> {
    const {rows} = await pool.query(this.compile())
    return rows;
  }
}
