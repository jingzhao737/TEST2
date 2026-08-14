# AGENTS.md — Portfolio v2 Project Instructions

> **This file is for ALL AI agents working on this project.**
> Read this BEFORE making any changes.

## Project Overview

This is a personal portfolio website deployed via GitHub Pages.
- **Live URL**: https://jingzhao737.github.io/TEST2/
- **GitHub Repo**: https://github.com/jingzhao737/TEST2
- **Tech Stack**: Vanilla HTML/CSS/JS + GSAP (via CDN) + Three.js (via import map)
- **No build step needed** — the source code IS the deployed code
- **Full project context**: Read `PROJECT.md` for detailed design intent, architecture, and user preferences

## Project Structure

```
portfolio-v2/
├── index.html          # Main HTML (single-page app)
├── styles.css          # All CSS styles (~1200 lines)
├── ice.js              # 3D crystal model (Three.js)
├── js/modules/         # JavaScript modules (19 files)
├── images/             # Images and EXR environment maps
├── videos/             # MP4 video reels
├── sound/              # Audio files
├── Font/               # Google Sans font files
├── model/              # 3D GLB models
├── workflow.py         # Backup/deploy tool (excluded from git)
├── AGENTS.md           # This file (instructions for AI agents)
└── PROJECT.md          # Full project knowledge base
```

## CRITICAL: Backup & Deploy Workflow

**You MUST use `workflow.py` for all backup and deploy operations.**

### Commands

| Command | What It Does |
|---------|-------------|
| `python workflow.py backup "note"` | Local snapshot + Git commit |
| `python workflow.py deploy "note"` | Local snapshot + Git commit + Push to GitHub (site goes live) |
| `python workflow.py rollback <step>` | Roll back to a previous backup (auto-saves current state first) |
| `python workflow.py list` | Show all backup history with disk usage |

### When to Use

| Situation | Command |
|-----------|---------|
| Finished editing, user is previewing locally | `backup` |
| Auto-deploy (Authorized June 5, 2026): Automatically run immediately after verification | `deploy` |
| Something broke, need to undo | `rollback` |

### Backup Details
- Code files backed up per-step (~0.3MB each). Assets stored once in shared `_base_assets/`.
- Max 20 backups kept. Oldest auto-deleted.

## Development Rules

1. **Local preview**: Run `npx.cmd vite --host` in the project directory
2. **Font**: `Google Sans` from `Font/Google_Sans/`. Fallback: `sans-serif`
3. **Three.js**: Loaded via `<script type="importmap">` in index.html — do NOT use npm imports
4. **GSAP**: Loaded via CDN (`https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm`) — do NOT use npm imports
5. **`.gitignore`** excludes: `node_modules/`, `dist/`, `*.py`, debug files

## ✦ Token 节省规则（所有 Agent 必须遵守）

> **Token 是有限资源。每一次工具调用、每一行输出都有成本。以下规则旨在最大限度减少不必要的 token 消耗。**

### 1. 精确读取，禁止全量读文件
- `view_file` 必须指定 `StartLine`/`EndLine`，每次限制在 **20-50 行**
- 禁止一次读取 200+ 行。如果不确定目标在哪，先用 `findstr`（Windows）或 `grep_search` 定位行号，再精确读取

### 2. 简单任务直接做，不走 plan 流程
- **改颜色、改数值、修 bug** 等简单任务：直接编辑，不需要写 `implementation_plan.md`
- **架构变更、新功能** 等复杂任务：才需要写 plan 并等用户审批
- 判断标准：如果改动涉及 ≤3 个文件且逻辑清晰，就是简单任务

### 3. 不维护冗余文档
- `task.md`、`walkthrough.md`、`implementation_plan.md` 只在复杂任务中创建和维护
- 简单任务完成后，在回复中用 1-3 句话总结即可，**不要更新 artifact 文件**

### 4. Git 搜索要节制
- 用 `git log --oneline -n 10` 而不是 `git log -p`（后者输出巨量 diff）
- 需要看某个 commit 的改动时，用 `git show <hash> -- <file>` 并限定文件
- 需要在历史中搜索关键字时，用 `git log -S "keyword" --oneline` 而不是 `-p`

