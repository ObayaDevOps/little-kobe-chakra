import { archiveInventoryItem } from '@/lib/db';

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        res.setHeader('Allow', ['PATCH']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const { sanityId, isArchived } = req.body;

    if (!sanityId) {
        return res.status(400).json({ message: 'Missing required field: sanityId' });
    }

    if (typeof isArchived !== 'boolean') {
        return res.status(400).json({ message: 'isArchived must be a boolean' });
    }

    try {
        const { data, error } = await archiveInventoryItem(sanityId, isArchived);

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ message: `Inventory item with ID ${sanityId} not found.` });
            }
            console.error('API Error archiving inventory item:', error);
            return res.status(500).json({ message: 'Failed to update archive status', error: error.message });
        }

        if (!data) {
            return res.status(404).json({ message: `Inventory item with ID ${sanityId} not found.` });
        }

        return res.status(200).json({
            message: isArchived ? 'Item archived successfully' : 'Item restored successfully',
            item: data,
        });
    } catch (error) {
        console.error('Unexpected API Error:', error);
        return res.status(500).json({ message: 'An unexpected error occurred', error: error.message });
    }
}
