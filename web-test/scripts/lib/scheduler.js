/**
 * Parallel Test Scheduler
 */

const path = require('path');
const { SCREENSHOTS_DIR } = require('./config');
const { handleWalletPopup } = require('./wallet-utils');

// Build dependency graph and detect cycles
function buildDependencyGraph(tasks) {
  const taskMap = new Map();
  const graph = new Map();

  // Create task map and initialize graph
  for (const task of tasks) {
    if (!task.id) throw new Error('Each task must have an "id" field');
    if (taskMap.has(task.id)) throw new Error(`Duplicate task id: ${task.id}`);
    taskMap.set(task.id, task);
    graph.set(task.id, new Set(task.depends || []));
  }

  // Validate dependencies exist
  for (const [taskId, deps] of graph) {
    for (const dep of deps) {
      if (!taskMap.has(dep)) {
        throw new Error(`Task "${taskId}" depends on unknown task "${dep}"`);
      }
    }
  }

  // Detect cycles using DFS
  const visited = new Set();
  const inStack = new Set();

  function hasCycle(taskId) {
    if (inStack.has(taskId)) return true;
    if (visited.has(taskId)) return false;

    visited.add(taskId);
    inStack.add(taskId);

    for (const dep of graph.get(taskId) || []) {
      if (hasCycle(dep)) return true;
    }

    inStack.delete(taskId);
    return false;
  }

  for (const taskId of graph.keys()) {
    if (hasCycle(taskId)) {
      throw new Error(`Circular dependency detected involving task "${taskId}"`);
    }
  }

  return { taskMap, graph };
}

// Execute a single step on a page
// context is optional, only needed for wallet popup handling
async function executeStep(taskPage, step, screenshotsDir, context = null) {
  const { action, ...params } = step;
  let walletResult = null;

  switch (action) {
    case 'navigate':
      // Use 'load' instead of 'networkidle' for faster navigation (networkidle can hang on polling/websocket pages)
      await taskPage.goto(params.url, { waitUntil: params.waitUntil || 'load', timeout: params.timeout || 15000 });
      break;
    case 'click':
      await taskPage.click(params.selector, { timeout: params.timeout || 10000 });
      // Auto-detect wallet popup after click (if context available and not ignored)
      if (context && step.walletAction !== 'ignore') {
        walletResult = await handleWalletPopup(
          context,
          step.walletAction || 'approve',
          3000
        );
        if (walletResult.testFailed) {
          throw new Error(`Wallet transaction failed: ${walletResult.error}`);
        }
      }
      break;
    case 'fill':
      await taskPage.fill(params.selector, params.value, { timeout: params.timeout || 10000 });
      break;
    case 'select':
      await taskPage.selectOption(params.selector, params.value, { timeout: params.timeout || 10000 });
      break;
    case 'check':
      await taskPage.check(params.selector, { timeout: params.timeout || 10000 });
      break;
    case 'uncheck':
      await taskPage.uncheck(params.selector, { timeout: params.timeout || 10000 });
      break;
    case 'wait':
      await taskPage.waitForTimeout(params.ms || 1000);
      break;
    case 'waitForSelector':
      await taskPage.waitForSelector(params.selector, { timeout: params.timeout || 30000 });
      break;
    case 'screenshot':
      const ssPath = path.join(screenshotsDir, params.name || `step-${Date.now()}.png`);
      await taskPage.screenshot({ path: ssPath, fullPage: params.fullPage || false });
      break;
    case 'evaluate':
      return await taskPage.evaluate(params.script);
    case 'type':
      await taskPage.type(params.selector, params.text, { delay: params.delay || 50 });
      break;
    case 'hover':
      await taskPage.hover(params.selector, { timeout: params.timeout || 10000 });
      break;
    case 'press':
      await taskPage.press(params.selector || 'body', params.key);
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }

  // Take screenshot after step if requested
  if (step.screenshot) {
    const ssPath = path.join(screenshotsDir, step.screenshot);
    await taskPage.screenshot({ path: ssPath, fullPage: step.fullPage || false });
  }

  // Return wallet result if any popup was handled
  return { walletResult };
}

