import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto } from './dtos/create-checkout-session.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe Checkout Session' })
  @SwaggerApiResponse({ status: 200, description: 'Stripe checkout session URL generated' })
  async createCheckoutSession(
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.billingService.createCheckoutSession(userId, userEmail, dto);
  }

  @Post('portal')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe Customer Portal Session' })
  @SwaggerApiResponse({ status: 200, description: 'Customer portal URL' })
  async createPortalSession(@CurrentUser('id') userId: string) {
    return this.billingService.createPortalSession(userId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook receiver' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: FastifyRequest,
  ) {
    // Fastify rawBody is parsed as buffer when enabled or body as fallback
    const body = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));
    return this.billingService.handleWebhook(body, signature);
  }
}
