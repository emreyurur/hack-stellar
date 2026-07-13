import {
  Controller,
  Get,
  Post,
  Body,
  UnauthorizedException,
  Query,
  Inject,
} from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { appConfig } from "../../config/app.config";

@Controller("api/v1/auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {}

  @Get("challenge")
  async getChallenge(@Query("publicKey") publicKey: string) {
    if (!publicKey) {
      throw new UnauthorizedException("Public key is required");
    }
    const challengeXdr = await this.authService.createChallenge(publicKey);
    return {
      transaction: challengeXdr,
      networkPassphrase: this.config.networkPassphrase,
    };
  }

  @Post("verify")
  async verify(@Body("signedXdr") signedXdr: string) {
    if (!signedXdr) {
      throw new UnauthorizedException("Signed XDR is required");
    }
    const result = await this.authService.verifyChallenge(signedXdr);
    return result;
  }
}
