import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { vibecodeFullPrompt } from '../prompts';
import { codegenResultSchema } from './schema'
import { CodegenInput, CodegenResult } from './types';
import { parseCodegenXml } from './xml/parser';


export async function generateCode(input: CodegenInput): Promise<CodegenResult> {
  const { object } = await generateObject({
    model: google('gemini-3-pro-preview'),
    system: vibecodeFullPrompt,
    schema: codegenResultSchema,
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingLevel: 'high'
        }
      }
    },
    ...input,
  });

  return parseCodegenXml(object.xml);
}
