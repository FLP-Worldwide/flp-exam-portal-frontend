'use client'
import React, { useState } from "react";
import { Tabs, Card, Input, Button, Form, Space, Typography, Divider, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../utils/axios"; // ✅ make sure you have your axios instance setup

const { Title } = Typography;

function LevelOneForm({ testId }) {
  const [paragraphs, setParagraphs] = useState([{ id: Date.now(), text: "", answer: "" }]);
  const [options, setOptions] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);

  // ✅ Add new paragraph
  const addParagraph = () => {
    setParagraphs([...paragraphs, { id: Date.now(), text: "", answer: "" }]);
  };

  // ✅ Update paragraph text
  const updateParagraph = (id, value) => {
    setParagraphs(paragraphs.map((p) => (p.id === id ? { ...p, text: value } : p)));
  };

  // ✅ Update answer
  const updateAnswer = (id, value) => {
    setParagraphs(paragraphs.map((p) => (p.id === id ? { ...p, answer: value } : p)));
  };

  // ✅ Add more option
  const addOption = () => {
    setOptions([...options, ""]);
  };

  // ✅ Update option text
  const updateOption = (index, value) => {
    setOptions(options.map((opt, i) => (i === index ? value : opt)));
  };

  // ✅ Save handler with API call
  const handleSave = async () => {
    // Build payload
    const payload = {
      testId: testId,
      level: "1",
      module: "reading",
      content: {
        paragraphs: paragraphs.map((p) => ({
          paragraph: p.text.trim(),
          answer: p.answer.trim(),
        })),
        options: options.filter((opt) => opt.trim() !== ""), // remove empty options
      },
    };

    console.log("🚀 Payload to be sent:", payload);

    // Validation
    if (payload.content.paragraphs.length === 0 || !payload.content.paragraphs[0].paragraph) {
      message.warning("Please enter at least one paragraph!");
      return;
    }
    if (payload.content.options.length === 0) {
      message.warning("Please enter at least one option!");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/course-test/details", payload);
      message.success(res.data?.message || "Level 1 saved successfully!");
      console.log("✅ API Response:", res.data);
    } catch (error) {
      console.error("❌ Error saving Level 1:", error);
      message.error(error.response?.data?.message || "Failed to save Level 1!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-md border border-gray-200">
        <Form layout="vertical">
          <Title level={4}>Paragraphs & Answers</Title>

          {paragraphs.map((p, index) => (
            <div key={p.id} className="border p-4 mb-4 rounded-md bg-white">
              <div className="flex justify-between items-center">
                <label className="font-semibold">Paragraph {index + 1}</label>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() =>
                    setParagraphs(paragraphs.filter((item) => item.id !== p.id))
                  }
                />
              </div>

              <Input.TextArea
                rows={4}
                placeholder="Enter paragraph text..."
                className="mt-2"
                value={p.text}
                onChange={(e) => updateParagraph(p.id, e.target.value)}
              />

              <Input
                className="mt-3"
                placeholder="Enter answer for this paragraph..."
                value={p.answer}
                onChange={(e) => updateAnswer(p.id, e.target.value)}
              />
            </div>
          ))}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addParagraph}
            className="w-full"
          >
            Add More Paragraph
          </Button>

          <Divider />

          <Title level={4}>Options</Title>
          {options.map((opt, i) => (
            <Input
              key={i}
              className="mb-2"
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
            />
          ))}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addOption}
            className="w-full mb-4"
          >
            Add More Option
          </Button>

          <Divider />

          <div className="flex justify-end">
            <Space>
              <Button type="primary" loading={loading} onClick={handleSave}>
                Save Level 1
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
}

function LevelTwoForm() {
  return (
    <div className="max-w-4xl mx-auto text-center text-gray-500">
      <p>Level 2 form can be added here later.</p>
    </div>
  );
}

export default function ReadingSet({ testId }) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Title level={2}>🧩 Reading Exam Creator</Title>

      <Tabs
        defaultActiveKey="1"
        items={[
          { key: "1", label: "Level 1", children: <LevelOneForm testId={testId} /> },
          { key: "2", label: "Level 2", children: <LevelTwoForm testId={testId} /> },
        ]}
      />
    </div>
  );
}
