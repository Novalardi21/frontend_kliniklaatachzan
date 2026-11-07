import type { MasterKind } from '../../../../shared/types/master'
import { masterRequest } from '../../../utils/master-http'
import { saveMaster, MasterError } from '../../../utils/master-store'

export default defineEventHandler(event =>
  masterRequest(event, true, async (pool, actor) => {
    const kind = getRouterParam(event, 'kind') as MasterKind
    if (!['packages', 'methods', 'providers'].includes(kind))
      throw new MasterError(400, 'Jenis data tidak valid.')
    return saveMaster(pool, kind, await readBody(event), actor)
  })
)
