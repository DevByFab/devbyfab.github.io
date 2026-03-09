import re, os

css_dir = "css"
files = sorted(f for f in os.listdir(css_dir) if f.endswith(".css"))
any_found = False

for fname in files:
    path = os.path.join(css_dir, fname)
    with open(path) as f:
        content = f.read()
        lines = content.splitlines(True)

    depth = 0
    in_comment = False
    selector_stack = []
    block_props = []
    found = []
    current_selector = ""
    # Buffer to accumulate selector text
    sel_buffer = ""

    i = 0
    while i < len(lines):
        line = lines[i]
        line_num = i + 1
        j = 0
        while j < len(line):
            if in_comment:
                end = line.find("*/", j)
                if end == -1:
                    j = len(line)
                else:
                    j = end + 2
                    in_comment = False
                continue
            if j < len(line) - 1 and line[j:j+2] == "/*":
                in_comment = True
                j += 2
                continue
            ch = line[j]
            if ch == "{":
                # The selector is everything accumulated in sel_buffer plus text before {
                sel_text = (sel_buffer + line[:j]).strip()
                # Clean up: take the last selector (after any })
                if "}" in sel_text:
                    sel_text = sel_text[sel_text.rfind("}") + 1:].strip()
                selector_stack.append((current_selector, list(block_props)))
                current_selector = sel_text
                block_props = []
                depth += 1
                sel_buffer = ""
                j += 1
                continue
            if ch == "}":
                # Check for duplicates
                prop_map = {}
                for prop, ln in block_props:
                    prop_map.setdefault(prop, []).append(ln)
                for prop, lns in prop_map.items():
                    if len(lns) > 1:
                        found.append((current_selector, prop, lns))
                depth -= 1
                if selector_stack:
                    current_selector, block_props = selector_stack.pop()
                else:
                    current_selector = ""
                    block_props = []
                sel_buffer = ""
                j += 1
                continue
            j += 1

        # Track property declarations inside rule blocks
        if depth >= 1 and not in_comment:
            stripped = line.strip()
            if ":" in stripped and not stripped.startswith("/*") and not stripped.startswith("*") and "{" not in stripped and "}" not in stripped:
                prop_match = re.match(r"^([\w-]+)\s*:", stripped)
                if prop_match:
                    prop_name = prop_match.group(1).lower()
                    # Exclude @keyframe keywords
                    if prop_name not in ("from", "to"):
                        block_props.append((prop_name, line_num))

        # Accumulate selector text when at depth 0
        if depth == 0 and not in_comment:
            stripped = line.strip()
            if stripped and not stripped.startswith("/*") and not stripped.startswith("*"):
                sel_buffer += " " + stripped

        i += 1

    if found:
        any_found = True
        print(f"\nFILE: css/{fname}")
        print("=" * 50)
        for sel, prop, lns in found:
            lines_str = ", ".join(f"L{l}" for l in lns)
            print(f"  Selector: {sel}")
            print(f"  Duplicate property: {prop}")
            print(f"  Lines: {lines_str}")
            print()

if not any_found:
    print("No duplicate properties found in any CSS file.")
print("--- Scan complete ---")
