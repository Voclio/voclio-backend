import PyPDF2
import json
import re

def extract_text_from_pdf(pdf_path):
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
    return text

def clean_json_text(text):
    """Extract and clean JSON from text"""
    # Remove page markers
    text = re.sub(r'Page \d+ of \d+', '', text)
    text = text.strip()
    return text

def parse_api_documentation(text):
    # Extract base info
    base_url_match = re.search(r'Base URL:\s*(.+)', text)
    version_match = re.search(r'Version:\s*(\d+\.\d+\.\d+)', text)
    
    api_docs = {
        "title": "Voclio System - API Documentation",
        "version": version_match.group(1) if version_match else "1.0.0",
        "base_url": base_url_match.group(1).strip() if base_url_match else "https://api.voclio.com/api",
        "authentication": "Bearer Token (JWT)",
        "endpoints": []
    }
    
    # Split text into sections by HTTP methods
    pattern = r'((?:GET|POST|PUT|DELETE|PATCH)\s+/api/[^\n]+)'
    sections = re.split(pattern, text)
    
    i = 1  # Start from 1 to skip the header
    while i < len(sections):
        if i + 1 >= len(sections):
            break
            
        endpoint_line = sections[i].strip()
        content = sections[i + 1] if i + 1 < len(sections) else ""
        
        # Parse endpoint line
        endpoint_match = re.match(r'(GET|POST|PUT|DELETE|PATCH)\s+(/api/\S+)', endpoint_line)
        if not endpoint_match:
            i += 2
            continue
        
        method = endpoint_match.group(1)
        path = endpoint_match.group(2)
        
        endpoint = {
            "method": method,
            "path": path,
            "description": "",
            "authentication_required": True,
            "headers": [],
            "query_parameters": [],
            "path_parameters": [],
            "request_body": None,
            "request_body_schema": {},
            "responses": {}
        }
        
        # Extract description (first paragraph before any section)
        desc_match = re.search(r'^([^\n]+?)(?:\n(?:Headers?:|Request Body:|Query Parameters?:|Parameters?:|Response))', content, re.MULTILINE)
        if desc_match:
            endpoint["description"] = desc_match.group(1).strip()
        
        # Extract headers
        headers_match = re.search(r'Headers?:\s*\n((?:.*\n)*?)(?=\n(?:Request Body:|Response|Query Parameters?|Parameters?:|$))', content, re.MULTILINE)
        if headers_match:
            headers_text = headers_match.group(1)
            headers = [h.strip() for h in headers_text.split('\n') if h.strip() and not h.strip().startswith('Response')]
            endpoint["headers"] = headers
        
        # Extract query parameters
        params_match = re.search(r'(?:Query Parameters?:|Parameters?):\s*\n((?:.*\n)*?)(?=\n(?:Request Body:|Response|Headers?:|$))', content, re.MULTILINE)
        if params_match:
            params_text = params_match.group(1)
            params = []
            for line in params_text.split('\n'):
                line = line.strip()
                if line and line.startswith('-'):
                    params.append(line[1:].strip())
            endpoint["query_parameters"] = params
        
        # Extract request body
        req_body_match = re.search(r'Request Body:\s*\n(\{(?:[^{}]|\{[^{}]*\})*\})', content, re.DOTALL)
        if req_body_match:
            try:
                json_text = clean_json_text(req_body_match.group(1))
                endpoint["request_body"] = json.loads(json_text)
                endpoint["request_body_schema"] = endpoint["request_body"]
            except json.JSONDecodeError:
                endpoint["request_body"] = req_body_match.group(1).strip()
        
        # Extract responses
        # Find all response status codes
        response_pattern = r'Response \((\d{3})\s+([^)]+)\):\s*\n(\{(?:[^{}]|\{[^{}]*\})*\})'
        for resp_match in re.finditer(response_pattern, content, re.DOTALL):
            status_code = resp_match.group(1)
            status_text = resp_match.group(2).strip()
            response_body = resp_match.group(3)
            
            try:
                json_text = clean_json_text(response_body)
                response_json = json.loads(json_text)
                endpoint["responses"][status_code] = {
                    "description": status_text,
                    "body": response_json
                }
            except json.JSONDecodeError:
                endpoint["responses"][status_code] = {
                    "description": status_text,
                    "body": response_body.strip()
                }
        
        # Extract path parameters from path
        path_params = re.findall(r':(\w+)', path)
        if path_params:
            endpoint["path_parameters"] = path_params
        
        # Check if authentication is not required (register, login, etc.)
        if any(keyword in path.lower() for keyword in ['register', 'login', 'forgot-password', 'reset-password']):
            endpoint["authentication_required"] = False
        
        api_docs["endpoints"].append(endpoint)
        i += 2
    
    return api_docs

def main():
    # Extract text from PDF
    pdf_path = "API_Documentation.pdf"
    print("Extracting text from PDF...")
    text = extract_text_from_pdf(pdf_path)
    
    # Save extracted text
    with open("extracted_text.txt", 'w', encoding='utf-8') as f:
        f.write(text)
    print("✓ Raw text saved to: extracted_text.txt")
    
    # Parse API documentation
    print("\nParsing API documentation...")
    api_docs = parse_api_documentation(text)
    
    # Save to JSON with proper formatting
    output_path = "API_Documentation.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(api_docs, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Converted PDF to JSON: {output_path}")
    print(f"✓ Found {len(api_docs['endpoints'])} endpoints")
    print(f"✓ Base URL: {api_docs['base_url']}")
    print(f"✓ Version: {api_docs['version']}")
    
    # Print summary
    print("\n" + "="*50)
    print("Endpoints Summary:")
    print("="*50)
    
    method_count = {}
    for endpoint in api_docs['endpoints']:
        method = endpoint['method']
        method_count[method] = method_count.get(method, 0) + 1
    
    for method, count in sorted(method_count.items()):
        print(f"{method:6s}: {count} endpoints")
    
    print("="*50)

if __name__ == "__main__":
    main()
