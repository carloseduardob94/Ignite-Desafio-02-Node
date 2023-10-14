import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    snacks: {
      id: string
      name: string
      description: string
      created_at: string
      on_diet: boolean
      user_id: string
    },
    users: {
      id: string
      username: string
      session_id: string
    }
  }
}