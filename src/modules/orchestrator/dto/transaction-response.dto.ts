import { ApiProperty } from '@nestjs/swagger';

export class BuiltTransactionDto {
  @ApiProperty({ description: 'Unsigned Base64 encoded XDR' })
  xdr: string;

  @ApiProperty({ description: 'Stellar network passphrase to sign with' })
  networkPassphrase: string;
}

export class ConfirmTransactionDto {
  @ApiProperty({ description: 'Signed Base64 encoded XDR' })
  signedXdr: string;
}
