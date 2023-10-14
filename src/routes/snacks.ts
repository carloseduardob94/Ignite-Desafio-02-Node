import { FastifyInstance } from "fastify";
import { z } from "zod";
import { knex } from "../database";
import { checkSessionIdExist } from "../middlewares/check-session-id-exist";
import { randomUUID } from "crypto";
import { Knex } from "knex";

export async function SnacksRoutes(app: FastifyInstance) {
  app.get('/', {
    preHandler: [checkSessionIdExist]
  }, async (request, reply) => {
    const { sessionId } = request.cookies

    const user = await knex('users')
      .where('session_id', sessionId)
      .first()

    if(!user){
      return reply.status(403).send({
        error: 'Session ID does not exist'
      })
    }

    const snacks = await knex('snacks')
      .where('user_id', user.id)
      .select()

    return { snacks }
  })

  app.get('/summary', {
    preHandler: [checkSessionIdExist]
  }, async (request, reply) => {
    const { sessionId } = request.cookies

    const user = await knex('users')
      .where('session_id', sessionId)
      .first()

    if(!user){
      return reply.status(403).send({
        error: 'Session ID does not exist'
      })
    }

    const data = await knex('snacks')
      .select()
      .count('snacks.id', {
        as: 'total'
      })

      // Buscar apenas os snacks que não estão na dieta
    .with('snacks_not_on_diet', (qb) => {
      qb.select('id').from('snacks').where({
        user_id: user.id,
        on_diet: false
      })
    })

    .leftJoin('snacks_not_on_diet', 'snacks_not_on_diet.id', 'snacks.id')
    .count('snacks_not_on_diet.id', {
      as: 'not_on_diet',
    })

    // Buscar apenas os snacks que estão na dieta
    .with('snacks_on_diet', (qb) => {
      qb.select('id').from('snacks').where({
        user_id: user.id,
        on_diet: true,
      })
    })

    .leftJoin('snacks_on_diet', 'snacks_on_diet.id', 'snacks.id')
    .count('snacks_on_diet.id', {
      as: 'on_diet',
    })

    //Buscar a melhor sequência de refeições dentro da dieta
    .with('best_sequence', (qb: Knex.QueryBuilder) => {
      qb.count('*', {
        as: 'count'
      })

      .from((qb: Knex.QueryBuilder) => {
        qb.select('id', 'on_diet')
          .rowNumber('seqnum', function () {
            this.orderBy('id').partitionBy('on_diet')
          })
          .from('snacks')
          .as('t')
          .where({
            user_id: user.id,
            on_diet: true
          })
      })
      .groupBy('on_diet')
      .groupByRaw('(id - seqnum)')
      .orderBy('on_diet')
      .orderByRaw('count(*) desc')
      .limit(1)
    })
    .join('best_sequence', knex.raw('1 = 1'))
    .select('best_sequence.count as best_sequence')
    .groupBy('best_sequence.count')

    .where('user_id', user.id)
    .first()

    return { data }


  })

  app.get('/:id', {
    preHandler: [checkSessionIdExist]
  }, async (request, reply) => {
    const { sessionId } = request.cookies
    const user = await knex('users')
      .where('session_id', sessionId)
      .first()

    if(!user) {
      return reply.status(403).send({
        error: 'Session ID does not exist'
      })
    }

    const getSnacksParamsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = getSnacksParamsSchema.parse(request.params)

    const snack = await knex('snacks')
      .select()
      .where({
        id,
        user_id: user.id
      })

    return { snack }
  })


  app.post('/', {
    preHandler: [checkSessionIdExist]
  }, async (request, reply) => {
    const sessionIdSchema = z.object({
      sessionId: z.string().uuid()
    })

    const { sessionId } = sessionIdSchema.parse(request.cookies)
    const user = await knex('users')
      .where('session_id', sessionId)
      .first()

    if(!user) {
      return reply.status(403).send({
        error: 'Session ID does not exist'
      })
    }

    const createSnackBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      on_diet: z.boolean().default(false)
    })

    const { name, description, on_diet } = createSnackBodySchema.parse(request.body)

    await knex('snacks')
      .insert({
        id: randomUUID(),
        name,
        description,
        on_diet,
        user_id: user.id
      })

    return reply.status(201).send()
  })


  app.put('/:id', {
    preHandler: [checkSessionIdExist]
  }, async (request, reply) => {
    const sessionIdSchema = z.object({
      sessionId: z.string().uuid()
    })

    const { sessionId } = sessionIdSchema.parse(request.cookies)
    const user = await knex('users')
      .where('session_id', sessionId)
      .first()

    if(!user) {
      return reply.status(403).send({
        error: 'Session ID does not exist'
      })
    }

    const idSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = idSchema.parse(request.params)
    
    const createSnackBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      on_diet: z.boolean().default(false),
    })

    const { name, description, on_diet } = createSnackBodySchema.parse(request.body)

    await knex('snacks')
      .where({
        id,
        user_id: user.id
      })
      .update({
        name, 
        description, 
        on_diet,
      })
      .returning('*')

    return reply.status(201).send()
  })

  app.delete('/:id', {
    preHandler: [checkSessionIdExist]
  } ,async (request, reply) => {
    const sessionIdSchema = z.object({
      sessionId: z.string().uuid()
    })

    const { sessionId } = sessionIdSchema.parse(request.cookies)
    const user = await knex('users')
      .where('session_id', sessionId)
      .first()

    if(!user){
      return reply.status(403).send({
        error: 'Session ID does not exist'
      })
    }

    const idSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = idSchema.parse(request.params)

    const hasDeleted = await knex('snacks')
      .delete()
      .where({
        id,
        user_id: user.id
      })
    
      return reply.status(200).send()
  })
}