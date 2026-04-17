import { getStoreHours } from '@/lib/db';
import { isStoreOpenNow } from '@/lib/storeHoursUtils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { data: hoursRows, error } = await getStoreHours();

    if (error) {
      console.error('Error fetching store hours for status check:', error);
      // Default to open on DB error
      return res.status(200).json({ isOpen: true, nextOpeningTime: null, message: '' });
    }

    const { isOpen, nextOpeningTime } = isStoreOpenNow(hoursRows);

    const message = isOpen
      ? ''
      : nextOpeningTime
        ? `The shop is currently closed. Orders placed now will be delivered at ${nextOpeningTime}.`
        : 'The shop is currently closed.';

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    return res.status(200).json({ isOpen, nextOpeningTime, message });
  } catch (err) {
    console.error('Unexpected error in store-status:', err);
    return res.status(200).json({ isOpen: true, nextOpeningTime: null, message: '' });
  }
}
