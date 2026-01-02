import simpleGit from 'simple-git';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface SourceFile {
  path: string;
  content: string;
}

export async function gitPush(userId: string, appId: string, sources: SourceFile[]): Promise<void> {
  const token = process.env.GITHUB_TOKEN!;
  const repoUrl = process.env.GIT_REPO_URL!;

  if (!token || !repoUrl) throw new Error('Missing env vars: GITHUB_TOKEN, GIT_REPO_URL');

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'git-'));
  const git = simpleGit({ baseDir: tempDir, trimmed: true });

  try {
    await git.clone(authUrl(repoUrl, token), '.', { '--depth': 1 });

    await git.addConfig('user.name', process.env.GIT_COMMIT_NAME ?? '-');
    await git.addConfig('user.email', process.env.GIT_COMMIT_EMAIL ?? '-');

    const baseDir = path.join(tempDir, 'users', userId, 'apps', appId);

    for (const s of sources) {
      const rel = path.posix.normalize(s.path.replace(/\\/g, '/')).replace(/^\/+/, '');
      const abs = path.join(baseDir, rel);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, s.content, 'utf8');
    }

    const status = await git.status();
    if (!status.files.length) return;

    await git.add(['.']);
    await git.commit(`Update sources: users/${userId}/apps/${appId}`);
    await git.push('origin', 'HEAD');
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function authUrl(repoUrl: string, token: string): string {
  const url = new URL(repoUrl);
  url.username = 'x-access-token';
  url.password = token;
  return url.toString();
}


// https://u-1234-a-1234-844205600272.europe-west1.run.app/
// builds are published: user id app id - cloud project id - server