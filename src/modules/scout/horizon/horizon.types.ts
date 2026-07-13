export interface HorizonAsset {
  asset: string;
}

export interface HorizonPoolResponse {
  id: string;
  paging_token: string;
  fee_bp: number;
  type: string;
  total_trustlines: number;
  total_shares: string;
  reserves: [
    {
      asset: string;
      amount: string;
    },
    {
      asset: string;
      amount: string;
    },
  ];
}

export interface HorizonTradeResponse {
  id: string;
  paging_token: string;
  ledger_close_time: string;
  base_asset_type: string;
  base_asset_code?: string;
  base_asset_issuer?: string;
  base_amount: string;
  counter_asset_type: string;
  counter_asset_code?: string;
  counter_asset_issuer?: string;
  counter_amount: string;
  base_is_seller: boolean;
  price: {
    n: number;
    d: number;
  };
}

export interface HorizonAccountResponse {
  id: string;
  account_id: string;
  sequence: string;
  home_domain?: string;
}

export interface HorizonPaginatedResponse<T> {
  _links: {
    next: {
      href: string;
    };
    prev: {
      href: string;
    };
  };
  _embedded: {
    records: T[];
  };
}
