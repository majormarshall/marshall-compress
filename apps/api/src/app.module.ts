import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './common/supabase/supabase.module';
import { StorageModule } from './modules/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { FilesModule } from './modules/files/files.module';
import { FoldersModule } from './modules/folders/folders.module';
import { CompressionModule } from './modules/compression/compression.module';
import { NotesModule } from './modules/notes/notes.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { AiModule } from './modules/ai/ai.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Config — available globally across all modules
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Core shared infrastructure
    SupabaseModule,
    StorageModule,

    // Feature modules
    AuthModule,
    FilesModule,
    FoldersModule,
    CompressionModule,
    NotesModule,
    MeetingsModule,
    AiModule,
  ],
})
export class AppModule {}
