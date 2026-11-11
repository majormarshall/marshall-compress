import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import type { UserProfile } from '@marshall/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get user profile by Supabase user ID
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await this.supabaseService.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      this.logger.warn(`Profile not found for user: ${userId}`);
      throw new NotFoundException('User profile not found');
    }

    return data as UserProfile;
  }

  /**
   * Register a new user with Supabase Auth and initialize user profile
   */
  async register(dto: RegisterDto): Promise<{ user: any; profile: UserProfile | null }> {
    const { data, error } = await this.supabaseService.client.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          first_name: dto.firstName,
          last_name: dto.lastName,
        },
      },
    });

    if (error) {
      this.logger.error(`Registration error for ${dto.email}: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    const user = data.user;
    if (!user) {
      throw new BadRequestException('User registration could not be completed');
    }

    // Ensure profile row exists (in case database trigger hasn't fired yet)
    const { data: profile, error: profileError } = await this.supabaseService.client
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        first_name: dto.firstName || null,
        last_name: dto.lastName || null,
        role: 'FREE',
        storage_used_bytes: 0,
        storage_limit_bytes: 5368709120, // 5GB default
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (profileError) {
      this.logger.warn(`Could not upsert profile for ${user.id}: ${profileError.message}`);
    }

    return {
      user,
      profile: (profile as UserProfile) || null,
    };
  }

  /**
   * Authenticate user with email and password
   */
  async login(dto: LoginDto): Promise<{ session: any; user: any; profile: UserProfile | null }> {
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.user || !data.session) {
      throw new UnauthorizedException(error?.message || 'Invalid email or password');
    }

    let profile: UserProfile | null = null;
    try {
      profile = await this.getProfile(data.user.id);
    } catch {
      // Profile might not exist yet if created outside standard flow
    }

    return {
      session: data.session,
      user: data.user,
      profile,
    };
  }

  /**
   * Log out user
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    const { error } = await this.supabaseService.client.auth.signOut();
    if (error) {
      this.logger.warn(`Logout error: ${error.message}`);
    }
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  /**
   * Send password reset email
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const { error } = await this.supabaseService.client.auth.resetPasswordForEmail(
      dto.email,
    );

    if (error) {
      this.logger.error(`Forgot password error for ${dto.email}: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return {
      message: 'Password reset link sent to your email address',
    };
  }

  /**
   * Reset user password for authenticated user
   */
  async resetPassword(userId: string, dto: ResetPasswordDto): Promise<{ message: string }> {
    const { error } = await this.supabaseService.client.auth.admin.updateUserById(
      userId,
      { password: dto.password },
    );

    if (error) {
      this.logger.error(`Reset password error for user ${userId}: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return {
      message: 'Password updated successfully',
    };
  }
}
