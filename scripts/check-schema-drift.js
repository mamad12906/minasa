#!/usr/bin/env node
/**
 * Schema drift check — comparing the SQLite schema in
 * `src/main/database/connection.ts` against the Postgres schema in
 * `server/db.ts`.
 *
 * Not a real migration tool. Just flags column names that exist in one
 * side but not the other, so a dev notices before shipping.
 *
 * Run: `node scripts/check-schema-drift.js`
 * Non-zero exit on drift (safe to use in CI).
 */
const fs = require('fs')
const path = require('path')

const SQLITE_FILE = path.join(__dirname, '..', 'src', 'main', 'database', 'connection.ts')
const POSTGRES_FILE = path.join(__dirname, '..', 'server', 'db.ts')

// Which tables to compare (shared between client/server).
const TABLES = ['reminders', 'platforms', 'categories', 'ministries']

// Tables with known, accepted drift — reviewed manually:
//  - `customers`: SQLite adds columns via ALTER TABLE in migrations; regex
//    can't see them. Checked manually on 2026-04-19 — columns match.
//  - `users`: SQLite `platform_name` added via migration (connection.ts:100-104).
//  - `audit_log`: SQLite uses `user_name` (legacy), Postgres uses `username`.
//    Desktop now reads audits from server so the local table is effectively
//    deprecated — drift tolerated until the local table is removed.
const KNOWN_DRIFT = new Set(['customers', 'users', 'audit_log'])

function extractColumns(source, tableName) {
  // Find the CREATE TABLE block. We tolerate IF NOT EXISTS and either a
  // backtick template-literal or a plain string literal.
  const patt = new RegExp(
    `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?${tableName}\\s*\\(([^)]*(?:\\([^)]*\\)[^)]*)*)\\)`,
    'i',
  )
  const match = source.match(patt)
  if (!match) return null
  const body = match[1]
  // Each column definition is: `name TYPE ...,` — we take the first token.
  const cols = body
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/,$/, ''))
    .filter((l) => l && !/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT|INDEX|KEY)\b/i.test(l))
    .map((l) => l.split(/\s+/)[0].replace(/[`"]/g, ''))
    .filter((c) => c && !/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)$/i.test(c))
  return new Set(cols)
}

function diff(a, b) {
  return [...a].filter((x) => !b.has(x))
}

function main() {
  const sqliteSrc = fs.readFileSync(SQLITE_FILE, 'utf8')
  const pgSrc = fs.readFileSync(POSTGRES_FILE, 'utf8')
  let problems = 0

  for (const table of TABLES) {
    const sqliteCols = extractColumns(sqliteSrc, table)
    const pgCols = extractColumns(pgSrc, table)

    if (!sqliteCols && !pgCols) continue
    if (!sqliteCols) {
      console.log(`[drift] ${table}: missing in SQLite (${SQLITE_FILE})`)
      problems++
      continue
    }
    if (!pgCols) {
      console.log(`[drift] ${table}: missing in Postgres (${POSTGRES_FILE})`)
      problems++
      continue
    }

    const onlySqlite = diff(sqliteCols, pgCols)
    const onlyPg = diff(pgCols, sqliteCols)
    if (onlySqlite.length || onlyPg.length) {
      console.log(`[drift] ${table}:`)
      if (onlySqlite.length) console.log(`  only in SQLite: ${onlySqlite.join(', ')}`)
      if (onlyPg.length)     console.log(`  only in Postgres: ${onlyPg.join(', ')}`)
      problems++
    } else {
      console.log(`[ok]    ${table}: ${sqliteCols.size} columns match`)
    }
  }

  if (problems > 0) {
    console.log(`\n❌ ${problems} table(s) drifted. Align schemas before shipping.`)
    process.exit(1)
  }
  console.log('\n✅ Schemas aligned.')
}

main()
