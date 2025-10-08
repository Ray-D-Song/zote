import { Button, Card, Form, Typography } from '@douyinfe/semi-ui'
import { useState } from 'preact/hooks'

const { Title, Text } = Typography

export function Login() {
  const [loading, setLoading] = useState(false)
  const [isSignup, setSignup] = useState(false)

  const handleSubmit = async (values: {
    username: string
    password: string
  }) => {
    setLoading(true)
    try {
      // await loginApi(values);
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div class="min-h-screen flex items-center justify-center bg-[var(--semi-color-bg-1)]">
      <Card
        className="w-500px p-32px"
        bordered
      >
        <div class="mb-32px text-center">
          <Title
            heading={2}
          >
            {isSignup ? '注册' : '欢迎登录'}
          </Title>
          <Text
            type="tertiary"
          >
            请输入您的账号密码
          </Text>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Input
            field="username"
            label="用户名"
            placeholder="请输入用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
            trigger="blur"
          />
          <Form.Input
            field="password"
            label="密码"
            type="password"
            mode="password"
            placeholder="请输入密码"
            rules={[{ required: true, message: '请输入密码' }]}
            trigger="blur"
          />
          <Button
            theme="solid"
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            className="mt-24px"
          >
            {isSignup ? '确认' : '登录'}
          </Button>
        </Form>

        <div class="mt-16px text-center hover:cursor-pointer">
          <Text
            type="tertiary"
            size="small"
          >
            {isSignup ? '已有账号?' : '还没有账号?'}
            {' '}
            <span
              class="text-blue-700 hover:underline"
              onClick={() => setSignup(prev => !prev)}
            >
              立即
              {isSignup ? '登录' : '注册'}
            </span>
          </Text>
        </div>
      </Card>
    </div>
  )
}
