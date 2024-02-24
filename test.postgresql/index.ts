import { database_person, test_adapter } from '@persontric/adapter-test'
import dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { resolve } from 'path'
import pg from 'pg'
import { DrizzlePostgreSQLAdapter } from '../driver/postgresql.js'
dotenv.config({
	path: resolve('.env')
})
export const pool = new pg.Pool({
	connectionString: process.env.POSTGRES_DATABASE_URL
})
await pool.query('DROP TABLE IF EXISTS public.session')
await pool.query('DROP TABLE IF EXISTS public.person')
await pool.query(`
	CREATE TABLE public.person (
		id    TEXT PRIMARY KEY,
		login TEXT NOT NULL UNIQUE)`)
await pool.query(`
	CREATE TABLE public.session (
		id         TEXT PRIMARY KEY,
		person_id  TEXT        NOT NULL REFERENCES public.person (id),
		expire_dts TIMESTAMPTZ NOT NULL,
		country    TEXT        NOT NULL)`)
await pool.query(`INSERT INTO public.person (id, login)
									VALUES ($1, $2)`, [
	database_person.id,
	database_person.attributes.login
])
const person_tbl = pgTable('person', {
	id: text('id').primaryKey(),
	login: text('login').notNull().unique()
})
const session_tbl = pgTable('session', {
	id: text('id').primaryKey(),
	person_id: text('person_id')
		.notNull()
		.references(()=>person_tbl.id),
	expire_dts: timestamp('expire_dts', {
		withTimezone: true
	}).notNull(),
	country: text('country')
})
const db = drizzle(pool)
const adapter = new DrizzlePostgreSQLAdapter(db, session_tbl, person_tbl)
await test_adapter(adapter)
await pool.query('DROP TABLE public.session')
await pool.query('DROP TABLE public.person')
process.exit()
declare module 'persontric' {
	interface Register {
		Persontric:typeof adapter
		DatabasePersonAttributes:{
			login:string
		}
	}
}
