import { randomUUID } from 'crypto';
import { env } from './env.js';

const API_BASE = 'https://api.yookassa.ru/v3';

interface CreatePaymentParams {
  amount: number;
  orderId: string;
  description: string;
}

interface YookassaPaymentResponse {
  id: string;
  status: string;
  confirmation?: { confirmation_url?: string };
}

function authHeader(): string {
  const token = Buffer.from(`${env.yookassa.shopId}:${env.yookassa.secretKey}`).toString('base64');
  return `Basic ${token}`;
}

export async function createYookassaPayment({ amount, orderId, description }: CreatePaymentParams): Promise<YookassaPaymentResponse> {
  if (!env.yookassa.shopId || !env.yookassa.secretKey) {
    // Без настроенных ключей возвращаем мок для локальной разработки, чтобы флоу не падал.
    return {
      id: `mock_${randomUUID()}`,
      status: 'pending',
      confirmation: { confirmation_url: `${env.yookassa.returnUrl}/${orderId}?mockPayment=1` },
    };
  }

  const response = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
      'Idempotence-Key': randomUUID(),
    },
    body: JSON.stringify({
      amount: { value: amount.toFixed(2), currency: 'RUB' },
      capture: true,
      confirmation: { type: 'redirect', return_url: `${env.yookassa.returnUrl}/${orderId}` },
      description,
      metadata: { orderId },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YooKassa error ${response.status}: ${text}`);
  }

  return (await response.json()) as YookassaPaymentResponse;
}
