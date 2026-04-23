import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import config from './index.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Voclio API Documentation',
      version: '2.0.0',
      description: 'Voice-powered productivity and task management API with AI capabilities',
      contact: {
        name: 'Voclio Team',
        email: 'support@voclio.app'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server'
      },
      {
        url: 'https://api.voclio.app',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                message: {
                  type: 'string',
                  example: 'Invalid request data'
                }
              }
            }
          }
        },
        Task: {
          type: 'object',
          properties: {
            task_id: {
              type: 'integer',
              example: 1
            },
            user_id: {
              type: 'integer',
              example: 1
            },
            title: {
              type: 'string',
              example: 'Complete project documentation'
            },
            description: {
              type: 'string',
              example: 'Write comprehensive API documentation'
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'completed', 'cancelled'],
              example: 'todo'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              example: 'high'
            },
            due_date: {
              type: 'string',
              format: 'date-time',
              example: '2026-04-30T15:00:00Z'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        VoiceRecording: {
          type: 'object',
          properties: {
            recording_id: {
              type: 'integer',
              example: 1
            },
            user_id: {
              type: 'integer',
              example: 1
            },
            file_path: {
              type: 'string',
              example: 'https://storage.voclio.app/voice/123/recording.mp3'
            },
            storage_key: {
              type: 'string',
              example: 'voice/123/1234567890-abc123-recording.mp3'
            },
            file_size: {
              type: 'integer',
              example: 1024000
            },
            format: {
              type: 'string',
              example: 'audio/mpeg'
            },
            transcription_text: {
              type: 'string',
              example: 'عايز أشتري لبن وخبز بكرة الصبح'
            },
            status: {
              type: 'string',
              enum: ['uploaded', 'processing', 'completed', 'failed'],
              example: 'completed'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        JobStatus: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'job-123-abc'
            },
            name: {
              type: 'string',
              example: 'transcribe-audio'
            },
            state: {
              type: 'string',
              enum: ['waiting', 'active', 'completed', 'failed', 'delayed'],
              example: 'completed'
            },
            progress: {
              type: 'number',
              example: 100
            },
            result: {
              type: 'object',
              example: {
                transcription: 'عايز أشتري لبن وخبز',
                success: true
              }
            },
            error: {
              type: 'string',
              nullable: true
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Voice',
        description: 'Voice recording and processing'
      },
      {
        name: 'Tasks',
        description: 'Task management'
      },
      {
        name: 'Notes',
        description: 'Note management'
      },
      {
        name: 'Queue',
        description: 'Job queue management'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
