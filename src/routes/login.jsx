import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Checkbox, Form, Input, Card, App } from "antd";
import { store } from "@/store";
import { getPersistedToken } from "@/utils";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = App.useApp();

  useEffect(() => {
    // 同步本地持久化的 token，再决定是否跳转
    if (!store.token) {
      const token = getPersistedToken();
      if (token) {
        store.token = token;
      }
    }
    if (store.token) {
      navigate({ to: "/about" });
    }
  }, [navigate]);

  const onFinish = (values) => {
    const { username, password } = values || {};
    if (username === "admin" && password === "123456") {
      store.token = "mock-token";
      message.success("登录成功");
      navigate({ to: "/about" });
      return;
    }
    message.error("账号或密码错误");
  };

  return (
    <div>
      <div>login</div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ username: "admin", password: "123456" }}
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked" label={null}>
            <Checkbox>Remember me</Checkbox>
          </Form.Item>
          <Form.Item label={null}>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
