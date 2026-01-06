export type CliOptions = {
  http: boolean;
  insecure: boolean;
};

export function parseArgs(argv: string[]): CliOptions {
  const args = argv.slice(2);
  return {
    http: args.includes("--http") || process.env.HTTP === "1",
    insecure: args.includes("--insecure"),
  };
}
