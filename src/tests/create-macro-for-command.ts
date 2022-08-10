import test, { ExecutionContext } from "ava"
import { Pool } from "pg"
import { SQLQuery } from "zapatos/db"
import { SQLCommand } from "~/lib"
import { getTestDatabase } from "./fixtures/plugins"

interface CreateMacroForCommandOptions<Builder extends SQLCommand<any>> {
  builderFactory: () => Builder
}

/**
 * By default the created macro will execute the built query and take a snapshot of the result.
 * If an assertion callback function is passed, no snapshot will be taken.
 */
export const createMacroForBuilder = <Builder extends SQLCommand<any>>({
  builderFactory,
}: CreateMacroForCommandOptions<Builder>) => {
  return test.macro(
    async (
      t,
      callback: (builder: Builder) => SQLCommand<any>,
      assertions?: (
        t: ExecutionContext,
        result: any,
        query: SQLQuery,
        pool: Pool
      ) => void | Promise<void>
    ) => {
      const { pool } = await getTestDatabase()

      const builder = callback(builderFactory())

      const result = await builder.run(pool)

      if (assertions) {
        await assertions(t, result, builder.compile(), pool)
      } else {
        t.snapshot(result)
      }
    }
  )
}