### 5. 命令输出要精简
- 避免运行会产生大量输出的命令（如不加 `-n` 的 `git log`）
- `findstr` 比 `git grep` 在 Windows 上更可靠，优先使用

### 6. 重型研究任务交给 Subagent
- 需要大量搜索代码库、阅读多个文件的调研任务，委派给 `research` subagent
- 主 agent 保持上下文窗口干净

### 7. 语言规则
- 与用户沟通统一使用**中文**
- 代码注释可以用英文

---

## Gemini-Specific Instructions

> **This section is for Gemini models only (Gemini 2.5, 3.1, etc.).**
> If you are NOT a Gemini model, skip this section entirely.

If you are a Gemini model, you MUST follow these additional rules. They exist because you have known tendencies that cause problems in this project. These are NOT suggestions — they are hard requirements.

### Rule 1: Read Before You Edit

**NEVER edit a file from memory. ALWAYS `view_file` first.**

You have a tendency to "remember" file contents from earlier in the conversation and edit based on that memory. The file may have changed since then. Before every single edit:
1. Use `view_file` to read the current content of the target file
2. Confirm the line numbers and exact content you plan to change
3. Only then make the edit

If you skip this step and your edit fails, that is YOUR fault.

### Rule 2: Sequential Multi-File Editing (Optimized)

**You may edit multiple files in a single turn sequentially. However, you must:**
1. Run a backup `python workflow.py backup "..."` BEFORE making the first edit.
2. Edit one file, call the tool, then edit the next file in the same turn (do not make parallel calls for the same file).
3. In your final response, provide a clear, file-by-file breakdown of what was changed and why.

*This replaces the restriction of having to stop and wait for a user response between every file.*

### Rule 3: Backup Before Any Code Change

Before your FIRST code edit in any user request, run:
```
python workflow.py backup "description"
```
Do this BEFORE you start editing. Not after. Not "I'll do it later." BEFORE.

### Rule 4: Minimum Viable Change

**Only change what the user explicitly asked for. Do NOT "improve" other things.**

If the user says "make the title smaller", you change the title font-size. You do NOT:
- Refactor the CSS architecture
- "Clean up" unrelated code
- Add new features you think would be nice
- Change colors, spacing, or animations that weren't mentioned

### Rule 5: When Unsure, Ask

If the user's request is ambiguous, do NOT guess. Ask them.

Bad: "I think they probably want X, so I'll just do X, Y, and Z."
Good: "I can interpret this two ways — do you mean A or B?"

### Rule 6: When Something Fails, Stop and Analyze

If a command returns an error, do NOT immediately retry with a slightly different approach. Instead:
1. Read the error message carefully
2. Explain to the user what went wrong and why
3. Propose a fix
4. Only proceed after thinking it through

You have a tendency to enter "retry loops" where you keep trying variations without understanding the root cause. This wastes time and often makes things worse.

### Rule 7: Explain As You Go

After each meaningful action, tell the user:
- What you just did
- Why you did it that way
- What you plan to do next

The user wants to feel in control. Silence followed by "I did 8 things" is not acceptable.

### Rule 8: Periodically Re-Read the Documentation

**You MUST re-read this file (`AGENTS.md`) and `PROJECT.md` periodically during long sessions (every 5-10 turns).**

If a conversation extends beyond 5-10 turns, AI models tend to suffer from context drift, forgetting core constraints (such as backing up before making changes) or ignoring the user's design preferences.
- **Strict Requirement**: You MUST proactively call `view_file` on both `AGENTS.md` and `PROJECT.md` to refresh your memory every 5-10 turns.
- **User Reminders**: Whenever the user reminds you to "read the rules", "read the md", or asks if you have backed up, immediately pause and re-read both files completely before proceeding with any action.
- **Reporting Requirement**: Whenever you re-read the documentation (either proactively or because the user reminded you), you MUST explicitly report this to the user in your response (e.g. "I have re-read AGENTS.md and PROJECT.md...") so that they are aware your context has been refreshed.
- **Self-Discipline**: Do not wait for the user to prompt you. Build a habit of refreshing your context.

### Summary for Gemini

Think of yourself as a careful surgeon, not a fast construction worker. Precision and communication matter more than speed. The user would rather you do 3 things correctly and explain each one, than do 10 things silently and get 2 of them wrong.
