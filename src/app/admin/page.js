'use client';

import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
  BellOutlined,
} from '@ant-design/icons';
import api from '../../utils/axios';
import toast from 'react-hot-toast';

const Admin = () => {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTests: 0,
    totalPurchasedStudents: 0,
    passingRatio: 0,
  });

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 🧮 Fetch students + tests in parallel
        const [studentsRes, testsRes] = await Promise.all([
          api.get('user/list/student'),
          api.get('course-test'),
        ]);

        const students = studentsRes?.data?.data?.data || [];
        const tests = testsRes?.data?.data || [];

        const totalStudents = students.length;
        const totalTests = tests.length;

        let totalAssignments = 0;
        let totalCompleted = 0;
        let totalPurchasedStudents = 0;
        const activity = [];

        students.forEach((student) => {
          const assignments = Array.isArray(student.assignments)
            ? student.assignments.filter((a) => a && a.testId)
            : [];

          if (assignments.length > 0) {
            totalPurchasedStudents += 1;
          }

          assignments.forEach((a) => {
            totalAssignments += 1;
            if (
              a.status === 'completed' ||
              a.status === 'pass' ||
              a.status === 'passed'
            ) {
              totalCompleted += 1;
            }

            activity.push({
              key: `${student._id}-${a.testId}-${a.assignedAt || a.expiryDate || Math.random()}`,
              studentName: student.name,
              email: student.email,
              testName: a.testName || '—',
              status: a.status || 'N/A',
              assignedAt: a.assignedAt,
              expiryDate: a.expiryDate,
            });
          });
        });

        const passingRatio =
          totalAssignments > 0
            ? Number(((totalCompleted / totalAssignments) * 100).toFixed(0))
            : 0;

        // Sort notifications by assignedAt / expiryDate (latest first)
        activity.sort((a, b) => {
          const aDate = new Date(a.assignedAt || a.expiryDate || 0).getTime();
          const bDate = new Date(b.assignedAt || b.expiryDate || 0).getTime();
          return bDate - aDate;
        });

        setStats({
          totalStudents,
          totalTests,
          totalPurchasedStudents,
          passingRatio,
        });

        // keep only latest 10 notifications
        setNotifications(activity.slice(0, 10));
      } catch (error) {
        console.error(error);
        toast.error('Failed to load admin dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const columns = [
    {
      title: 'Student',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Test',
      dataIndex: 'testName',
      key: 'testName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (!status) color = 'default';
        else if (status === 'active') color = 'blue';
        else if (status === 'completed' || status === 'pass' || status === 'passed')
          color = 'green';
        else if (status === 'expired' || status === 'fail' || status === 'failed')
          color = 'red';

        return <Tag color={color}>{status ? status.toUpperCase() : 'N/A'}</Tag>;
      },
    },
    {
      title: 'Assigned At',
      dataIndex: 'assignedAt',
      key: 'assignedAt',
      render: (date) =>
        date ? new Date(date).toLocaleString() : '—',
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date) =>
        date ? new Date(date).toLocaleDateString() : '—',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div className="flex items-center gap-2 mb-6">
        <BellOutlined />
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      </div>

      {/* Top stats cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Students"
              value={stats.totalStudents}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Tests"
              value={stats.totalTests}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Students Purchased Test"
              value={stats.totalPurchasedStudents}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Passing Ratio"
              value={stats.passingRatio}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Notifications / recent activity table */}
      <Card
        title="Recent Test Activity"
        style={{ marginTop: 32 }}
        extra={<span className="text-xs text-gray-500">Latest 10 actions</span>}
      >
        {notifications.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            No recent test activity found.
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={notifications}
            pagination={{ pageSize: 5 }}
          />
        )}
      </Card>
    </div>
  );
};

export default Admin;
