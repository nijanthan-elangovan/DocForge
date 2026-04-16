import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

interface GitHubFile {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
  size: number;
}

// Files to always fetch from root
const ROOT_FILES = [
  "README.md",
  "readme.md",
  "README",
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "setup.py",
  "setup.cfg",
  "composer.json",
  "Gemfile",
  "pom.xml",
  "build.gradle",
];

// Source code extensions worth reading
const CODE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs",
  ".py", ".go", ".rs", ".java", ".kt",
  ".rb", ".php", ".cs", ".swift", ".dart",
  ".vue", ".svelte", ".astro",
  ".c", ".cpp", ".h", ".hpp",
  ".graphql", ".gql", ".prisma",
  ".yaml", ".yml", ".toml", ".json",
  ".md", ".mdx",
]);

// Directories to skip
const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", "out",
  "__pycache__", ".cache", "coverage", ".turbo",
  "vendor", "target", ".idea", ".vscode",
  "public", "static", "assets", "images", "fonts",
  ".github", ".husky", ".changeset",
]);

// Files to skip
const SKIP_FILES = new Set([
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
  "bun.lockb", "composer.lock", "Gemfile.lock",
  "Cargo.lock", "go.sum", "poetry.lock",
  ".eslintrc.json", ".prettierrc", "tsconfig.json",
  "next.config.ts", "next.config.js", "next.config.mjs",
  "tailwind.config.ts", "tailwind.config.js",
  "postcss.config.js", "postcss.config.mjs",
  "vite.config.ts", "webpack.config.js",
]);

const MAX_FILE_SIZE = 80_000; // 80KB per file
const MAX_TOTAL_CHARS = 300_000; // 300K total for more code coverage
const MAX_FILES = 60; // cap total files fetched
const MAX_DEPTH = 4; // directory recursion depth

const githubHeaders = { Accept: "application/vnd.github.v3+json" };

function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

function isSourceFile(file: GitHubFile): boolean {
  if (SKIP_FILES.has(file.name)) return false;
  if (file.size > MAX_FILE_SIZE || file.size === 0) return false;
  return CODE_EXTENSIONS.has(getExtension(file.name));
}

// Priority: lower = fetched first. Entry points and core files first.
function filePriority(path: string): number {
  const name = path.split("/").pop()?.toLowerCase() || "";
  if (name === "readme.md" || name === "readme") return 0;
  if (name.includes("index") || name.includes("main") || name.includes("app")) return 1;
  if (name.includes("route") || name.includes("router") || name.includes("controller")) return 2;
  if (name.includes("server") || name.includes("handler") || name.includes("middleware")) return 3;
  if (name.includes("model") || name.includes("schema") || name.includes("types")) return 4;
  if (name.includes("service") || name.includes("util") || name.includes("helper") || name.includes("lib")) return 5;
  if (name.includes("component") || name.includes("page")) return 6;
  if (name.endsWith(".md") || name.endsWith(".mdx")) return 7;
  if (name.endsWith(".json") || name.endsWith(".yaml") || name.endsWith(".yml") || name.endsWith(".toml")) return 8;
  if (name.includes("test") || name.includes("spec") || name.includes("__test")) return 10;
  return 9;
}

