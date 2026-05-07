import 'dotenv/config';
// import cookieParser from 'cookie-parser';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as morgan from 'morgan';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { ReadOnlyGuard } from './common/guards/read-only.guard';
import { AuthService } from './auth/auth.service';
import { JwtService } from '@nestjs/jwt';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(morgan('dev'));
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  const allowedOrigins = configService.get('NODE_ENV') === 'production' 
    ? [
        configService.get('FRONTEND_URL'), // Frontend domain trên Vercel
        configService.get('ADMIN_URL'),    // Admin panel domain (nếu có)
      ].filter(Boolean) // Loại bỏ undefined values
    : true; // Cho phép tất cả origins trong development

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  });
  app.use(cookieParser());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Wood Furniture Store Management API')
    .setDescription('API for managing wood furniture store operations')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>('PORT', 3000);

  // Global read-only guard for demo account
  app.useGlobalGuards(new ReadOnlyGuard(app.get(JwtService)));

  // Ensure demo admin user exists (only if DEMO_* envs are set)
  const authService = app.get(AuthService);
  await authService.ensureDemoUser({});

  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

// For Vercel serverless deployment
export default bootstrap;

// For local development
if (require.main === module) {
  bootstrap().catch((error) => {
    console.error('Error starting application:', error);
    process.exit(1);
  });
}
