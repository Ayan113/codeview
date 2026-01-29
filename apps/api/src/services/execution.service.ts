import { spawn, ChildProcess } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import logger from '../utils/logger';

interface ExecutionResult {
    success: boolean;
    output: string;
    error?: string;
    executionTime: number;
    memoryUsed?: number;
}

interface ExecutionOptions {
    code: string;
    language: string;
    input?: string;
    timeoutMs?: number;
}

const LANGUAGE_CONFIG: Record<string, { extension: string; command: string; args: (file: string) => string[] }> = {
    javascript: {
        extension: 'js',
        command: 'node',
        args: (file) => [file],
    },
    python: {
        extension: 'py',
        command: 'python3',
        args: (file) => [file],
    },
    typescript: {
        extension: 'ts',
        command: 'npx',
        args: (file) => ['ts-node', file],
    },
};

const TEMP_DIR = path.join(process.cwd(), '.temp', 'executions');

export class CodeExecutionService {
    private static initialized = false;

    static async initialize(): Promise<void> {
        if (!existsSync(TEMP_DIR)) {
            await mkdir(TEMP_DIR, { recursive: true });
        }
        this.initialized = true;
        logger.info('Code execution service initialized');
    }

    static async execute(options: ExecutionOptions): Promise<ExecutionResult> {
        if (!this.initialized) {
            await this.initialize();
        }

        const { code, language, input, timeoutMs = config.codeExecutionTimeout } = options;
        const startTime = Date.now();

        const langConfig = LANGUAGE_CONFIG[language];
        if (!langConfig) {
            return {
                success: false,
                output: '',
                error: `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_CONFIG).join(', ')}`,
                executionTime: 0,
            };
        }

        const executionId = uuidv4();
        const fileName = `exec_${executionId}.${langConfig.extension}`;
        const filePath = path.join(TEMP_DIR, fileName);

        try {
            // Write code to temp file
            await writeFile(filePath, code, 'utf-8');

            // Execute code
            const result = await this.runProcess(
                langConfig.command,
                langConfig.args(filePath),
                input,
                timeoutMs
            );

            const executionTime = Date.now() - startTime;

            return {
                ...result,
                executionTime,
            };
        } catch (error: any) {
            logger.error({ error, executionId }, 'Code execution failed');
            return {
                success: false,
                output: '',
                error: error.message || 'Execution failed',
                executionTime: Date.now() - startTime,
            };
        } finally {
            // Cleanup temp file
            try {
                await unlink(filePath);
            } catch {
                // Ignore cleanup errors
            }
        }
    }

    private static runProcess(
        command: string,
        args: string[],
        input?: string,
        timeoutMs: number = 10000
    ): Promise<{ success: boolean; output: string; error?: string }> {
        return new Promise((resolve) => {
            let stdout = '';
            let stderr = '';
            let killed = false;

            const childProc: ChildProcess = spawn(command, args, {
                timeout: timeoutMs,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, NODE_ENV: 'production' },
            });

            // Set timeout
            const timeout = setTimeout(() => {
                killed = true;
                childProc.kill('SIGKILL');
                resolve({
                    success: false,
                    output: stdout,
                    error: `Execution timed out after ${timeoutMs}ms`,
                });
            }, timeoutMs);

            childProc.stdout?.on('data', (data) => {
                stdout += data.toString();
                // Limit output size
                if (stdout.length > 100000) {
                    killed = true;
                    childProc.kill('SIGKILL');
                    resolve({
                        success: false,
                        output: stdout.slice(0, 100000) + '\n...[output truncated]',
                        error: 'Output exceeded maximum size',
                    });
                }
            });

            childProc.stderr?.on('data', (data) => {
                stderr += data.toString();
            });

            childProc.on('close', (code) => {
                clearTimeout(timeout);
                if (killed) return;

                resolve({
                    success: code === 0,
                    output: stdout.trim(),
                    error: stderr.trim() || undefined,
                });
            });

            childProc.on('error', (err) => {
                clearTimeout(timeout);
                if (killed) return;

                resolve({
                    success: false,
                    output: '',
                    error: err.message,
                });
            });

            // Send input if provided
            if (input && childProc.stdin) {
                childProc.stdin.write(input);
                childProc.stdin.end();
            }
        });
    }

    static async validateTestCases(
        code: string,
        language: string,
        testCases: Array<{ input: string; expectedOutput: string }>
    ): Promise<{
        passed: number;
        failed: number;
        results: Array<{ passed: boolean; input: string; expected: string; actual: string }>;
    }> {
        const results = [];
        let passed = 0;
        let failed = 0;

        for (const testCase of testCases) {
            const result = await this.execute({
                code,
                language,
                input: testCase.input,
            });

            const actualOutput = result.output.trim();
            const expectedOutput = testCase.expectedOutput.trim();
            const testPassed = actualOutput === expectedOutput;

            if (testPassed) {
                passed++;
            } else {
                failed++;
            }

            results.push({
                passed: testPassed,
                input: testCase.input,
                expected: expectedOutput,
                actual: actualOutput,
            });
        }

        return { passed, failed, results };
    }
}
