import test from "ava"
import { getTestDatabase } from "~/tests/fixtures/plugins"
// import { Builder } from '~/lib/builder'
// import { WhereBuilder } from '~/lib/builders/common/where'
import { actor } from "zapatos/schema"
// import { SelectCompiler } from '~/lib/compilers/select'
import { SelectCommand } from "~/lib/builders/select"
import knex from "knex"
import { UpdateCommand } from "~/lib/builders/update"

test("main", async (t) => {
  // const where = new WhereBuilder<actor.Whereable>()
  // where.isIn('first_name', ['John', 'Jane'])

  // const where2 = new WhereBuilder<actor.Whereable>()
  // where2.isNotIn('last_name', ['Doe', 'Smith'])

  // const compiler = new SelectCompiler([where, where2])

  // console.log(compiler.compile().compile())

  /*
  q('actor')
  .whereIn('first_name', ['John', 'Jane'])
  .where({first_name: 'John'})
  .innerJoin('movie_actor', 'actor_id', 'actor.actor_id')
  .columns(['actor_id', 'first_name', 'last_name'])
  .run(pool)

  */

  const { pool } = await getTestDatabase()

  const result = await new SelectCommand<actor.Selectable, actor.Whereable>(
    "actor"
  )
    // todo: improve type errors
    .select("first_name", "last_name")
    .whereIn("first_name", ["ELLEN"])
    .where((b) => b.whereIn("last_name", ["PRESLEY"]))
    .limit(10)
    .run(pool)

  console.log(result)

  const upd = new UpdateCommand<actor.Updatable, actor.Whereable>("actor")
    .set({ first_name: "John" })
    .set("last_name", "Doe")
    .whereIn("first_name", ["ELLEN"])

  console.log(await upd.run(pool))

  // const w = new WhereBuilder<actor.Whereable>()
  // const compileResult = w
  //   .isIn('first_name', ['John', 'Jane'])
  //   .isNotIn('actor_id', [1, 2])
  //   .compile()
  // console.log({compileResult})

  // const a = await new Builder()
  //   .table('actor')
  //   .run(pool)

  // const results = await new Builder()
  //   .table('actor')
  //   .whereIsIn('first_name', ['ELLEN'])
  //   // .whereIn('actor_id', [1, 2, 3])
  //   // .where('first_name', 'ELLEN')
  //   // .where('actor_id', b => b.isIn([1, 2, 3]))
  //   // .column(['actor_id', 'first_name'])
  //   // .column('actor_id')
  //   // .column(['actor_id', 'first_name'])
  //   // .column('actor_id')
  //   .run(pool)

  // t.is(results.length > 0, true)

  // console.log(results)

  // const [firstResult] = results

  // console.log(firstResult.actor_id)
})
