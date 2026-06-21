<p align="center">
  <img src="assets/banner.png" alt="Flux Tasks Banner" width="100%">
</p>

<div align="center">

# 🌊 Flux Tasks

### ✨ Premium Offline-First Project Manager & Development Hub
*Organize your workflow with absolute privacy, liquid-glass aesthetics, and seamless local productivity.*

[![Electron](https://img.shields.io/badge/Electron-42.4-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Local-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Offline First](https://img.shields.io/badge/Offline--First-Secured-7CFFC4?style=for-the-badge)](https://github.com/Straniksss/Flux-Tasks)

---

[Key Features](#-key-features) • [Tech Stack](#-technology-stack) • [GitHub & Offline Mode](#-github--offline-first-flexibility) • [Detailed Integration](#-detailed-github--git-integration-points) • [Installation](#-getting-started) • [Development & Build](#%EF%B8%8F-development--build-guide) • [OTA Updates & Releases](#-automated-releases--ota) • [Security & Privacy](#-privacy-by-design)

</div>

---

## 🚀 About Flux Tasks

**Flux Tasks** is a premium, offline-first project management application designed specifically for developers, creators, and teams who value speed, privacy, and rich aesthetics. 

Unlike traditional project management tools, Flux Tasks stores **100% of your data locally** on your machine. No cloud databases, no tracking, no mandatory subscriptions. Just pure, instant desktop performance wrapped in a gorgeous liquid-glass user interface.

Additionally, Flux Tasks features an **optional GitHub integration** using a streamlined Personal Access Token (PAT) flow. Link your local projects to GitHub repositories, track remote releases, and sync issues—all while retaining the ability to work entirely offline.

---

## 🔌 GitHub & Offline-First Flexibility

Flux Tasks is architected from the ground up to place full ownership of data in your hands. You don't need a GitHub account, a token, or even an active internet connection to use the core system.

### 🛡️ 100% Offline Mode (No GitHub Connected)
When used entirely offline or without a linked GitHub account, all features remain fully functional:
* **Local Projects & Roadmaps**: Create and manage local projects and milestones without any network requests.
* **Smart Tasks & Checklists**: Create bugs, features, refactors, docs, or AI prompts stored directly in your local SQLite database.
* **Local Code Snippets**: Save and edit code fragments with syntax highlighting.
* **Local Attachments**: Import and open project resources (images, PDFs, ZIP archives) locally.
* **Local Backups & Exports**: Export data to Markdown, JSON, HTML, or CSV, and create/restore local database backups.

### 🐙 Optional GitHub Integration (When Connected)
If you decide to link a project to a GitHub repository, you get access to advanced repository metrics:
* **Repository Dashboard**: View stars, forks, open issues, PR counts, default branch, and last push date directly in the app.
* **Issues Integration**: Synchronize states, import GitHub issues into local tasks, or automatically create GitHub issues from your tasks.
* **Local Git Actions**: Perform `commit`, `pull`, `push`, and `tag` commands, or launch a terminal directly in your project folder.
* **Release Timeline Viewer**: Render a read-only timeline of your repository's GitHub Releases history.
* **High-Level Security**: Your Personal Access Token (PAT) is never stored in plain text or shared with the renderer; it is securely encrypted using Electron's `safeStorage` API and stays safely inside your local SQLite DB.

---

## 🐙 Detailed GitHub & Git Integration Points

For developers looking to understand where and how Git and GitHub are integrated across the Flux Tasks codebase, here is a detailed breakdown:

### 1. Connection & Token Security (`electron/git-github.ts`)
* **Settings Panel Integration (`src/components/GitHubSettings.tsx`)**: Prompts the user to create a Personal Access Token (PAT) via a pre-filled GitHub scopes link, connects the account, and displays profile details (username, avatar, scopes, list of repositories).
* **Electron safeStorage Encryption**: When the user connects their GitHub account, the PAT is transferred to the main process, encrypted using OS-level keychains via Electron's `safeStorage` API, and saved as a hexadecimal string in the local SQLite settings table.
* **Security Isolation**: The decrypted token is **never** sent back to the frontend renderer or logged, completely protecting it from cross-site scripting (XSS) extraction.

### 2. Repository Dashboard (`src/components/GitHubProjectDashboard.tsx`)
* **Dashboard Tab**: Renders repository metadata fetched via the GitHub REST API, showing:
  * Open issues count (excluding Pull Requests) and Pull Requests count.
  * Stars and forks counters.
  * Repository default branch and the last push timestamp.
  * A shortcut to open the remote repository in the default web browser.

### 3. Issues Sync & Management
* **Issues Tab (`src/components/GitHubProjectDashboard.tsx`)**:
  * **Import Issue**: Resolves issue fields and saves them as a local SQLite task, including labels, description, and status mappings.
  * **Link Issue**: Links an existing local task to a GitHub issue.
* **Task Details View (`src/components/TaskDetailView.tsx`)**:
  * **Linked Issue Card**: Displays the state of the linked issue (open or closed) dynamically in the task properties sidebar.
  * **Create Issue**: Automatically converts task descriptions, tags, and checklist items to markdown and posts it to GitHub to create a remote issue.

### 4. Local Git Command execution (`electron/git-github.ts` $\rightarrow$ CLI Spawn)
* **Local Path Configuration**: By specifying a local folder path in the project editor, the following operations are enabled:
  * **Git Status**: Parses unstaged, staged, and untracked files using `git status --porcelain`.
  * **Commit**: Runs `git add -A` and `git commit -m "[message]"` on your files.
  * **Tag**: Spawns annotated tags using `git tag [name] -m "[message]"`.
  * **Pull & Push**: Syncs code with the remote repository origin (`git pull`/`git push`).
  * **Terminal/Folder Launchers**: Spawns PowerShell inside the project directory, or opens it inside the default system File Explorer.

### 5. Read-Only Releases Timeline (`src/components/GitHubReleasesView.tsx`)
* **Roadmap Viewer Tab**: Placed inside the roadmap switcher to render version history, release notes, release tags, release states (`Draft`, `Prerelease`, `Latest Stable`), and lists of download assets along with their file sizes and download counts.
* **Strict Read-Only Access**: All mutation controls (creating releases, editing notes, deleting tags, or uploading binaries) are fully removed from the user interface.

### 6. Command-Line Release Pipeline (`scripts/release.js`)
* **Decoupled System**: Compiling application packages and publishing update manifests (`latest.json` or `latest-[channel].json`) is restricted to the Node CLI script.
* **Authentication**: Uses `process.env.GITHUB_TOKEN` or a token configured inside the local `.env` configuration file.
* **Process**: Compiles files, builds setup installers and portable ZIPs, generates update hashes, and automates creating tags and uploading the assets to GitHub Releases.

---

## ✨ Key Features

### 📋 Smart Task Management
Create and organize multi-type tasks optimized for development cycles:
* 🐞 **Bugs**: Document, track, and squash code issues.
* ✨ **Features**: Plan new functionality with checklist items.
* 🚀 **Releases**: Group tasks under specific project versions.
* 🔧 **Refactors**: Keep your codebase clean and structured.
* 📝 **Documentation**: Draft guidelines and design specs right alongside your code.
* 🤖 **AI Prompts**: Store, tag, and refine prompts for ChatGPT, Claude, or Gemini.

### 🎨 Liquid-Glass Interface
Enjoy an interactive experience inspired by **Apple visionOS**, **Arc Browser**, and **Linear**:
* **Aero Glass & Acrylic Blur**: Beautiful backdrop filters that blend with your desktop environment.
* **Dynamic HSL Gradients**: Curated color palettes with smooth interactive states.
* **Micro-Animations**: Fluid transitions powered by Framer Motion.
* **Typographic Harmony**: Structured typography with premium system font fallbacks.

### 🛣 Timeline & Roadmaps
Plan and visualize your development trajectory:
* Track versions, milestones, and release goals.
* **Release Timeline Switcher**: Instantly switch between checking local SQLite milestones and pulling GitHub releases in real time.

### 💻 Local Code Snippets & Attachments
* Keep your code fragments and snippets organized with integrated syntax highlighting for JavaScript, TypeScript, Python, SQL, HTML, CSS, Bash, and PowerShell.
* Attach PDFs, logs, images, and ZIP files directly to your projects.

### 🔍 Instant Global Search
* Instantly search across all tasks, descriptions, code snippets, notes, and AI prompts with zero network latency.

---

## 🏗 Technology Stack

Flux Tasks is built on modern, lightweight, and high-performance desktop technologies:

* **Runtime**: [Electron 42](https://www.electronjs.org/) (for secure, cross-platform shell integration)
* **Frontend**: [React 19](https://react.dev/) + [Vite](https://vite.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [TailwindCSS 4](https://tailwindcss.com/) + Custom Vanilla CSS for backdrop filters and glassmorphism
* **Database**: [SQLite](https://www.sqlite.org/) (fast, ACID-compliant local database)
* **State Management**: [Zustand](https://github.com/pmndrs/zustand)
* **Animations**: [Framer Motion](https://www.framer.com/motion/)
* **Icons**: [Lucide React](https://lucide.dev/)

---

## 📊 Workflow Reference

### Task Types
| Type | Icon | Primary Use Case |
| :--- | :---: | :--- |
| **Bug** | 🐞 | Bug tracking, regression testing, and hotfixes |
| **Feature** | ✨ | Feature requests, UI improvements, and new capabilities |
| **Release** | 🚀 | Version targeting, deployment tasks, and change summaries |
| **Refactor** | 🔧 | Technical debt reduction and code cleanup |
| **Documentation**| 📝 | System architecture docs, onboarding guides, and user manuals |
| **AI Prompt** | 🤖 | System instructions, prompt templates, and agent guidelines |

### Task Statuses
| Status | Icon | Stage in Pipeline |
| :--- | :---: | :--- |
| **Planned** | 📌 | Backlogged or scheduled for future iterations |
| **Waiting** | ⏳ | Blocked, waiting on review, or pending external feedback |
| **In Progress** | 🚧 | Currently active development |
| **Testing** | 🧪 | Verification, QA check, or code-review stage |
| **Completed** | ✅ | Successfully closed and implemented |
| **Cancelled** | ❌ | Discarded, duplicated, or marked out of scope |

---

## 💾 Local Storage Architecture

All data resides safely on your disk. You own your files:

```text
%APPDATA%/Flux Tasks/   (Windows)
~/Library/Application Support/Flux Tasks/ (macOS)
~/.config/Flux Tasks/   (Linux)

├── tasks.db         # Core SQLite database containing tasks, projects, snippets, and encrypted credentials
├── backups/         # Auto-generated database checkpoints and backups
└── exports/         # Markdown, JSON, and CSV project exports
```

---

## ⚙️ Getting Started

Installing Flux Tasks is quick and simple.

1. **Download the Web Installer**:
   Download the installer package directly: [Flux Tasks Web Setup (EXE)](https://github.com/Straniksss/Flux-Tasks/releases/download/installer-v1/Flux.Tasks.Web.Setup.exe)
2. **Run Setup**:
   Launch `Flux.Tasks.Web.Setup.exe` on your system. The installer will set up all dependencies and prepare the application shell.
3. **Start Organizing**:
   Open the app from your Desktop or Start Menu and begin managing your projects offline!
---

## 🛠️ Development & Build Guide

If you are developing or building Flux Tasks locally, follow these steps to set up your environment:

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (version 18.x or newer)
* [Git](https://git-scm.com/)

### 2. Configure Environment Variables
Create a file named `.env` in the root folder of the project, and add the following keys:
```env
# GitHub token for release publishing (repo, read:user, workflow scopes)
GITHUB_TOKEN=your_personal_access_token_here

# GitHub repository owner and repository name
GITHUB_OWNER=Straniksss
GITHUB_REPO=Flux-Tasks

# URL to poll for client-side OTA auto-update checks
UPDATE_MANIFEST_URL=https://github.com/Straniksss/Flux-Tasks/releases/latest/download/latest.json
```

### 3. Run Locally in Dev Mode
1. Install node packages:
   ```bash
   npm install
   ```
2. Start the hot-reloading dev environment:
   ```bash
   npm run dev
   ```
   *This starts the local Vite server and boots the Electron application frame.*

### 4. Build Standalone Installer Locally
To compile frontend code and build the final executable installer:
```bash
npm run build
```
*This produces standalone installers and portable ZIP packages inside the `release/` directory.*

---

## 🚀 Automated Releases & OTA

Flux Tasks features a custom-built automation pipeline for compiling, verifying, and publishing updates.

### Release Script (`npm run release`)
Running `npm run release` prompts you for release metadata:
1. **Target Version**: (e.g., `1.1.15`, `1.2.0-beta.1`)
2. **Release Channel**: (`stable`, `beta`, `alpha`, `rc`)
3. **Release Title**: Heading for the changelog
4. **Changelog Notes**: Bullet points representing changes
5. **GitHub Repository**: Target owner/repo (defaults to the setting in `.env` or `Straniksss/Flux-Tasks`)

#### What the script does under the hood:
* Stops active `Flux Tasks.exe` instances to prevent locking files.
* Bumps target version, automatically stages all changed project files, commits them, and pushes them to your current remote Git branch (`git push origin [branch]`).
* Builds the React client and compiles Electron main/preload processes via `esbuild`.
* Bundles files into an `app.asar` archive and validates structure.
* Calculates SHA256 checksums and file sizes.
* Generates OTA (Over-the-Air) update manifests:
  * Stable releases publish/overwrite `latest.json` and `latest-stable.json`.
  * Pre-releases (beta, alpha, rc) write to isolated manifests (e.g., `latest-beta.json`).
* If a `GITHUB_TOKEN` is found, automatically creates a GitHub Release, tags the repository, cleans up duplicate assets, and uploads the manifest files, `app.asar`, portable ZIP, and NSIS setup installer.

---

## 🔒 Privacy by Design

* **Zero Tracking**: No telemetry, no usage analytics, and no external tracking pixels.
* **Offline-First Storage**: The app behaves 100% identically when you are disconnected from the network.
* **Secure Token Handling**: When using the optional GitHub integration:
  * Personal Access Tokens are encrypted using Electron's OS-level credentials system (`safeStorage`).
  * Tokens are never stored plain-text, never logged to stdout/files, and never sent to the renderer process.
  * All GitHub requests are routed through Electron's main process for advanced header security.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Crafted with ❤️ for developers who love premium aesthetics and privacy.
</p>
