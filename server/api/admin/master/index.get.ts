import { masterRequest } from '../../../utils/master-http'
import { readMaster } from '../../../utils/master-store'

export default defineEventHandler(event =>
  masterRequest(event, false, pool => readMaster(pool))
)
