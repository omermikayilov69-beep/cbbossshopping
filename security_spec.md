# Security Specification for CBBOSS SHOP Firestore Rules

## 1. Data Invariants
1. Products catalog is publicly readable by all store visitors across any device.
2. Only verified store administrators (specifically `omermikayilov69@gmail.com` or explicit admin records) can create, edit, or delete products.
3. Every product document must adhere to structural integrity: valid string bounds, positive prices, valid categories, image URLs, and non-empty name.
4. Default deny protects all other documents and paths from unauthorized reads or writes.

## 2. The Dirty Dozen Payloads (Targeting Products Collection)
1. **Unauthenticated Write**: An unauthenticated guest attempts to create a product. (Expected: PERMISSION_DENIED)
2. **Non-Admin Write**: A standard authenticated user with email `shopper@example.com` attempts to create or update a product. (Expected: PERMISSION_DENIED)
3. **Spoofed Unverified Admin**: A user claiming `omermikayilov69@gmail.com` with `email_verified: false` attempts to write. (Expected: PERMISSION_DENIED)
4. **ID Injection Attack**: Writing to a productId longer than 128 characters or containing path traversal characters. (Expected: PERMISSION_DENIED)
5. **Denial of Wallet Payload**: Inserting a 2MB base64 payload into `imageUrl` or `description`. (Expected: PERMISSION_DENIED due to `.size() <= 2048` and `.size() <= 2000`)
6. **Negative Price Exploit**: Creating or updating a product with `price: -50.00`. (Expected: PERMISSION_DENIED)
7. **Negative Stock Exploit**: Updating a product to `stock: -10`. (Expected: PERMISSION_DENIED)
8. **Missing Mandatory Fields**: Attempting to create a product missing `name` or `price`. (Expected: PERMISSION_DENIED)
9. **Shadow Field Injection**: Attempting to inject unexpected fields like `isAdmin: true` into the product document. (Expected: PERMISSION_DENIED)
10. **Tampered Creator / Audit Spoof**: Attempting to set `creatorUid` to an arbitrary foreign UID not matching `request.auth.uid`. (Expected: PERMISSION_DENIED)
11. **Arbitrary Admin Collection Escalation**: A standard non-admin trying to write to `/admins/{theirUid}` to grant themselves admin privileges. (Expected: PERMISSION_DENIED)
12. **Malformed Type Mutation**: Passing an array or object into `price` or `name`. (Expected: PERMISSION_DENIED)
