import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import express from 'express';
let cachedApp: any = null;

async function createNestApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  
  const nestApp = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { 
      logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn', 'log']
    }
  );

  const configService = nestApp.get(ConfigService);

  nestApp.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  
  // Use simpler logging for serverless
  if (process.env.NODE_ENV !== 'production') {
    nestApp.use(morgan('combined'));
  }

  // Global validation pipe
  nestApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  nestApp.setGlobalPrefix('api');

  // CORS
  const allowedOrigins = configService.get('NODE_ENV') === 'production' 
    ? [
        configService.get('FRONTEND_URL'),
        configService.get('ADMIN_URL'),
      ].filter(Boolean)
    : true;

  nestApp.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  });
  
  nestApp.use(cookieParser());

  await nestApp.init();
  
  cachedApp = nestApp;
  return nestApp;
}

export default async (req: any, res: any) => {
  try {
    const app = await createNestApp();
    const expressApp = app.getHttpAdapter().getInstance();
    
    // Handle the request
    return expressApp(req, res);
  } catch (error) {
    console.error('Error in Vercel handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
