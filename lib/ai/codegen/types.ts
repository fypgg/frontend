import { ModelMessage } from '@ai-sdk/provider-utils';

export type CodegenInput =
  | {
      prompt: string
      messages?: never
    }
  | {
      messages: ModelMessage[]
      prompt?: never
    }

export interface CodegenFileResult {
  file: string;
  description: string;
  content: string;
}

export interface CodegenResult {
  changes: CodegenFileResult[];
  rawXml: string;
}
