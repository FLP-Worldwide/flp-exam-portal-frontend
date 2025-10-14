'use client'
import React, { useState } from 'react';
import {
    UserOutlined,
    VideoCameraOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined
} from '@ant-design/icons';
import { Button, Layout, Menu, theme } from 'antd';
const { Header, Content, Footer, Sider } = Layout;
import BreadcrumbE from '../../components/shared/BreadcrumbEl';
const siderStyle = {
    overflow: 'auto',
    height: '100vh',
    position: 'sticky',
    insetInlineStart: 0,
    top: 0,
    bottom: 0,
    scrollbarWidth: 'thin',
    scrollbarGutter: 'stable',
};

const items = [{
    key: '1',
    icon: React.createElement(UserOutlined),
    label: 'Tests',
}]
const AdminLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    return (
        <Layout hasSider>
            <Sider trigger={null} style={siderStyle} collapsible collapsed={collapsed}>
                <div className="demo-logo-vertical text-white text-center font-bold py-3">{collapsed ? 'FP' : 'FLP EXAM PORTAL'}</div>
                <Menu theme="dark" mode="inline" defaultSelectedKeys={['4']} items={items} />

            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer }} >
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    /></Header>
                <Content className='p-6' style={{ margin: '24px 16px 0', overflow: 'initial' }}>
                    {/* <BreadcrumbE />s */}
                    {children}
                </Content>
                <Footer style={{ textAlign: 'center' }}>
                    Ant Design ©{new Date().getFullYear()} Created by Ant UED
                </Footer>
            </Layout>
        </Layout>
    );
};
export default AdminLayout;