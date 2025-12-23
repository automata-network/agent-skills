# Agent Skills

A collection of AI agent skills following the [agentskills.io](https://agentskills.io/) specification. These skills can be installed and used across multiple AI coding agents including Claude Code, Cursor, Codex, and more.

## Available Skills

| Skill                           | Description                                                             |
| ------------------------------- | ----------------------------------------------------------------------- |
| [web-test](./web-test/SKILL.md) | Comprehensive web app testing with Playwright ensuring 100% UI coverage |

## Installation

Use the [ai-agent-skills](https://www.npmjs.com/package/ai-agent-skills) CLI to install skills from this repository.

### Claude Code

```bash
npx ai-agent-skills install automata-network/agent-skills --agent claude
```

### Cursor

```bash
npx ai-agent-skills install automata-network/agent-skills --agent cursor
```

### Codex

```bash
npx ai-agent-skills install automata-network/agent-skills --agent codex
```

## Supported Agents

The skills in this repository work with:

- Claude Code
- Cursor
- Codex
- VS Code (GitHub Copilot)
- Amp
- Goose
- OpenCode
- And any agent supporting the SKILL.md format

## Project Structure

```
agent-skills/
├── README.md
├── LICENSE
├── web-test/          # Each subfolder is a skill
│   ├── SKILL.md              # Main skill definition (required)
│   ├── references/           # Supporting documentation
│   │   ├── CHECKLIST.md
│   │   └── ELEMENT-TYPES.md
│   └── scripts/              # Implementation scripts
│       ├── test_runner.py
│       └── requirements.txt
└── <other-skill>/            # Add more skills as subfolders
    └── SKILL.md
```

**Each subfolder represents a separate skill.** To add a new skill, create a new folder with a `SKILL.md` file following the [agentskills.io](https://agentskills.io/) specification.

### Skill Format

Each skill folder should contain:

- `SKILL.md` - Main skill definition with metadata and instructions (required)
- `references/` - Supporting documentation and checklists (optional)
- `scripts/` - Implementation scripts and tools (optional)

## Learn More

- [agentskills.io](https://agentskills.io/) - Open standard for AI agent skills
- [ai-agent-skills on npm](https://www.npmjs.com/package/ai-agent-skills) - CLI for installing skills

## License

MIT
