'use client';
import React, { useState } from "react";
import { Card, Input, Button, Typography, Divider, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../../utils/axios";

const { Title } = Typography;

export default function LevelFourForm({ testId }) {
  const [paragraphs, setParagraphs] = useState([
    {
      id: Date.now(),
      paragraph: "",
      blanks: [
        {
          id: Date.now() + 1,
          options: ["", "", ""], // first option = correct
        },
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);

  // 🧩 Detect blanks in paragraph and sync blank groups
  const handleParagraphChange = (id, value) => {
    setParagraphs((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        const blankCount = (value.match(/___/g) || []).length;
        const updatedBlanks = Array.from({ length: blankCount }, (_, i) => {
          return p.blanks[i] || { id: Date.now() + i, options: ["", "", ""] };
        });

        return { ...p, paragraph: value, blanks: updatedBlanks };
      })
    );
  };

  // ✏️ Update an option inside a blank
  const handleOptionChange = (pId, bId, optIndex, value) => {
    setParagraphs((prev) =>
      prev.map((p) =>
        p.id === pId
          ? {
              ...p,
              blanks: p.blanks.map((b) =>
                b.id === bId
                  ? {
                      ...b,
                      options: b.options.map((opt, i) =>
                        i === optIndex ? value : opt
                      ),
                    }
                  : b
              ),
            }
          : p
      )
    );
  };

  // ➕ Add a new option in a blank
  const addOption = (pId, bId) => {
    setParagraphs((prev) =>
      prev.map((p) =>
        p.id === pId
          ? {
              ...p,
              blanks: p.blanks.map((b) =>
                b.id === bId ? { ...b, options: [...b.options, ""] } : b
              ),
            }
          : p
      )
    );
  };

  // ➕ Add a new paragraph
  const addParagraph = () => {
    setParagraphs([
      ...paragraphs,
      { id: Date.now(), paragraph: "", blanks: [] },
    ]);
  };

  // ❌ Remove paragraph
  const removeParagraph = (id) => {
    setParagraphs(paragraphs.filter((p) => p.id !== id));
  };

  // 💾 Save data
  const handleSave = async () => {
    if (!testId) return message.error("❌ Test ID missing!");

    const payload = {
      testId,
      level: "4",
      module: "reading",
      content: {
        paragraphs: paragraphs.map((p) => ({
          paragraph: p.paragraph.trim(),
          blanks: p.blanks.map((b) => ({
            options: b.options.filter((opt) => opt.trim() !== ""),
            answer: b.options[0]?.trim() || "",
          })),
        })),
      },
    };

    if (
      payload.content.paragraphs.some(
        (p) => !p.paragraph || p.blanks.some((b) => b.options.length === 0)
      )
    ) {
      return message.warning("Please complete all paragraphs and blanks.");
    }

    try {
      setLoading(true);
      const res = await api.post("/course-test/details", payload);
      message.success(res.data?.message || "Level 4 saved successfully!");
    } catch (err) {
      console.error("Save Level 4 error:", err);
      message.error(err.response?.data?.message || "Failed to save Level 4 data!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-md border border-gray-200">
        <Title level={4}>🧩 Level 4: Fill in the Blanks (Multiple Blanks)</Title>
        <p className="text-gray-500 mb-4">
          Use <b>___</b> to mark blanks inside your paragraph. Each blank will automatically
          generate an option set below. The <b>first option</b> is considered the correct answer.
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
              <div className="space-y-4">
                {p.blanks.map((b, bi) => (
                  <div
                    key={b.id}
                    className="border p-3 rounded-md bg-gray-50"
                  >
                    <p className="font-medium mb-2">
                      Blank {bi + 1} Options (First = Correct Answer)
                    </p>

                    {b.options.map((opt, oi) => (
                      <Input
                        key={oi}
                        placeholder={`Option ${oi + 1}`}
                        className="mb-2"
                        value={opt}
                        onChange={(e) =>
                          handleOptionChange(p.id, b.id, oi, e.target.value)
                        }
                      />
                    ))}

                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => addOption(p.id, b.id)}
                      block
                    >
                      Add Option
                    </Button>
                  </div>
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
          Save Level 4
        </Button>
      </Card>
    </div>
  );
}
