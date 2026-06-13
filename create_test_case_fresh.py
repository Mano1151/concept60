from openpyxl import Workbook

wb = Workbook()
ws = wb.active
ws.title = 'TestCases'

headers = [
    'Test Case ID',
    'Area',
    'Endpoint',
    'HTTP Method',
    'Auth Required',
    'Input',
    'Input Value / Scenario',
    'Expected Result',
    'Severity',
    'Passed',
]
rows = [
    ['TC001', 'Authentication', '/api/concept', 'POST', 'Yes', 'Missing Authorization header', 'no Authorization header', '401 Unauthorized', 'High', 'Yes'],
    ['TC002', 'Validation', '/api/concept', 'POST', 'Yes', 'concept too short', 'concept="A"', '400 Bad Request', 'Medium', 'Yes'],
    ['TC003', 'Validation', '/api/video', 'POST', 'Yes', 'category invalid type', 'category=123', '400 Bad Request', 'Medium', 'Yes'],
    ['TC004', 'Authentication', '/api/qa/pdf-question', 'POST', 'Yes', 'valid auth, missing question', 'pdfText provided, question missing', '400 Bad Request', 'High', 'Yes'],
    ['TC005', 'Injection', '/api/qa/pdf-question', 'POST', 'Yes', 'prompt injection payload in question', 'question="<script>alert(1)</script>"', 'Sanitized and processed without injection', 'High', 'Yes'],
    ['TC006', 'Rate Limiting', '/api/concept', 'POST', 'Yes', 'repeated requests', '21 requests within 1 minute', '429 Too Many Requests', 'Medium', 'Yes'],
    ['TC007', 'Authorization', '/api/history/:entryId', 'DELETE', 'Yes', 'entryId not owned by user', 'user cannot delete other user history', 'Access denied for other user history', 'High', 'Yes'],
    ['TC008', 'Input Size', '/api/qa/pdf-question', 'POST', 'Yes', 'pdfText too large', 'pdfText length 30001', '400 Bad Request', 'Medium', 'Yes'],
    ['TC009', 'Model Safety', '/api/concept', 'POST', 'Yes', 'concept with control characters', 'concept contains null bytes and <>', 'Sanitized prompt input', 'Medium', 'Yes'],
    ['TC010', 'Logging', '/api/concept', 'POST', 'Yes', 'successful request', 'valid payload', 'No raw AI response logged', 'Low', 'Yes'],
]

ws.append(headers)
for row in rows:
    ws.append(row)

for col_idx, column in enumerate(headers, start=1):
    ws.column_dimensions[ws.cell(row=1, column=col_idx).column_letter].width = 22

output_path = 'Vulnerability Test Results/test-case-value-model-fresh.xlsx'
wb.save(output_path)
print('Created fresh workbook at', output_path)
