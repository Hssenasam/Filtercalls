import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    openapi: '3.1.0',
    info: { title: 'FilterCalls API', version: '3.0.1' },
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        AdminToken: { type: 'apiKey', in: 'header', name: 'X-Admin-Token' }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: { error: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' } } } }
        }
      }
    },
    paths: {
      '/api/analyze': {
        options: { responses: { '204': { description: 'CORS preflight' } } },
        post: { responses: { '200': { description: 'Analysis response' }, '400': { description: 'Validation error' }, '401': { description: 'Unauthorized' }, '429': { description: 'Rate limited' } } }
      },
      '/api/analyze/batch': {
        options: { responses: { '204': { description: 'CORS preflight' } } },
        post: {
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { items: { type: 'array', maxItems: 100 } } } } }
          },
          responses: { '200': { description: 'Batch response' }, '400': { description: 'Validation error' }, '401': { description: 'Unauthorized' }, '429': { description: 'Rate limited' } }
        }
      },
      '/api/admin/keys': {
        get: { security: [{ AdminToken: [] }], responses: { '200': { description: 'List API keys' }, '401': { description: 'Unauthorized' } } },
        post: { security: [{ AdminToken: [] }], responses: { '200': { description: 'Created API key (full key only once)' }, '401': { description: 'Unauthorized' } } }
      },
      '/api/admin/keys/{id}': {
        delete: {
          security: [{ AdminToken: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Revoked' }, '401': { description: 'Unauthorized' } }
        }
      },
      '/api/webhooks': {
        get: { security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'List webhooks' }, '401': { description: 'Unauthorized' } } },
        post: { security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'Create webhook' }, '401': { description: 'Unauthorized' } } },
        delete: { security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'Disable webhook' }, '401': { description: 'Unauthorized' } } }
      }
    }
  });
}
