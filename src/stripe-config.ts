export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price_per_unit: number;
  currency_symbol: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_T9RgXyM7Qzwcyb',
    priceId: 'price_1SD8nWIG3TLqP9yaH0D0oIpW',
    name: 'Bundle of 100 Staged Photos',
    description: '$7.00 per photo',
    price_per_unit: 700.00,
    currency_symbol: '$',
    mode: 'payment'
  },
  {
    id: 'prod_T9Rg7JtfWeNBuf',
    priceId: 'price_1SD8nTIG3TLqP9yaTOhRMNFq',
    name: 'Bundle of 50 Staged Photos',
    description: '$7.50 Per Photo',
    price_per_unit: 375.00,
    currency_symbol: '$',
    mode: 'payment'
  },
  {
    id: 'prod_T9RgI2NU08WsLa',
    priceId: 'price_1SD8nQIG3TLqP9yaBVVV1coG',
    name: 'Bundle of 20 Staged Photos',
    description: '$8.00 Per Photo',
    price_per_unit: 160.00,
    currency_symbol: '$',
    mode: 'payment'
  },
  {
    id: 'prod_T9RgxDXt385hrD',
    priceId: 'price_1SD8nNIG3TLqP9yazPngAINO',
    name: 'Bundle of 10 Staged Photos',
    description: '$8.50 Per Photo',
    price_per_unit: 85.00,
    currency_symbol: '$',
    mode: 'payment'
  },
  {
    id: 'prod_T9RgVwENfeZhNL',
    priceId: 'price_1SD8nJIG3TLqP9yaGAjd2WdP',
    name: 'Bundle of 5 Staged Photos',
    description: '$9.00 Per Photo',
    price_per_unit: 45.00,
    currency_symbol: '$',
    mode: 'payment'
  },
  {
    id: 'prod_T9Rfls5oteKUTy',
    priceId: 'price_1SD8lsIG3TLqP9yabBsx4jyZ',
    name: '1 Staged Photo',
    description: '$10.00',
    price_per_unit: 10.00,
    currency_symbol: '$',
    mode: 'payment'
  }
];