// Parallel task scheduler class
class ParallelScheduler {
  constructor(browserContext, tasks, options = {}) {
    this.context = browserContext;
    this.tasks = tasks;
    this.maxParallel = options.maxParallel || 5;
    this.failFast = options.failFast || false;
    this.screenshotsDir = options.screenshotsDir || SCREENSHOTS_DIR;

    const { taskMap, graph } = buildDependencyGraph(tasks);
    this.taskMap = taskMap;
    this.dependencyGraph = graph;

    this.completed = new Set();
    this.failed = new Set();
    this.running = new Map(); // taskId -> Promise
    this.results = new Map(); // taskId -> { success, steps, error }
    this.aborted = false;
  }

  // Get tasks that are ready to run (all deps completed, not yet started)
  getReadyTasks() {
    const ready = [];
    for (const [taskId, deps] of this.dependencyGraph) {
      if (this.completed.has(taskId) || this.running.has(taskId) || this.failed.has(taskId)) {
        continue;
      }

      // Check if all dependencies are completed
      let allDepsCompleted = true;
      let anyDepFailed = false;
      for (const dep of deps) {
        if (!this.completed.has(dep)) {
          allDepsCompleted = false;
        }
        if (this.failed.has(dep)) {
          anyDepFailed = true;
        }
      }

      if (anyDepFailed) {
        // Skip this task as a dependency failed
        this.failed.add(taskId);
        this.results.set(taskId, {
          success: false,
          error: 'Skipped due to failed dependency',
          skipped: true
        });
        continue;
      }

      if (allDepsCompleted) {
        ready.push(taskId);
      }
    }
    return ready;
  }

  // Run a single task
  async runTask(taskId) {
    const task = this.taskMap.get(taskId);
    const stepResults = [];

    // Create a new page for this task
    const taskPage = await this.context.newPage();

    try {
      for (const step of task.steps || []) {
        if (this.aborted) break;

        try {
          const result = await executeStep(taskPage, step, this.screenshotsDir, this.context);
          stepResults.push({ step, success: true, result, walletResult: result?.walletResult });
        } catch (error) {
          stepResults.push({ step, success: false, error: error.message });

          if (task.stopOnError !== false) {
            throw error;
          }
        }
      }

      this.results.set(taskId, {
        success: stepResults.every(r => r.success),
        steps: stepResults
      });

      if (stepResults.every(r => r.success)) {
        this.completed.add(taskId);
      } else {
        this.failed.add(taskId);
        if (this.failFast) {
          this.aborted = true;
        }
      }
    } catch (error) {
      this.results.set(taskId, {
        success: false,
        steps: stepResults,
        error: error.message
      });
      this.failed.add(taskId);

      if (this.failFast) {
        this.aborted = true;
      }
    } finally {
      await taskPage.close();
      this.running.delete(taskId);
    }
  }

  // Main execution loop
  async run() {
    while (!this.aborted) {
      const ready = this.getReadyTasks();

      if (ready.length === 0 && this.running.size === 0) {
        // All tasks completed or no more can run
        break;
      }

      // Start new tasks up to maxParallel limit
      const toStart = ready.slice(0, this.maxParallel - this.running.size);

      for (const taskId of toStart) {
        const promise = this.runTask(taskId);
        this.running.set(taskId, promise);
      }

      // Wait for at least one task to complete
      if (this.running.size > 0) {
        await Promise.race(Array.from(this.running.values()));
      }
    }

    // Wait for any remaining running tasks
    await Promise.all(Array.from(this.running.values()));

    // Build results summary
    const results = [];
    for (const taskId of this.taskMap.keys()) {
      const result = this.results.get(taskId);
      results.push({
        taskId,
        ...result
      });
    }

    return {
      success: this.failed.size === 0,
      completed: this.completed.size,
      failed: this.failed.size,
      total: this.taskMap.size,
      aborted: this.aborted,
      results
    };
  }
}

module.exports = {
  buildDependencyGraph,
  executeStep,
  ParallelScheduler,
};
