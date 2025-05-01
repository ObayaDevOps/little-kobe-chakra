import React, { useState, useEffect } from 'react';

function AdminInventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async (query = '') => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/admin/inventory${query ? `?search=${encodeURIComponent(query)}` : ''}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setInventory(data);
        } catch (e) {
            console.error("Failed to fetch inventory:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(); // Fetch initial data on load
    }, []); // Empty dependency array means run once on mount

    const handleSearch = (event) => {
        event.preventDefault();
        fetchData(searchTerm);
    };

    // TODO: Add functions to handle updates (calling the PUT/PATCH API)

    return (
        <div>
            <h1>Admin Inventory Management</h1>

            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit">Search</button>
                <button type="button" onClick={() => { setSearchTerm(''); fetchData(''); }}>Clear</button>
             </form>

            {loading && <p>Loading inventory...</p>}
            {error && <p style={{ color: 'red' }}>Error fetching inventory: {error}</p>}

            {!loading && !error && (
                <table>
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Sanity ID</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Min Stock</th>
                            <th>In Sync</th>
                             <th>Actions</th> {/* Placeholder for edit buttons */}
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map((item) => (
                            <tr key={item.sanityId}>
                                <td>
                                    {item.imageUrl && (
                                        <img src={item.imageUrl} alt={item.name} width="50" height="50" style={{ objectFit: 'cover' }} />
                                    )}
                                </td>
                                <td>{item.name ?? 'N/A'}</td>
                                <td>{item.sanityId}</td>
                                <td>{item.price !== null ? `$${item.price}` : 'N/A'}</td>
                                <td>{item.quantity ?? 'N/A'}</td>
                                <td>{item.minStockLevel ?? 'N/A'}</td>
                                <td>{item.isInInventory ? 'Yes' : 'No (Add to DB)'}</td>
                                <td>
                                     {/* Add Edit/Update buttons here */}
                                     <button disabled>Edit</button> {/* TODO: Implement Edit */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
             {!loading && inventory.length === 0 && <p>No inventory items found.</p>}
        </div>
    );
}

export default AdminInventoryPage;

// Optional: Add getServerSideProps or getStaticProps if needed for initial data fetching
// But client-side fetching as shown is often fine for admin dashboards 