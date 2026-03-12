# GitHub Issues Discipline Guide for AI Agents

This guide defines the standards for tracking work, managing issues, and aligning with project milestones on GitHub. All AI development agents must follow these rules to ensure project transparency and discipline.

## 1. Creating Issues

Every significant task or feature must have a corresponding GitHub issue.

### Naming Convention
Titles must be concise and prefixed with the type of work:
- `feat:` New features or enhancements.
- `fix:` Bug fixes.
- `chore:` Maintenance, dependency updates, or internal tasks.
- `docs:` Documentation changes.
- `refactor:` Code improvements without functional changes.
- `test:` Adding or updating tests.

*Example: `feat: implement user authentication flow`*

### Description Template
Information in the issue body should be structured and actionable:
- **Project/Context**: Brief overview of why this is being done.
- **Tasks**: A `[ ]` checklist of specific steps.
- **Acceptance Criteria**: What defines this issue as "done".
- **Related Issues**: Link to parent or dependent issues if applicable.

## 2. Labels and Milestones

- **Labels**: Use appropriate labels (`bug`, `enhancement`, `priority:high`, etc.) to categorize work.
- **Milestones**: Every issue must be assigned to an active milestone to track progress against project goals.

## 3. Workflow Discipline

### Starting Work
As soon as a task begins:
1. Verify the issue exists; if not, create it.
2. Link the current AI session to the issue (e.g., by mentioning the issue number in early comments).

### Updating Progress
- **Comments**: Add periodic updates to the issue if a task spans multiple sessions or encounters blockers.
- **Checkbox Completion**: Update the task checklist in the issue description as sub-tasks are completed.

### Closing Issues
- Close the issue only when all acceptance criteria are met and verified.
- Ensure the final commit message references the issue (e.g., `closes #123`).

## 4. Agent Checklist
Before finishing a task, the AI agent must:
- [ ] Ensure all relevant issues are created or updated.
- [ ] Check that milestones reflect the current project state.
- [ ] Verify that no "ghost tasks" (work done without an issue) remain.
