import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Vaso Cerâmica Terracota' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'vaso-ceramica-terracota' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiProperty({ example: 'Vaso feito à mão com acabamento fosco' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 8900, description: 'Preço em centavos (R$ 89,00)' })
  @IsNumber()
  @Min(1)
  priceInCents!: number;

  @ApiProperty({ example: 15 })
  @IsNumber()
  @Min(0)
  stock!: number;

  @ApiProperty({
    example: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 'uuid-da-categoria' })
  @IsUUID('4')
  @IsNotEmpty()
  categoryId!: string;
}
