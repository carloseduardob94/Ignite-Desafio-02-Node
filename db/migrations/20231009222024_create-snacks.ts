import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('snacks', (tables) => {
    tables.uuid('id').primary()
    tables.text('name').notNullable()
    tables.string('description').notNullable()
    tables.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
    tables.boolean('on_diet')
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('snacks')
}

