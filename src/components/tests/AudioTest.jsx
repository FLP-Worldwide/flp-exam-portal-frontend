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
import {toast } from 'react-hot-toast'


const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

export default function ListeningAdmin({ testId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState(null);
  const [file, setFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const emptyQuestion = () => ({ text: "", correctAnswer: "true" });

  // Load existing audio module
 const loadQuestions = async () => {
  setLoading(true);
  try {
    const res = await api.get(
      `/course-test/details/${encodeURIComponent(testId)}?module=audio`
    );

    const d = res?.data?.data; // whole object you showed

    if (!d) {
      setQuestions([]);
      setMedia(null);
      setLoading(false);
      return;
    }

    // 1) modules is an object like:
    // {
    //   "level_level_1": {
    //     module: "audio",
    //     content: { media, questions }
    //   }
    // }
    const modules = d.modules || {};

    // 2) Pick the audio module entry (you can also filter by level if needed)
    const audioModuleEntry =
      Object.values(modules).find((m) => m.module === "audio") || null;

    if (!audioModuleEntry || !audioModuleEntry.content) {
      // No audio module yet
      setMedia(null);
      setQuestions([]);
      setLoading(false);
      return;
    }

    const content = audioModuleEntry.content;

    // 3) Prefill audio
    setMedia(content.media || null);

    // 4) Prefill questions
    const items = Array.isArray(content.questions)
      ? content.questions
      : [];

    setQuestions(
      items.map((q) => ({
        text: q.text || "",
        correctAnswer: q.correctAnswer ? "true" : "false",
        questionId: q.questionId || null, // keep id if you need it later
      }))
    );
  } catch (err) {
    console.error(err);
    toast.error("Failed to load questions/audio");
  }
  setLoading(false);
};


  useEffect(() => {
    if (!testId) return;
    loadQuestions();
  }, [testId]);

  // Question handlers
  const addQuestion = () =>
    setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (idx) =>
    setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const handleQuestionChange = (idx, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  // Upload handlers
  const handleUploadChange = (info) => {
    const newList = info.fileList || [];
    setFileList(newList);

    const latest = newList[newList.length - 1];
    if (!latest) {
      setFile(null);
      return;
    }

    const realFile = latest.originFileObj;
    setFile(realFile || null);
  };

  const uploadAudioFile = async () => {
    if (!file) {
      toast("Please select an audio file first");
      return null;
    }

    const fd = new FormData();
    fd.append("file", file);

    const res = await api.post("/course-test/audio/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (!res.data?.success) {
      throw new Error(res.data?.message || "Upload failed");
    }

    setMedia(res.data);
    setFile(null);
    setFileList([]);
    return res.data;
  };

  const saveAll = async () => {
    if (!testId) {
      message.error("No test selected");
      return;
    }
    setIsSaving(true);
    try {
      let uploadedMedia = null;
      if (file) {
        uploadedMedia = await uploadAudioFile();
      }

      const mediaPayload = uploadedMedia || media;
      if (!mediaPayload) {
        toast("Please upload an audio file before saving");
        setIsSaving(false);
        return;
      }

      const payload = {
        testId,
        level: 'level_1', // TODO: replace with actual level
        module: "audio",
        content: {
          media: mediaPayload,
          questions: questions.map((q) => ({
            text: q.text,
            correctAnswer: q.correctAnswer === "true",
          })),
        },
      };

      const res = await api.post("/course-test/details", payload);
      console.log(res);
      if (!res.data?.data && !res.data?.success) {
        throw new Error(res.data?.message || "Save failed");
      }

      toast.success("Saved successfully");
    } catch (err) {
      console.error(err);
      message.error("Save failed: " + (err.message || err));
    }
    setIsSaving(false);
  };

  const deleteAudio = async () => {
    setMedia(null);
    toast.success("Audio removed from this test (frontend state)");
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Content
        style={{ padding: 24, display: "flex", justifyContent: "center" }}
      >
        <div style={{ width: "100%", maxWidth: 1100 }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>

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
              {/* LEFT: title + subtitle */}
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
                  Manage audio and true/false questions for the listening exam.
                </p>
              </div>

              {/* RIGHT: save button */}
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={saveAll}
                loading={isSaving}
                style={{ height: 40, paddingInline: 20, whiteSpace: "nowrap" }}
              >
                Save All (audio + questions)
              </Button>
            </div>
          </Card>





            <Row gutter={[16, 16]}>
              {/* AUDIO SECTION (unchanged) */}
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
                  {media?.url ? (
                    <Space
                      direction="vertical"
                      size="small"
                      style={{ width: "100%" }}
                    >
                      <Text>
                        Current:{" "}
                        <Text strong>
                          {media.filename || media.name || "Audio file"}
                        </Text>
                      </Text>
                      {media.updatedAt && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Last updated:{" "}
                          {new Date(media.updatedAt).toLocaleString()}
                        </Text>
                      )}
                      <audio
                        controls
                        src={media.url}
                        style={{ width: "100%", marginTop: 8 }}
                      />

                      <Popconfirm
                        title="Remove current audio from this test?"
                        okText="Yes"
                        cancelText="No"
                        onConfirm={deleteAudio}
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
                    <Text type="secondary">No audio uploaded yet.</Text>
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
                      fileList={fileList}
                      onChange={handleUploadChange}
                      showUploadList={{ showRemoveIcon: true }}
                    >
                      <Button icon={<UploadOutlined />}>
                        {file ? "Change Audio File" : "Select Audio File"}
                      </Button>
                    </Upload>

                    <Button
                      type="default"
                      icon={<PlayCircleOutlined />}
                      onClick={async () => {
                        try {
                          setIsSaving(true);
                          const result = await uploadAudioFile();
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
                      Upload Audio Only
                    </Button>
                  </Space>
                </Card>
              </Col>

              {/* QUESTIONS SECTION – beautified */}
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <Space>
                      <FormOutlined />
                      <span>Questions</span>
                      {questions.length > 0 && (
                        <Tag color="blue" style={{ borderRadius: 999 }}>
                          {questions.length} item
                          {questions.length > 1 ? "s" : ""}
                        </Tag>
                      )}
                    </Space>
                  }
                  extra={
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={addQuestion}
                    >
                      Add Question
                    </Button>
                  }
                  bordered={false}
                  style={{ height: "100%" }}
                  bodyStyle={{ padding: 16 }}
                >
                  {loading ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "40px 0",
                      }}
                    >
                      <Spin tip="Loading questions..." />
                    </div>
                  ) : (
                    <Space
                      direction="vertical"
                      size="middle"
                      style={{
                        width: "100%",
                        maxHeight: 480,
                        overflowY: "auto",
                      }}
                    >
                      {questions.length === 0 && (
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
                            No questions added yet. Click{" "}
                            <Text strong>"Add Question"</Text> to create your
                            first true/false question.
                          </Text>
                        </div>
                      )}

                      {questions.map((q, idx) => (
                        <div
                          key={idx}
                          style={{
                            borderRadius: 12,
                            border: "1px solid #f0f0f0",
                            background: "#fafafa",
                            padding: 16,
                          }}
                        >
                          <Space
                            align="flex-start"
                            style={{ width: "100%", justifyContent: "space-between" }}
                          >
                            {/* Left side: badge + textarea + options */}
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
                                  Q{idx + 1}
                                </Tag>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  True / False question
                                </Text>
                              </Space>

                              <TextArea
                                value={q.text}
                                onChange={(e) =>
                                  handleQuestionChange(
                                    idx,
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
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Correct answer:
                                </Text>
                                <Radio.Group
                                  style={{ marginLeft: 8 }}
                                  value={q.correctAnswer}
                                  onChange={(e) =>
                                    handleQuestionChange(
                                      idx,
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

                            {/* Right side: actions */}
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
                                onConfirm={() => removeQuestion(idx)}
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
                  )}
                </Card>
              </Col>
            </Row>

            {/* ACTIONS */}
            
          </Space>
        </div>
      </Content>
    </Layout>
  );
}
