"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Statistic,
  Alert,
  Spin,
  Result,
} from "antd";
import {
  ClockCircleOutlined,
  ArrowLeftOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  AlertOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { toast } from "react-hot-toast";
import api from "../../../../utils/axios";
import { useExamTimer } from "../../../../components/ExamTimerContext";

export default function StartExamModule() {
  const { testId } = useParams();
  const router = useRouter();

  const { startTimer } = useExamTimer();

  const [testObj, setTestObj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const storageKey = testId ? `exam_end_${testId}` : null;

  useEffect(() => {
    if (!testId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/course-test/detail-instruction/${testId}`);

        const payload =
          (res && res.data && res.data.test) ||
          (res && res.data && res.data.data && res.data.data.test) ||
          res.data ||
          null;
        const final =
          (payload && payload.test) ||
          (payload && payload.data) ||
          payload ||
          null;

        if (!final) {
          console.error("Unexpected test response shape:", res);
          setTestObj(null);
        } else {
          setTestObj(final);
        }
      } catch (err) {
        console.error("Error fetching test details:", err?.response || err);
        setTestObj(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [testId]);

  // helper: return seconds remaining if an active endTime is present
  const getStoredRemainingSeconds = () => {
    if (!storageKey) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const end = Number(raw);
      if (!end || isNaN(end)) return null;
      return Math.max(0, Math.ceil((end - Date.now()) / 1000));
    } catch (e) {
      return null;
    }
  };

  const formatTime = (secs) => {
    if (secs <= 0) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const hh = h > 0 ? String(h).padStart(2, "0") + ":" : "";
    return `${hh}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

 const startExamAndRedirect = async () => {
  if (!testObj) {
    toast.error("Test data not loaded.");
    return;
  }
  if (!testId) {
    toast.error("Missing test id.");
    return;
  }

  const attemptsInfo = testObj.attemptsInfo || null;
  const attemptsLeft = attemptsInfo?.attemptsLeft ?? null;
  const assignmentId = attemptsInfo?.assignmentId ?? null;

  // ❗ Only block if attemptsLeft < 0 (means already exceeded)
  if (attemptsLeft !== null && attemptsLeft < 0) {
    toast.error("No attempts left for this test.");
    return;
  }

  // If active exam exists, continue it
  const existingSecs = getStoredRemainingSeconds();
  if (existingSecs && existingSecs > 0) {
    router.push(`/dashboard/exam/${testId}/start`);
    return;
  }

  setStarting(true);

  try {
    const payload = assignmentId ? { assignmentId } : {};
    await api.post(`/course-test/attempt/${testId}`, payload); // ❗ Just fire and forget

    // Always start exam immediately (ignore returned attemptsLeft)
    const durationSeconds = Number(testObj.duration ?? 0);

    const started = startTimer({
      testId,
      durationSeconds,
      assignmentId: assignmentId || null,
    });

    if (!started) {
      toast.error("Failed to initialize exam timer.");
      setStarting(false);
      return;
    }

    router.push(`/dashboard/exam/${testId}/start`);
  } catch (err) {
    console.error("Failed to start exam:", err?.response || err);
    toast.error("Failed to start exam. Please try again.");
  } finally {
    setStarting(false);
  }
};


  if (loading) {
    return (
      <div
        style={{
          padding: 32,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!testObj) {
    return (
      <Result
        status="404"
        title="Test not found"
        subTitle="We couldn’t load details for this exam. Please go back to your dashboard and try again."
        extra={
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        }
        style={{ padding: 24 }}
      />
    );
  }

  const testName = testObj.testName || testObj.title || "Untitled Test";
  const durationRaw = testObj.duration || 0;
  const price = testObj.price ?? 0;
  const totalSections = testObj.totalSections ?? testObj.total_sections ?? "--";
  const totalLevels = testObj.totalLevels ?? testObj.total_levels ?? "--";
  const attemptsInfo = testObj.attemptsInfo || null;
  const attemptsLeft = attemptsInfo?.attemptsLeft ?? null;
  const existingSecs = getStoredRemainingSeconds();
const attemptsColor =
  attemptsLeft === 0
    ? "#cf1322"
    : attemptsLeft <= 1
    ? "#faad14"
    : "#52c41a";
  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
     <Card
  bordered={false}
  style={{ borderRadius: 16, marginBottom: 16 }}
  title={
    <Space align="center">
      <FileTextOutlined />
      <span>{testName}</span>
    </Space>
  }
  extra={
    <Space size="large" align="center">
      {/* Duration */}
      <Tag icon={<ClockCircleOutlined />} color="processing">
        {Math.floor(durationRaw / 60)} mins
      </Tag>

      {/* Attempts left compact block */}
      <div style={{ textAlign: "right", minWidth: 110 }}>
        <div style={{ fontSize: 11, color: "#8c8c8c" }}>Attempts left</div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: attemptsInfo ? attemptsColor : "#999",
          }}
        >
          {attemptsInfo
            ? `${attemptsLeft} / ${attemptsInfo.maxAttempts}`
            : "--"}
        </div>
      </div>
    </Space>
  }
>
        

        {/* Instructions */}
        <Card
          type="inner"
          title={
            <Space>
              <AlertOutlined />
              <span>Instructions</span>
            </Space>
          }
          style={{ marginTop: 24, borderRadius: 12 }}
        >
          <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
            <li>Read each question carefully before answering.</li>
            <li>You have {Math.floor(durationRaw / 60)} minutes to complete the test.</li>
            <li>Do not refresh or close the browser tab while the test is running.</li>
            <li>The test will be automatically submitted when the timer ends.</li>
          </ul>
        </Card>

        {/* Active attempt notice or action buttons */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            {existingSecs && existingSecs > 0 ? (
              <Alert
                type="warning"
                showIcon
                message="An exam attempt is already running."
                description={
                  <>
                    Time remaining:{" "}
                    <strong>{formatTime(existingSecs)}</strong>
                  </>
                }
              />
            ) : attemptsLeft !== null && attemptsLeft <= 0 ? (
              <Alert
                type="error"
                showIcon
                message="No attempts remaining"
                description="You have used all attempts for this test."
              />
            ) : (
              <Alert
                type="info"
                showIcon
                message="Ready to start?"
                description="Click 'Start Exam' when you are ready. The timer will begin immediately."
              />
            )}
          </div>

          <Space style={{ marginTop: 8 }} wrap>
            {existingSecs && existingSecs > 0 ? (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                size="large"
                onClick={() => router.push(`/dashboard/exam/${testId}/start`)}
              >
                Continue Exam
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                size="large"
                loading={starting}
                disabled={attemptsLeft !== null && attemptsLeft <= 0}
                onClick={startExamAndRedirect}
              >
                {starting ? "Starting..." : "Start Exam"}
              </Button>
            )}

            <Button
              icon={<ArrowLeftOutlined />}
              size="large"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}
