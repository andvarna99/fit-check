import { PageShell } from "@/components/layout/page-shell";

import { logout } from "../../login/actions";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PageShell title="Settings">
      <form action={logout}>
        <button
          type="submit"
          className="min-h-11 w-full rounded-lg border border-neutral-300 px-4 py-3 font-medium"
        >
          Log out
        </button>
      </form>
    </PageShell>
  );
}
