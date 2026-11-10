import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { BarHeader } from "@/components/ui/screen-header";

import { version } from "../../../package.json";
import { logout } from "../../login/actions";

import { WeatherSettings } from "./weather-settings";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <BarHeader
        title="Settings"
        start={
          <Link href="/" className="fc-iconbtn" aria-label="Back to Today">
            <Icon name="left" />
          </Link>
        }
      />
      <div className="gutter mt-2 flex flex-1 flex-col gap-6">
        <WeatherSettings />

        <section aria-labelledby="account" className="flex flex-col gap-2">
          <h2 id="account" className="type-title-sm">
            Account
          </h2>
          <form action={logout} className="fc-group">
            <button type="submit" className="fc-li type-body-strong !text-danger">
              Log out
            </button>
          </form>
        </section>
      </div>
      <footer className="mt-10 flex flex-col items-center gap-1 pb-4">
        <p className="type-pixel-sm text-ink-muted">Fit Check v{version}</p>
        <p className="type-caption">Made for one closet: yours.</p>
      </footer>
    </div>
  );
}
