'use client';
import React, { useState, useEffect } from "react";
import { Card, Input, Button, Form, Space, Typography, Divider } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../../utils/axios";
import toast from "react-hot-toast";

const { Title } = Typography;

export default function LevelOneForm({ testId, data }) {
  const [paragraphs, setParagraphs] = useState([{ id: Date.now(), text: "", answer: "" }]);
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

      setParagraphs(prefilledParagraphs.length ? prefilledParagraphs : [{ id: Date.now(), text: "", answer: "" }]);
      setOptions(prefilledOptions);
    }
  }, [data]);

  const addParagraph = () => setParagraphs([...paragraphs, { id: Date.now(), text: "", answer: "" }]);
  const updateParagraph = (id, value) =>
    setParagraphs(paragraphs.map((p) => (p.id === id ? { ...p, text: value } : p)));
  const updateAnswer = (id, value) =>
    setParagraphs(paragraphs.map((p) => (p.id === id ? { ...p, answer: value } : p)));
  const addOption = () => setOptions([...options, ""]);
  const updateOption = (index, value) =>
    setOptions(options.map((opt, i) => (i === index ? value : opt)));

  const handleSave = async () => {
    const payload = {
      testId,
      level: "1",
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
      toast.success(res.data?.message || "Level 1 saved successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save Level 1!");
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
                {paragraphs.length > 1 && (
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => setParagraphs(paragraphs.filter((item) => item.id !== p.id))}
                  />
                )}
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

          <Button type="dashed" icon={<PlusOutlined />} onClick={addParagraph} className="w-full">
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
