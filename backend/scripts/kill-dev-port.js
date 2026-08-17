const { execFile } = require('child_process');

const port = Number(process.argv[2] || process.env.PORT || 3001);

if (!Number.isInteger(port) || port <= 0) {
  console.error('Invalid port.');
  process.exit(1);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }

      resolve(stdout);
    });
  });
}

async function getWindowsListeningPids(targetPort) {
  let stdout = '';
  try {
    stdout = await run('powershell.exe', [
      '-NoProfile',
      '-Command',
      `$connections = Get-NetTCPConnection -LocalPort ${targetPort} -State Listen -ErrorAction SilentlyContinue; if ($connections) { $connections | Select-Object -ExpandProperty OwningProcess -Unique }`,
    ]);
  } catch {
    return [];
  }

  return stdout
    .split(/\r?\n/)
    .map((line) => Number(line.trim()))
    .filter((pid) => Number.isInteger(pid) && pid > 0);
}

async function getWindowsProcessName(pid) {
  try {
    const stdout = await run('tasklist.exe', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH']);
    const firstLine = stdout.split(/\r?\n/).find(Boolean);
    if (!firstLine || firstLine.includes('No tasks are running')) return '';

    return firstLine.split('","')[0]?.replace(/^"/, '') || '';
  } catch {
    const stdout = await run('powershell.exe', [
      '-NoProfile',
      '-Command',
      `(Get-Process -Id ${pid} -ErrorAction SilentlyContinue).ProcessName`,
    ]);
    const processName = stdout.trim();
    return processName ? `${processName}.exe` : '';
  }
}

async function killWindowsNodePort(targetPort) {
  const pids = await getWindowsListeningPids(targetPort);
  if (pids.length === 0) {
    console.log(`Port ${targetPort} is free.`);
    return;
  }

  for (const pid of pids) {
    const processName = await getWindowsProcessName(pid);
    if (processName.toLowerCase() !== 'node.exe') {
      console.error(`Port ${targetPort} is used by ${processName || `PID ${pid}`}. Stop it manually or choose another PORT.`);
      process.exit(1);
    }

    try {
      await run('taskkill.exe', ['/PID', String(pid), '/F']);
      console.log(`Stopped old backend dev process on port ${targetPort} (PID ${pid}).`);
    } catch (error) {
      const remainingPids = await getWindowsListeningPids(targetPort);
      if (!remainingPids.includes(pid)) {
        console.log(`Port ${targetPort} is free.`);
        continue;
      }

      throw error;
    }
  }
}

async function main() {
  if (process.platform !== 'win32') {
    console.log(`Port cleanup is only configured for Windows. Starting backend on port ${port}.`);
    return;
  }

  await killWindowsNodePort(port);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
