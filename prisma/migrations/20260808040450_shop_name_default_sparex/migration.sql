-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "shopName" TEXT NOT NULL DEFAULT 'SpareX',
    "shopAddress" TEXT NOT NULL DEFAULT '',
    "phone1" TEXT NOT NULL DEFAULT '',
    "phone2" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "bankName" TEXT NOT NULL DEFAULT '',
    "bankAccountName" TEXT NOT NULL DEFAULT '',
    "bankAccountNumber" TEXT NOT NULL DEFAULT '',
    "bankBranch" TEXT NOT NULL DEFAULT '',
    "deliveryFee" INTEGER NOT NULL DEFAULT 500,
    "openaiApiKey" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Settings" ("bankAccountName", "bankAccountNumber", "bankBranch", "bankName", "deliveryFee", "email", "id", "openaiApiKey", "phone1", "phone2", "shopAddress", "shopName") SELECT "bankAccountName", "bankAccountNumber", "bankBranch", "bankName", "deliveryFee", "email", "id", "openaiApiKey", "phone1", "phone2", "shopAddress", "shopName" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
