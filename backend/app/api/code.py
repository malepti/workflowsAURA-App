import subprocess
import tempfile
import os
import sys
import sqlite3
import time
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter()

class CodeExecutionRequest(BaseModel):
    language: str
    code: str

@router.post("/execute")
async def execute_code(request: CodeExecutionRequest):
    output = ""
    error = False
    execution_time_ms = 0
    start_time = time.time()
    
    # Normalize language name
    lang = (request.language or "").lower().strip()
    if lang in ["py", "python3"]:
        lang = "python"
    elif lang in ["js", "javascript", "ts"]:
        lang = "typescript"
    elif lang in ["c++", "cpp"]:
        lang = "c"
    elif lang in ["cs", "c#"]:
        lang = "csharp"
    elif lang in ["sqlite", "postgres", "postgresql"]:
        lang = "sql"

    with tempfile.TemporaryDirectory() as temp_dir:
        if lang == "python":
            file_path = os.path.join(temp_dir, "script.py")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(request.code)
            
            # Determine python executable (prefer current running virtualenv sys.executable)
            python_bin = sys.executable if sys.executable else "python"
            
            try:
                result = subprocess.run(
                    [python_bin, file_path],
                    capture_output=True,
                    text=True,
                    timeout=20
                )
                output = result.stdout
                if result.returncode != 0:
                    error = True
                    output = (output + "\n" if output else "") + (result.stderr or f"Process exited with code {result.returncode}")
                elif result.stderr:
                    # Non-fatal warnings
                    output = (output + "\n" if output else "") + "[Runtime Diagnostics / Warnings]:\n" + result.stderr
            except subprocess.TimeoutExpired:
                output = "Execution timed out (limit: 20s)."
                error = True
            except Exception as e:
                output = f"Execution failed: {e}"
                error = True
                
        elif lang == "typescript":
            file_path = os.path.join(temp_dir, "script.ts")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(request.code)
            
            try:
                # Try npx tsx first, fallback to node if plain js
                result = subprocess.run(
                    ["npx", "tsx", file_path],
                    capture_output=True,
                    text=True,
                    timeout=20,
                    shell=True
                )
                output = result.stdout
                if result.returncode != 0:
                    error = True
                    output = (output + "\n" if output else "") + (result.stderr or f"Process exited with code {result.returncode}")
                elif result.stderr:
                    output = (output + "\n" if output else "") + "[Runtime Diagnostics]:\n" + result.stderr
            except subprocess.TimeoutExpired:
                output = "Execution timed out (limit: 20s)."
                error = True
            except Exception as e:
                output = f"Execution failed: {e}"
                error = True

        elif lang == "sql":
            try:
                # Run SQL in an in-memory or temporary SQLite sandbox with demo tables
                conn = sqlite3.connect(":memory:")
                cursor = conn.cursor()
                
                # Pre-populate sample table so demo queries like SELECT * FROM users work out of the box
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY,
                        name TEXT NOT NULL,
                        email TEXT NOT NULL,
                        role TEXT DEFAULT 'developer',
                        credits INTEGER DEFAULT 100
                    );
                """)
                cursor.executemany("""
                    INSERT INTO users (id, name, email, role, credits) VALUES (?, ?, ?, ?, ?)
                """, [
                    (1, "Alice Walker", "alice@example.com", "admin", 250),
                    (2, "Bob Smith", "bob@example.com", "developer", 180),
                    (3, "Charlie Davis", "charlie@example.com", "designer", 120),
                    (4, "Diana Prince", "diana@example.com", "lead", 500)
                ])
                conn.commit()

                # Execute user SQL statements (supports multiple statements)
                statements = [s.strip() for s in request.code.split(';') if s.strip()]
                sql_outputs = []
                for stmt in statements:
                    cursor.execute(stmt)
                    if cursor.description:
                        columns = [desc[0] for desc in cursor.description]
                        rows = cursor.fetchall()
                        # Format as clean ascii table
                        col_widths = [max(len(str(col)), max((len(str(row[i])) for row in rows), default=0)) for i, col in enumerate(columns)]
                        header = " | ".join(col.ljust(col_widths[i]) for i, col in enumerate(columns))
                        divider = "-+-".join("-" * col_widths[i] for i in range(len(columns)))
                        row_strs = [" | ".join(str(val).ljust(col_widths[i]) for i, val in enumerate(row)) for row in rows]
                        table_str = f"{header}\n{divider}\n" + ("\n".join(row_strs) if row_strs else "(0 rows returned)")
                        sql_outputs.append(f"-- Query: {stmt}\n{table_str}\n({len(rows)} rows)")
                    else:
                        conn.commit()
                        sql_outputs.append(f"-- Statement: {stmt}\nQuery OK ({cursor.rowcount} rows affected)")

                output = "\n\n".join(sql_outputs) if sql_outputs else "Query executed successfully."
            except Exception as e:
                output = f"[SQL Execution Error]: {e}"
                error = True
                
        elif lang == "java":
            file_path = os.path.join(temp_dir, "Main.java")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(request.code)
            
            try:
                result = subprocess.run(["java", file_path], capture_output=True, text=True, timeout=20)
                output = result.stdout
                if result.returncode != 0:
                    error = True
                    output = (output + "\n" if output else "") + (result.stderr or "")
                elif result.stderr:
                    output = (output + "\n" if output else "") + "[Runtime Diagnostics]:\n" + result.stderr
            except FileNotFoundError:
                output = "Execution failed: 'java' is not installed or not in PATH on the host server."
                error = True
            except subprocess.TimeoutExpired:
                output = "Execution timed out (limit: 20s)."
                error = True
            except Exception as e:
                output = f"Execution failed: {e}"
                error = True
                
        elif lang == "c":
            file_path = os.path.join(temp_dir, "main.c")
            exe_path = os.path.join(temp_dir, "main.exe") if os.name == 'nt' else os.path.join(temp_dir, "main")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(request.code)
            
            try:
                compile_result = subprocess.run(["gcc", file_path, "-o", exe_path], capture_output=True, text=True, timeout=20)
                if compile_result.returncode != 0:
                    output = "Compilation Failed:\n" + compile_result.stderr
                    error = True
                else:
                    result = subprocess.run([exe_path], capture_output=True, text=True, timeout=15)
                    output = result.stdout
                    if result.returncode != 0:
                        error = True
                        output = (output + "\n" if output else "") + (result.stderr or "")
                    elif result.stderr:
                        output = (output + "\n" if output else "") + "[Runtime Diagnostics]:\n" + result.stderr
            except FileNotFoundError:
                output = "Execution failed: 'gcc' is not installed or not in PATH on the host server."
                error = True
            except subprocess.TimeoutExpired:
                output = "Execution timed out (limit: 20s)."
                error = True
            except Exception as e:
                output = f"Execution failed: {e}"
                error = True
                
        elif lang == "csharp":
            file_path = os.path.join(temp_dir, "script.csx")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(request.code)
            
            try:
                result = subprocess.run(["dotnet", "script", file_path], capture_output=True, text=True, timeout=20)
                output = result.stdout
                if result.returncode != 0:
                    error = True
                    output = (output + "\n" if output else "") + (result.stderr or "")
                elif result.stderr:
                    output = (output + "\n" if output else "") + "[Runtime Diagnostics]:\n" + result.stderr
            except FileNotFoundError:
                output = "Execution failed: 'dotnet script' is not installed or not in PATH on the host server."
                error = True
            except subprocess.TimeoutExpired:
                output = "Execution timed out (limit: 20s)."
                error = True
            except Exception as e:
                output = f"Execution failed: {e}"
                error = True

        else:
            output = f"Language '{request.language}' is not yet supported in this sandbox."
            error = True
            
    execution_time_ms = int((time.time() - start_time) * 1000)
    return {
        "output": output or "[Program completed with no output]",
        "error": error,
        "execution_time_ms": execution_time_ms
    }
