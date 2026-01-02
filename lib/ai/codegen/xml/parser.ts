import { CodegenResult } from '../types';

export function parseCodegenXml(xml: string): CodegenResult {
  if (xml.trim() === '') {
    throw new Error('Invalid XML input');
  }

  const trimmed = xml.trim();
  const blocks = Array.from(trimmed.matchAll(/<change>([\s\S]*?)<\/change>/g));
  const changes = blocks.map(match => {
    const body = match[1];
    return {
      file: extractTag(body, 'file'),
      description: extractTag(body, 'description'),
      content: extractCdata(body)
    };
  });

  return { changes, rawXml: xml };
}

export function encodeToXml(result: CodegenResult): string {
  const changesXml = result.changes
    .map(change => {
      return `  <change>
    <file>${change.file}</file>
    <description>${change.description}</description>
    <content><![CDATA[${change.content}]]></content>
  </change>`;
    })
    .join('\n');

  return `<changes>\n${changesXml}\n</changes>`;
}

function extractTag(source: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = source.match(regex);
  return match ? match[1].trim() : '';
}

function extractCdata(source: string): string {
  const regex = /<content><!\[CDATA\[([\s\S]*?)\]\]><\/content>/i;
  const match = source.match(regex);
  return match ? match[1] : '';
}
