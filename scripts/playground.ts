import 'dotenv/config';
import { generateCode } from '@/ai/codegen';
import { gitPush, SourceFile } from '@/git';

async function runGenerateCode() {
  const output = await generateCode({
    prompt: 'Create a simple 3d multiplayer clicker game.',
  });

  console.log(JSON.stringify(output.changes, null, 2));
}

async function runPushSources() {
  const userId = '1234';
  const appId = '1234';
  const sourceFiles: SourceFile[] = [
    {
      path: 'src/components/Button.tsx',
      content: 'Button'
    },
    {
      path: 'src/App.tsx',
      content: 'App'
    },
    {
      path: 'index.html',
      content: 'index'
    },
  ];

  await gitPush(userId, appId, sourceFiles);
}

runPushSources().then(r => console.log(r));