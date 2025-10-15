'use client'
import React, { useState, useMemo } from 'react'
import {
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Button, Layout, Menu, theme } from 'antd'
import { usePathname, useRouter } from 'next/navigation'

const { Header, Content, Footer, Sider } = Layout

const siderStyle = {
  overflow: 'auto',
  height: '100vh',
  position: 'sticky',
  insetInlineStart: 0,
  top: 0,
  bottom: 0,
  scrollbarWidth: 'thin',
  scrollbarGutter: 'stable',
}

// 👉 define menu config once; keys are FULL paths for easy routing
const MENU_ITEMS = [
  {
    key: '/admin/exam-test',          // route for your “Tests” page
    icon: React.createElement(UserOutlined),
    label: 'Tests',
  },
  // add more here when needed:
  // { key: '/admin/listening', icon: <SoundOutlined />, label: 'Listening' },
  // { key: '/admin/writing', icon: <EditOutlined />, label: 'Writing' },
]

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const pathname = usePathname()
  const router = useRouter()

  // figure out which menu key should be selected from current URL
  const selectedKeys = useMemo(() => {
    // find the first item whose key is a prefix of the pathname
    const match = MENU_ITEMS.find(it => pathname?.startsWith(it.key))
    return [match?.key || MENU_ITEMS[0].key]
  }, [pathname])

  return (
    <Layout hasSider>
      <Sider trigger={null} style={siderStyle} collapsible collapsed={collapsed}>
        <div className="text-white text-center font-bold py-3">
          {collapsed ? 'FP' : 'FLP EXAM PORTAL'}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={MENU_ITEMS}
          onClick={({ key }) => router.push(key)}  // ← dynamic routing
        />
      </Sider>

      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 64, height: 64 }}
          />
        </Header>

        <Content className="p-6" style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          {children}
        </Content>

        <Footer style={{ textAlign: 'center' }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  )
}
