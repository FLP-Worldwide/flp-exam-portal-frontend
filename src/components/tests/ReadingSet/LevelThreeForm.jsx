'use client';
import React, { useEffect, useState } from "react";
import { Card, Input, Button, Typography, Divider, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../../utils/axios";

const { Title } = Typography;

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
      // Default empty structure
      setParagraphs([{ id: Date.now(), paragraph: "", answer: "" }]);
    }
  }, [data]);

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
    if (paragraphs.length === 1) {
      toast("At least one paragraph is required!");
      return;
    }
    setParagraphs((prev) => prev.filter((p) => p.id !== id));
  };

  // ✅ Submit Level 3 data
  const handleSubmit = async () => {
    if (!testId) {
      return toast.error("❌ Test ID missing!");
    }

    const invalid = paragraphs.some(
      (p) => !p.paragraph.trim() || !p.answer.trim()
    );
    if (invalid) {
      return toast("Please fill all paragraphs and answers.");
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
      toast.success(res.data?.message || "Level 3 data saved successfully!");
    } catch (err) {
      console.error("Error saving Level 3:", err);
      toast.error("Failed to save Level 3 data!");
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
        block
      >
        Save Level 3
      </Button>
    </div>
  );
}
