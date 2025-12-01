"use client";
import React, { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Input,
  Button,
  Form,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Tag,
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
  const [paragraphs, setParagraphs] = useState([
    { id: Date.now(), text: "", answer: "" },
  ]);
  const [options, setOptions] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);

  // ✅ Prefill when data is available
  useEffect(() => {
    if (data?.content) {
      const prefilledParagraphs =
        data.content.paragraphs?.map((p, idx) => ({
          id: idx + 1,
          text: p.paragraph || "",
          answer: p.answer || "",
        })) || [];

      const prefilledOptions = data.content.options?.length
        ? data.content.options
        : ["", "", "", ""];

      setParagraphs(
        prefilledParagraphs.length
          ? prefilledParagraphs
          : [{ id: Date.now(), text: "", answer: "" }]
      );
      setOptions(prefilledOptions);
    }
  }, [data]);

  const addParagraph = () =>
    setParagraphs([
      ...paragraphs,
      { id: Date.now(), text: "", answer: "" },
    ]);

  const updateParagraph = (id, value) =>
    setParagraphs(
      paragraphs.map((p) => (p.id === id ? { ...p, text: value } : p))
    );

  const updateAnswer = (id, value) =>
    setParagraphs(
      paragraphs.map((p) => (p.id === id ? { ...p, answer: value } : p))
    );

  const removeParagraph = (id) =>
    setParagraphs(paragraphs.filter((p) => p.id !== id));

  const addOption = () => setOptions([...options, ""]);

  const updateOption = (index, value) =>
    setOptions(options.map((opt, i) => (i === index ? value : opt)));

  const handleSave = async () => {
    const payload = {
      testId,
      level: "3",
      module: "reading",
      content: {
        paragraphs: paragraphs.map((p) => ({
          paragraph: p.text.trim(),
          answer: p.answer.trim(),
        })),
        options: options.filter((opt) => opt.trim() !== ""),
      },
    };

    if (!payload.content.paragraphs[0]?.paragraph) {
      toast.error("Please enter at least one paragraph!");
      return;
    }
    if (payload.content.options.length === 0) {
      toast.error("Please enter at least one option!");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/course-test/details", payload);
      toast.success(res.data?.message || "Level 3 saved successfully!");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save Level 3!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Content
        style={{
          padding: 12,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 1100 }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* TOP HEADER CARD */}
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
                {/* LEFT: title + subtitle */}
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
                    Configure advanced paragraphs, answers and shared options for
                    the reading module.
                  </p>
                </div>

                {/* RIGHT: save button */}
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
                  Save Level 3
                </Button>
              </div>
            </Card>

            {/* MAIN GRID */}
            <Row gutter={[16, 16]}>
              {/* LEFT: PARAGRAPHS & ANSWERS */}
              <Col xs={24} lg={14}>
                <Card
                  bordered={false}
                  style={{
                    width: "100%",
                    borderRadius: 16,
                  }}
                  title={
                    <Space>
                      <FileTextOutlined />
                      <span>Paragraphs & Answers</span>
                      {paragraphs.length > 0 && (
                        <Tag color="blue" style={{ borderRadius: 999 }}>
                          {paragraphs.length} item
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
                        maxHeight: 480,
                        overflowY: "auto",
                        paddingRight: 4,
                      }}
                    >
                      {paragraphs.length === 0 && (
                        <div
                          style={{
                            padding: 16,
                            borderRadius: 12,
                            background: "#fafafa",
                            border: "1px dashed #e5e5e5",
                            textAlign: "center",
                          }}
                        >
                          <Text type="secondary">
                            No paragraphs added yet. Use{" "}
                            <Text strong>"Add Paragraph"</Text> to create one.
                          </Text>
                        </div>
                      )}

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

                          <Form.Item
                            style={{ marginBottom: 10 }}
                            label={
                              <span style={{ fontWeight: 500 }}>
                                Paragraph text
                              </span>
                            }
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

                          <Form.Item
                            style={{ marginBottom: 0 }}
                            label={
                              <span style={{ fontWeight: 500 }}>
                                Correct answer
                              </span>
                            }
                          >
                            <Input
                              placeholder="Enter answer for this paragraph..."
                              value={p.answer}
                              onChange={(e) =>
                                updateAnswer(p.id, e.target.value)
                              }
                            />
                          </Form.Item>
                        </div>
                      ))}
                    </Space>

                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={addParagraph}
                      style={{
                        width: "100%",
                        marginTop: 16,
                        borderRadius: 999,
                      }}
                    >
                      Add Paragraph
                    </Button>
                  </Form>
                </Card>
              </Col>

              {/* RIGHT: OPTIONS & HINT */}
              <Col xs={24} lg={10}>
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  {/* OPTIONS CARD */}
                  <Card
                    bordered={false}
                    style={{ borderRadius: 16 }}
                    title={
                      <Space>
                        <BulbOutlined />
                        <span>Options</span>
                        {options.filter((o) => o.trim()).length > 0 && (
                          <Tag color="green" style={{ borderRadius: 999 }}>
                            {options.filter((o) => o.trim()).length} active
                          </Tag>
                        )}
                      </Space>
                    }
                    bodyStyle={{ padding: 16 }}
                  >
                    <Space
                      direction="vertical"
                      size="small"
                      style={{ width: "100%" }}
                    >
                      {options.map((opt, i) => (
                        <Input
                          key={i}
                          placeholder={`Option ${String.fromCharCode(
                            65 + i
                          )}`}
                          value={opt}
                          onChange={(e) => updateOption(i, e.target.value)}
                        />
                      ))}
                    </Space>

                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={addOption}
                      style={{
                        width: "100%",
                        marginTop: 16,
                        borderRadius: 999,
                      }}
                    >
                      Add Option
                    </Button>

                    <Divider style={{ margin: "16px 0" }} />

                    <Text type="secondary" style={{ fontSize: 12 }}>
                      These options will be shared across all paragraphs in this
                      level. You can add as many as you need (A, B, C, D, ...).
                    </Text>
                  </Card>

                  {/* SMALL INFO CARD */}
                  <Card
                    bordered={false}
                    style={{ borderRadius: 16, background: "#fafafa" }}
                  >
                    <Space direction="vertical" size={4}>
                      <Text strong>Tips</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        • Use Level 3 for slightly more advanced texts. <br />
                        • Keep answers clear and unambiguous. <br />
                        • Options should be similar in length and style so they
                        don&apos;t give away the correct one too easily.
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
