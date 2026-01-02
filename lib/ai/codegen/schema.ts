import { z } from 'zod'

export const codegenResultSchema = z.object({
  xml: z.string(),
})
