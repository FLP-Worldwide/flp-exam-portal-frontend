'use client'
import React, { useState } from "react";
import { Card, Input, Button, Form, Space, Typography, Divider } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function ReadingSetSingle() {
  const [paragraph, setParagraph] = useState("");
  const [questions, setQuestions] = useState([
    { id: Date.now(), number: "1.1", text: "" },
  ]);
  const [options, setOptions] = useState(["", "", "", ""]);

  // Add new question
  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: Date.now(), number: `1.${questions.length + 1}`, text: "" },
    ]);
  };

  // Update question text
  const updateQuestion = (id, value) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, text: value } : q))
    );
  };

  // Update option text
  const updateOption = (index, value) => {
    setOptions(options.map((opt, i) => (i === index ? value : opt)));
  };

  // Save handler
  const handleSave = () => {
    const data = {
      paragraph,
      questions,
      options,
    };
    console.log("Saved Data:", data);
    alert("Saved successfully! Check console for full data.");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Title level={2}>🧩 Reading Exam Creator (Single Set)</Title>

        <Card className="shadow-md border border-gray-200">
          <Form layout="vertical">
            {/* Paragraph */}
            <Form.Item label="Paragraph (Main Text)">
              <Input.TextArea
                rows={5}
                placeholder="Enter your main paragraph here..."
                value={paragraph}
                onChange={(e) => setParagraph(e.target.value)}
              />
            </Form.Item>

            <Divider />

            {/* Questions */}
            <Title level={4}>Questions</Title>
            {questions.map((q, index) => (
              <div key={q.id} className="border p-4 mb-3 rounded-md bg-white">
                <div className="flex justify-between items-center">
                  <label className="font-semibold">
                    Question {q.number}
                  </label>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() =>
                      setQuestions(questions.filter((item) => item.id !== q.id))
                    }
                  />
                </div>
                <Input
                  className="mt-2"
                  placeholder="Enter question text..."
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, e.target.value)}
                />
              </div>
            ))}

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addQuestion}
              className="w-full"
            >
              Add Another Question
            </Button>

            <Divider />

            {/* Shared Options */}
            <Title level={4}>All Options (Shared)</Title>
            {options.map((opt, i) => (
              <Input
                key={i}
                className="mb-2"
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
              />
            ))}

            <Divider />

            {/* Save Button */}
            <div className="flex justify-end">
              <Space>
                <Button type="primary" onClick={handleSave}>
                  Save Set
                </Button>
              </Space>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}
