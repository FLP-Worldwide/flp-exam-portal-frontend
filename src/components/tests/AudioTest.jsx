"use client";

import React, { useEffect, useState } from "react";
import {
  Layout,
  Card,
  Typography,
  Space,
  Button,
  Upload,
  Radio,
  Input,
  Row,
  Col,
  Spin,
  message,
  Popconfirm,
  Divider,
  Tag,
} from "antd";
import {
  SoundOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  UploadOutlined,
  PlayCircleOutlined,
  FormOutlined,
} from "@ant-design/icons";
import api from "../../utils/axios";
import { toast } from "react-hot-toast";

const { Content } = Layout;
const { Text } = Typography;
const { TextArea } = Input;

const emptyQuestion = () => ({ text: "", correctAnswer: "true" });

const emptyLevel = (index) => ({
  id: Date.now() + index,
  levelKey: `level_${index + 1}`,
  media: null,
  file: null,
  fileList: [],
  questions: [emptyQuestion()],
});

export default function ListeningAdmin({ testId }) {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ----- LOAD EXISTING AUDIO MODULES -----
  const loadQuestions = async () => {
    if (!testId) return;
    setLoading(true);
    try {
      const res = await api.get(
        `/course-test/details/${encodeURIComponent(testId)}?module=audio`
      );

      const d = res?.data?.data;
      if (!d || !d.modules) {
        // no modules at all → start with one empty level
        setLevels([emptyLevel(0)]);
        setLoading(false);
        return;
      }

      const modules = d.modules || {};
      const audioEntries = Object.entries(modules).filter(
        ([, m]) => m && m.module === "audio"
      );

      if (!audioEntries.length) {
        setLevels([emptyLevel(0)]);
        setLoading(false);
        return;
      }

      const loadedLevels = audioEntries.map(([key, m], idx) => {
        const content = m.content || {};
        const items = Array.isArray(content.questions)
          ? content.questions
          : [];

        return {
          id: Date.now() + idx,
          levelKey: m.level || `level_${idx + 1}`,
          media: content.media || null,
          file: null,
          fileList: [],
          questions: items.map((q) => ({
            text: q.text || "",
            correctAnswer: q.correctAnswer ? "true" : "false",
            questionId: q.questionId || null,
          })),
        };
      });

      setLevels(loadedLevels);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load listening modules");
      setLevels([emptyLevel(0)]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuestions();
  }, [testId]);

  // ----- LEVEL HANDLERS -----
  const addLevel = () => {
    setLevels((prev) => {
      const nextIndex = prev.length;
      return [...prev, emptyLevel(nextIndex)];
    });
  };

  const deleteAudio = (levelIdx) => {
    setLevels((prev) =>
      prev.map((lvl, idx) =>
        idx === levelIdx ? { ...lvl, media: null } : lvl
      )
    );
    toast.success("Audio removed from this level (frontend state)");
  };

  // ----- QUESTION HANDLERS -----
  const addQuestion = (levelIdx) => {
    setLevels((prev) =>
      prev.map((lvl, idx) =>
        idx === levelIdx
          ? { ...lvl, questions: [...lvl.questions, emptyQuestion()] }
          : lvl
      )
    );
  };

  const removeQuestion = (levelIdx, qIdx) => {
    setLevels((prev) =>
      prev.map((lvl, idx) =>
        idx === levelIdx
          ? {
              ...lvl,
              questions: lvl.questions.filter((_, i) => i !== qIdx),
            }
          : lvl
      )
    );
  };

  const handleQuestionChange = (levelIdx, qIdx, field, value) => {
    setLevels((prev) =>
      prev.map((lvl, idx) =>
        idx === levelIdx
          ? {
              ...lvl,
              questions: lvl.questions.map((q, i) =>
                i === qIdx ? { ...q, [field]: value } : q
              ),
            }
          : lvl
      )
    );
  };

  // ----- UPLOAD HANDLERS -----
  const handleUploadChange = (levelIdx, info) => {
    const newList = info.fileList || [];
    const latest = newList[newList.length - 1];
    const realFile = latest ? latest.originFileObj : null;

    setLevels((prev) =>
      prev.map((lvl, idx) =>
        idx === levelIdx
          ? { ...lvl, fileList: newList, file: realFile }
          : lvl
      )
    );
  };

  const uploadAudioFile = async (levelIdx) => {
    const level = levels[levelIdx];
    if (!level.file) {
      toast("Please select an audio file first");
      return null;
    }

    const fd = new FormData();
    fd.append("file", level.file);

    const res = await api.post("/course-test/audio/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (!res.data?.success) {
      throw new Error(res.data?.message || "Upload failed");
    }

    const uploaded = res.data;

    setLevels((prev) =>
      prev.map((lvl, idx) =>
        idx === levelIdx
          ? { ...lvl, media: uploaded, file: null, fileList: [] }
          : lvl
      )
    );

    return uploaded;
  };

  // ----- SAVE ALL LEVELS -----
  const saveAll = async () => {
    if (!testId) {
      message.error("No test selected");
      return;
    }

    setIsSaving(true);
    try {
      for (let i = 0; i < levels.length; i += 1) {
        const lvl = levels[i];

        // upload file if newly selected
        let mediaPayload = lvl.media;
        if (lvl.file) {
          const uploaded = await uploadAudioFile(i);
          if (uploaded) mediaPayload = uploaded;
        }

        if (!mediaPayload) {
          toast.error(`Please upload audio for Level ${i + 1}`);
          continue;
        }

        const payload = {
          testId,
          level: lvl.levelKey, // e.g. "level_1", "level_2"
          module: "audio",
          content: {
            media: mediaPayload,
            questions: lvl.questions.map((q) => ({
              text: q.text,
              correctAnswer: q.correctAnswer === "true",
            })),
          },
        };

        const res = await api.post("/course-test/details", payload);
        if (!res.data?.data && !res.data?.success) {
          throw new Error(res.data?.message || "Save failed");
        }
      }

      toast.success("All levels saved successfully");
    } catch (err) {
      console.error(err);
      message.error("Save failed: " + (err.message || err));
    }
    setIsSaving(false);
  };

  // ----- UI -----
  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Content
        style={{ padding: 24, display: "flex", justifyContent: "center" }}
      >
        <div style={{ width: "100%", maxWidth: 1100 }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* HEADER */}
            <Card
              bordered={false}
              style={{
                width: "100%",
                borderRadius: 16,
                marginBottom: 16,
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
                    Listening Test – Admin
                  </h2>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 14,
                      color: "#8c8c8c",
                    }}
                  >
                    Manage audio and true/false questions for each listening
                    level.
                  </p>
                </div>

                <Space>
                  <Button
                    type="default"
                    icon={<PlusOutlined />}
                    onClick={addLevel}
                  >
                    Add Level
                  </Button>

                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={saveAll}
                    loading={isSaving}
                    style={{
                      height: 40,
                      paddingInline: 20,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Save All Levels
                  </Button>
                </Space>
              </div>
            </Card>

            {/* LEVELS */}
            {loading ? (
              <Card
                bordered={false}
                style={{ borderRadius: 16, textAlign: "center" }}
              >
                <Spin tip="Loading listening modules..." />
              </Card>
            ) : (
              levels.map((lvl, levelIdx) => (
                <Card
                  key={lvl.id}
                  bordered={false}
                  style={{ borderRadius: 16 }}
                  title={
                    <Space>
                      <Tag
                        color="processing"
                        style={{
                          borderRadius: 999,
                          padding: "0 10px",
                          fontWeight: 500,
                        }}
                      >
                        Level {levelIdx + 1}
                      </Tag>
                      <span>{lvl.levelKey}</span>
                    </Space>
                  }
                >
                  <Row gutter={[16, 16]}>
                    {/* AUDIO SECTION */}
                    <Col xs={24} lg={12}>
                      <Card
                        title={
                          <Space>
                            <SoundOutlined />
                            <span>Test Audio</span>
                          </Space>
                        }
                        bordered={false}
                        style={{ height: "100%" }}
                      >
                        {lvl.media?.url ? (
                          <Space
                            direction="vertical"
                            size="small"
                            style={{ width: "100%" }}
                          >
                            <Text>
                              Current:{" "}
                              <Text strong>
                                {lvl.media.filename ||
                                  lvl.media.name ||
                                  "Audio file"}
                              </Text>
                            </Text>
                            {lvl.media.updatedAt && (
                              <Text
                                type="secondary"
                                style={{ fontSize: 12 }}
                              >
                                Last updated:{" "}
                                {new Date(
                                  lvl.media.updatedAt
                                ).toLocaleString()}
                              </Text>
                            )}
                            <audio
                              controls
                              src={lvl.media.url}
                              style={{ width: "100%", marginTop: 8 }}
                            />

                            <Popconfirm
                              title="Remove current audio from this level?"
                              okText="Yes"
                              cancelText="No"
                              onConfirm={() => deleteAudio(levelIdx)}
                            >
                              <Button
                                type="primary"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                style={{ marginTop: 8 }}
                              >
                                Remove Audio
                              </Button>
                            </Popconfirm>
                          </Space>
                        ) : (
                          <Text type="secondary">
                            No audio uploaded for this level yet.
                          </Text>
                        )}

                        <Divider />

                        <Space
                          direction="vertical"
                          size="small"
                          style={{ width: "100%" }}
                        >
                          <Upload
                            accept="audio/*,video/*"
                            beforeUpload={() => false}
                            maxCount={1}
                            fileList={lvl.fileList}
                            onChange={(info) =>
                              handleUploadChange(levelIdx, info)
                            }
                            showUploadList={{ showRemoveIcon: true }}
                          >
                            <Button icon={<UploadOutlined />}>
                              {lvl.file
                                ? "Change Audio File"
                                : "Select Audio File"}
                            </Button>
                          </Upload>

                          <Button
                            type="default"
                            icon={<PlayCircleOutlined />}
                            onClick={async () => {
                              try {
                                setIsSaving(true);
                                const result = await uploadAudioFile(levelIdx);
                                if (result) {
                                  message.success("Audio uploaded");
                                }
                              } catch (err) {
                                console.error(err);
                                message.error("Upload failed");
                              } finally {
                                setIsSaving(false);
                              }
                            }}
                          >
                            Upload Audio Only (Level {levelIdx + 1})
                          </Button>
                        </Space>
                      </Card>
                    </Col>

                    {/* QUESTIONS SECTION */}
                    <Col xs={24} lg={12}>
                      <Card
                        title={
                          <Space>
                            <FormOutlined />
                            <span>Questions</span>
                            {lvl.questions.length > 0 && (
                              <Tag
                                color="blue"
                                style={{ borderRadius: 999 }}
                              >
                                {lvl.questions.length} item
                                {lvl.questions.length > 1 ? "s" : ""}
                              </Tag>
                            )}
                          </Space>
                        }
                        extra={
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => addQuestion(levelIdx)}
                          >
                            Add Question
                          </Button>
                        }
                        bordered={false}
                        style={{ height: "100%" }}
                        bodyStyle={{ padding: 16 }}
                      >
                        <Space
                          direction="vertical"
                          size="middle"
                          style={{
                            width: "100%",
                            maxHeight: 480,
                            overflowY: "auto",
                          }}
                        >
                          {lvl.questions.length === 0 && (
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
                                No questions added yet for this level. Click{" "}
                                <Text strong>"Add Question"</Text> to create
                                your first true/false question.
                              </Text>
                            </div>
                          )}

                          {lvl.questions.map((q, qIdx) => (
                            <div
                              key={qIdx}
                              style={{
                                borderRadius: 12,
                                border: "1px solid #f0f0f0",
                                background: "#fafafa",
                                padding: 16,
                              }}
                            >
                              <Space
                                align="flex-start"
                                style={{
                                  width: "100%",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Space
                                  direction="vertical"
                                  style={{ flex: 1 }}
                                  size="small"
                                >
                                  <Space align="center">
                                    <Tag
                                      color="processing"
                                      style={{
                                        borderRadius: 999,
                                        padding: "0 10px",
                                        fontWeight: 500,
                                      }}
                                    >
                                      L{levelIdx + 1}-Q{qIdx + 1}
                                    </Tag>
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: 12 }}
                                    >
                                      True / False question
                                    </Text>
                                  </Space>

                                  <TextArea
                                    value={q.text}
                                    onChange={(e) =>
                                      handleQuestionChange(
                                        levelIdx,
                                        qIdx,
                                        "text",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Enter question statement..."
                                    rows={2}
                                    style={{
                                      marginTop: 6,
                                      background: "#fff",
                                    }}
                                  />

                                  <div style={{ marginTop: 4 }}>
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: 12 }}
                                    >
                                      Correct answer:
                                    </Text>
                                    <Radio.Group
                                      style={{ marginLeft: 8 }}
                                      value={q.correctAnswer}
                                      onChange={(e) =>
                                        handleQuestionChange(
                                          levelIdx,
                                          qIdx,
                                          "correctAnswer",
                                          e.target.value
                                        )
                                      }
                                    >
                                      <Radio value="true">True</Radio>
                                      <Radio value="false">False</Radio>
                                    </Radio.Group>
                                  </div>
                                </Space>

                                <Space
                                  direction="vertical"
                                  align="flex-end"
                                  size="small"
                                  style={{ minWidth: 80 }}
                                >
                                  <Popconfirm
                                    title="Remove this question?"
                                    okText="Yes"
                                    cancelText="No"
                                    onConfirm={() =>
                                      removeQuestion(levelIdx, qIdx)
                                    }
                                  >
                                    <Button
                                      size="small"
                                      type="link"
                                      danger
                                      icon={<DeleteOutlined />}
                                      style={{ paddingRight: 0 }}
                                    >
                                      Remove
                                    </Button>
                                  </Popconfirm>
                                </Space>
                              </Space>
                            </div>
                          ))}
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                </Card>
              ))
            )}
          </Space>
        </div>
      </Content>
    </Layout>
  );
}
