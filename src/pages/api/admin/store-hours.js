import { getStoreHours, upsertStoreHours } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await getStoreHours();
    if (error) {
      return res.status(500).json({ message: 'Failed to fetch store hours', error: error.message });
    }
    return res.status(200).json({ hours: data });
  }

  if (req.method === 'PUT') {
    const { hours } = req.body;

    if (!Array.isArray(hours) || hours.length !== 7) {
      return res.status(400).json({ message: 'hours must be an array of 7 day entries' });
    }

    // Validate each entry
    for (const row of hours) {
      if (row.day_of_week < 0 || row.day_of_week > 6) {
        return res.status(400).json({ message: `Invalid day_of_week: ${row.day_of_week}` });
      }
      if (!row.open_time || !row.close_time) {
        return res.status(400).json({ message: 'open_time and close_time are required' });
      }
      if (!row.is_closed && row.close_time <= row.open_time) {
        const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return res.status(400).json({
          message: `Close time must be after open time for ${DAY_NAMES[row.day_of_week]}`,
        });
      }
    }

    const { error } = await upsertStoreHours(hours);
    if (error) {
      return res.status(500).json({ message: 'Failed to save store hours', error: error.message });
    }
    return res.status(200).json({ message: 'Store hours saved successfully' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
