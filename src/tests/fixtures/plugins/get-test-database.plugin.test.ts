import test from "ava";
import { getTestDatabase } from ".";

test("getTestDatabase() works", async (t) => {
  const { pool } = await getTestDatabase();

  await t.notThrowsAsync(async () => {
    const result = await pool.query("SELECT * FROM actor LIMIT 1");

    t.is(result.rows.length, 1);
  });
});
