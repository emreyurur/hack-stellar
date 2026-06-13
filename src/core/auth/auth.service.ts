import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { TransactionBuilder, Networks, Keypair, Operation, Transaction, Account } from '@stellar/stellar-sdk';
import { appConfig } from '../../config/app.config';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthService {
  private readonly serverKeypair: Keypair;

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {
    // Sunucu kimliği için geçici bir keypair (challenge üretmek için)
    this.serverKeypair = Keypair.random();
  }

  async createChallenge(clientPublicKey: string): Promise<string> {
    const nonce = Math.random().toString(36).substring(2, 15);
    
    const tx = new TransactionBuilder(
      new Account(this.serverKeypair.publicKey(), '0'),
      {
        fee: '100',
        networkPassphrase: this.config.networkPassphrase,
      }
    )
      .addOperation(
        Operation.manageData({
          name: 'auth_nonce',
          value: nonce,
          source: clientPublicKey, // Kullanıcının imzalaması gereken operation
        })
      )
      .setTimeout(300) // 5 dk geçerli
      .build();

    // Challenge sunucu tarafından imzalanır (kimden geldiği belli olsun)
    tx.sign(this.serverKeypair);
    
    const xdr = tx.toXDR();
    // Nonce cache'te tutularak replay attack önlenir
    await this.redisService.set(`auth_nonce:${clientPublicKey}`, nonce, 300);
    
    return xdr;
  }

  async verifyChallenge(signedXdr: string): Promise<{ accessToken: string }> {
    try {
      const tx = new Transaction(signedXdr, this.config.networkPassphrase);
      
      const op = tx.operations[0] as Operation.ManageData;
      const clientPublicKey = op.source;
      const nonceFromTx = op.value?.toString();

      if (!clientPublicKey || !nonceFromTx) {
        throw new Error('Invalid challenge structure');
      }

      // Redis'ten nonce kontrolü
      const expectedNonce = await this.redisService.get<string>(`auth_nonce:${clientPublicKey}`);
      if (!expectedNonce || expectedNonce !== nonceFromTx) {
        throw new Error('Challenge expired or invalid');
      }

      // İmza doğrulaması: İşlem, clientPublicKey tarafından imzalanmış mı?
      // Transaction hash'i üzerinden imzalar kontrol edilir
      const txHash = tx.hash();
      let hasValidClientSignature = false;
      
      for (const sig of tx.signatures) {
        const keypair = Keypair.fromPublicKey(clientPublicKey);
        if (keypair.verify(txHash, sig.signature())) {
          hasValidClientSignature = true;
          break;
        }
      }

      if (!hasValidClientSignature) {
        throw new Error('Missing or invalid client signature');
      }

      // Başarılı giriş, nonce'u sil
      await this.redisService.del(`auth_nonce:${clientPublicKey}`);

      const payload = { sub: clientPublicKey };
      return {
        accessToken: this.jwtService.sign(payload),
      };
    } catch (error) {
      throw new UnauthorizedException(`Verification failed: ${error.message}`);
    }
  }
}
