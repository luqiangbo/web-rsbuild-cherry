import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import axios from "axios";
import { Button } from "antd";
import { useSetState } from "ahooks";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const baseUrl = "http://127.0.0.1:8080";
  const [state, setState] = useSetState({
    publicKey: "",
  });

  useEffect(() => {
    init();
  }, []);
  const init = () => {
    console.log("init", {});
    fetchGet();
  };

  const fetchGet = () => {
    axios({
      method: "get", // 可选（默认即为 'get'）
      url: baseUrl + "/rsa/public",
      // 其他配置项...
    })
      .then((response) => {})
      .catch((error) => {
        console.error("请求失败:", error.message);
      });
  };

  return (
    <div>
      <div>index</div>
    </div>
  );
}
