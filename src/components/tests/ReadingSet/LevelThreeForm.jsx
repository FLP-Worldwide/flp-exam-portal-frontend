"use client";
import React, { useEffect, useState } from "react";
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
} from "@ant-design/icons";
import api from "../../../utils/axios";
import toast from "react-hot-toast";

const { Content } = Layout;
const { Text } = Typography;
const { TextArea } = Input;

export default function LevelThreeForm({ testId, data }) {
  const [paragraphs, setParagraphs] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Prefill from existing data (if available)
  useEffect(() => {
    if (data?.content?.paragraphs?.length > 0) {
      const formatted = data.content.paragraphs.map((p, i) => ({
        id: Date.now() + i,
        paragraph: p.paragraph || "",
        answer: p.answer || "",
      }));
      setParagraphs(formatted);
    } else {
      setParagraphs([{ id: Date.now(), paragraph: "", answer: "" }]);
    }
  }, [data]);

  // ✅ Handle Paragraph and Answer changes
  const handleChange = (id, field, value) => {
    setParagraphs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // ➕ Add new paragraph + answer pair
  const addParagraph = () => {
    setParagraphs((prev) => [
      ...prev,
      { id: Date.now(), paragraph: "", answer: "" },
    ]);
  };

  // 🗑️ Remove paragraph pair
  const removeParagraph = (id) => {
    if (paragraphs.length === 1) {
      toast("At least one paragraph is required!");
      return;
    }
    setParagraphs((prev) => prev.filter((p) => p.id !== id));
  };

  // 💾 Submit Level 3 data
  const handleSubmit = async () => {
    if (!testId) {
      toast.error("Test ID is missing!");
      return;
    }

    const invalid = paragraphs.some(
      (p) => !p.paragraph.trim() || !p.answer.trim()
    );
    if (invalid) {
      toast.error("Please fill all paragraphs and answers.");
      return;
    }

    const payload = {
      testId,
      level: "3",
      module: "reading",
      content: {
        paragraphs: paragraphs.map((p) => ({
          paragraph: p.paragraph.trim(),
          answer: p.answer.trim(),
        })),
      },
    };

    try {
      setLoading(true);
      const res = await api.post("/course-test/details", payload);
      toast.success(
        res.data?.message || "Level 3 data saved successfully!"
      );
    } catch (err) {
      console.error("Error saving Level 3:", err);
      toast.error("Failed to save Level 3 data!");
    } finally {
      setLoading(false);
    }
  };

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
            {/* HEADER */}
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
                    Reading Test – Level 3
                  </h2>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 14,
                      color: "#8c8c8c",
                    }}
                  >
                    Define paragraphs and their short answers for advanced
                    reading comprehension.
                  </p>
                </div>

                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSubmit}
                  loading={loading}
                  style={{
                    height: 40,
                    paddingInline: 20,
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  Save Level 3
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
                      <span>Paragraphs & Answers</span>
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
                    {paragraphs.map((p, index) => (
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
                              P{index + 1}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Paragraph & answer
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

                        <div style={{ marginBottom: 12 }}>
                          <Text style={{ fontWeight: 500, fontSize: 13 }}>
                            Paragraph
                          </Text>
                          <TextArea
                            rows={4}
                            placeholder="Enter paragraph text..."
                            value={p.paragraph}
                            onChange={(e) =>
                              handleChange(p.id, "paragraph", e.target.value)
                            }
                            style={{ marginTop: 6, background: "#fff" }}
                          />
                        </div>

                        <div>
                          <Text style={{ fontWeight: 500, fontSize: 13 }}>
                            Answer
                          </Text>
                          <TextArea
                            rows={2}
                            placeholder="Enter the answer..."
                            value={p.answer}
                            onChange={(e) =>
                              handleChange(p.id, "answer", e.target.value)
                            }
                            style={{ marginTop: 6, background: "#fff" }}
                          />
                        </div>
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

              {/* RIGHT: Tips / Info */}
              <Col xs={24} lg={8}>
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <Card
                    bordered={false}
                    style={{ borderRadius: 16, background: "#fafafa" }}
                    title={
                      <Space>
                        <BulbOutlined />
                        <span>Guidelines</span>
                      </Space>
                    }
                    bodyStyle={{ padding: 16 }}
                  >
                    <Space direction="vertical" size={4}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        • Use short, focused paragraphs to test specific skills.
                        <br />
                        • Answers should be concise and can be used for
                        open-ended or short-text responses.
                        <br />
                        • Make sure each answer is clearly inferable from its
                        paragraph.
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
