import fastify from 'fastify'
import { UserRoutes } from "./routes/users";
import cookie from '@fastify/cookie'
import { SnacksRoutes } from './routes/snacks';

export const app = fastify()

app.register(cookie)

app.register(UserRoutes, {
  prefix: 'users'
})

app.register(SnacksRoutes, {
  prefix: 'snacks'
})