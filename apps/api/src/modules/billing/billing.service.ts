import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateCheckoutSessionDto } from './dtos/create-checkout-session.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey && !stripeSecretKey.startsWith('sk_test_...')) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-01-27.acacia' as any,
      });
      this.logger.log('Stripe client initialized successfully');
    } else {
      this.logger.warn('STRIPE_SECRET_KEY is not configured or placeholder — running in simulated billing mode');
    }
  }

  /**
   * Create a Stripe Checkout session or return simulated redirect URL in dev mode
   */
  async createCheckoutSession(
    userId: string,
    userEmail: string,
    dto: CreateCheckoutSessionDto,
  ): Promise<{ url: string; sessionId?: string; isSimulated: boolean }> {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      this.configService.get<string>('CORS_ORIGIN') ||
      'http://localhost:3000';

    const successUrl = dto.successUrl || `${appUrl}/dashboard/billing?status=success&plan=${dto.planId}`;
    const cancelUrl = dto.cancelUrl || `${appUrl}/dashboard/billing?status=cancelled`;

    const role = dto.planId === 'enterprise' ? 'BUSINESS' : 'PRO';
    const storageLimitBytes = dto.planId === 'enterprise' ? 1099511627776 : 107374182400;

    // If Stripe is not live yet, gracefully simulate success in dev
    if (!this.stripe) {
      this.logger.log(`Simulating checkout session for user ${userId} and plan ${dto.planId}`);
      try {
        await this.supabaseService.client
          .from('profiles')
          .update({
            role,
            storage_limit_bytes: storageLimitBytes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        await this.supabaseService.client
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan: role,
            status: 'ACTIVE',
            updated_at: new Date().toISOString(),
          });
      } catch (err: any) {
        this.logger.warn(`Could not update profile subscription: ${err.message}`);
      }

      return {
        url: successUrl,
        sessionId: `sim_sess_${Date.now()}`,
        isSimulated: true,
      };
    }

    try {
      const priceId =
        dto.planId === 'pro'
          ? process.env.STRIPE_PRICE_PRO_MONTHLY
          : process.env.STRIPE_PRICE_BUSINESS_MONTHLY;

      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: userEmail,
        client_reference_id: userId,
        line_items: priceId
          ? [{ price: priceId, quantity: 1 }]
          : [
              {
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: `MARSHALL ${dto.planId.toUpperCase()} Subscription`,
                    description: `Unlimited file compression, AI features, and high-speed storage.`,
                  },
                  unit_amount: dto.planId === 'pro' ? 1200 : 4900,
                  recurring: { interval: 'month' },
                },
                quantity: 1,
              },
            ],
        metadata: {
          userId,
          planId: dto.planId,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return {
        url: session.url || successUrl,
        sessionId: session.id,
        isSimulated: false,
      };
    } catch (err: any) {
      this.logger.error(`Error creating checkout session: ${err.message}`);
      throw new BadRequestException(err.message || 'Failed to create checkout session');
    }
  }

  /**
   * Create a Customer Portal session for managing billing / cards / cancellation
   */
  async createPortalSession(userId: string): Promise<{ url: string }> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!this.stripe) {
      return { url: `${appUrl}/dashboard/billing` };
    }

    // Lookup customer ID from profiles
    const { data: profile } = await this.supabaseService.client
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_customer_id) {
      throw new NotFoundException('No active Stripe customer found for this account');
    }

    const portal = await this.stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/dashboard/billing`,
    });

    return { url: portal.url };
  }

  /**
   * Handle incoming Stripe webhook
   */
  async handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
    if (!this.stripe) {
      return { received: true };
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        const planId = session.metadata?.planId || 'pro';
        const role = planId === 'enterprise' ? 'BUSINESS' : 'PRO';
        const storageLimitBytes = planId === 'enterprise' ? 1099511627776 : 107374182400;

        if (userId) {
          await this.supabaseService.client
            .from('profiles')
            .update({
              role,
              storage_limit_bytes: storageLimitBytes,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          await this.supabaseService.client
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              plan: role,
              status: 'ACTIVE',
              updated_at: new Date().toISOString(),
            });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.supabaseService.client
          .from('subscriptions')
          .update({
            status: 'CANCELLED',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }
}
