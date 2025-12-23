/**
 * Development server commands
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { DEV_SERVER_FILE } = require('../lib/config');
const {
  isPortAvailable,
  findAvailablePort,
  detectPackageManager,
  detectFramework,
  getDevCommand,
  waitForServer,
} = require('../lib/utils');

const commands = {
  async 'dev-server-start'(args, options) {
    const projectDir = path.resolve(args[0] || '.');
    const preferredPort = parseInt(args[1]) || 3000;

    // Check if project exists
    if (!fs.existsSync(path.join(projectDir, 'package.json'))) {
      console.log(JSON.stringify({
        success: false,
        error: 'No package.json found in project directory',
        projectDir
      }));
      process.exit(1);
    }

    // Check if a dev server is already running
    if (fs.existsSync(DEV_SERVER_FILE)) {
      try {
        const existing = JSON.parse(fs.readFileSync(DEV_SERVER_FILE, 'utf-8'));
        try {
          process.kill(existing.pid, 0);
          console.log(JSON.stringify({
            success: false,
            error: 'A dev server is already running',
            existing,
            hint: 'Use dev-server-stop to stop it first'
          }));
          process.exit(1);
        } catch (e) {
          fs.unlinkSync(DEV_SERVER_FILE);
        }
      } catch (e) {}
    }

    // Detect package manager and framework
    const packageManager = detectPackageManager(projectDir);
    const framework = detectFramework(projectDir);

    console.log(JSON.stringify({
      status: 'info',
      message: `Detected ${framework} project with ${packageManager}`
    }));

    // Find available port
    let port = preferredPort;
    if (!(await isPortAvailable(port))) {
      console.log(JSON.stringify({
        status: 'info',
        message: `Port ${preferredPort} is in use, finding available port...`
      }));
      port = await findAvailablePort(preferredPort);
    }

    // Get the command to run
    const devCommand = options.command || getDevCommand(framework, packageManager, port);

    console.log(JSON.stringify({
      status: 'info',
      message: `Starting dev server: ${devCommand}`
    }));

    // Start the dev server
    const serverProcess = spawn('sh', ['-c', devCommand], {
      cwd: projectDir,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Capture some initial output for debugging
    let output = '';
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    serverProcess.stderr.on('data', (data) => {
      output += data.toString();
    });

    serverProcess.unref();

    const serverUrl = `http://localhost:${port}`;

    // Save server info
    const serverInfo = {
      pid: serverProcess.pid,
      port,
      url: serverUrl,
      projectDir,
      framework,
      packageManager,
      command: devCommand,
      startedAt: new Date().toISOString()
    };

    fs.writeFileSync(DEV_SERVER_FILE, JSON.stringify(serverInfo, null, 2));

    // Wait for server to be ready
    console.log(JSON.stringify({
      status: 'info',
      message: 'Waiting for server to be ready...'
    }));

    const isReady = await waitForServer(serverUrl, 30000);

    if (isReady) {
      console.log(JSON.stringify({
        success: true,
        message: 'Dev server started successfully',
        ...serverInfo
      }));
    } else {
      console.log(JSON.stringify({
        success: true,
        warning: 'Server started but may not be ready yet',
        hint: 'The server process is running, but could not verify it is responding. Check the output manually.',
        ...serverInfo,
        initialOutput: output.slice(0, 500)
      }));
    }
  },

  async 'dev-server-stop'(args, options) {
    if (!fs.existsSync(DEV_SERVER_FILE)) {
      console.log(JSON.stringify({
        success: false,
        error: 'No dev server is currently running (no state file found)'
      }));
      process.exit(1);
    }

    try {
      const serverInfo = JSON.parse(fs.readFileSync(DEV_SERVER_FILE, 'utf-8'));

      // Try to kill the process and its children
      try {
        process.kill(-serverInfo.pid, 'SIGTERM');
      } catch (e) {
        try {
          process.kill(serverInfo.pid, 'SIGTERM');
        } catch (e2) {
          // Process might already be dead
        }
      }

      fs.unlinkSync(DEV_SERVER_FILE);

      console.log(JSON.stringify({
        success: true,
        message: 'Dev server stopped',
        stoppedServer: serverInfo
      }));
    } catch (e) {
      console.log(JSON.stringify({
        success: false,
        error: 'Failed to stop dev server',
        details: e.message
      }));
      process.exit(1);
    }
  },

  async 'dev-server-status'(args, options) {
    if (!fs.existsSync(DEV_SERVER_FILE)) {
      console.log(JSON.stringify({
        success: true,
        running: false,
        message: 'No dev server is currently running'
      }));
      return;
    }

    try {
      const serverInfo = JSON.parse(fs.readFileSync(DEV_SERVER_FILE, 'utf-8'));

      // Check if process is still running
      let isRunning = false;
      try {
        process.kill(serverInfo.pid, 0);
        isRunning = true;
      } catch (e) {
        isRunning = false;
      }

      // Check if server is responding
      const isResponding = isRunning ? await waitForServer(serverInfo.url, 3000) : false;

      if (!isRunning) {
        fs.unlinkSync(DEV_SERVER_FILE);
      }

      console.log(JSON.stringify({
        success: true,
        running: isRunning,
        responding: isResponding,
        serverInfo: isRunning ? serverInfo : null,
        message: isRunning
          ? (isResponding ? 'Dev server is running and responding' : 'Dev server is running but not responding')
          : 'Dev server process has stopped (stale state cleaned up)'
      }));
    } catch (e) {
      console.log(JSON.stringify({
        success: false,
        error: 'Failed to check dev server status',
        details: e.message
      }));
    }
  },
};

module.exports = commands;
