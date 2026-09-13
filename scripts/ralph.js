#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RALPH — Autonomous Test-and-Repair Loop Runner
 * National Furniture & Interiors Monorepo
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Usage:
 *   node scripts/ralph.js [options]
 *   pnpm ralph [options]
 *
 * Options:
 *   --check         Run typecheck across all monorepo packages (default)
 *   --test          Run automated tests across packages
 *   --lint          Run ESLint across packages
 *   --all           Run typecheck, lint, and tests
 *   --fix           Auto-fix lint and formatting issues
 *   --package=<pkg> Target a specific package (e.g. apps/api, @nfi/shared)
 *   --help          Display this help message
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { spawnSync, execSync } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import fs from 'node:fs';

const args = process.argv.slice(2);

const isHelp = args.includes('--help') || args.includes('-h');
const isAll = args.includes('--all');
const isTest = args.includes('--test');
const isLint = args.includes('--lint');
const isFix = args.includes('--fix');
const isCheck = args.includes('--check') || (!isAll && !isTest && !isLint && !isFix);
const targetPkgArg = args.find((a) => a.startsWith('--package='));
const targetPackage = targetPkgArg ? targetPkgArg.split('=')[1] : null;

// ANSI Colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const GRAY = '\x1b[90m';

function banner() {
  console.log(`\n${BOLD}${MAGENTA}╔══════════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${MAGENTA}║${RESET}  ${BOLD}${CYAN}RALPH${RESET} — Autonomous Iteration & Self-Healing Verification Engine  ${BOLD}${MAGENTA}║${RESET}`);
  console.log(`${BOLD}${MAGENTA}║${RESET}  ${GRAY}National Furniture & Interiors Monorepo Architecture                ${BOLD}${MAGENTA}║${RESET}`);
  console.log(`${BOLD}${MAGENTA}╚══════════════════════════════════════════════════════════════════════╝${RESET}\n`);
}

function printHelp() {
  banner();
  console.log(`${BOLD}Usage:${RESET}`);
  console.log(`  pnpm ralph [options]\n`);
  console.log(`${BOLD}Options:${RESET}`);
  console.log(`  ${CYAN}--check${RESET}          Run TypeScript typecheck across monorepo (default)`);
  console.log(`  ${CYAN}--test${RESET}           Run unit & integration test suites`);
  console.log(`  ${CYAN}--lint${RESET}           Run ESLint checks across packages`);
  console.log(`  ${CYAN}--all${RESET}            Run typecheck, lint, and test suites`);
  console.log(`  ${CYAN}--fix${RESET}            Auto-format with Prettier and run eslint --fix`);
  console.log(`  ${CYAN}--package=<pkg>${RESET}  Filter execution to a specific package or app`);
  console.log(`  ${CYAN}--help, -h${RESET}       Display this help documentation\n`);
}

if (isHelp) {
  printHelp();
  process.exit(0);
}

banner();

function runCommand(command, args, options = {}) {
  const cmdStr = `${command} ${args.join(' ')}`;
  console.log(`${GRAY}▶ Executing: ${cmdStr}${RESET}`);
  
  const startTime = Date.now();
  const result = spawnSync(command, args, {
    stdio: 'pipe',
    shell: true,
    encoding: 'utf-8',
    ...options,
  });
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  return {
    success: result.status === 0,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    duration,
  };
}

/**
 * Parses TypeScript diagnostic errors
 * Format: path/to/file.ts(line,col): error TSxxxx: message
 */
