import { getSettings } from "@/lib/settings";
import { isR2Configured } from "@/lib/storage";
import { updateSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const s = await getSettings();
  const hasKey = Boolean(s.openaiApiKey);
  const r2 = isR2Configured();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-ink">Settings</h1>

      <form action={updateSettings} className="grid gap-6 lg:grid-cols-2">
        {/* Business */}
        <section className="card p-5">
          <h2 className="mb-4 text-base font-bold text-ink">Business details</h2>
          <div className="grid gap-4">
            <Field label="Shop name" name="shopName" defaultValue={s.shopName} />
            <div>
              <label className="label" htmlFor="shopAddress">Address</label>
              <textarea id="shopAddress" name="shopAddress" rows={2} className="input" defaultValue={s.shopAddress} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone 1" name="phone1" defaultValue={s.phone1} />
              <Field label="Phone 2" name="phone2" defaultValue={s.phone2} />
            </div>
            <Field label="Email" name="email" defaultValue={s.email} type="email" />
            <Field label="Delivery fee (Rs)" name="deliveryFee" defaultValue={String(s.deliveryFee)} type="number" />
          </div>
        </section>

        {/* Bank */}
        <section className="card p-5">
          <h2 className="mb-4 text-base font-bold text-ink">Bank deposit details</h2>
          <p className="mb-4 text-sm text-muted">Shown to customers who choose Bank Deposit at checkout.</p>
          <div className="grid gap-4">
            <Field label="Bank name" name="bankName" defaultValue={s.bankName} />
            <Field label="Account name" name="bankAccountName" defaultValue={s.bankAccountName} />
            <Field label="Account number" name="bankAccountNumber" defaultValue={s.bankAccountNumber} />
            <Field label="Branch" name="bankBranch" defaultValue={s.bankBranch} />
          </div>
        </section>

        {/* Integrations */}
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-1 text-base font-bold text-ink">Integrations</h2>
          <p className="mb-4 text-sm text-muted">Optional. Improves SEO and CSV import when set.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="openaiApiKey">
                OpenAI API key {hasKey && <span className="text-green-600">(set)</span>}
              </label>
              <input
                id="openaiApiKey"
                name="openaiApiKey"
                type="password"
                className="input"
                placeholder={hasKey ? "•••••••• (leave blank to keep)" : "sk-…"}
                autoComplete="off"
              />
              {hasKey && (
                <label className="mt-2 flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" name="clearKey" className="h-4 w-4" /> Remove saved key
                </label>
              )}
              <p className="mt-1 text-xs text-muted">
                Used to auto-generate SEO tags and sort CSV imports. Skipped if not set.
              </p>
            </div>
            <div>
              <label className="label">Image storage</label>
              <div className="rounded-lg border border-line bg-gray-50 p-3 text-sm">
                {r2 ? (
                  <span className="text-green-700">✓ Cloudflare R2 configured — images upload to R2.</span>
                ) : (
                  <span className="text-muted">
                    Using local storage (/public/uploads). Add R2 credentials in the environment to
                    store images on Cloudflare R2.
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="lg:col-span-2">
          <button type="submit" className="btn-primary">Save settings</button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="input" defaultValue={defaultValue} />
    </div>
  );
}
