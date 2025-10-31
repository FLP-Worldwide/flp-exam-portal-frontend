'use client';
import React, { useEffect, useState } from "react";
import { Card, Input, Button, Form, Typography, Divider, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../../utils/axios"; // ✅ your axios instance

const { Title } = Typography;

export default function LevelTwoForm({ testId, data }) {
  const [paragraphs, setParagraphs] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Prefill from existing data if available
  useEffect(() => {
    if (data?.content?.paragraphs?.length > 0) {
      const formatted = data.content.paragraphs.map((p, pi) => ({
        id: Date.now() + pi,
        text: p.paragraph || "",
        questions: p.questions?.map((q, qi) => ({
          id: Date.now() + pi + qi,
          question: q.question || "",
          options: q.options?.length ? q.options : ["", "", ""],
          answer: q.answer || "",
        })) || [
          {
            id: Date.now() + pi + 1,
            question: "",
            options: ["", "", ""],
            answer: "",
          },
        ],
      }));

      setParagraphs(formatted);
    } else {
      // Initialize with empty one
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
    setParagraphs([
      ...paragraphs,
      {
        id: Date.now(),
        text: "",
        questions: [
          { id: Date.now() + 1, question: "", options: ["", "", ""], answer: "" },
        ],
      },
    ]);
  };

  // ➕ Add Question
  const addQuestion = (pId) => {
    setParagraphs(
      paragraphs.map((p) =>
        p.id === pId
          ? {
              ...p,
              questions: [
                ...p.questions,
                { id: Date.now(), question: "", options: ["", "", ""], answer: "" },
              ],
            }
          : p
      )
    );
  };

  // ✏️ Update Paragraph
  const updateParagraph = (pId, text) => {
    setParagraphs(paragraphs.map((p) => (p.id === pId ? { ...p, text } : p)));
  };

  // ✏️ Update Question or Option
  const updateQuestion = (pId, qId, field, value, optIndex = null) => {
    setParagraphs(
      paragraphs.map((p) =>
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
    setParagraphs(paragraphs.filter((item) => item.id !== pId));
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
            options: q.options.filter((opt) => opt.trim() !== ""),
            answer: q.answer.trim(),
          })),
        })),
      },
    };

    if (!payload.content.paragraphs[0]?.paragraph) {
      toast("Please enter at least one paragraph!");
      return;
    }

    const hasQuestions = payload.content.paragraphs.some(
      (p) => p.questions.length > 0 && p.questions[0].question
    );

    if (!hasQuestions) {
      toast("Please add at least one question!");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/course-test/details", payload);
      toast.success(res.data?.message || "Level 2 saved successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save Level 2!");
    } finally {
      setLoading(false);
    }
  };

  // 🧱 UI
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-md border border-gray-200">
        <Form layout="vertical">
          <Title level={4}>Paragraphs with Questions</Title>

          {paragraphs.map((p, pi) => (
            <div key={p.id} className="border p-4 mb-6 rounded-md bg-white">
              <div className="flex justify-between items-center">
                <label className="font-semibold">Paragraph {pi + 1}</label>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => deleteParagraph(p.id)}
                />
              </div>

              <Input.TextArea
                rows={4}
                placeholder="Enter paragraph text..."
                className="mt-2 mb-4"
                value={p.text}
                onChange={(e) => updateParagraph(p.id, e.target.value)}
              />

              {p.questions.map((q, qi) => (
                <div key={q.id} className="border p-3 mb-3 rounded-md bg-gray-50">
                  <Input
                    placeholder={`Question ${qi + 1}`}
                    className="mb-2"
                    value={q.question}
                    onChange={(e) =>
                      updateQuestion(p.id, q.id, "question", e.target.value)
                    }
                  />

                  {q.options.map((opt, oi) => (
                    <Input
                      key={oi}
                      className="mb-2"
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                      value={opt}
                      onChange={(e) =>
                        updateQuestion(p.id, q.id, "options", e.target.value, oi)
                      }
                    />
                  ))}

                  <Input
                    placeholder="Correct Answer"
                    value={q.answer}
                    onChange={(e) =>
                      updateQuestion(p.id, q.id, "answer", e.target.value)
                    }
                  />
                </div>
              ))}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => addQuestion(p.id)}
                className="w-full"
              >
                Add Question
              </Button>
            </div>
          ))}

          <Divider />

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addParagraph}
            className="w-full"
          >
            Add New Paragraph
          </Button>

          <Divider />

          <Button
            type="primary"
            loading={loading}
            onClick={handleSave}
            className="w-full"
          >
            Save Level 2
          </Button>
        </Form>
      </Card>
    </div>
  );
}
