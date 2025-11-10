import { createFileRoute, redirect } from "@tanstack/react-router";
import { store } from "@/store";
import { getPersistedToken } from "@/utils";

export const Route = createFileRoute("/about")({
  beforeLoad: () => {
    if (!store.token) {
      const token = getPersistedToken();
      if (token) {
        store.token = token;
        return;
      }
      throw redirect({ to: "/login" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <div>about</div>;
}
