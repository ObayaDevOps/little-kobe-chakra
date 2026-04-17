# Little Kobe Japanese Market — Development Work Summary
**April 13–14, 2026**

---

## 1. Low Stock Alerts
When a product's stock drops to or below a set minimum level, the system now automatically sends an email alert to the store. The same warning also appears as a red banner on the admin inventory page, clearly listing which products need to be restocked. The store manager can set the minimum level for each product individually.

## 2. Archive / Restore Products
A new "Archive Item" button has been added to each product in the inventory. Archiving a product hides it from the customer-facing website without deleting it — all product data is kept safe and the item can be restored at any time with one click. Archived products appear greyed out in the admin panel so they are easy to identify. Archived products are correctly excluded from low stock alerts.

## 3. How to Use Guide
A plain-English guide has been written and added to the admin panel, accessible from the main Control Centre. It covers all day-to-day tasks a shopkeeper would need: managing stock and prices, adding new products, archiving items, understanding stock alerts, viewing orders, and changing store hours — with step-by-step instructions and a quick reference table.

## 4. "Create New Product" Button
A clearly labelled button has been added to the Inventory Manager page that takes the shopkeeper directly to the product content editor (where names, descriptions, and photos are managed), alongside a short explanation of its purpose.

## 5. Admin Navigation Improvements
The navigation bar across all admin pages has been updated: Store Hours and Developer Tools links have been added, three developer-only links have been removed from the main bar (they remain accessible via the Developer Tools section), and all links are now centred for a cleaner appearance.

## 6. Store Hours
The ability to set daily opening and closing times was completed. When the shop is outside its set hours, customers see a closed notice and cannot place orders.

## 7. Order Receipt on Checkout
Customers now receive a full order summary on the payment success page, showing exactly what they ordered.

---

*All changes are live in the codebase and ready for deployment.*
