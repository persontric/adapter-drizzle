import { database_person, test_adapter } from '@persontric/adapter-test'
import dotenv from 'dotenv'
import { datetime, mysqlTable, varchar } from 'drizzle-orm/mysql-core'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { resolve } from 'path'
import { DrizzleMySQLAdapter } from '../driver/mysql.js'
dotenv.config({
	path: resolve('.env')
})
const connection = await mysql.createConnection({
	host: 'localhost',
	user: 'root',
	database: process.env.MYSQL_DATABASE,
	password: process.env.MYSQL_PASSWORD
})
// @formatter:off
await connection.execute('DROP TABLE IF EXISTS person_session')
await connection.execute('DROP TABLE IF EXISTS test_person')
await connection.execute(
	`CREATE TABLE IF NOT EXISTS test_person (
		id VARCHAR (255) PRIMARY KEY,
		login VARCHAR (255) NOT NULL UNIQUE
	)`)
await connection.execute(
	`CREATE TABLE IF NOT EXISTS person_session (
		id VARCHAR (255) PRIMARY KEY,
		person_id VARCHAR (255) NOT NULL,
		expire_dts DATETIME NOT NULL,
		country VARCHAR (255),
		FOREIGN KEY (person_id) REFERENCES test_person (id)
	)`)
// @formatter:on
await connection.execute('INSERT INTO test_person (id, login) VALUES (?, ?)', [
	database_person.id,
	database_person.attributes.login
])
const person_tbl = mysqlTable('test_person', {
	id: varchar('id', {
		length: 255
	}).primaryKey(),
	login: varchar('login', {
		length: 255
	})
		.notNull()
		.unique()
})
const session_tbl = mysqlTable('person_session', {
	id: varchar('id', {
		length: 255
	}).primaryKey(),
	person_id: varchar('person_id', {
		length: 255
	})
		.notNull()
		.references(()=>person_tbl.id),
	expire_dts: datetime('expire_dts').notNull(),
	country: varchar('country', {
		length: 255
	})
})
const db = drizzle(connection)
const adapter = new DrizzleMySQLAdapter(db, session_tbl, person_tbl)
await test_adapter(adapter)
await connection.execute('DROP TABLE IF EXISTS person_session')
await connection.execute('DROP TABLE IF EXISTS test_person')
process.exit()
declare module 'persontric' {
	interface Register {
		Persontric:typeof adapter
		DatabasePersonAttributes:{
			login:string
		}
	}
}
