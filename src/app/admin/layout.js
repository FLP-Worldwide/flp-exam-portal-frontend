"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UsergroupAddOutlined,
  DiffOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, theme, Space } from "antd";
import { usePathname, useRouter } from "next/navigation";
import ProtectedRoute from "../../utils/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import LoaderComp from "../../components/shared/LoaderComp";

const { Header, Content, Footer, Sider } = Layout;

const siderStyle = {
  overflow: "auto",
  height: "100vh",
  position: "sticky",
  insetInlineStart: 0,
  top: 0,
  bottom: 0,
  scrollbarWidth: "thin",
  scrollbarGutter: "stable",
};

const MENU_ITEMS = [
  {
    key: "/admin",
    icon: React.createElement(DiffOutlined),
    label: "Dashboard",
  },
  {
    key: "/admin/create-exam-test",
    icon: React.createElement(DiffOutlined),
    label: "Create Exam Test",
  },
  {
    key: "/admin/student",
    icon: React.createElement(UsergroupAddOutlined),
    label: "Student",
  },
];

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [navLoading, setNavLoading] = useState(false);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const pathname = usePathname();
  const router = useRouter();

  // set loader off when route changes
  useEffect(() => {
    setNavLoading(false);
  }, [pathname]);

  const selectedKeys = useMemo(() => {
    if (!pathname) return [MENU_ITEMS[0].key];

    const matched = MENU_ITEMS.filter(
      (it) =>
        pathname === it.key ||
        pathname.startsWith(it.key + "/") ||
        pathname.startsWith(it.key)
    ).sort((a, b) => b.key.length - a.key.length)[0];

    return [matched?.key || MENU_ITEMS[0].key];
  }, [pathname]);

  const handleMenuClick = ({ key }) => {
    if (key === pathname) return; // already there
    setNavLoading(true);
    router.push(key);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    router.push("/");
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <Layout hasSider>
        {/* NAV LOADER OVERLAY */}
        {navLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
            <LoaderComp />
          </div>
        )}

        {/* SIDEBAR */}
        <Sider
          trigger={null}
          style={siderStyle}
          collapsible
          collapsed={collapsed}
          width={230}
        >
          <div className="h-16 flex items-center justify-center border-b border-slate-800/40 bg-slate-950/70">
            <span className="text-white font-semibold tracking-wide text-xs">
              {collapsed ? "FLP" : "FLP EXAM PORTAL"}
            </span>
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={selectedKeys}
            items={MENU_ITEMS}
            onClick={handleMenuClick}
            style={{ borderRight: "none", paddingTop: 8 }}
          />
        </Sider>

        {/* MAIN AREA */}
        <Layout>
          {/* HEADER */}
          <Header
            style={{
              padding: "0 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: colorBgContainer,
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: 18, width: 40, height: 40 }}
              />
              <div className="flex-1 gap-4">
                <span className="text-sm font-semibold text-slate-900">
                  Admin Panel
                </span>
              </div>
            </div>

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

          {/* CONTENT */}
          <Content
            className="p-3 md:p-4 lg:p-6 bg-slate-50"
            style={{ minHeight: "calc(100vh - 120px)" }}
          >
            <div className="max-w-7xl mx-auto">
              {/* content card wrapper for nicer look */}
              <div className="bg-white p-2 md:p-3">
                {children}
              </div>
            </div>
          </Content>

          {/* FOOTER */}
          <Footer style={{ textAlign: "center", fontSize: 12 }}>
            testyourgerman.com ©{new Date().getFullYear()} · Created by{" "}
            <a
              href="https://nobeltechinnovations.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Nobel Tech Innovations
            </a>
          </Footer>

          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </Layout>
      </Layout>
    </ProtectedRoute>
  );
}
