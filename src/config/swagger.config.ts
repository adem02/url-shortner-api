import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'URL Shortner API',
      version: '1.0.0',
      description: 'Public REST API for URL Shortner — URL shortener with analytics.',
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3000',
        description: 'Current server',
      },
    ],
    components: {
      schemas: {
        ApiError: {
          type: 'object',
          required: ['code', 'key', 'message'],
          properties: {
            code: { type: 'integer', example: 400 },
            key: {
              type: 'string',
              enum: [
                'validation/failed',
                'resource/not-found',
                'security/rate-limit-exceeded',
                'sql/failed',
                'sql/not-found',
                'link/code-generation-failed',
                'internal/unknown',
              ],
            },
            message: { type: 'string', example: 'URL must start with http:// or https://.' },
          },
        },
        ShortenUrlInputDTO: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string', format: 'uri', example: 'https://example.com/very-long-path' },
          },
        },
        ShortenUrlInterface: {
          type: 'object',
          required: ['code', 'longUrl', 'shortUrl', 'statsUrl', 'createdAt'],
          properties: {
            code: { type: 'string', example: 'aB3xK9' },
            longUrl: { type: 'string', format: 'uri' },
            shortUrl: { type: 'string', format: 'uri', example: 'http://localhost:3000/aB3xK9' },
            statsUrl: {
              type: 'string',
              format: 'uri',
              example: 'http://localhost:3000/api/stats/aB3xK9',
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        StatsLink: {
          type: 'object',
          required: ['code', 'longUrl', 'shortUrl', 'createdAt'],
          properties: {
            code: { type: 'string', example: 'aB3xK9' },
            longUrl: { type: 'string', format: 'uri' },
            shortUrl: { type: 'string', format: 'uri' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ClicksPerHour: {
          type: 'object',
          required: ['hour', 'clicks'],
          properties: {
            hour: {
              type: 'string',
              example: '14:00',
              description: 'Hour slot formatted as HH:MM (UTC)',
            },
            clicks: { type: 'integer', example: 5 },
          },
        },
        StatsCountry: {
          type: 'object',
          required: ['country', 'clicks', 'percentage'],
          properties: {
            country: { type: 'string', example: 'France' },
            clicks: { type: 'integer', example: 42 },
            percentage: { type: 'number', format: 'float', example: 35.5 },
          },
        },
        StatsDevices: {
          type: 'object',
          required: ['mobile', 'desktop', 'tablet'],
          properties: {
            mobile: { type: 'integer', example: 120 },
            desktop: { type: 'integer', example: 80 },
            tablet: { type: 'integer', example: 10 },
          },
        },
        RecentClick: {
          type: 'object',
          required: ['timestamp', 'country', 'device', 'browser'],
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            country: { type: 'string', example: 'France', nullable: true },
            device: { type: 'string', enum: ['mobile', 'desktop', 'tablet'], example: 'mobile' },
            browser: { type: 'string', example: 'Chrome', nullable: true },
          },
        },
        ClickStats: {
          type: 'object',
          required: [
            'today',
            'thisWeek',
            'thisMonth',
            'total',
            'clicksPerHour',
            'topCountries',
            'devices',
            'recentClicks',
          ],
          properties: {
            today: { type: 'integer', example: 12 },
            thisWeek: { type: 'integer', example: 84 },
            thisMonth: { type: 'integer', example: 320 },
            total: { type: 'integer', example: 1540 },
            clicksPerHour: { type: 'array', items: { $ref: '#/components/schemas/ClicksPerHour' } },
            topCountries: { type: 'array', items: { $ref: '#/components/schemas/StatsCountry' } },
            devices: { $ref: '#/components/schemas/StatsDevices' },
            recentClicks: { type: 'array', items: { $ref: '#/components/schemas/RecentClick' } },
          },
        },
      },
    },
    paths: {
      '/api/shorten': {
        post: {
          summary: 'Shorten a URL',
          tags: ['Links'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ShortenUrlInputDTO' },
              },
            },
          },
          responses: {
            201: {
              description: 'URL shortened successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/ShortenUrlInterface' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                  example: {
                    code: 400,
                    key: 'validation/failed',
                    message: 'URL must start with http:// or https://.',
                  },
                },
              },
            },
            429: {
              description: 'Rate limit exceeded (20 requests/hour per IP)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                  example: {
                    code: 429,
                    key: 'security/rate-limit-exceeded',
                    message: 'Too many requests. Limit: 20 links per hour per IP.',
                  },
                },
              },
            },
            500: {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                  example: {
                    code: 500,
                    key: 'internal/unknown',
                    message: 'Internal server error.',
                  },
                },
              },
            },
            503: {
              description: 'Code generation failed (retry later)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                  example: {
                    code: 503,
                    key: 'link/code-generation-failed',
                    message: 'Failed generating unique code. Please try again later.',
                  },
                },
              },
            },
          },
        },
      },
      '/{code}': {
        get: {
          summary: 'Redirect to the original URL',
          tags: ['Redirect'],
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              description: '6-character alphanumeric short code',
              schema: { type: 'string', example: 'aB3xK9' },
            },
          ],
          responses: {
            302: {
              description: 'Redirect to the original URL',
              headers: {
                Location: {
                  description: 'Target URL',
                  schema: { type: 'string', format: 'uri' },
                },
              },
            },
            404: {
              description: 'Code not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                  example: { code: 404, key: 'resource/not-found', message: 'Url not found.' },
                },
              },
            },
          },
        },
      },
      '/api/stats/{code}': {
        get: {
          summary: 'Get click analytics for a shortened link',
          tags: ['Stats'],
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              description: '6-character alphanumeric short code',
              schema: { type: 'string', example: 'aB3xK9' },
            },
          ],
          responses: {
            200: {
              description: 'Stats retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          link: { $ref: '#/components/schemas/StatsLink' },
                          stats: { $ref: '#/components/schemas/ClickStats' },
                        },
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: 'Code not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                  example: { code: 404, key: 'resource/not-found', message: 'Url not found.' },
                },
              },
            },
            500: {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                  example: {
                    code: 500,
                    key: 'internal/unknown',
                    message: 'Internal server error.',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
