import swaggerAutogen from 'swagger-autogen'

const doc = {
  info: { title: 'TaskFlow API', version: '1.0.0' },
  servers: [{ url: 'http://localhost:4000/api' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
}

swaggerAutogen({ openapi: '3.0.0' })('./src/swagger-output.json', ['./src/routes/index.js'], doc)