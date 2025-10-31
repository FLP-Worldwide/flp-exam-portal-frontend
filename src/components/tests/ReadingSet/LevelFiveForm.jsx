'use client';
import React, { useState } from "react";
import { Card, Input, Button, Typography, Divider, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../../utils/axios";

const { Title } = Typography;

export default function LevelFiveForm({ testId }) {
  const [paragraphs, setParagraphs] = useState([
    {
      id: Date.now(),
      paragraph: "",
      blanks: [""], // each blank = one answer
    },
  ]);
  const [loading, setLoading] = useState(false);

  // 🧩 Detect blanks from paragraph text (count ___)
  const handleParagraphChange = (id, value) => {
    setParagraphs((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        const blankCount = (value.match(/___/g) || []).length;
        const updatedBlanks = Array.from(
          { length: blankCount },
          (_, i) => p.blanks[i] || ""
        );

        return { ...p, paragraph: value, blanks: updatedBlanks };
      })
    );
  };

  // ✏️ Change blank answer value
  const handleBlankChange = (pId, index, value) => {
    setParagraphs((prev) =>
      prev.map((p) =>
        p.id === pId
          ? {
              ...p,
              blanks: p.blanks.map((b, i) => (i === index ? value : b)),
            }
          : p
      )
    );
  };

  // ➕ Add paragraph
  const addParagraph = () => {
    setParagraphs((prev) => [
      ...prev,
      { id: Date.now(), paragraph: "", blanks: [] },
    ]);
  };

  // ❌ Remove paragraph
  const removeParagraph = (id) => {
    setParagraphs((prev) => prev.filter((p) => p.id !== id));
  };

  // 💾 Save data
  const handleSave = async () => {
    if (!testId) return message.error("❌ Test ID missing!");

    const payload = {
      testId,
      level: "5",
      module: "reading",
      content: {
        paragraphs: paragraphs.map((p) => ({
          paragraph: p.paragraph.trim(),
          blanks: p.blanks.map((ans) => ans.trim()),
        })),
      },
    };

    if (
      payload.content.paragraphs.some(
        (p) =>
          !p.paragraph ||
          (p.paragraph.includes("___") && p.blanks.some((b) => !b.trim()))
      )
    ) {
      return message.warning("Please fill all blanks for each paragraph!");
    }

    try {
      setLoading(true);
      const res = await api.post("/course-test/details", payload);
      message.success(res.data?.message || "Level 5 saved successfully!");
    } catch (err) {
      console.error("Save Level 5 error:", err);
      message.error(err.response?.data?.message || "Failed to save Level 5 data!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-md border border-gray-200">
        <Title level={4}>🧠 Level 5: Fill in the Blanks (Direct Answers)</Title>
        <p className="text-gray-500 mb-4">
          Use <b>___</b> to mark blanks inside your paragraph. Each blank will
          automatically create a single answer field below in sequence.
        </p>

        {paragraphs.map((p, pi) => (
          <div key={p.id} className="border p-4 mb-6 rounded-md bg-white">
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold">Paragraph {pi + 1}</label>
              {paragraphs.length > 1 && (
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeParagraph(p.id)}
                />
              )}
            </div>

            <Input.TextArea
              rows={4}
              placeholder="Write paragraph with blanks (e.g., The sky is ___ and the grass is ___.)"
              value={p.paragraph}
              onChange={(e) => handleParagraphChange(p.id, e.target.value)}
              className="mb-4"
            />

            {p.blanks.length > 0 && (
              <div className="space-y-3">
                {p.blanks.map((b, bi) => (
                  <Input
                    key={bi}
                    placeholder={`Answer for Blank ${bi + 1}`}
                    value={b}
                    onChange={(e) =>
                      handleBlankChange(p.id, bi, e.target.value)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        <Divider />

        <Divider />

        <Button
          type="primary"
          loading={loading}
          onClick={handleSave}
          className="w-full"
        >
          Save Level 5
        </Button>
      </Card>
    </div>
  );
}
