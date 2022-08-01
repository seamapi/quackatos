import { customAlphabet } from "nanoid"

const nanoid = customAlphabet("abcdef", 10)

const getRandomDatabaseName = (tag?: string) =>
  tag ? `${tag}_${nanoid()}` : nanoid()

export default getRandomDatabaseName
