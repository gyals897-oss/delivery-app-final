import pg from "pg";

const { Pool } = pg;

let pool;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
    });
  }

  return pool;
}

export async function query(text, params) {
  const client = getPool();
  return client.query(text, params);
}

export async function getClient() {
  const client = await getPool().connect();
  return client;
}