async function fetchDirRecursive(
  owner: string,
  repo: string,
  dirPath: string,
  depth: number,
  collected: GitHubFile[]
): Promise<void> {
  if (depth > MAX_DEPTH || collected.length >= MAX_FILES * 2) return;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`,
      { headers: githubHeaders }
    );
    if (!res.ok) return;

    const items: GitHubFile[] = await res.json();

    for (const item of items) {
      if (item.type === "file" && isSourceFile(item)) {
        collected.push(item);
      } else if (item.type === "dir" && !SKIP_DIRS.has(item.name.toLowerCase())) {
        await fetchDirRecursive(owner, repo, item.path, depth + 1, collected);
      }
    }
  } catch {
    // skip unreachable directories
  }
}

export async function POST(req: NextRequest) {
  try {
    const { repoUrl } = await req.json();

    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
    }

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/\s#?]+)/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid GitHub URL. Use format: https://github.com/owner/repo" },
        { status: 400 }
      );
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");

    // Fetch repo metadata
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: githubHeaders,
    });

    if (!repoRes.ok) {
      return NextResponse.json(
        { error: `Repository not found: ${owner}/${repo}` },
        { status: 404 }
      );
    }

    const repoData = await repoRes.json();

    // Fetch root contents
    const contentsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents`,
      { headers: githubHeaders }
    );

    if (!contentsRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch repository contents" },
        { status: 500 }
      );
    }

    const rootContents: GitHubFile[] = await contentsRes.json();

    // 1. Collect root-level relevant files (README, package.json, etc.)
    const rootFiles = rootContents.filter(
      (f) =>
        f.type === "file" &&
        f.size < MAX_FILE_SIZE &&
        ROOT_FILES.some((r) => f.name.toLowerCase() === r.toLowerCase())
    );

    // 2. Recursively collect source code files from all directories
    const sourceFiles: GitHubFile[] = [];

    // Also grab root source files
    for (const item of rootContents) {
      if (item.type === "file" && isSourceFile(item)) {
        sourceFiles.push(item);
      }
    }

    // Crawl directories in parallel (batch top-level dirs)
    const dirs = rootContents.filter(
      (f) => f.type === "dir" && !SKIP_DIRS.has(f.name.toLowerCase())
    );

    await Promise.all(
      dirs.map((dir) => fetchDirRecursive(owner, repo, dir.path, 1, sourceFiles))
    );

    // Sort by priority and cap
    sourceFiles.sort((a, b) => filePriority(a.path) - filePriority(b.path));
    const filesToFetch = [
      ...rootFiles,
      ...sourceFiles.filter((sf) => !rootFiles.some((rf) => rf.path === sf.path)),
    ].slice(0, MAX_FILES);

    // 3. Fetch file contents
    let totalChars = 0;
    const fileContents: string[] = [];

    // Fetch in batches of 10 for speed
    for (let i = 0; i < filesToFetch.length; i += 10) {
      if (totalChars > MAX_TOTAL_CHARS) break;

      const batch = filesToFetch.slice(i, i + 10);
      const results = await Promise.all(
        batch.map(async (file) => {
          if (!file.download_url) return null;
          try {
            const fileRes = await fetch(file.download_url);
            if (!fileRes.ok) return null;
            return { path: file.path, text: await fileRes.text() };
          } catch {
            return null;
          }
        })
      );

      for (const result of results) {
        if (!result || totalChars > MAX_TOTAL_CHARS) continue;
        const trimmed = result.text.slice(0, MAX_FILE_SIZE);
        fileContents.push(`\n--- FILE: ${result.path} ---\n${trimmed}`);
        totalChars += trimmed.length;
      }
    }

    // 4. Build directory tree for structure overview
    const allPaths = [...rootContents.map((f) => f.name), ...sourceFiles.map((f) => f.path)];
    const uniqueDirs = new Set<string>();
    for (const p of allPaths) {
      const parts = p.split("/");
      for (let i = 1; i <= parts.length; i++) {
        uniqueDirs.add(parts.slice(0, i).join("/"));
      }
    }
    const treeLines = Array.from(uniqueDirs).sort().slice(0, 100);

    const aggregated = `# Repository: ${repoData.full_name}

**Description:** ${repoData.description || "No description"}
**Language:** ${repoData.language || "Unknown"}
**Stars:** ${repoData.stargazers_count} | **Forks:** ${repoData.forks_count}
**Topics:** ${repoData.topics?.join(", ") || "None"}
**License:** ${repoData.license?.name || "Not specified"}
**Last updated:** ${repoData.updated_at}

## Project Structure
\`\`\`
${treeLines.join("\n")}
\`\`\`

## Source Code & Files (${fileContents.length} files, ~${Math.round(totalChars / 1000)}K chars)
${fileContents.join("\n") || "No readable files found."}
`;

    return NextResponse.json({
      content: aggregated,
      repoName: repoData.full_name,
      description: repoData.description,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch repository";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
