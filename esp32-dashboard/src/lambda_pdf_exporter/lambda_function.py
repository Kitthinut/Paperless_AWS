import json
import os
import boto3
import base64
from decimal import Decimal
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from datetime import datetime
from io import BytesIO

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')

# Environment variable (or fallback)
LOG_TABLE_NAME = os.environ.get('LOG_TABLE_NAME', 'Paperless_ESP32_Log_Data')
log_table = dynamodb.Table(LOG_TABLE_NAME)

def lambda_handler(event, context):
    print(f"Received event for export-pdf: {json.dumps(event)}")

    # CORS preflight request handling
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            },
            'body': ''
        }

    try:
        # Parse query parameters
        query_params = event.get('queryStringParameters', {})
        chip_id = query_params.get('chip_id')
        timestamp_str = query_params.get('timestamp')

        if not chip_id or not timestamp_str:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Missing chip_id or timestamp in request query parameters.'})
            }

        try:
            timestamp = int(timestamp_str)
        except ValueError:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Invalid timestamp format. Must be a number.'})
            }

        # Fetch data from DynamoDB
        response = log_table.get_item(
            Key={
                'chip_id': chip_id,
                'timestamp': timestamp
            }
        )
        item = response.get('Item')
        if not item:
            return {
                'statusCode': 404,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Log entry not found.'})
            }

        # Convert timestamp
        try:
            log_timestamp_ms = item.get('timestamp', 0)
            log_timestamp_seconds = float(log_timestamp_ms) / 1000
            log_datetime = datetime.fromtimestamp(log_timestamp_seconds)
        except (TypeError, ValueError, OverflowError) as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': f'Internal server error: Failed to process timestamp: {str(e)}'})
            }

        # Prepare PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Format timestamps
        BECYear = log_datetime.year + 543
        formatted_datetime_be = log_datetime.strftime(f"%d/%m/{BECYear} %H:%M:%S")
        formatted_datetime_ce = log_datetime.strftime("%Y-%m-%d %H:%M:%S")

        # Add timestamp info
        story.append(Paragraph(f"<b>Timestamp (BE):</b> {formatted_datetime_be}", styles['Normal']))
        story.append(Paragraph(f"<b>Timestamp (CE):</b> {formatted_datetime_ce}", styles['Normal']))
        story.append(Spacer(1, 10))

        # Add table of data
        data_rows = [["Attribute", "Value"]]
        for key, value in item.items():
            if key not in ['chip_id', 'timestamp', 'name', 'SK'] and not key.startswith('aws:'):
                display_value = str(float(value)) if isinstance(value, Decimal) else str(value)
                data_rows.append([key, display_value])

        if len(data_rows) > 1:
            table = Table(data_rows)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BOX', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(table)
            story.append(Spacer(1, 10))

        # End tag
        story.append(Paragraph("--- End of Report ---", styles['Normal']))

        # Generate PDF
        doc.build(story)
        pdf_content = buffer.getvalue()
        buffer.close()

        # Return PDF Base64-encoded
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/pdf',
                'Content-Disposition': f'attachment; filename="log_report_{chip_id}_{timestamp}.pdf"',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': base64.b64encode(pdf_content).decode('utf-8'),
            'isBase64Encoded': True
        }

    except Exception as e:
        print(f"Error generating PDF: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Internal server error: {str(e)}'})
        }
