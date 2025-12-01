"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Button,
  Space,
  Tag,
  Alert,
  Spin,
  Result,
} from "antd";
import {
  ClockCircleOutlined,
  ArrowLeftOutlined,
  PlayCircleOutlined,
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
  const [expanded, setExpanded] = useState(false);

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

  const getStoredRemainingSeconds = () => {
    if (!storageKey) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const end = Number(raw);
      if (!end || isNaN(end)) return null;
      return Math.max(0, Math.ceil((end - Date.now()) / 1000));
    } catch {
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
      toast.error("Testdaten nicht geladen.");
      return;
    }
    if (!testId) {
      toast.error("Fehlende Test-ID.");
      return;
    }

    const attemptsInfo = testObj.attemptsInfo || null;
    const attemptsLeft = attemptsInfo?.attemptsLeft ?? null;
    const assignmentId = attemptsInfo?.assignmentId ?? null;

    if (attemptsLeft !== null && attemptsLeft < 0) {
      toast.error("Keine Versuche mehr verfügbar.");
      return;
    }

    const existingSecs = getStoredRemainingSeconds();
    if (existingSecs && existingSecs > 0) {
      router.push(`/dashboard/exam/${testId}/start`);
      return;
    }

    setStarting(true);

    try {
      const payload = assignmentId ? { assignmentId } : {};
      await api.post(`/course-test/attempt/${testId}`, payload);

      const durationSeconds = Number(testObj.duration ?? 0);

      const started = startTimer({
        testId,
        durationSeconds,
        assignmentId: assignmentId || null,
      });

      if (!started) {
        toast.error("Timer konnte nicht gestartet werden.");
        setStarting(false);
        return;
      }

      router.push(`/dashboard/exam/${testId}/start`);
    } catch (err) {
      console.error("Failed to start exam:", err?.response || err);
      toast.error("Fehler beim Starten der Prüfung. Bitte erneut versuchen.");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 32, display: "flex", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!testObj) {
    return (
      <Result
        status="404"
        title="Test nicht gefunden"
        subTitle="Prüfungsdaten konnten nicht geladen werden. Bitte kehren Sie zum Dashboard zurück."
        extra={
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/dashboard")}
          >
            Zurück zum Dashboard
          </Button>
        }
        style={{ padding: 24 }}
      />
    );
  }

  const testName = testObj.testName || "Unbenannter Test";
  const durationRaw = testObj.duration || 0;
  const attemptsInfo = testObj.attemptsInfo || null;
  const attemptsLeft = attemptsInfo?.attemptsLeft ?? null;
  const existingSecs = getStoredRemainingSeconds();
  const attemptsColor =
    attemptsLeft === 0 ? "#cf1322" : attemptsLeft <= 1 ? "#faad14" : "#52c41a";

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
          <Space size="large">
            <Tag icon={<ClockCircleOutlined />} color="processing">
              {Math.floor(durationRaw / 60)} Minuten
            </Tag>

            <div style={{ textAlign: "right", minWidth: 110 }}>
              <div style={{ fontSize: 11, color: "#8c8c8c" }}>
                Verbleibende Versuche
              </div>
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
        <Card
          type="inner"
          title={
            <Space>
              <AlertOutlined />
              <span className="font-medium">Anweisungen</span>
            </Space>
          }
          style={{
            marginTop: 24,
            borderRadius: 12,
            background: "#fafafa",
          }}
        >
          <ul style={{ paddingLeft: 20, marginBottom: 0, lineHeight: "1.7" }}>
            <li>Lesen Sie jede Frage sorgfältig durch.</li>
            <li>
              Sie haben <strong>{Math.floor(durationRaw / 60)} Minuten</strong>{" "}
              Zeit für diesen Test.
            </li>
            <li>Schließen oder aktualisieren Sie den Browser während der Prüfung nicht.</li>
            <li>Die Prüfung wird automatisch eingereicht, wenn die Zeit abläuft.</li>
          </ul>

          {expanded && (
            <div style={{ marginTop: 16 }}>
              <ul style={{ paddingLeft: 20, lineHeight: "1.7", color: "#444" }}>
                <li>Verwenden Sie Kopfhörer für das Hören-Modul.</li>
                <li>Nach dem Wechseln des Abschnitts kann nicht zurückgekehrt werden.</li>
                <li>Stellen Sie eine stabile Internetverbindung sicher.</li>
                <li>Antworten werden automatisch gespeichert.</li>
                <li>Es gibt keine Pausenzeit – planen Sie Ihre Zeit gut.</li>
              </ul>
            </div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              marginTop: 12,
              fontSize: 13,
              fontWeight: 500,
              color: "#1677ff",
              cursor: "pointer",
              background: "transparent",
              border: "none",
              padding: 0,
            }}
          >
            {expanded ? "Weniger anzeigen" : "Mehr anzeigen"}
          </button>
        </Card>

        {/* action */}
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
                message="Eine Prüfung läuft bereits."
                description={
                  <>
                    Verbleibende Zeit: <strong>{formatTime(existingSecs)}</strong>
                  </>
                }
              />
            ) : attemptsLeft !== null && attemptsLeft <= 0 ? (
              <Alert
                type="error"
                showIcon
                message="Keine Versuche verfügbar"
                description="Sie haben alle Versuche verbraucht."
              />
            ) : (
              <Alert
                type="info"
                showIcon
                message="Bereit zum Start?"
                description="Klicken Sie auf 'Prüfung starten', um zu beginnen."
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
                Prüfung fortsetzen
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
                {starting ? "Wird gestartet..." : "Prüfung starten"}
              </Button>
            )}

            <Button
              icon={<ArrowLeftOutlined />}
              size="large"
              onClick={() => router.push("/dashboard")}
            >
              Zurück zum Dashboard
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}
