# Publish a public GitHub repository

From Cloud Shell with a verified GitHub login (via GitHub CLI or Git credential flow):

```bash
cd signalfoundry-work-continuity-agent
git init -b main
git add .
git status --short
git commit -m "Build evidence-backed work continuity prototype"
```

In GitHub, create a new empty **Public** repository named `signalfoundry-work-continuity-agent` (do not initialize it with a second README). Then:

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/signalfoundry-work-continuity-agent.git
git push -u origin main
```

If `git push` requests a password, authenticate using GitHub's supported device/browser login or GitHub CLI (`gh auth login`); do not put a token inside committed files or command history. Confirm that the repository opens publicly while signed out.
