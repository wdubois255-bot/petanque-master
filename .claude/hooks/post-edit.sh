#!/bin/bash
# Hook: Auto-run unit tests after Edit/Write on src/ or public/data/ files
# Runs async (non-blocking) - Claude continues working while tests run

# Read the tool input from stdin
INPUT=$(cat)

# Extract file path from JSON input
FILE_PATH=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{
    try{
      const j=JSON.parse(d);
      console.log(j.tool_input?.file_path || j.tool_input?.path || '');
    }catch{console.log('')}
  });
")

# Only run tests if the edited file is in src/ or public/data/
if echo "$FILE_PATH" | grep -qE '(src/|public/data/).*\.(js|json)$'; then
  echo "Auto-test triggered by: $FILE_PATH"
  npx vitest run --reporter=dot 2>&1 | tail -10
else
  exit 0
fi
