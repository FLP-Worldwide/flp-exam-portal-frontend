'use client';
import React from "react";
import { Tabs, Typography } from "antd";
import LevelOneForm from "./LevelOneForm";
import LevelTwoForm from "./LevelTwoForm";

const { Title } = Typography;

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
