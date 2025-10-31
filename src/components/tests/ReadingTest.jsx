'use client'
import React, { useState } from "react";
import { Tabs, Card, Input, Button, Form, Space, Typography, Divider, message } from "antd";
import LevelOneForm from "./ReadingSet/LevelOneForm"; 
import LevelTwoForm from "./ReadingSet/LevelTwoForm";
import LevelThreeForm from "./ReadingSet/LevelThreeForm";
import LevelFourForm from "./ReadingSet/LevelFourForm";
import LevelFiveForm from "./ReadingSet/LevelFiveForm";

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
          { key: "3", label: "Level 3", children: <LevelThreeForm testId={testId} /> },
          { key: "4", label: "Level 4", children: <LevelFourForm testId={testId} /> },
          { key: "5", label: "Level 5", children: <LevelFiveForm testId={testId} /> },
        ]}
      />
    </div>
  );
}
