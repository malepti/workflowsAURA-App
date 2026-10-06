import subprocess
import tempfile
import os
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
    
    with tempfile.TemporaryDirectory() as temp_dir:
        if request.language == "python":
            file_path = os.path.join(temp_dir, "script.py")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(request.code)
            
            try:
                result = subprocess.run(["python", file_path], capture_output=True, text=True, timeout=10)
                output = result.stdout
                if result.stderr:
                    output += "\n[Error Output]:\n" + result.stderr
            except subprocess.TimeoutExpired:
                output = "Execution timed out (limit: 10s)."
                error = True
            except Exception as e:
                output = f"Execution failed: {e}"
                error = True
                
        elif request.language == "typescript":
            file_path = os.path.join(temp_dir, "script.ts")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(request.code)
            
            try:
                # Use npx tsx to execute typescript (assuming tsx is available via npm)
                result = subprocess.run(["npx", "tsx", file_path], capture_output=True, text=True, timeout=10, shell=True)
                output = result.stdout
                if result.stderr:
                    output += "\n[Error Output]:\n" + result.stderr
            except subprocess.TimeoutExpired:
                output = "Execution timed out (limit: 10s)."
                error = True
            except Exception as e:
                output = f"Execution failed: {e}"
                error = True
                
        elif request.language == "java":
            file_path = os.path.join(temp_dir, "Main.java")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(request.code)
            
            try:
                # Java 11+ can run single-file source code directly
                result = subprocess.run(["java", file_path], capture_output=True, text=True, timeout=10)
                output = result.stdout
                if result.stderr:
                    output += "\n[Error Output]:\n" + result.stderr
            except FileNotFoundError:
                output = "Execution failed: 'java' is not installed or not in PATH on the host server."
                error = True
            except subprocess.TimeoutExpired:
                output = "Execution timed out (limit: 10s)."
                error = True
            except Exception as e:
                output = f"Execution failed: {e}"
                error = True
                
        elif request.language == "c":
            file_path = os.path.join(temp_dir, "main.c")
            exe_path = os.path.join(temp_dir, "main.exe") if os.name == 'nt' else os.path.join(temp_dir, "main")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(request.code)
            
            try:
                compile_result = subprocess.run(["gcc", file_path, "-o", exe_path], capture_output=True, text=True, timeout=10)
                if compile_result.returncode != 0:
                    output = "Compilation Failed:\n" + compile_result.stderr
                    error = True
                else:
                    result = subprocess.run([exe_path], capture_output=True, text=True, timeout=10)
                    output = result.stdout
                    if result.stderr:
                        output += "\n[Error Output]:\n" + result.stderr
            except FileNotFoundError:
                output = "Execution failed: 'gcc' is not installed or not in PATH on the host server."
                error = True
            except subprocess.TimeoutExpired:
                output = "Execution timed out (limit: 10s)."
                error = True
            except Exception as e:
                output = f"Execution failed: {e}"
                error = True
                
        elif request.language == "csharp":
            # For C#, it's more complex (requires csproj), but we can try to use 'dotnet script' if installed
            file_path = os.path.join(temp_dir, "script.csx")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(request.code)
            
            try:
                result = subprocess.run(["dotnet", "script", file_path], capture_output=True, text=True, timeout=15)
                output = result.stdout
                if result.stderr:
                    output += "\n[Error Output]:\n" + result.stderr
            except FileNotFoundError:
                output = "Execution failed: 'dotnet script' is not installed or not in PATH on the host server."
                error = True
            except subprocess.TimeoutExpired:
                output = "Execution timed out (limit: 15s)."
                error = True
            except Exception as e:
                output = f"Execution failed: {e}"
                error = True

        else:
            output = f"Real execution for {request.language} is not configured on this sandbox yet."
            error = True
            
    return {"output": output or "[No Output]", "error": error}
