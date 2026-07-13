import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { appConfig } from "../../config/app.config";
import { UnauthorizedException } from "@nestjs/common";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    createChallenge: jest.fn(),
    verifyChallenge: jest.fn(),
  };

  const mockAppConfig = {
    networkPassphrase: "Test SDF Network ; September 2015",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: appConfig.KEY,
          useValue: mockAppConfig,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getChallenge", () => {
    it("should return a challenge transaction and network passphrase", async () => {
      const publicKey = "GAXYZ...";
      const mockXdr = "AAAA...";

      mockAuthService.createChallenge.mockResolvedValue(mockXdr);

      const result = await controller.getChallenge(publicKey);

      expect(authService.createChallenge).toHaveBeenCalledWith(publicKey);
      expect(result).toEqual({
        transaction: mockXdr,
        networkPassphrase: mockAppConfig.networkPassphrase,
      });
    });

    it("should throw UnauthorizedException if public key is not provided", async () => {
      await expect(controller.getChallenge(undefined as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("verify", () => {
    it("should return a token if signature is valid", async () => {
      const mockSignedXdr = "AAAA...";
      const mockResult = { token: "jwt-token-123" };

      mockAuthService.verifyChallenge.mockResolvedValue(mockResult);

      const result = await controller.verify(mockSignedXdr);

      expect(authService.verifyChallenge).toHaveBeenCalledWith(mockSignedXdr);
      expect(result).toEqual(mockResult);
    });

    it("should throw UnauthorizedException if signedXdr is not provided", async () => {
      await expect(controller.verify("")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
