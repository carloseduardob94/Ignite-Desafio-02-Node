import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('users', (table) => {
      table.uuid('id').primary()
      table.string('username').notNullable()
      table.uuid('session_id').notNullable().after('id').index()
    })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users')
}

