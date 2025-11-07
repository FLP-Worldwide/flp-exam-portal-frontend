"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Row, Col, Card, Table, Statistic, Tag, message, Empty, Button } from "antd";
import {
  BarChartOutlined,
  CheckCircleOutlined,
  BookOutlined,
  CalendarOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import api from "../../utils/axios";
import { useExamTimer } from "../../components/ExamTimerContext"; // <-- import timer hook

export default function StudentDashboard() {
  const [tests, setTests] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Exam timer context values
  const { activeTestId, remainingSeconds, formatted } = useExamTimer();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/student/dashboard");

      const rawTests = res.data.tests || [];
      const normalized = normalizeTests(rawTests);

      setTests(normalized);
      setStudent(res.data.student || null);
    } catch (error) {
      console.error(error);
      message.error("Failed to load dashboard data!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // optionally poll or re-fetch on focus if desired
  }, []);

  // Normalize tests to flatten nested `test` object
  const normalizeTests = (testsArray) => {
    return testsArray.map((t) => ({
      ...t,
      _id: t._id || t.assignmentId || (t.test && t.test._id) || null,
      testName: t.test?.testName || t.testName || "Unknown Test",
      language: t.test?.language || "N/A",
      duration: t.test?.duration || t.duration || 0,
      price: t.test?.price || t.price || 0,
      // keep original nested object for routing if needed
      rawTest: t.test || null,
    }));
  };

  // Assign tag color based on language
  const langColor = (lang) => {
    if (!lang) return "default";
    switch (lang.toLowerCase()) {
      case "english":
        return "blue";
      case "german":
      case "deutsch":
        return "purple";
      case "hindi":
        return "gold";
      case "spanish":
        return "volcano";
      default:
        return "default";
    }
  };

  // When user clicks primary action: either start test or continue/submit if it's the active one
  const handleActionClick = (record) => {
    const testId = record.test?._id || record._id || record.testId;
    if (!testId) return message.error("Invalid test ID");

    // If this test is currently active, go to the running exam page (continue / submit)
    if (activeTestId && String(activeTestId) === String(testId)) {
      router.push(`/dashboard/exam/${testId}/start`);
      return;
    }

    // Otherwise start normally
    router.push(`/dashboard/exam/${testId}`);
  };

  const totalAssigned = tests.length;
  const totalCompleted = tests.filter((t) => t.status === "completed").length;
  const passingRatio = totalAssigned ? ((totalCompleted / totalAssigned) * 100).toFixed(0) : 0;

  const columns = [
    {
      title: "#",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Test Name",
      key: "testName",
      render: (_, record) => {
        const testId = record.test?._id || record._id;
        const isLive = activeTestId && String(activeTestId) === String(testId);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 600 }}>{record.testName}</div>
            <Tag color={langColor(record.language)}>{record.language}</Tag>
            {isLive && <Tag color="red">LIVE</Tag>}
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "blue";
        if (status === "completed") color = "green";
        else if (status === "expired") color = "red";
        return <Tag color={color}>{status?.toUpperCase?.() ?? String(status)}</Tag>;
      },
    },
    {
      title: "Assigned Date",
      dataIndex: "assignedAt",
      key: "assignedAt",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "--"),
    },
    {
      title: "Expiry Date",
      dataIndex: "expiryDate",
      key: "expiryDate",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "--"),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        const testId = record.test?._id || record._id;
        const isLive = activeTestId && String(activeTestId) === String(testId);

        return (
          <Button
            type={isLive ? "primary" : "default"}
            icon={<PlayCircleOutlined />}
            onClick={() => handleActionClick(record)}
            disabled={record.status !== "active" && !isLive}
          >
            {isLive ? "Go to Submit Exam" : "Start Test"}
          </Button>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Top warning banner when an exam is running */}
      {activeTestId && remainingSeconds > 0 && (
        <div
          style={{
            background: "linear-gradient(90deg,#fff7e6,#fff1f0)",
            border: "1px solid #ffd8bf",
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: "#ad4b00" }}>
              An exam is currently running — it will auto-submit when the timer completes.
            </div>
            <div style={{ fontSize: 13, color: "#6b4a00", marginTop: 4 }}>
              Time remaining: <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{formatted}</span>
              {" • "}
              <span style={{ textDecoration: "underline", cursor: "pointer", color: "#925200" }} onClick={() => router.push(`/dashboard/exam/${activeTestId}/start`)}>
                Click to continue exam
              </span>
            </div>
          </div>

          <div>
            <Button type="primary" onClick={() => router.push(`/dashboard/exam/${activeTestId}/start`)}>
              Continue Exam
            </Button>
          </div>
        </div>
      )}

      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>
        Welcome back, {student?.name || "Student"} 👋
      </h1>

      {/* Dashboard Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Tests Assigned"
              value={totalAssigned}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tests Completed"
              value={totalCompleted}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Passing Ratio"
              value={passingRatio}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Account Created"
              value={student?.createdAt ? new Date(student.createdAt).toLocaleDateString() : "--"}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Assigned Tests Table */}
      <Card title="Assigned Tests" style={{ marginTop: 32 }}>
        {tests.length === 0 ? (
          <Empty description="No tests assigned yet" />
        ) : (
          <Table columns={columns} dataSource={tests} rowKey={(record) => record._id || record.test?._id} loading={loading} pagination={{ pageSize: 5 }} />
        )}
      </Card>
    </div>
  );
}
