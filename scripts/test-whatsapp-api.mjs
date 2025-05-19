// scripts/test-whatsapp-api.js
import axios from 'axios';

// --- Configuration ---
const API_URL = 'http://localhost:3000/api/whatsapp/send-order-confirmation'; // Adjust port if necessary
const RECIPIENT_PHONE_NUMBER = '+256789062116'; // <--- !!! REPLACE WITH YOUR TEST PHONE NUMBER !!!
const SEND_TO_SHOPKEEPER_TEST = false; // Set to true to test the shopkeeper message, false for customer


// --- Test Data ---
const testOrderDetails = {
    customerName: "Test Customer",
    customerPhoneNumber: "+15551234567", // Test customer number
    items: [
        { name: "Test Item A", quantity: 3, price: 1500 },
        { name: "Test Item B", quantity: 1, price: 7500 }
    ],
    delivery_address: {
        address: "456 Test Lane",
        city: "Sampleville"
    },
    totalAmount: 12000,
    estimatedDelivery: "In 2-3 business days",
    merchantReference: "TEST-SCRIPT-456",
    confirmationCode: "SCRIPTCODEABC"
};

// --- Function to send the WhatsApp message ---
async function sendTestWhatsApp() {
    const payload = {
        recipientPhoneNumber: RECIPIENT_PHONE_NUMBER,
        orderDetails: testOrderDetails,
        isShopkeeper: SEND_TO_SHOPKEEPER_TEST
    };

    try {
        console.log(`Sending test WhatsApp message to ${RECIPIENT_PHONE_NUMBER} (isShopkeeper: ${SEND_TO_SHOPKEEPER_TEST})...`);
        const response = await axios.post(API_URL, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log("API Response Status:", response.status);
        console.log("API Response Data:", response.data);
        console.log("Test message request completed.");

    } catch (error) {
        console.error("Error sending test WhatsApp message:");
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
            console.error("Headers:", error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            console.error("No response received from API:", error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error("Error details:", error.message);
        }
        console.error("Test message request failed.");
    }
}

// Execute the function
sendTestWhatsApp();