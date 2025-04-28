import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { amount, currency, customerEmail, customerFirstName, customerLastName, customerPhone, redirectUrl, backUrl, reference, paymentMethod } = req.body;

    const pesapalUrl = 'https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest'; // Sandbox URL

    const payload = {
      id: reference,
      currency: currency,
      amount: amount,
      description: 'Payment for order',
      callback_url: redirectUrl,
      notification_id: 'your_notification_id', // Replace with your registered IPN ID
      billing_address: {
        email_address: customerEmail,
        phone_number: customerPhone,
        first_name: customerFirstName,
        last_name: customerLastName,
      },
      payment_method: paymentMethod,
    };

    try {
      const response = await fetch(pesapalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer YOUR_ACCESS_TOKEN`, // Replace with your access token
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.status === '200') {
        res.status(200).json({ success: true, paymentUrl: data.redirect_url });
      } else {
        res.status(400).json({ success: false, message: data.message });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
