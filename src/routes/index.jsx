import { createFileRoute } from "@tanstack/react-router";
import { Button } from "antd";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <div>index</div>
      <Button type="primary">加密</Button>
    </div>
  );
}
