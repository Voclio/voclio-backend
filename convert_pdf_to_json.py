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

def parse_api_documentation(text):
    api_docs = {
        "title": "API Documentation",
        "base_url": "",
        "version": "1.0.0",
        "endpoints": []
    }
    
    lines = text.split('\n')
    current_endpoint = None
    current_section = None
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Detect endpoint
        endpoint_match = re.match(r'^(GET|POST|PUT|DELETE|PATCH)\s+(/\S+)', line)
        if endpoint_match:
            # Save previous endpoint
            if current_endpoint:
                api_docs["endpoints"].append(current_endpoint)
            
            method = endpoint_match.group(1)
            path = endpoint_match.group(2)
            
            current_endpoint = {
                "method": method,
                "path": path,
                "description": "",
                "headers": [],
                "query_parameters": [],
                "path_parameters": [],
                "request_body": None,
                "request_body_example": "",
                "responses": {},
                "authentication": "Bearer Token"
            }
            current_section = None
        
        elif current_endpoint:
            # Detect sections
            if re.match(r'^(Description|Endpoint Description):', line, re.IGNORECASE):
                current_section = "description"
                i += 1
                continue
            elif re.match(r'^Headers?:', line, re.IGNORECASE):
                current_section = "headers"
                i += 1
                continue
            elif re.match(r'^(Query Parameters?|Parameters?):', line, re.IGNORECASE):
                current_section = "parameters"
                i += 1
                continue
            elif re.match(r'^Request Body:', line, re.IGNORECASE):
                current_section = "request_body"
                i += 1
                continue
            elif re.match(r'^(Response|Success Response|Responses?):', line, re.IGNORECASE):
                current_section = "response"
                i += 1
                continue
            elif re.match(r'^(Error Responses?|Errors?):', line, re.IGNORECASE):
                current_section = "error_response"
                i += 1
                continue
            
            # Parse content based on current section
            if current_section == "description":
                if line and not re.match(r'^(Headers?|Parameters?|Request|Response|GET|POST|PUT|DELETE|PATCH):', line, re.IGNORECASE):
                    current_endpoint["description"] += line + " "
            
            elif current_section == "headers":
                if line and line.startswith('-'):
                    current_endpoint["headers"].append(line[1:].strip())
                elif line and not re.match(r'^(Parameters?|Request|Response|GET|POST|PUT|DELETE|PATCH):', line, re.IGNORECASE):
                    current_endpoint["headers"].append(line)
            
            elif current_section == "parameters":
                if line and (line.startswith('-') or re.match(r'^\w+\s*\(', line)):
                    current_endpoint["query_parameters"].append(line.lstrip('- ').strip())
            
            elif current_section == "request_body":
                if line and not re.match(r'^(Response|GET|POST|PUT|DELETE|PATCH):', line, re.IGNORECASE):
                    if line.startswith('{') or current_endpoint["request_body_example"]:
                        current_endpoint["request_body_example"] += line + " "
                        # Try to parse as JSON
                        try:
                            current_endpoint["request_body"] = json.loads(current_endpoint["request_body_example"].strip())
                        except:
                            pass
            
            elif current_section == "response":
                if line and not re.match(r'^(Error|GET|POST|PUT|DELETE|PATCH):', line, re.IGNORECASE):
                    # Check for status codes
                    status_match = re.match(r'^(\d{3})\s+(.+)', line)
                    if status_match:
                        status_code = status_match.group(1)
                        status_text = status_match.group(2)
                        current_endpoint["responses"][status_code] = {
                            "description": status_text,
                            "example": ""
                        }
                    elif line.startswith('{'):
                        # Try to find the last status code and add example
                        if current_endpoint["responses"]:
                            last_status = list(current_endpoint["responses"].keys())[-1]
                            current_endpoint["responses"][last_status]["example"] += line + " "
            
            elif current_section == "error_response":
                if line and not re.match(r'^(GET|POST|PUT|DELETE|PATCH):', line, re.IGNORECASE):
                    status_match = re.match(r'^(\d{3})\s+(.+)', line)
                    if status_match:
                        status_code = status_match.group(1)
                        status_text = status_match.group(2)
                        current_endpoint["responses"][status_code] = {
                            "description": status_text,
                            "example": ""
                        }
        
        i += 1
    
    # Add the last endpoint
    if current_endpoint:
        api_docs["endpoints"].append(current_endpoint)
    
    # Clean up endpoints
    for endpoint in api_docs["endpoints"]:
        endpoint["description"] = endpoint["description"].strip()
        if endpoint["request_body_example"]:
            endpoint["request_body_example"] = endpoint["request_body_example"].strip()
    
    return api_docs

# Extract and convert
pdf_path = "API_Documentation.pdf"
text = extract_text_from_pdf(pdf_path)

# Save raw text for debugging
with open("extracted_text.txt", 'w', encoding='utf-8') as f:
    f.write(text)

# Parse the documentation
api_docs = parse_api_documentation(text)

# Save to JSON
output_path = "API_Documentation.json"
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(api_docs, f, indent=2, ensure_ascii=False)

print(f"Converted PDF to JSON: {output_path}")
print(f"Found {len(api_docs['endpoints'])} endpoints")
print(f"Raw text saved to: extracted_text.txt")
