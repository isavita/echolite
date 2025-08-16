import { spawn } from "node:child_process";

export type RunOpts = {
  env?: NodeJS.ProcessEnv;
};

/**
 * Spawns a child process and returns a promise that resolves when the process exits.
 * @param cmd The command to run.
 * @param args An array of command-line arguments.
 * @param opts Options, including environment variables.
 * @returns A promise that resolves on successful exit, or rejects on error or non-zero exit code.
 */
export function run(cmd: string, args: string[], opts?: RunOpts): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "pipe", env: opts?.env });
    let stderr = "";
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", (e) => reject(e));
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd} exited with code ${code}\n${stderr}`));
      }
    });
  });
}
