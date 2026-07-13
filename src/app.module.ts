import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "./config/config.module";
import { CoreModule } from "./core/core.module";
import { ScoutModule } from "./modules/scout/scout.module";
import { RiskModule } from "./modules/risk/risk.module";
import { OrchestratorModule } from "./modules/orchestrator/orchestrator.module";
import { PortfolioModule } from "./modules/portfolio/portfolio.module";

@Module({
  imports: [
    ConfigModule,
    CoreModule,
    ScoutModule,
    RiskModule,
    OrchestratorModule,
    PortfolioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
