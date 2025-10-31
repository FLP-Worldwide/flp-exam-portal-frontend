'use client'
import React, { useState, useMemo } from 'react'
import {
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UsergroupAddOutlined,
  UserAddOutlined,
  DiffOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { Button, Layout, Menu, theme, Space } from 'antd'
import { usePathname, useRouter } from 'next/navigation'
import ProtectedRoute from '../../utils/ProtectedRoute'
import { Toaster } from "react-hot-toast";

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

// Menu config
const MENU_ITEMS = [
  {
    key: '/admin/create-exam-test',
    icon: React.createElement(DiffOutlined),
    label: 'Create Exam Test',
  },
  {
    key: '/admin/student',
    icon: React.createElement(UsergroupAddOutlined),
    label: 'Student',
  },
  {
    key: '/admin/teacher',
    icon: React.createElement(UserAddOutlined),
    label: 'Teacher',
  },
  {
    key: '/admin/test-sale-order',
    icon: React.createElement(DollarOutlined),
    label: 'Test Sale Order',
  },
]

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const pathname = usePathname()
  const router = useRouter()

  // Selected menu key
  const selectedKeys = useMemo(() => {
    const match = MENU_ITEMS.find(it => pathname?.startsWith(it.key))
    return [match?.key || MENU_ITEMS[0].key]
  }, [pathname])

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('role')
    router.push('/')
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'teacher']}>
    <Layout hasSider>
      <Sider trigger={null} style={siderStyle} collapsible collapsed={collapsed}>
        <div className="text-white text-center font-bold py-3">
          {collapsed ? 'FLP' : 'FLP EXAM PORTAL'}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={MENU_ITEMS}
          onClick={({ key }) => router.push(key)}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: colorBgContainer,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 64, height: 64 }}
          />

          <Space>
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Space>
        </Header>

        <Content className="p-6" style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          {children}
        </Content>

        <Footer style={{ textAlign: 'center' }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>

         <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
         
      </Layout>
    </Layout>
    </ProtectedRoute>
  )
}
