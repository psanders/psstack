import json, sys, time, re

path = sys.argv[1]
INTERESTING = re.compile(r"\b(gh (issue|pr|label|api)|git (push|commit|checkout -b|switch -c)|npm (test|run)|gradlew)\b")

def short(s, n=160):
    s = " ".join(str(s).split())
    return s if len(s) <= n else s[: n - 1] + "…"

def emit(line):
    print(line, flush=True)

with open(path) as f:
    f.seek(0, 2)
    while True:
        line = f.readline()
        if not line:
            time.sleep(1)
            continue
        try:
            rec = json.loads(line)
        except Exception:
            continue
        msg = rec.get("message") or {}
        content = msg.get("content")
        if rec.get("type") == "user" and isinstance(content, str) and not content.startswith("<"):
            emit("USER: " + short(content))
            continue
        if not isinstance(content, list):
            continue
        for c in content:
            t = c.get("type")
            if t == "tool_use":
                name, inp = c.get("name"), c.get("input") or {}
                if name == "Skill":
                    emit(f"SKILL: {inp.get('skill')} {short(inp.get('args',''),80)}")
                elif name == "Agent":
                    emit(f"AGENT: {short(inp.get('description',''),80)} [{inp.get('subagent_type','')}]")
                elif name == "Bash" and INTERESTING.search(inp.get("command", "")):
                    emit("RUN: " + short(inp.get("command", "")))
                elif name in ("AskUserQuestion",):
                    qs = inp.get("questions") or []
                    emit("ASK: " + short(" | ".join(q.get("question", "") for q in qs)))
            elif t == "tool_result" and c.get("is_error"):
                txt = c.get("content")
                if isinstance(txt, list):
                    txt = " ".join(x.get("text", "") for x in txt if isinstance(x, dict))
                emit("ERROR: " + short(txt))
