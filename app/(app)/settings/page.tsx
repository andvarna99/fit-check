import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BarHeader } from "@/components/ui/screen-header";

import { logout } from "../../login/actions";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <BarHeader
        title="Settings"
        start={
          <Link href="/" className="fc-iconbtn" aria-label="Back to Today">
            <Icon name="left" />
          </Link>
        }
      />
      <form action={logout} className="gutter mt-6">
        <Button type="submit" variant="secondary" block>
          Log out
        </Button>
      </form>
    </>
  );
}
