"use client";
import React, { useState, useEffect, useRef } from "react";
import { Tabs, Typography, Spin, Card, Space, Tag } from "antd";
import { ReadOutlined } from "@ant-design/icons";
import { Toaster, toast } from "react-hot-toast";
import api from "../../utils/axios";

import LevelOneForm from "./ReadingSet/LevelOneForm";
import LevelTwoForm from "./ReadingSet/LevelTwoForm";
import LevelThreeForm from "./ReadingSet/LevelThreeForm";
import LevelFourForm from "./ReadingSet/LevelFourForm";
import LevelFiveForm from "./ReadingSet/LevelFiveForm";

const { Title, Text } = Typography;

export default function ReadingSet({ testId }) {
  const [loading, setLoading] = useState(true);
  const [existingData, setExistingData] = useState(null);
  const fetched = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      if (fetched.current) return;
      if (existingData) return;

      fetched.current = true;

      if (!testId) {
        toast.error("Missing Test ID!");
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(
          `/course-test/details/${testId}?module=reading`
        );
        if (res.data?.data) {
          const data = res.data.data;

          setExistingData({
            level1: data.modules?.level_1 || null,
            level2: data.modules?.level_2 || null,
            level3: data.modules?.level_3 || null,
            level4: data.modules?.level_4 || null,
            level5: data.modules?.level_5 || null,
          });

        } else {
          toast("No previous data found. Create new levels.", {
            duration: 2500,
          });
        }
      } catch (err) {
        console.error("Error loading reading data:", err);
        toast.error("Failed to load data!", { duration: 3000 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [testId, existingData]);

  if (loading && !existingData) {
    return (
      <div
        style={{
          padding: 24,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 12 }}>
      <Toaster position="top-right" />

      <div style={{ width: "100%" }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* HEADER CARD */}
          <Card
            bordered={false}
            bodyStyle={{ padding: "16px" }}
            style={{
              width: "100%",
              borderRadius: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <div style={{ flex: 1 }}>
                <Title
                  level={3}
                  style={{ margin: 0, display: "flex", alignItems: "center" }}
                >
                  <ReadOutlined style={{ marginRight: 8 }} />
                  Reading Exam Creator
                </Title>
                <Text
                  type="secondary"
                  style={{ display: "block", marginTop: 4 }}
                >
                  Configure all reading levels (1–5) for this test in one place.
                </Text>
              </div>

              {testId && (
                <Tag color="blue" style={{ borderRadius: 999, fontSize: 12 }}>
                  Test ID: {testId}
                </Tag>
              )}
            </div>
          </Card>

          {/* TABS CARD */}
          <Card
            bordered={false}
            style={{
              width: "100%",
              borderRadius: 16,
            }}
            bodyStyle={{ padding: "2px 16px" }}
          >
            <Tabs
              defaultActiveKey="1"
              destroyInactiveTabPane
              tabBarGutter={24}
              size="large"
              items={[
                {
                  key: "1",
                  label: (
                    <span>
                      <ReadOutlined /> Level 1
                    </span>
                  ),
                  children: (
                    <div style={{ padding: 2 }}>
                      <LevelOneForm
                        testId={testId}
                        data={existingData?.level1}
                      />
                    </div>
                  ),
                },
                {
                  key: "2",
                  label: (
                    <span>
                      <ReadOutlined /> Level 2
                    </span>
                  ),
                  children: (
                    <div style={{ padding: 16 }}>
                      <LevelTwoForm
                        testId={testId}
                        data={existingData?.level2}
                      />
                    </div>
                  ),
                },
                {
                  key: "3",
                  label: (
                    <span>
                      <ReadOutlined /> Level 3
                    </span>
                  ),
                  children: (
                    <div style={{ padding: 16 }}>
                      <LevelThreeForm
                        testId={testId}
                        data={existingData?.level3}
                      />
                    </div>
                  ),
                },
                {
                  key: "4",
                  label: (
                    <span>
                      <ReadOutlined /> Level 4
                    </span>
                  ),
                  children: (
                    <div style={{ padding: 16 }}>
                      <LevelFourForm
                        testId={testId}
                        data={existingData?.level4}
                      />
                    </div>
                  ),
                },
                {
                  key: "5",
                  label: (
                    <span>
                      <ReadOutlined /> Level 5
                    </span>
                  ),
                  children: (
                    <div style={{ padding: 16 }}>
                      <LevelFiveForm
                        testId={testId}
                        data={existingData?.level5}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Space>
      </div>
    </div>
  );
}
