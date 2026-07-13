import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { DatabaseModule } from "./database/database.module";
import { RedisModule } from "./redis/redis.module";
import { AuthModule } from "./auth/auth.module";
import { GlobalExceptionFilter } from "./filters/global-exception.filter";

@Module({
  imports: [DatabaseModule, RedisModule, AuthModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [DatabaseModule, RedisModule, AuthModule],
})
export class CoreModule {}
