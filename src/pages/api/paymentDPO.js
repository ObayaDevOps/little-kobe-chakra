import axios from 'axios';

const DPO_COMPANY_TOKEN = process.env.DPO_COMPANY_TOKEN;
const DPO_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://secure.3gdirectpay.com/API/v6/' 
  : 'https://secure1.sandbox.directpay.online/API/v6/';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      amount,
      currency,
      customerEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
      redirectUrl,
      backUrl,
      reference,
      paymentMethod = 'CARD', // CARD, MPESA, AIRTEL, etc.
    } = req.body;

    // Create payment request
    const createRequest = {
      CompanyToken: DPO_COMPANY_TOKEN,
      Amount: amount,
      Currency: currency,
      RedirectURL: redirectUrl,
      BackURL: backUrl,
      Reference: reference,
      CompanyRefUnique: 1,
      CustomerEmail: customerEmail,
      CustomerFirstName: customerFirstName,
      CustomerLastName: customerLastName,
      CustomerPhone: customerPhone,
      PaymentMethod: paymentMethod,
      DefaultPayment: 'CC', // Credit Card as default
    };

    // Create transaction
    const createResponse = await axios.post(
      `${DPO_BASE_URL}Transaction/Initialize`,
      createRequest
    );

    if (createResponse.data.Result !== '000') {
      throw new Error(createResponse.data.ResultExplanation);
    }

    // Get the transaction token
    const transToken = createResponse.data.TransToken;

    // Verify transaction status
    const verifyRequest = {
      CompanyToken: DPO_COMPANY_TOKEN,
      TransactionToken: transToken,
    };

    const verifyResponse = await axios.post(
      `${DPO_BASE_URL}Transaction/Verify`,
      verifyRequest
    );

    // Return the payment URL and transaction details
    return res.status(200).json({
      success: true,
      paymentUrl: `${DPO_BASE_URL}Payment/Index/${transToken}`,
      transactionToken: transToken,
      verificationResult: verifyResponse.data,
    });

  } catch (error) {
    console.error('DPO Payment Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Payment processing failed',
    });
  }
}
