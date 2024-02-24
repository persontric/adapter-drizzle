import { database_person, test_adapter } from '@persontric/adapter-test'
import sqlite from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { DrizzleSQLiteAdapter } from '../driver/sqlite.js'
const sqliteDB = sqlite(':memory:')
sqliteDB.exec(`
	CREATE TABLE person (
		id    TEXT NOT NULL PRIMARY KEY,
		login TEXT NOT NULL UNIQUE)`
).exec(`
	CREATE TABLE person_session (
		id         TEXT    NOT NULL PRIMARY KEY,
		person_id  TEXT    NOT NULL,
		expire_dts INTEGER NOT NULL,
		country    TEXT,
		FOREIGN KEY (person_id) REFERENCES person (id))`)
sqliteDB
	.prepare(`INSERT INTO person (id, login)
						VALUES (?, ?)`)
	.run(database_person.id, database_person.attributes.login)
const person_tbl = sqliteTable('person', {
	id: text('id').notNull().primaryKey(),
	login: text('login').notNull().unique()
})
const session_tbl = sqliteTable('person_session', {
	id: text('id').notNull().primaryKey(),
	person_id: text('person_id')
		.notNull()
		.references(()=>person_tbl.id),
	expire_dts: integer('expire_dts', { mode: 'timestamp_ms' }).notNull(),
	country: text('country')
})
const db = drizzle(sqliteDB)
const adapter = new DrizzleSQLiteAdapter(db, session_tbl, person_tbl)
await test_adapter(adapter)
declare module 'persontric' {
	interface Register {
		Persontric:typeof adapter
		DatabasePersonAttributes:{
			login:string
		}
	}
}
