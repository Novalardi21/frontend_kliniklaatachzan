import { masterRequest } from '../../../utils/master-http'
import { saveCapacity } from '../../../utils/master-store'

export default defineEventHandler(event =>
  masterRequest(event, true, async (pool, actor) =>
    saveCapacity(pool, await readBody(event), actor)
  )
)
