import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.mjs";

let pyodide = null;

async function initPyodide() {
    if (pyodide) return;
    
    self.postMessage({ type: 'status', message: 'Loading Pyodide runtime...' });
    pyodide = await loadPyodide();
    
    self.postMessage({ type: 'status', message: 'Loading Pydantic...' });
    await pyodide.loadPackage('pydantic');

    self.postMessage({ type: 'status', message: 'Verifying Pydantic...' });
    try {
        // Run a quick script to ensure Pydantic is loaded and working.
        pyodide.runPython(`
from pydantic import BaseModel
class VerificationModel(BaseModel):
    id: int
assert VerificationModel(id=1) is not None, "Pydantic model creation failed"
        `);
    } catch (error) {
        console.error("Pydantic verification failed:", error);
        throw new Error("Pydantic package could not be loaded or verified.");
    }
    
    self.postMessage({ type: 'status', success: true, message: 'Ready!' });
}

const pythonPydanticToJsonScript = `
import ast
import json
import pydantic
from pydantic import BaseModel, Field
from typing import List, Optional, Union, Any, Dict
from datetime import datetime, date

def find_last_pydantic_class_name(code_string):
    """
    Parses the Python code and returns the name of the *last* class
    that inherits from pydantic.BaseModel. This is a better heuristic
    than picking the first one, as the last class is often the main model.
    """
    tree = ast.parse(code_string)
    last_found_class_name = None
    
    # Iterate through the top-level nodes in the code to respect definition order.
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            is_pydantic_model = False
            for base in node.bases:
                # Handles "class Model(BaseModel)"
                if isinstance(base, ast.Name) and base.id == 'BaseModel':
                    is_pydantic_model = True
                    break
                # Handles "class Model(pydantic.BaseModel)"
                if isinstance(base, ast.Attribute):
                    base_value = getattr(base, 'value', None)
                    if isinstance(base_value, ast.Name) and base_value.id == 'pydantic' and base.attr == 'BaseModel':
                        is_pydantic_model = True
                        break
            if is_pydantic_model:
                last_found_class_name = node.name
    
    return last_found_class_name

def convert(pydantic_code):
    class_name = find_last_pydantic_class_name(pydantic_code)
    if not class_name:
        raise ValueError("No class inheriting from pydantic.BaseModel found.")
    
    # Create a robust namespace that allows user code to use "pydantic.BaseModel" or just "BaseModel".
    namespace = {
        'pydantic': pydantic,
        'BaseModel': BaseModel,
        'Field': Field,
        'List': List,
        'Optional': Optional,
        'Union': Union,
        'Any': Any,
        'Dict': Dict,
        'datetime': datetime,
        'date': date,
    }
    
    # Execute the user's code within this controlled namespace.
    exec(pydantic_code, namespace)
    
    pydantic_class = namespace.get(class_name)

    if not pydantic_class:
        raise ValueError(f"Class '{class_name}' not found after execution. Make sure the class is defined in the script.")

    if not issubclass(pydantic_class, BaseModel):
        raise TypeError(f"Class '{class_name}' does not inherit from pydantic.BaseModel.")
        
    schema = pydantic_class.model_json_schema()
    
    if 'title' in schema:
        del schema['title']

    return json.dumps(schema, indent=2)
`;


self.onmessage = async (e) => {
    const { id, type, payload } = e.data;

    try {
        if (type === 'init') {
            await initPyodide();
            self.postMessage({ id, type, success: true });
            return;
        }

        if (!pyodide) {
           throw new Error('Pyodide not initialized. Sent init message first.');
        }
    
        if (type === 'pydantic-to-json') {
            pyodide.runPython(pythonPydanticToJsonScript);
            const converter = pyodide.globals.get('convert');
            const result_payload = converter(payload.pydanticCode);
            converter.destroy();
            self.postMessage({ id, success: true, payload: result_payload });
        } else {
            throw new Error(`Unknown message type: ${type}`);
        }
    } catch (error) {
        self.postMessage({ id, success: false, error: error.toString() });
    }
};
