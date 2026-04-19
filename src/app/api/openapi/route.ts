import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    openapi: '3.1.0',
    info: {
      title: 'FilterCalls API',
      version: '3.0.0'
    },
    paths: {
      '/api/analyze': {
        post: {
          summary: 'Analyze one phone number',
          parameters: [{ in: 'header', name: 'X-API-Key', required: false, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['number'],
                  properties: {
                    number: { type: 'string' },
                    country: { type: 'string', minLength: 2, maxLength: 2 }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Analysis response' },
            '400': { description: 'Validation error' },
            '401': { description: 'API key invalid' },
            '429': { description: 'Rate limit exceeded' }
          }
        }
      },
      '/api/analyze/batch': {
        post: {
          summary: 'Analyze a batch of phone numbers',
          parameters: [{ in: 'header', name: 'X-API-Key', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Batch result' },
            '400': { description: 'Validation error' },
            '401': { description: 'API key required' },
            '429': { description: 'Rate limit exceeded' }
          }
        }
      }
    }
  });
}
