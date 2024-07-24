import { performance, PerformanceObserver } from "perf_hooks";
import stats from "stats-lite";
import chalk from "chalk";
import Table from "cli-table3";
import { v4 as uuidv4 } from "uuid";

interface BenchmarkOptions {
    iterations?: number;
    warmupIterations?: number;
    gcCollectionMode?: "auto" | "off";
}

interface BenchmarkResult {
    name: string;
    averageTime: number;
    minTime: number;
    maxTime: number;
    median: number;
    p75: number;
    p95: number;
    p99: number;
    stdDev: number;
}

class Benchmark {
    private options: BenchmarkOptions;
    private groups: Map<string, Map<string, () => void>>;
    private currentGroup: string;

    constructor(options: BenchmarkOptions = {}) {
        this.options = {
            iterations: options.iterations || 1000,
            warmupIterations: options.warmupIterations || 100,
            gcCollectionMode: options.gcCollectionMode || "auto",
        };
        this.groups = new Map();
        this.currentGroup = "default";
    }

    group(name: string): Benchmark {
        this.currentGroup = name;
        if (!this.groups.has(name)) {
            this.groups.set(name, new Map());
        }
        return this;
    }

    withBench(name: string, fn: () => void): Benchmark {
        const group = this.groups.get(this.currentGroup);
        if (!group) {
            throw new Error(`Group ${this.currentGroup} not found`);
        }
        group.set(name, fn);
        return this;
    }

    private async runBenchmark(fn: () => void): Promise<number[]> {
        const times: number[] = [];
        const observer = new PerformanceObserver((list) => {
            const entry = list.getEntries()[0];
            times.push(entry!.duration * 1e6); // Convert to nanoseconds
        });
        observer.observe({ entryTypes: ["measure"], buffered: false });

        for (let i = 0; i < this.options.iterations!; i++) {
            if (this.options.gcCollectionMode === "auto") {
                global.gc && global.gc();
            }
            const id = uuidv4();
            performance.mark(`start-${id}`);
            await fn();
            performance.mark(`end-${id}`);
            performance.measure(`benchmark-${id}`, `start-${id}`, `end-${id}`);
        }

        observer.disconnect();
        return times;
    }

    private calculateStats(times: number[]): BenchmarkResult {
        return {
            name: "",
            averageTime: stats.mean(times),
            minTime: Math.min(...times),
            maxTime: Math.max(...times),
            median: stats.median(times),
            p75: stats.percentile(times, 0.75),
            p95: stats.percentile(times, 0.95),
            p99: stats.percentile(times, 0.99),
            stdDev: stats.stdev(times),
        };
    }

    private formatTime(ns: number): string {
        if (ns < 1000) return `${ns.toFixed(2)} ns`;
        if (ns < 1000000) return `${(ns / 1000).toFixed(2)} µs`;
        if (ns < 1000000000) return `${(ns / 1000000).toFixed(2)} ms`;
        return `${(ns / 1000000000).toFixed(2)} s`;
    }

    async run(): Promise<void> {
        for (const [groupName, benchmarks] of this.groups) {
            console.log(chalk.bold(`\nBenchmark Group: ${groupName}`));

            const table = new Table({
                head: [
                    "Benchmark",
                    "Avg Time",
                    "Min Time",
                    "Max Time",
                    "Median",
                    "p75",
                    "p95",
                    "p99",
                    "Std Dev",
                ],
                style: { head: ["cyan"] },
            });

            const results: BenchmarkResult[] = [];

            for (const [name, fn] of benchmarks) {
                console.log(chalk.yellow(`Running benchmark: ${name}`));

                // Warm-up
                for (let i = 0; i < this.options.warmupIterations!; i++) {
                    await fn();
                }

                const times = await this.runBenchmark(fn);
                const stats = this.calculateStats(times);
                stats.name = name;
                results.push(stats);

                table.push([
                    name,
                    this.formatTime(stats.averageTime),
                    this.formatTime(stats.minTime),
                    this.formatTime(stats.maxTime),
                    this.formatTime(stats.median),
                    this.formatTime(stats.p75),
                    this.formatTime(stats.p95),
                    this.formatTime(stats.p99),
                    this.formatTime(stats.stdDev),
                ]);
            }

            console.log(table.toString());

            console.log(chalk.bold("\nSummary:"));
            const fastest = results.reduce((a, b) =>
                a.averageTime < b.averageTime ? a : b,
            );
            for (const result of results) {
                if (result !== fastest) {
                    const timesDifference =
                        result.averageTime / fastest.averageTime;
                    console.log(
                        chalk.magenta(
                            `${result.name} is ${timesDifference.toFixed(
                                2,
                            )}x slower than ${fastest.name}`,
                        ),
                    );
                } else {
                    console.log(chalk.green(`${result.name} is the fastest`));
                }
            }
        }
    }
}

export { Benchmark, type BenchmarkOptions };
