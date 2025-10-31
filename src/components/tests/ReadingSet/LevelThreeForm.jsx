'use client';
import React, { useState } from "react";
import { Card, Input, Button, Typography, Divider, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../../utils/axios"; // ✅ your axios instance

const { Title } = Typography;

export default function LevelThreeForm({ testId }) {
  const [paragraphs, setParagraphs] = useState([
    { id: Date.now(), paragraph: "", answer: "" },
  ]);
  const [loading, setLoading] = useState(false);

  // ✅ Handle Paragraph and Answer changes
  const handleChange = (id, field, value) => {
    setParagraphs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // ✅ Add new paragraph + answer pair
  const addParagraph = () => {
    setParagraphs((prev) => [
      ...prev,
      { id: Date.now(), paragraph: "", answer: "" },
    ]);
  };

  // ✅ Remove paragraph pair
  const removeParagraph = (id) => {
    setParagraphs((prev) => prev.filter((p) => p.id !== id));
  };

  // ✅ Submit Level 3 data
  const handleSubmit = async () => {
    if (!testId) {
      return message.error("❌ Test ID missing!");
    }

    // Validate empty fields
    const invalid = paragraphs.some(
      (p) => !p.paragraph.trim() || !p.answer.trim()
    );
    if (invalid) {
      return message.warning("Please fill all paragraphs and answers.");
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
        console.log("Submitting Level 3 res:", res);
      message.success(res.data?.message || "Level 3 data saved successfully!");
    } catch (err) {
      console.error(err);
      message.error("Failed to save Level 3 data!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Title level={3}>📘 Level 3: Paragraph & Answer</Title>

      {paragraphs.map((p, index) => (
        <Card
          key={p.id}
          title={`Paragraph ${index + 1}`}
          className="border rounded-lg shadow-sm"
          extra={
            paragraphs.length > 1 && (
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => removeParagraph(p.id)}
              />
            )
          }
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Paragraph</label>
              <Input.TextArea
                rows={4}
                placeholder="Enter paragraph text..."
                value={p.paragraph}
                onChange={(e) =>
                  handleChange(p.id, "paragraph", e.target.value)
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Answer</label>
              <Input.TextArea
                rows={2}
                placeholder="Enter the answer..."
                value={p.answer}
                onChange={(e) => handleChange(p.id, "answer", e.target.value)}
              />
            </div>
          </div>
        </Card>
      ))}

      <Divider />

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addParagraph}
        block
      >
        Add New Paragraph
      </Button>

      <Button
        type="primary"
        loading={loading}
        onClick={handleSubmit}
        className="mt-6"
      >
        Save Level 3
      </Button>
    </div>
  );
}
