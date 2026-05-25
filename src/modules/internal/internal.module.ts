import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
  imports: [ChatbotModule],
  controllers: [InternalController],
})
export class InternalModule {}
