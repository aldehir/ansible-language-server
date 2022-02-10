import { CommandRunner } from '../../src/utils/commandRunner';
import { AssertionError, expect } from 'chai';
import { WorkspaceManager } from '../../src/services/workspaceManager';
import { createConnection } from 'vscode-languageserver/node';
import { getDoc } from '../helper';

describe('commandRunner', () => {
  const tests = [
    {
      args: ['ansible-config', 'dump'],
      rc: 0,
      stdout: 'ANSIBLE_FORCE_COLOR',
      stderr: '',
    },
    {
      args: ['ansible', '--version'],
      rc: 0,
      stdout: 'configured module search path',
      stderr: '',
    },
    {
      args: ['ansible-lint', '--version'],
      rc: 0,
      stdout: 'using ansible',
      stderr: '',
    },
    {
      args: ['ansible-playbook', 'missing-file'],
      rc: 1,
      stdout: '',
      stderr: 'ERROR! the playbook: missing-file could not be found',
    },
  ];

  tests.forEach(({ args, rc, stdout, stderr }) => {
    it(`call ${args.join(' ')}`, async function () {
      this.timeout(10000);
      process.argv.push('--node-ipc');
      const connection = createConnection();
      const workspaceManager = new WorkspaceManager(connection);
      const textDoc = await getDoc('yaml/ancestryBuilder.yml');
      const context = workspaceManager.getContext(textDoc.uri);
      const settings = await context.documentSettings.get(textDoc.uri);

      const commandRunner = new CommandRunner(connection, context, settings);
      try {
        const proc = await commandRunner.runCommand(
          args[0],
          args.slice(1).join(' ')
        );
        expect(proc.stdout, proc.stderr).contains(stdout);
        expect(proc.stderr, proc.stdout).contains(stderr);
      } catch (e) {
        if (e instanceof AssertionError) {
          throw e;
        }
        expect(e.code, e).equals(rc);
        expect(e.stdout, e).contains(stdout);
        expect(e.stderr, e).contains(stderr);
      }
    });
  });
});