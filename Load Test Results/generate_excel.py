import json
import pandas as pd
import sys

def main():
    try:
        with open('autocannon_result.json', 'r', encoding='utf-16') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading JSON: {e}")
        sys.exit(1)

    url = data.get('url', 'N/A')
    connections = data.get('connections', 0)
    duration = data.get('duration', 0)
    requests_total = data.get('requests', {}).get('total', 0)
    requests_avg = data.get('requests', {}).get('average', 0)
    errors = data.get('errors', 0)
    timeouts = data.get('timeouts', 0)
    
    latency = data.get('latency', {})
    lat_min = latency.get('min', 0)
    lat_max = latency.get('max', 0)
    lat_avg = latency.get('average', 0)
    lat_p99 = latency.get('p99', 0)

    report_data = {
        'Metric': [
            'Target URL',
            'Concurrent Users (Connections)',
            'Duration (seconds)',
            'Total Requests Sent',
            'Requests per second (RPS)',
            'Total Errors',
            'Timeouts',
            'Fastest Response / Min Latency (ms)',
            'Average Response Time (ms)',
            'Slowest Response / Max Latency (ms)',
            '99th Percentile Latency (ms)'
        ],
        'Value': [
            url,
            connections,
            duration,
            requests_total,
            requests_avg,
            errors,
            timeouts,
            lat_min,
            lat_avg,
            lat_max,
            lat_p99
        ]
    }

    df = pd.DataFrame(report_data)

    output_file = 'Load_Testing_Report.xlsx'
    try:
        df.to_excel(output_file, index=False, sheet_name='Load Test Results')
        print(f"Successfully generated {output_file}")
    except Exception as e:
        print(f"Error writing to Excel: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