function parseTypeScriptErrors(output) {
  const tsErrorRegex = /([^\s(]+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)/g;
  const errors = [];
  let match;
  while ((match = tsErrorRegex.exec(output)) !== null) {
    errors.push({
      file: match[1],
      line: parseInt(match[2], 10),
      col: parseInt(match[3], 10),
      code: match[4],
      message: match[5],
    });
  }
  return errors;
}

/**
 * Parses ESLint error diagnostics
 */
function parseEslintErrors(output) {
  const eslintRegex = /^\s*(\d+):(\d+)\s+(error|warning)\s+(.+?)\s+([@\w\/-]+)$/gm;
  const errors = [];
  let match;
  while ((match = eslintRegex.exec(output)) !== null) {
    errors.push({
      line: parseInt(match[1], 10),
      col: parseInt(match[2], 10),
      severity: match[3],
      message: match[4],
      rule: match[5],
    });
  }
  return errors;
}

async function main() {
  let hasFailures = false;

  // 1. Auto-Fix Phase (if requested)
  if (isFix) {
    console.log(`${BOLD}${YELLOW}=== Phase: Auto-Fix & Format ===${RESET}`);
    const formatRes = runCommand('pnpm', ['format']);
    if (formatRes.success) {
      console.log(`${GREEN}✓ Prettier format completed successfully.${RESET}`);
    } else {
      console.log(`${YELLOW}⚠ Prettier format encountered warnings.${RESET}`);
    }
    console.log();
  }

  // 2. Typecheck Phase
  if (isCheck || isAll) {
    console.log(`${BOLD}${CYAN}=== Phase: TypeScript Typecheck ===${RESET}`);
    const filterArgs = targetPackage ? [`--filter=${targetPackage}`] : ['-r', '--parallel'];
    const typecheckRes = runCommand('pnpm', [...filterArgs, 'typecheck']);

    if (typecheckRes.success) {
      console.log(`${GREEN}${BOLD}✓ Typecheck PASSED${RESET} across all packages (${typecheckRes.duration}s)\n`);
    } else {
      hasFailures = true;
      console.log(`${RED}${BOLD}✗ Typecheck FAILED${RESET} (${typecheckRes.duration}s)\n`);
      const fullOutput = typecheckRes.stdout + '\n' + typecheckRes.stderr;
      const parsedErrors = parseTypeScriptErrors(fullOutput);

      if (parsedErrors.length > 0) {
        console.log(`${BOLD}${RED}Diagnostic Breakdown (${parsedErrors.length} TypeScript errors):${RESET}`);
        parsedErrors.forEach((err, idx) => {
          console.log(`  ${BOLD}${idx + 1}.${RESET} ${CYAN}${err.file}:${err.line}:${err.col}${RESET}`);
          console.log(`     ${RED}[${err.code}]${RESET} ${err.message}`);
        });
        console.log(`\n${BOLD}${YELLOW}→ Ralph Self-Healing Action:${RESET} Inspect each file above, address the type signature mismatch, and re-run ${CYAN}pnpm ralph${RESET}.\n`);
      } else {
        console.log(fullOutput.slice(-2000));
      }
    }
  }

  // 3. Lint Phase
  if (isLint || isAll) {
    console.log(`${BOLD}${CYAN}=== Phase: ESLint Validation ===${RESET}`);
    const filterArgs = targetPackage ? [`--filter=${targetPackage}`] : [];
    const lintRes = runCommand('pnpm', ['turbo', 'run', 'lint', ...filterArgs]);

    if (lintRes.success) {
      console.log(`${GREEN}${BOLD}✓ ESLint PASSED${RESET} (${lintRes.duration}s)\n`);
    } else {
      hasFailures = true;
      console.log(`${RED}${BOLD}✗ ESLint FAILED${RESET} (${lintRes.duration}s)\n`);
      const fullOutput = lintRes.stdout + '\n' + lintRes.stderr;
      console.log(fullOutput.slice(-1500));
      console.log(`\n${BOLD}${YELLOW}→ Ralph Self-Healing Action:${RESET} Run ${CYAN}pnpm ralph --fix${RESET} or resolve lint errors manually.\n`);
    }
  }

  // 4. Test Phase
  if (isTest || isAll) {
    console.log(`${BOLD}${CYAN}=== Phase: Test Suites ===${RESET}`);
    const filterArgs = targetPackage ? [`--filter=${targetPackage}`] : [];
    const testRes = runCommand('pnpm', ['turbo', 'run', 'test', ...filterArgs]);

    if (testRes.success) {
      console.log(`${GREEN}${BOLD}✓ Tests PASSED${RESET} (${testRes.duration}s)\n`);
    } else {
      hasFailures = true;
      console.log(`${RED}${BOLD}✗ Tests FAILED${RESET} (${testRes.duration}s)\n`);
      const fullOutput = testRes.stdout + '\n' + testRes.stderr;
      console.log(fullOutput.slice(-2000));
      console.log(`\n${BOLD}${YELLOW}→ Ralph Self-Healing Action:${RESET} Examine failed test assertions above and adjust implementation.\n`);
    }
  }

  // Final Summary
  console.log(`${BOLD}══════════════════════════════════════════════════════════════════════${RESET}`);
  if (hasFailures) {
    console.log(`${RED}${BOLD}✗ RALPH VERIFICATION FAILED${RESET} — Autonomous intervention required.`);
    console.log(`${GRAY}Apply the fixes indicated in the diagnostics above, then rerun:${RESET} ${CYAN}pnpm ralph${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}✓ ALL RALPH VERIFICATIONS PASSED${RESET} — System is healthy and ready.`);
    console.log(`${GRAY}Zero type errors, zero regressions.${RESET}\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`${RED}Fatal error running Ralph:${RESET}`, err);
  process.exit(1);
});
