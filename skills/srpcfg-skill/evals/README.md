# Skill checks

`evals.json` contains three task prompts and verifiable expectations for future independent agent runs: staging-only video edits, an unapproved mode binding conflict, and selective map-guide deployment/removal.

The dependency-free Python runner executes those command scenarios against a real CLI in temporary directories:

```bash
python skills/srpcfg-skill/evals/run_cli_checks.py --exe build-core/app/cli/Release/srpcfg.exe --bundle config --output build-gui/verification-skill/iteration-1
```

Use the appropriate compiled executable path on Linux or another CMake generator. No Steam account or actual game files are modified. All fixtures are removed after the run. `--output` is optional; review metadata, command traces, grading JSON and Markdown reports remain when specified.

CTest registers these checks as `srpcfg_cli_skill` when Python 3 is available. The runner is a command/integration check, not an LLM evaluation: it does not prove that an agent will select the skill or follow its instructions, and it does not produce baseline/token scores.

Independent skill evaluations should execute each prompt once with this skill and once without it, using fresh isolated fixtures for each run. Record transcripts and grade the expectations from actual commands and resulting file bytes. Do not run destructive test cases against automatically detected Steam/game directories.
