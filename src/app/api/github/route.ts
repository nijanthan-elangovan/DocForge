import { NextRequest, NextResponse } from "next/server";

interface GitHubFile {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
  size: number;
}

const RELEVANT_FILES = [
  "README.md",
  "readme.md",
  "README",
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  "docs/",
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "setup.py",
  "setup.cfg",
];

const MAX_FILE_SIZE = 100_000; // 100KB per file
const MAX_TOTAL_CHARS = 200_000;

export async function POST(req: NextRequest) {
  try {
    const { repoUrl } = await req.json();

    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
    }

    // Parse GitHub URL: support github.com/owner/repo formats
    const match = repoUrl.match(
      /github\.com\/([^/]+)\/([^/\s#?]+)/
    );

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
      headers: { Accept: "application/vnd.github.v3+json" },
    });

    if (!repoRes.ok) {
      return NextResponse.json(
        { error: `Repository not found: ${owner}/${repo}` },
        { status: 404 }
      );
    }

    const repoData = await repoRes.json();

    // Fetch root file listing
    const contentsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents`,
      { headers: { Accept: "application/vnd.github.v3+json" } }
    );

    if (!contentsRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch repository contents" },
        { status: 500 }
      );
    }

    const contents: GitHubFile[] = await contentsRes.json();

    // Collect relevant files
    const filesToFetch: GitHubFile[] = contents.filter(
      (f) =>
        f.type === "file" &&
        f.size < MAX_FILE_SIZE &&
        RELEVANT_FILES.some(
          (r) => f.name.toLowerCase() === r.toLowerCase() || f.path.startsWith(r)
        )
    );

    // Also check for src/lib/app directories to get a structure overview
    const srcDirs = contents.filter(
      (f) =>
        f.type === "dir" &&
        ["src", "lib", "app", "docs", "api", "pkg", "cmd"].includes(f.name.toLowerCase())
    );

    let structureText = "";
    for (const dir of srcDirs.slice(0, 3)) {
      try {
        const dirRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${dir.path}`,
          { headers: { Accept: "application/vnd.github.v3+json" } }
        );
        if (dirRes.ok) {
          const dirContents: GitHubFile[] = await dirRes.json();
          structureText += `\n### ${dir.path}/\n`;
          structureText += dirContents
            .slice(0, 20)
            .map((f) => `- ${f.name} (${f.type})`)
            .join("\n");
        }
      } catch {
        // skip
      }
    }

    // Fetch file contents
    let totalChars = 0;
    const fileContents: string[] = [];

    for (const file of filesToFetch) {
      if (totalChars > MAX_TOTAL_CHARS) break;
      if (!file.download_url) continue;

      try {
        const fileRes = await fetch(file.download_url);
        if (fileRes.ok) {
          const text = await fileRes.text();
          const trimmed = text.slice(0, MAX_FILE_SIZE);
          fileContents.push(`\n--- FILE: ${file.path} ---\n${trimmed}`);
          totalChars += trimmed.length;
        }
      } catch {
        // skip
      }
    }

    // Build the aggregated content
    const aggregated = `# Repository: ${repoData.full_name}

**Description:** ${repoData.description || "No description"}
**Language:** ${repoData.language || "Unknown"}
**Stars:** ${repoData.stargazers_count} | **Forks:** ${repoData.forks_count}
**Topics:** ${repoData.topics?.join(", ") || "None"}
**License:** ${repoData.license?.name || "Not specified"}
**Last updated:** ${repoData.updated_at}

## Repository Structure
${contents
  .slice(0, 30)
  .map((f) => `- ${f.name} (${f.type})`)
  .join("\n")}
${structureText}

## File Contents
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
