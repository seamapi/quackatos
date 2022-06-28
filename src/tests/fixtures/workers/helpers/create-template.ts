import { StartedTestContainer } from "testcontainers";
import { Client } from "pg";
import getRandomDatabaseName from "./get-random-database-name";

/**
 * Creates a seeded database template.
 * @param container started Postgres test container
 * @returns name of created template
 */
const createTemplate = async (container: StartedTestContainer) => {
  const name = getRandomDatabaseName("template");

  const postgresUrl = `postgresql://postgres:@${container.getHost()}:${container.getMappedPort(
    5432
  )}/postgres`;

  const postgresClient = new Client(postgresUrl);
  await postgresClient.connect();

  await postgresClient.query(`CREATE DATABASE ${name};`);

  const createdDatabaseUrl = `postgresql://postgres:@${container.getHost()}:${container.getMappedPort(
    5432
  )}/${name}`;

  const createdDatabaseClient = new Client(createdDatabaseUrl);
  await createdDatabaseClient.connect();

  const { exitCode } = await container.exec(
    `psql -U postgres -d ${name} -f /pagila/dump.sql`.split(" ")
  );
  if (exitCode !== 0) {
    throw new Error(`Failed to load sample schema & data`);
  }

  await createdDatabaseClient.end();
  await postgresClient.query(`ALTER DATABASE ${name} WITH is_template TRUE;`);
  await postgresClient.end();

  return name;
};

export default createTemplate;
