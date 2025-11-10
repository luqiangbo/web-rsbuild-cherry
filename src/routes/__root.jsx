import { Outlet, createRootRoute } from "@tanstack/react-router";
import { px2remTransformer, StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider, App, Spin } from "antd";

import "@/styles/index.scss";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const px2rem = px2remTransformer({
    rootValue: 100,
  });
  return (
    <StyleProvider transformers={[px2rem]}>
      <ConfigProvider>
        <App>
          <Spin spinning={false}>
            <Outlet />
          </Spin>
        </App>
      </ConfigProvider>
    </StyleProvider>
  );
}
