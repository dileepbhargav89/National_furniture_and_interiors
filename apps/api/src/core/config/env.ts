// Boot-time fail-fast validation — docs/06_project_structure.md §4.2, docs/09_security_architecture.md §5.2,
// docs/18_CLAUDE_CONSTITUTION.md §4.13 ("security by default", no silent/assumed config).
import { envSchema, type Env } from './env.schema';

/** Pure parse — throws a single, readable Error listing every invalid/missing variable. Never calls process.exit. */
export function parseEnv(raw: NodeJS.ProcessEnv): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid or missing environment variables:\n${issues}`);
  }
  return parsed.data;
}

/** Boot-time entry point — fails fast with a clear message and non-zero exit, never boots on bad config. */
function loadEnv(): Env {
  try {
    return parseEnv(process.env);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

export const env = loadEnv();
export type { Env };
