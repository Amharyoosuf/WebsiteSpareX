-- Data fix: the displayed shop name/footer reads from the Settings row.
-- Correct any stale brand name still stored in the live database so the
-- storefront shows "Ceylon Spares" without needing a manual Settings edit.
UPDATE "Settings" SET "shopName" = 'Ceylon Spares' WHERE "shopName" IN ('SpareX', 'Colombo Spares');
UPDATE "Settings" SET "bankAccountName" = 'Ceylon Spares' WHERE "bankAccountName" IN ('SpareX', 'Colombo Spares');
UPDATE "Settings" SET "email" = 'hello@ceylonspares.lk' WHERE "email" = 'hello@sparex.lk';
