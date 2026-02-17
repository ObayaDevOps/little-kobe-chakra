import { sendCustomerOrderConfirmationEmail } from '@/lib/orderConfirmationEmail';


export default async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { orderDetails } = req.body;

    try {
        const info = await sendCustomerOrderConfirmationEmail(orderDetails);
        console.log("Order confirmation email sent successfully:", info.messageId);
        res.status(200).json({ message: "Confirmation email sent successfully." });
    } catch (err) {
        console.error('Error sending order confirmation email:', err);
        res.status(500).json({ message: `Failed to send order confirmation email: ${err.message}` });
    }
}; 
