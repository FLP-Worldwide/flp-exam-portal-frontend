'use client';
import React, { useState, useEffect, useRef } from "react";
import { Tabs, Typography, Spin } from "antd";
import { Toaster, toast } from "react-hot-toast";
import api from "../../utils/axios";

import LevelOneForm from "./ReadingSet/LevelOneForm";
import LevelTwoForm from "./ReadingSet/LevelTwoForm";
import LevelThreeForm from "./ReadingSet/LevelThreeForm";
import LevelFourForm from "./ReadingSet/LevelFourForm";
import LevelFiveForm from "./ReadingSet/LevelFiveForm";

const { Title } = Typography;

export default function ReadingSet({ testId }) {
  const [loading, setLoading] = useState(true);
  const [existingData, setExistingData] = useState(null);
  const fetched = useRef(false);

  // ✅ Fetch previously saved reading data
  useEffect(() => {
    const fetchData = async () => {
      if (fetched.current) return; // prevent double fetch in React StrictMode
      fetched.current = true;

      if (!testId) {
        toast.error("Missing Test ID!");
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/course-test/details/${testId}?module=reading`);
        if (res.data?.data) {
          const data = res.data.data;

          // ✅ Normalize data so it matches our form props
          setExistingData({
            level1: data.modules?.level_1 || null,
            level2: data.modules?.level_2 || null,
            level3: data.modules?.level_3 || null,
            level4: data.modules?.level_4 || null,
            level5: data.modules?.level_5 || null,
          });

          toast.success("Loaded existing reading data!");
        } else {
          toast("No previous data found. Create new levels.");
        }
      } catch (err) {
        console.error("Error loading reading data:", err);
        toast.error("Failed to load data!");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [testId]);

  // ✅ Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster position="top-right" />

      <Title level={2}>🧩 Reading Exam Creator</Title>

      <Tabs
        defaultActiveKey="1"
        items={[
          { key: "1", label: "Level 1", children: <LevelOneForm testId={testId} data={existingData?.level1} /> },
          { key: "2", label: "Level 2", children: <LevelTwoForm testId={testId} data={existingData?.level2} /> },
          { key: "3", label: "Level 3", children: <LevelThreeForm testId={testId} data={existingData?.level3} /> },
          { key: "4", label: "Level 4", children: <LevelFourForm testId={testId} data={existingData?.level4} /> },
          { key: "5", label: "Level 5", children: <LevelFiveForm testId={testId} data={existingData?.level5} /> },
        ]}
      />
    </div>
  );
}
