# 🦆 quackatos

[![NPM Test](https://github.com/seamapi/quackatos/actions/workflows/npm-test.yml/badge.svg?branch=main)](https://github.com/seamapi/quackatos/actions/workflows/npm-test.yml)

Quackatos is an extremely **well-typed query builder** for Postgres, built on top of the excellent [Zapatos](https://jawj.github.io/zapatos/) library.

For example:

```ts
import q from "quackatos"
import { Pool } from "pg"

const pool = new Pool()

const filmAndActor = await q("film")
  .leftJoin("film_actor", "film.film_id", "film_actor.film_id")
  .leftJoin("actor", "actor.actor_id", "film_actor.actor_id")
  .select("actor.first_name", "film.*")
  .limit(1)
  .run(pool)

// typeof filmAndActor ===
//  film.Selectable &
//  Pick<NullPartial<actor.Selectable>, "first_name">
```

## Setup

First, you'll have to [set up Zapatos](https://jawj.github.io/zapatos/#how-do-i-get-it) (Quackatos relies on Zapatos for type generation and helper functions).

Then:

`yarn add quackatos` or `npm install quackatos`

## Goals

> If it looks like a duck, swims like a duck, and quacks like a duck, then it's probably a duck.

Quackatos has three main goals:

- Query results should be strongly typed to the fullest extent possible
- Any code without type errors should generate a valid query
- It should be immediately obvious what Postgres query will be generated for any given code

Quackatos **does not** intend to be a drop-in replacement for [Knex](https://knexjs.org/), though it shares much of the same syntax.

## Related Works

- [Knex](https://knexjs.org/): a weakly-typed query builder for many different database engines
- [Prisma](https://www.prisma.io/): a strongly-typed ORM for many different database engines
- [Zapatos](https://jawj.github.io/zapatos/): a type generation and query helper library for Postgres

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.
