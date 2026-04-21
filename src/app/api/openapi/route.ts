import { NextResponse } from 'next/server.js';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    openapi: '3.1.0',
    info: { title: 'FilterCalls API', version: '4.0.0' },
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        AdminToken: { type: 'apiKey', in: 'header', name: 'X-Admin-Token' },
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'fc_session' }
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

      '/api/portal/signup': { post: { responses: { '201': { description: 'Signup success' }, '409': { description: 'Duplicate email' }, '429': { description: 'Rate limited (5/hour/IP)' } } } },
      '/api/portal/login': { post: { responses: { '200': { description: 'Login success' }, '401': { description: 'Invalid credentials' }, '429': { description: 'Rate limited (5/15min/IP)' } } } },
      '/api/portal/logout': { post: { security: [{ cookieAuth: [] }], responses: { '200': { description: 'Logged out' } } } },
      '/api/portal/me': {
        get: { security: [{ cookieAuth: [] }], responses: { '200': { description: 'Current user' } } },
        patch: { security: [{ cookieAuth: [] }], responses: { '200': { description: 'Updated' }, '403': { description: 'CSRF failed' } } },
        delete: { security: [{ cookieAuth: [] }], responses: { '200': { description: 'Soft-deleted' }, '403': { description: 'CSRF failed' } } }
      },
      '/api/portal/keys': {
        get: { security: [{ cookieAuth: [] }], responses: { '200': { description: 'User keys' }, '429': { description: 'Rate limited (300/min/user)' } } },
        post: { security: [{ cookieAuth: [] }], responses: { '201': { description: 'Created key' }, '403': { description: 'CSRF failed' }, '429': { description: 'Rate limited (60/min/user)' } } }
      },
      '/api/portal/keys/{id}': { delete: { security: [{ cookieAuth: [] }], responses: { '200': { description: 'Revoked' }, '404': { description: 'Not found' } } } },
      '/api/portal/webhooks': { get: { security: [{ cookieAuth: [] }], responses: { '200': { description: 'List' } } }, post: { security: [{ cookieAuth: [] }], responses: { '201': { description: 'Created' } } } },
      '/api/portal/usage': { get: { security: [{ cookieAuth: [] }], responses: { '200': { description: 'User 30-day usage' } } } },
      '/api/portal/dashboard': { get: { security: [{ cookieAuth: [] }], responses: { '200': { description: 'User dashboard metrics' } } } },
      '/api/webhooks': {
        get: { security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'List webhooks' }, '401': { description: 'Unauthorized' } } },
        post: { security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'Create webhook' }, '401': { description: 'Unauthorized' } } },
        delete: { security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'Disable webhook' }, '401': { description: 'Unauthorized' } } }
      }
    }
  });
}
