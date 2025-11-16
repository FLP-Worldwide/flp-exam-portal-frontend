"use client";
import React, { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Input,
  Button,
  Typography,
  Divider,
  Row,
  Col,
  Space,
  Tag,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  FileTextOutlined,
  BulbOutlined,
  HighlightOutlined,
} from "@ant-design/icons";
import toast from "react-hot-toast";
import api from "../../../utils/axios";

const { Content } = Layout;
const { Text } = Typography;
const { TextArea } = Input;

export default function LevelFiveForm({ testId, data }) {
  const [paragraphs, setParagraphs] = useState([
    {
      id: Date.now(),
      paragraph: "",
      blanks: ["", "", ""], // 👈 3 default blank answers
    },
  ]);
  const [loading, setLoading] = useState(false);

  // 🧾 Prefill existing Level 5 data if provided
  useEffect(() => {
    if (data?.content?.paragraphs?.length) {
      const prefilled = data.content.paragraphs.map((p, idx) => {
        const existingBlanks = p.blanks?.length ? p.blanks : [""];
        // ensure at least 3 answer fields
        const blanksWithExtra = [
          ...existingBlanks,
          ...Array(Math.max(0, 3 - existingBlanks.length)).fill(""),
        ];
        return {
          id: Date.now() + idx,
          paragraph: p.paragraph || "",
          blanks: blanksWithExtra,
        };
      });
      setParagraphs(prefilled);
    }
  }, [data]);

  // 🧩 Detect blanks from paragraph text (count ___) + keep at least 3 fields
  const handleParagraphChange = (id, value) => {
    setParagraphs((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        const blankCount = (value.match(/___/g) || []).length;
        const minFields = Math.max(blankCount, 3); // 👈 always show at least 3
        const updatedBlanks = Array.from({ length: minFields }, (_, i) => {
          return p.blanks[i] ?? "";
        });

        return { ...p, paragraph: value, blanks: updatedBlanks };
      })
    );
  };

  // ✏️ Change blank answer value
  const handleBlankChange = (pId, index, value) => {
    setParagraphs((prev) =>
      prev.map((p) =>
        p.id === pId
          ? {
              ...p,
              blanks: p.blanks.map((b, i) => (i === index ? value : b)),
            }
          : p
      )
    );
  };

  // ➕ Add paragraph
  const addParagraph = () => {
    setParagraphs((prev) => [
      ...prev,
      { id: Date.now(), paragraph: "", blanks: ["", "", ""] },
    ]);
  };

  // ❌ Remove paragraph
  const removeParagraph = (id) => {
    if (paragraphs.length === 1) {
      toast.error("At least one paragraph is required!");
      return;
    }
    setParagraphs((prev) => prev.filter((p) => p.id !== id));
  };

  // 💾 Save Level 5 data
  const handleSave = async () => {
    if (!testId) return toast.error("❌ Test ID missing!");

    const paragraphsPayload = paragraphs.map((p) => {
      const trimmedParagraph = p.paragraph.trim();
      const blankCount = (trimmedParagraph.match(/___/g) || []).length;

      // We only send answers for the actual number of blanks.
      const usedBlanks = p.blanks
        .slice(0, blankCount)
        .map((ans) => ans.trim());

      return {
        paragraph: trimmedParagraph,
        blanks: usedBlanks,
        _blankCount: blankCount, // temp for validation only
      };
    });

    // Basic validation
    const hasInvalid = paragraphsPayload.some((p) => {
      if (!p.paragraph) return true;
      if (p._blankCount === 0) return false; // no blanks → no answers required
      return p.blanks.length !== p._blankCount || p.blanks.some((b) => !b);
    });

    if (hasInvalid) {
      return toast.error("Please fill answers for all blanks in each paragraph.");
    }

    const payload = {
      testId,
      level: "5",
      module: "reading",
      content: {
        paragraphs: paragraphsPayload.map(({ _blankCount, ...rest }) => rest),
      },
    };

    try {
      setLoading(true);
      const res = await api.post("/course-test/details", payload);
      toast.success(res.data?.message || "✅ Level 5 saved successfully!");
    } catch (err) {
      console.error("Save Level 5 error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to save Level 5 data!"
      );
    } finally {
      setLoading(false);
    }
  };

  // 🧱 UI
  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Content
        style={{
          padding: 24,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 1100 }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* HEADER CARD */}
            <Card
              bordered={false}
              style={{
                width: "100%",
                borderRadius: 16,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 600,
                    }}
                  >
                    Reading Test – Level 5
                  </h2>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 14,
                      color: "#8c8c8c",
                    }}
                  >
                    Create fill-in-the-blank questions where learners type
                    direct answers.
                  </p>
                </div>

                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={loading}
                  style={{
                    height: 40,
                    paddingInline: 20,
                    whiteSpace: "nowrap",
                    borderRadius: 999,
                  }}
                >
                  Save Level 5
                </Button>
              </div>
            </Card>

            <Row gutter={[16, 16]}>
              {/* LEFT: Paragraphs & Answers */}
              <Col xs={24} lg={16}>
                <Card
                  bordered={false}
                  style={{ borderRadius: 16 }}
                  title={
                    <Space>
                      <FileTextOutlined />
                      <span>Paragraphs & Blanks (Direct Answers)</span>
                      {paragraphs.length > 0 && (
                        <Tag color="blue" style={{ borderRadius: 999 }}>
                          {paragraphs.length} paragraph
                          {paragraphs.length > 1 ? "s" : ""}
                        </Tag>
                      )}
                    </Space>
                  }
                  bodyStyle={{ padding: 16 }}
                >
                  <Space
                    direction="vertical"
                    size="middle"
                    style={{
                      width: "100%",
                      maxHeight: 520,
                      overflowY: "auto",
                      paddingRight: 4,
                    }}
                  >
                    {paragraphs.map((p, pi) => (
                      <div
                        key={p.id}
                        style={{
                          borderRadius: 12,
                          border: "1px solid #f0f0f0",
                          background: "#fafafa",
                          padding: 14,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <Space align="center">
                            <Tag
                              color="processing"
                              style={{
                                borderRadius: 999,
                                paddingInline: 10,
                                fontWeight: 500,
                              }}
                            >
                              P{pi + 1}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Paragraph with typed answers
                            </Text>
                          </Space>

                          {paragraphs.length > 1 && (
                            <Button
                              type="link"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => removeParagraph(p.id)}
                              style={{ paddingRight: 0 }}
                            >
                              Remove
                            </Button>
                          )}
                        </div>

                        {/* Paragraph text */}
                        <div style={{ marginBottom: 12 }}>
                          <Text style={{ fontWeight: 500, fontSize: 13 }}>
                            Paragraph
                          </Text>
                          <TextArea
                            rows={4}
                            placeholder="Use ___ to mark blanks. Example: The sky is ___ and the grass is ___."
                            value={p.paragraph}
                            onChange={(e) =>
                              handleParagraphChange(p.id, e.target.value)
                            }
                            style={{ marginTop: 6, background: "#fff" }}
                          />
                        </div>

                        {/* Blanks answers */}
                        {p.blanks.length > 0 && (
                          <Space
                            direction="vertical"
                            size="small"
                            style={{ width: "100%" }}
                          >
                            {p.blanks.map((b, bi) => (
                              <Input
                                key={bi}
                                placeholder={`Answer for Blank ${bi + 1}`}
                                value={b}
                                onChange={(e) =>
                                  handleBlankChange(p.id, bi, e.target.value)
                                }
                              />
                            ))}
                          </Space>
                        )}
                      </div>
                    ))}
                  </Space>

                  <Divider />

                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={addParagraph}
                    style={{ width: "100%", borderRadius: 999 }}
                  >
                    Add Paragraph
                  </Button>
                </Card>
              </Col>

              {/* RIGHT: Info / Tips */}
              <Col xs={24} lg={8}>
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <Card
                    bordered={false}
                    style={{ borderRadius: 16 }}
                    title={
                      <Space>
                        <HighlightOutlined />
                        <span>How blanks work</span>
                      </Space>
                    }
                    bodyStyle={{ padding: 16 }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      • Every <b>___</b> in the paragraph becomes a blank in
                      order.
                      <br />
                      • You will see at least <b>3 answer fields</b> per
                      paragraph for convenience.
                      <br />
                      • Only as many answers as there are blanks are saved.
                    </Text>
                  </Card>

                  <Card
                    bordered={false}
                    style={{ borderRadius: 16, background: "#fafafa" }}
                    title={
                      <Space>
                        <BulbOutlined />
                        <span>Tips</span>
                      </Space>
                    }
                    bodyStyle={{ padding: 16 }}
                  >
                    <Space direction="vertical" size={4}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        • Keep answers short and unambiguous.
                        <br />
                        • Avoid multiple correct spellings unless your checking
                        logic supports them.
                        <br />
                        • Use context in the sentence so the correct word is
                        clear.
                      </Text>
                    </Space>
                  </Card>
                </Space>
              </Col>
            </Row>
          </Space>
        </div>
      </Content>
    </Layout>
  );
}
