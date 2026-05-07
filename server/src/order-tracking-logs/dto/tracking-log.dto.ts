import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTrackingLogDto {
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  orderId: number;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class TrackingLogResponseDto {
  id: number;
  orderId: number;
  message: string;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: number;
    fullName: string;
    role: string;
  };
}

export class UpdateOrderStatusWithLogDto {
  @IsString()
  @IsNotEmpty()
  newStatus: string;

  @IsString()
  @IsOptional()
  message?: string;
}
