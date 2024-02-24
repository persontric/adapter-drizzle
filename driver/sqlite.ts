import { eq, lte } from 'drizzle-orm'
import type { Adapter, DatabaseSession, DatabasePerson } from 'persontric'
import type {
	SQLiteColumn,
	BaseSQLiteDatabase,
	SQLiteTableWithColumns
} from 'drizzle-orm/sqlite-core'
import type { InferSelectModel } from 'drizzle-orm'
export class DrizzleSQLiteAdapter implements Adapter {
	private db:BaseSQLiteDatabase<'async'|'sync', {}>
	private session_tbl:SQLiteSessionTable
	private person_tbl:SQLitePersonTable
	constructor(
		db:BaseSQLiteDatabase<any, any, any>,
		session_tbl:SQLiteSessionTable,
		person_tbl:SQLitePersonTable
	) {
		this.db = db
		this.session_tbl = session_tbl
		this.person_tbl = person_tbl
	}
	public async session__delete(session_id:string):Promise<void> {
		await this.db.delete(this.session_tbl).where(eq(this.session_tbl.id, session_id))
	}
	public async person_session_all__delete(person_id:string):Promise<void> {
		await this.db.delete(this.session_tbl).where(eq(this.session_tbl.person_id, person_id))
	}
	public async session_person_pair_(
		session_id:string
	):Promise<[session:DatabaseSession|null, user:DatabasePerson|null]> {
		const result = await this.db
			.select({
				user: this.person_tbl,
				session: this.session_tbl
			})
			.from(this.session_tbl)
			.innerJoin(this.person_tbl, eq(this.session_tbl.person_id, this.person_tbl.id))
			.where(eq(this.session_tbl.id, session_id))
			.get()
		if (!result) return [null, null]
		return [
			session_table__database_session_(result.session),
			person_tbl__database_person_(result.user)
		]
	}
	public async person_session_all_(person_id:string):Promise<DatabaseSession[]> {
		const result = await this.db
			.select()
			.from(this.session_tbl)
			.where(eq(this.session_tbl.person_id, person_id))
			.all()
		return result.map((val)=>{
			return session_table__database_session_(val)
		})
	}
	public async session__set(session:DatabaseSession):Promise<void> {
		await this.db
			.insert(this.session_tbl)
			.values({
				id: session.id,
				person_id: session.person_id,
				expire_dts: session.expire_dts,
				...session.attributes
			})
			.run()
	}
	public async session_expiration__update(session_id:string, expire_dts:Date):Promise<void> {
		await this.db
			.update(this.session_tbl)
			.set({ expire_dts })
			.where(eq(this.session_tbl.id, session_id))
			.run()
	}
	public async expired_session_all__delete():Promise<void> {
		await this.db
			.delete(this.session_tbl)
			.where(lte(this.session_tbl.expire_dts, new Date()))
	}
}
export type SQLitePersonTable = SQLiteTableWithColumns<{
	dialect:'sqlite'
	columns:{
		id:SQLiteColumn<
			{
				name:any
				tableName:any
				dataType:any
				columnType:any
				data:string
				driverParam:any
				notNull:true
				hasDefault:boolean // must be boolean instead of any to allow default values
				enumValues:any
				baseColumn:any
			},
			object
		>
	}
	schema:any
	name:any
}>
export type SQLiteSessionTable = SQLiteTableWithColumns<{
	dialect:any
	columns:{
		id:SQLiteColumn<
			{
				dataType:any
				notNull:true
				enumValues:any
				tableName:any
				columnType:any
				data:string
				driverParam:any
				hasDefault:false
				name:any
			},
			object
		>
		expire_dts:SQLiteColumn<
			{
				dataType:'date'
				notNull:true
				enumValues:any
				tableName:any
				columnType:any
				data:Date
				driverParam:any
				hasDefault:false
				name:any
			},
			object
		>
		person_id:SQLiteColumn<
			{
				dataType:'string'
				notNull:true
				enumValues:any
				tableName:any
				columnType:any
				data:string
				driverParam:any
				hasDefault:false
				name:any
			},
			object
		>
	}
	schema:any
	name:any
}>
function session_table__database_session_(raw:InferSelectModel<SQLiteSessionTable>):DatabaseSession {
	const { id, person_id, expire_dts, ...attributes } = raw
	return {
		person_id,
		id,
		expire_dts,
		attributes
	}
}
function person_tbl__database_person_(raw:InferSelectModel<SQLitePersonTable>):DatabasePerson {
	const { id, ...attributes } = raw
	return {
		id,
		attributes
	}
}
