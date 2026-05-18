import Stripe from 'stripe';
import type { Config } from '@netlify/functions';

interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const secretKey = Netlify.env.get('STRIPE_SECRET_KEY');
  if (!secretKey) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    const { items }: { items: CartItem[] } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Carrinho vazio' }, { status: 400 });
    }

    const stripe = new Stripe(secretKey);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item) => ({
        price_data: {
          currency: 'eur',
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: 'https://marifariajoias.netlify.app/sucesso',
      cancel_url: 'https://marifariajoias.netlify.app/cancelado',
    });

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return Response.json({ error: message }, { status: 500 });
  }
};

export const config: Config = {
  path: '/api/create-checkout-session',
  method: 'POST',
};
