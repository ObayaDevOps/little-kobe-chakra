import axios from 'axios'

export default async function handler(req, res) {
  const { transactionToken } = req.query
  const DPO_COMPANY_TOKEN = process.env.DPO_COMPANY_TOKEN

  try {
    const response = await axios.post(
      `${process.env.DPO_BASE_URL}/API/v6/Transaction/Verify`,
      {
        CompanyToken: DPO_COMPANY_TOKEN,
        TransactionToken: transactionToken
      }
    )
    
    res.status(200).json(response.data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
} 