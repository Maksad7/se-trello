// lib/mongodb.ts
import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Подключение к MongoDB.
 * Ошибка по MONGODB_URI будет выброшена ТОЛЬКО внутри функции,
 * а не на уровне импорта (иначе Next шлёт HTML вместо JSON).
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  if (client && db) {
    return { client, db };
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(); // имя БД берётся из URI

  return { client, db };
}
