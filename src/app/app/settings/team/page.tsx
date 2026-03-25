import { redirect } from "next/navigation";

const CANONICAL_INVITE_PATH = "/app/settings/team/invite";

export default function TeamPage() {
  redirect(CANONICAL_INVITE_PATH);
}
