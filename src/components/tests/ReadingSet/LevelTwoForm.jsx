"use client";
import React, { useEffect, useState } from "react";
import {
  Layout,
  Card,
  Input,
  Button,
  Form,
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
  QuestionCircleOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import api from "../../../utils/axios";
import toast from "react-hot-toast";

const { Content } = Layout;
const { Text } = Typography;
const { TextArea } = Input;

export default function LevelTwoForm({ testId, data }) {
  const [paragraphs, setParagraphs] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Prefill from existing data if available
  useEffect(() => {
    if (data?.content?.paragraphs?.length > 0) {
      const formatted = data.content.paragraphs.map((p, pi) => ({
        id: Date.now() + pi,
        text: p.paragraph || "",
        questions:
          p.questions?.map((q, qi) => ({
            id: Date.now() + pi + qi + 1,
            question: q.question || "",
            options: q.options?.length ? q.options : ["", "", ""],
            answer: q.answer || "",
          })) || [
            {
              id: Date.now() + pi + 100,
              question: "",
              options: ["", "", ""],
              answer: "",
            },
          ],
      }));

      setParagraphs(formatted);
    } else {
      // Initialize with one empty paragraph + question
      setParagraphs([
        {
          id: Date.now(),
          text: "",
          questions: [
            {
              id: Date.now() + 1,
              question: "",
              options: ["", "", ""],
              answer: "",
            },
          ],
        },
      ]);
    }
  }, [data]);

  // ➕ Add Paragraph
  const addParagraph = () => {
    setParagraphs((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: "",
        questions: [
          {
            id: Date.now() + 1,
            question: "",
            options: ["", "", ""],
            answer: "",
          },
        ],
      },
    ]);
  };

  // ➕ Add Question
  const addQuestion = (pId) => {
    setParagraphs((prev) =>
      prev.map((p) =>
        p.id === pId
          ? {
              ...p,
              questions: [
                ...p.questions,
                {
                  id: Date.now(),
                  question: "",
                  options: ["", "", ""],
                  answer: "",
                },
              ],
            }
          : p
      )
    );
  };

  // 🗑️ Delete Question (even if blank)
  const deleteQuestion = (pId, qId) => {
    setParagraphs((prev) =>
      prev.map((p) =>
        p.id === pId
          ? {
              ...p,
              questions: p.questions.filter((q) => q.id !== qId),
            }
          : p
      )
    );
  };

  // ✏️ Update Paragraph
  const updateParagraph = (pId, text) => {
    setParagraphs((prev) =>
      prev.map((p) => (p.id === pId ? { ...p, text } : p))
    );
  };

  // ✏️ Update Question or Option
  const updateQuestion = (pId, qId, field, value, optIndex = null) => {
    setParagraphs((prev) =>
      prev.map((p) =>
        p.id === pId
          ? {
              ...p,
              questions: p.questions.map((q) =>
                q.id === qId
                  ? field === "options"
                    ? {
                        ...q,
                        options: q.options.map((o, i) =>
                          i === optIndex ? value : o
                        ),
                      }
                    : { ...q, [field]: value }
                  : q
              ),
            }
          : p
      )
    );
  };

  // 🗑️ Delete paragraph
  const deleteParagraph = (pId) => {
    if (paragraphs.length === 1) {
      toast("At least one paragraph is required!");
      return;
    }
    setParagraphs((prev) => prev.filter((item) => item.id !== pId));
  };

  // 💾 Handle Save
  const handleSave = async () => {
    const payload = {
      testId,
      level: "2",
      module: "reading",
      content: {
        paragraphs: paragraphs.map((p) => ({
          paragraph: p.text.trim(),
          questions: p.questions.map((q) => ({
            question: q.question.trim(),
            options: q.options
              .map((opt) => opt.trim())
              .filter((opt) => opt !== ""),
            answer: q.answer.trim(),
          })),
        })),
      },
    };

    if (!payload.content.paragraphs[0]?.paragraph) {
      toast.error("Please enter at least one paragraph!");
      return;
    }

    const hasQuestions = payload.content.paragraphs.some((p) =>
      p.questions.some((q) => q.question)
    );

    if (!hasQuestions) {
      toast.error("Please add at least one question!");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/course-test/details", payload);
      toast.success(res.data?.message || "Level 2 saved successfully!");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save Level 2!"
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
                    Reading Test – Level 2
                  </h2>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 14,
                      color: "#8c8c8c",
                    }}
                  >
                    Create detailed paragraphs with multiple-choice questions.
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
                  Save Level 2
                </Button>
              </div>
            </Card>

            <Row gutter={[16, 16]}>
              {/* LEFT: Paragraphs & Questions */}
              <Col xs={24} lg={16}>
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 16,
                  }}
                  title={
                    <Space>
                      <FileTextOutlined />
                      <span>Paragraphs & Questions</span>
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
                  <Form layout="vertical">
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
                          {/* Paragraph header */}
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
                                Paragraph with MCQs
                              </Text>
                            </Space>

                            <Button
                              type="link"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => deleteParagraph(p.id)}
                              style={{ paddingRight: 0 }}
                            >
                              Remove
                            </Button>
                          </div>

                          {/* Paragraph text */}
                          <Form.Item
                            label={
                              <span style={{ fontWeight: 500 }}>
                                Paragraph text
                              </span>
                            }
                            style={{ marginBottom: 12 }}
                          >
                            <TextArea
                              rows={4}
                              placeholder="Enter paragraph text..."
                              value={p.text}
                              onChange={(e) =>
                                updateParagraph(p.id, e.target.value)
                              }
                              style={{ background: "#fff" }}
                            />
                          </Form.Item>

                          {/* Questions list */}
                          <Space
                            direction="vertical"
                            size="small"
                            style={{ width: "100%" }}
                          >
                            {p.questions.map((q, qi) => (
                              <div
                                key={q.id}
                                style={{
                                  borderRadius: 10,
                                  border: "1px solid #e5e5e5",
                                  background: "#ffffff",
                                  padding: 10,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 6,
                                  }}
                                >
                                  <Space align="center">
                                    <Tag
                                      color="default"
                                      style={{
                                        borderRadius: 999,
                                        paddingInline: 8,
                                      }}
                                    >
                                      Q{qi + 1}
                                    </Tag>
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: 12 }}
                                    >
                                      Multiple-choice question
                                    </Text>
                                  </Space>

                                  {/* remove single question */}
                                  <Button
                                    type="link"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() =>
                                      deleteQuestion(p.id, q.id)
                                    }
                                    style={{ paddingRight: 0 }}
                                  >
                                    Remove
                                  </Button>
                                </div>

                                <Input
                                  placeholder={`Question ${qi + 1}`}
                                  style={{ marginBottom: 8 }}
                                  value={q.question}
                                  onChange={(e) =>
                                    updateQuestion(
                                      p.id,
                                      q.id,
                                      "question",
                                      e.target.value
                                    )
                                  }
                                />

                                {q.options.map((opt, oi) => (
                                  <Input
                                    key={oi}
                                    style={{ marginBottom: 6 }}
                                    placeholder={`Option ${String.fromCharCode(
                                      65 + oi
                                    )}`}
                                    value={opt}
                                    onChange={(e) =>
                                      updateQuestion(
                                        p.id,
                                        q.id,
                                        "options",
                                        e.target.value,
                                        oi
                                      )
                                    }
                                  />
                                ))}

                                <Input
                                  placeholder="Correct answer"
                                  value={q.answer}
                                  onChange={(e) =>
                                    updateQuestion(
                                      p.id,
                                      q.id,
                                      "answer",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                            ))}
                          </Space>

                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => addQuestion(p.id)}
                            style={{
                              width: "100%",
                              marginTop: 10,
                              borderRadius: 999,
                            }}
                          >
                            Add Question
                          </Button>
                        </div>
                      ))}
                    </Space>

                    <Divider />

                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={addParagraph}
                      style={{
                        width: "100%",
                        borderRadius: 999,
                      }}
                    >
                      Add New Paragraph
                    </Button>
                  </Form>
                </Card>
              </Col>

              {/* RIGHT: Helper / Tips */}
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
                        <QuestionCircleOutlined />
                        <span>Structure</span>
                      </Space>
                    }
                    bodyStyle={{ padding: 16 }}
                  >
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Each paragraph can have multiple questions. Every question
                      supports at least 3 options and one correct answer.
                    </Text>
                    <Divider style={{ margin: "12px 0" }} />
                    <Space direction="vertical" size={4}>
                      <Text strong>Example:</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        • Paragraph 1 → 3 questions (Q1, Q2, Q3) <br />
                        • Paragraph 2 → 2 questions (Q1, Q2)
                      </Text>
                    </Space>
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
                        • Keep questions directly related to the paragraph. <br />
                        • Options should be plausible and similar in length. <br />
                        • Avoid giving away the correct answer with patterns.
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
