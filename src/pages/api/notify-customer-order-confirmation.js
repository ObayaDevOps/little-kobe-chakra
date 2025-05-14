import nodemailer from "nodemailer";

// Helper function to format currency (adjust locale/currency as needed)
const formatCurrency = (amount, currency = 'UGX') => {
    // Ensure amount is a number
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
        console.warn(`Invalid amount received for formatting: ${amount}`);
        return 'N/A'; // Or some other placeholder
    }
    try {
        return new Intl.NumberFormat('en-UG', { style: 'currency', currency: currency }).format(numericAmount);
    } catch (error) {
        console.error(`Error formatting currency for amount ${numericAmount} and currency ${currency}:`, error);
        // Fallback for invalid currency codes etc.
        return `${currency} ${numericAmount.toFixed(2)}`;
    }
};


// Helper function to generate HTML table for items
const generateItemsTable = (items, currency) => {
    // Ensure items is an array
     if (!Array.isArray(items)) {
         console.warn("generateItemsTable received non-array:", items);
         return "<p><i>Error: Could not display item details.</i></p>";
     }

    let tableHTML = `
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: sans-serif; border-color: #cccccc;">
            <thead style="background-color: #f2f2f2;">
                <tr>
                    <th style="text-align: left; border-bottom: 2px solid #dddddd;">Product</th>
                    <th style="text-align: center; border-bottom: 2px solid #dddddd;">Quantity</th>
                    <th style="text-align: right; border-bottom: 2px solid #dddddd;">Price/Item</th>
                    <th style="text-align: right; border-bottom: 2px solid #dddddd;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
    `;
    items.forEach(item => {
        const price = item.price ?? 0; // Default to 0 if price is missing
        const quantity = item.quantity ?? 0; // Default to 0 if quantity is missing
        const subtotal = price * quantity;
        tableHTML += `
            <tr>
                <td style="border-bottom: 1px solid #dddddd;">${item.name || 'N/A'}</td>
                <td style="text-align: center; border-bottom: 1px solid #dddddd;">${quantity}</td>
                <td style="text-align: right; border-bottom: 1px solid #dddddd;">${formatCurrency(price, currency)}</td>
                <td style="text-align: right; border-bottom: 1px solid #dddddd;">${formatCurrency(subtotal, currency)}</td>
            </tr>
        `;
    });
    tableHTML += `
            </tbody>
        </table>
    `;
    return tableHTML;
};


export default async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { orderDetails } = req.body;

    // --- Validation ---
    if (!orderDetails) {
        console.error("notify-user-order-confirmation: Missing 'orderDetails' in request body.");
        return res.status(400).json({ message: "Missing order details." });
    }
    // Check essential nested properties
    if (!orderDetails.items || !orderDetails.delivery_address || !orderDetails.totalAmount || !orderDetails.currency) {
         console.error("notify-user-order-confirmation: Incomplete 'orderDetails' structure (expecting delivery_address):", orderDetails);
         return res.status(400).json({ message: "Incomplete order details provided." });
    }
    // Add check for deliveryLocation
    if (!orderDetails.deliveryLocation || typeof orderDetails.deliveryLocation.latitude !== 'number' || typeof orderDetails.deliveryLocation.longitude !== 'number') {
        console.warn("notify-user-order-confirmation: Missing or invalid 'deliveryLocation' in orderDetails:", orderDetails.deliveryLocation);
        // Decide if this is critical. For now, we'll proceed but won't show the map link.
    }
    // --- End Validation ---


    const {
        items,
        totalAmount,
        currency,
        delivery_address,
        confirmationCode,
        merchantReference,
        deliveryLocation, // Destructure deliveryLocation
        // customer_email, // Can still use these if needed, but primary info is in delivery_address
        // customer_phone,
    } = orderDetails;

     // Extract billing details safely
     const firstName = delivery_address?.first_name || '';
     const lastName = delivery_address?.last_name || '';
     // Use email/phone from delivery_address as the primary source for the email
     const email = delivery_address?.email_address || '';
     const phone = delivery_address?.phone_number || '';
     const addressLine1 = delivery_address?.line_1 || '';
     const city = delivery_address?.city || '';
     const countryCode = delivery_address?.country_code || ''; // Often 'UG'

    // Extract map coordinates safely
    const latitude = deliveryLocation?.latitude;
    const longitude = deliveryLocation?.longitude;
    let googleMapsLink = '';
    if (typeof latitude === 'number' && typeof longitude === 'number') {
        googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    }


    // --- Environment Variable Check ---
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.error("Email configuration (SMTP_USER, SMTP_PASSWORD) missing.");
        // Don't block the user, but fail the email sending part.
        // We already responded positively in callback.js if payment was okay.
        return res.status(500).json({ message: "Email server configuration error." });
    }
    // --- End Environment Variable Check ---

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports like 587
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
         // Optional: Add connection timeout
        connectionTimeout: 10000, // 10 seconds
         greetingTimeout: 5000, // 5 seconds
         socketTimeout: 10000, // 10 seconds
    });

    const itemsTable = generateItemsTable(items, currency);
    const formattedTotal = formatCurrency(totalAmount, currency);

    const mailData = {
        //TODO: Remove email address ?
        from: `"Little Kobe Orders" <${process.env.SMTP_USER}>`, // Use a sender name and your email
        to: delivery_address.email_address, //TODO confirm this is passed 
        replyTo: email, // Set reply-to the customer's email if available
        subject: `✅ Thanks for your order - Ref: ${merchantReference || 'N/A'}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h1 style="color: #333;">New Order Received!</h1>
                <p>A new order has been successfully placed and payment verified.</p>
                <hr style="border: none; border-top: 1px solid #eee;">

                <h2>Order Summary</h2>
                <p><strong>Order Reference:</strong> ${merchantReference || 'N/A'}</p>
                <p><strong>Pesapal Confirmation:</strong> ${confirmationCode || 'N/A'}</p>
                <p><strong>Order Total:</strong> <strong style="font-size: 1.1em;">${formattedTotal}</strong></p>
                <hr style="border: none; border-top: 1px solid #eee;">

                <h2>Delivery Details</h2>
                <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                <p><strong>Email:</strong> ${email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
                <p><strong>Address:</strong> ${addressLine1 || 'N/A'}</p>
                <p><strong>City:</strong> ${city || 'N/A'} ${countryCode ? `(${countryCode})` : ''}</p>
                ${googleMapsLink ? `
                <p><strong>Map Location:</strong> <a href="${googleMapsLink}" target="_blank" style="color: #007bff; text-decoration: none;">View on Google Maps</a></p>
                ` : ''}
                 <hr style="border: none; border-top: 1px solid #eee;">


                <h2>Order Items</h2>
                ${itemsTable}
                <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">

                <p style="font-size: 0.9em; color: #777;">This is an automated notification regarding order reference ${merchantReference || 'N/A'}.</p>
            </div>
        `,
    };

    try {
        console.log(`Sending confirmation email for Ref: ${merchantReference} to ${process.env.RECIPIENT_ADDRESS}`);
        const info = await transporter.sendMail(mailData);
        console.log("Order confirmation email sent successfully:", info.messageId);
        res.status(200).json({ message: "Confirmation email sent successfully." });
    } catch (err) {
        console.error(`Error sending order confirmation email for Ref ${merchantReference}:`, err);
        // Return error to the calling function (callback.js), which will handle it (e.g., log, show toast)
        res.status(500).json({ message: `Failed to send order confirmation email: ${err.message}` });
    }
}; 