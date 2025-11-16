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
  message,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  FileTextOutlined,
  BulbOutlined,
  HighlightOutlined,
} from "@ant-design/icons";
import api from "../../../utils/axios";
import toast from "react-hot-toast";
const { Content } = Layout;
const { Text } = Typography;
const { TextArea } = Input;

export default function LevelFourForm({ testId, data }) {
  const [paragraphs, setParagraphs] = useState([
    {
      id: Date.now(),
      paragraph: "",
      blanks: [
        {
          id: Date.now() + 1,
          options: ["", "", ""],
        },
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);

  // ✅ Prefill existing data (if provided)
  useEffect(() => {
    if (data?.content?.paragraphs?.length) {
      const filled = data.content.paragraphs.map((p, idx) => ({
        id: Date.now() + idx,
        paragraph: p.paragraph || "",
        blanks:
          p.blanks?.map((b, bi) => ({
            id: Date.now() + idx + bi + 1,
            options: b.options?.length ? b.options : ["", "", ""],
          })) || [],
      }));
      setParagraphs(filled);
    }
  }, [data]);

  // 🧩 Detect blanks in paragraph and sync blank groups
  const handleParagraphChange = (id, value) => {
    setParagraphs((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        const blankCount = (value.match(/___/g) || []).length;

        const updatedBlanks = Array.from({ length: blankCount }, (_, i) => {
          return p.blanks[i] || {
            id: Date.now() + i,
            options: ["", "", ""],
          };
        });

        return { ...p, paragraph: value, blanks: updatedBlanks };
      })
    );
  };

  // ✏️ Update option
  const handleOptionChange = (
    pId,
    bId,
    optIndex,
    value
  ) => {
    setParagraphs((prev) =>
      prev.map((p) =>
        p.id === pId
          ? {
              ...p,
              blanks: p.blanks.map((b) =>
                b.id === bId
                  ? {
                      ...b,
                      options: b.options.map((opt, i) =>
                        i === optIndex ? value : opt
                      ),
                    }
                  : b
              ),
            }
          : p
      )
    );
  };

  // ➕ Add a new option
  const addOption = (pId, bId) => {
    setParagraphs((prev) =>
      prev.map((p) =>
        p.id === pId
          ? {
              ...p,
              blanks: p.blanks.map((b) =>
                b.id === bId ? { ...b, options: [...b.options, ""] } : b
              ),
            }
          : p
      )
    );
  };

  // ➕ Add paragraph
  const addParagraph = () => {
    setParagraphs((prev) => [
      ...prev,
      {
        id: Date.now(),
        paragraph: "",
        blanks: [],
      },
    ]);
  };

  // ❌ Remove paragraph
  const removeParagraph = (id) => {
    if (paragraphs.length === 1) {
      toast("At least one paragraph is required!");
      return;
    }
    setParagraphs((prev) => prev.filter((p) => p.id !== id));
  };

  // 💾 Save data
  const handleSave = async () => {
    if (!testId) {
      message.error("Test ID missing!");
      return;
    }

    const payload = {
      testId,
      level: "4",
      module: "reading",
      content: {
        paragraphs: paragraphs.map((p) => ({
          paragraph: p.paragraph.trim(),
          blanks: p.blanks.map((b) => ({
            options: b.options
              .map((opt) => opt.trim())
              .filter((opt) => opt !== ""),
            // first option = correct answer
            answer: b.options[0]?.trim() || "",
          })),
        })),
      },
    };

    const invalid = payload.content.paragraphs.some(
      (p) =>
        !p.paragraph ||
        p.blanks.length === 0 ||
        p.blanks.some((b) => b.options.length === 0)
    );

    if (invalid) {
      toast("Please complete all paragraphs and blanks.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/course-test/details", payload);
      toast.success(res.data?.message || "Level 4 saved successfully!");
    } catch (err) {
      console.error("Save Level 4 error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to save Level 4 data!"
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
                    Reading Test – Level 4
                  </h2>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 14,
                      color: "#8c8c8c",
                    }}
                  >
                    Configure paragraphs with multiple fill-in-the-blank slots
                    and answer options.
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
                  Save Level 4
                </Button>
              </div>
            </Card>

            <Row gutter={[16, 16]}>
              {/* LEFT: Paragraphs & Blanks */}
              <Col xs={24} lg={16}>
                <Card
                  bordered={false}
                  style={{ borderRadius: 16 }}
                  title={
                    <Space>
                      <FileTextOutlined />
                      <span>Paragraphs & Blanks</span>
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
                              Paragraph with blanks
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

                        {/* Paragraph editor */}
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

                        {/* Blanks & options */}
                        {p.blanks.length > 0 && (
                          <Space
                            direction="vertical"
                            size="small"
                            style={{ width: "100%" }}
                          >
                            {p.blanks.map((b, bi) => (
                              <div
                                key={b.id}
                                style={{
                                  borderRadius: 10,
                                  border: "1px dashed #e5e5e5",
                                  background: "#ffffff",
                                  padding: 10,
                                }}
                              >
                                <Text
                                  style={{
                                    fontWeight: 500,
                                    fontSize: 13,
                                    display: "block",
                                    marginBottom: 6,
                                  }}
                                >
                                  Blank {bi + 1} options{" "}
                                  <span style={{ fontWeight: 400 }}>
                                    (first option = correct answer)
                                  </span>
                                </Text>

                                {b.options.map((opt, oi) => (
                                  <Input
                                    key={oi}
                                    placeholder={`Option ${oi + 1}`}
                                    style={{ marginBottom: 6 }}
                                    value={opt}
                                    onChange={(e) =>
                                      handleOptionChange(
                                        p.id,
                                        b.id,
                                        oi,
                                        e.target.value
                                      )
                                    }
                                  />
                                ))}

                                <Button
                                  type="dashed"
                                  icon={<PlusOutlined />}
                                  onClick={() => addOption(p.id, b.id)}
                                  style={{
                                    width: "100%",
                                    borderRadius: 999,
                                    marginTop: 4,
                                  }}
                                >
                                  Add Option
                                </Button>
                              </div>
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
                    Add New Paragraph
                  </Button>
                </Card>
              </Col>

              {/* RIGHT: Tips */}
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
                      • Type <b>___</b> inside the paragraph to create a blank.
                      <br />
                      • Each blank automatically gets its own option group.
                      <br />
                      • The <b>first option</b> in a group is treated as the
                      correct answer.
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
                        • Keep sentences simple so learners can infer the
                        correct word.
                        <br />
                        • Options should be similar in length and grammar form.
                        <br />
                        • Avoid blanks at the very beginning of a sentence when
                        possible.
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
