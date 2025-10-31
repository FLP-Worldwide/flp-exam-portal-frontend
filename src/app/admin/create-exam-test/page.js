'use client';
import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Space,
  Radio,
} from "antd";
import { useRouter } from "next/navigation";
import api from "../../../utils/axios";
import MODULE_CONST from "../../../constants/MODULE_CONST"; // ✅ adjust path if needed
import toast from "react-hot-toast";


const { Option } = Select;

const Exam = () => {
  const router = useRouter();

  const [tests, setTests] = useState([]);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [form] = Form.useForm();
  const [selectedTestId, setSelectedTestId] = useState(null);

  // ✅ Fetch tests from API
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await api.get(`course-test`);
        setTests(response.data.data || []);

        toast.success("Tests loaded successfully!");
      } catch (error) {
        console.error("Error fetching tests:", error);
        toast.error("Failed to fetch tests!");
      }
    };
    fetchTests();
  }, []);

  // ✅ Table columns
  const columns = [
    {
      title: "Test Name",
      dataIndex: "testName",
      key: "testName",
    },
    {
      title: "Language",
      dataIndex: "language",
      key: "language",
    },
    {
      title: "Duration (min)",
      dataIndex: "duration",
      key: "duration",
      render: (d) => `${Math.floor(d / 60)} mins`,
    },
    {
      title: "Price (₹)",
      dataIndex: "price",
      key: "price",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleAddModule(record._id)}>
            Add Module
          </Button>
          <Button danger type="link" onClick={() => handleDelete(record._id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // ✅ Add new test
  const handleAddTest = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        testName: values.name,
        language: values.language,
        price: values.price,
        duration: values.duration || 3600, // default 1 hour
      };

      const response = await api.post("course-test/create", payload);
      toast.success("New test created successfully!");
      setTests((prev) => [...prev, response.data.data]);
      setIsTestModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error("Error creating test:", error);
      toast.error("Failed to create test!");
    }
  };

  // ✅ Delete test
  const handleDelete = async (id) => {
    try {
      await api.delete(`course-test/${id}`);
      setTests((prev) => prev.filter((t) => t._id !== id));
      toast.success("Test deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete test!");
    }
  };

  // ✅ Handle Add Module button click
  const handleAddModule = (id) => {
    const test = tests.find((t) => t._id === id);
    toast(`Add module for: ${test.testName}`);
    setSelectedTestId(test._id);
    setIsModuleModalOpen(true);
  };

  // ✅ Handle Next → route to /module/[moduleName]
  const handleModuleNext = () => {
    if (!selectedModule) {
      toast.warning("Please select a module type!");
      return;
    }
    setIsModuleModalOpen(false);
    router.push(`/admin/create-exam-test/module/${selectedModule.toLowerCase()}?testId=${selectedTestId}`);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Exam Test List</h1>
        <Button type="primary" onClick={() => setIsTestModalOpen(true)}>
          Add New Test
        </Button>
      </div>

      <Table
        dataSource={tests}
        columns={columns}
        rowKey={(record) => record._id}
        pagination={false}
      />

      {/* ✅ Modal: Add Test */}
      <Modal
        title="Add New Test"
        open={isTestModalOpen}
        onOk={handleAddTest}
        onCancel={() => setIsTestModalOpen(false)}
        okText="Create Test"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Test Name"
            name="name"
            rules={[{ required: true, message: "Please enter test name" }]}
          >
            <Input placeholder="Enter test name" />
          </Form.Item>
          <Form.Item
            label="Test Duration (minutes)"
            name="duration"
            rules={[{ required: true, message: "Please enter test duration" }]}
          >
            <Input placeholder="Enter test duration" />
          </Form.Item>

          <Form.Item
            label="Test Price (₹)"
            name="price"
            rules={[{ required: true, message: "Please enter test price" }]}
          >
            <InputNumber placeholder="Enter test price" className="w-full" min={0} />
          </Form.Item>

          <Form.Item
            label="Language"
            name="language"
            rules={[{ required: true, message: "Please select language" }]}
          >
            <Select placeholder="Select language">
              <Option value="English">English</Option>
              <Option value="German">German</Option>
              <Option value="French">French</Option>
              <Option value="Spanish">Spanish</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* ✅ Modal: Select Module */}
      <Modal
        title="Select Module Type"
        open={isModuleModalOpen}
        onOk={handleModuleNext}
        onCancel={() => setIsModuleModalOpen(false)}
        okText="Next"
      >
        <Radio.Group
          onChange={(e) => setSelectedModule(e.target.value)}
          value={selectedModule}
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          {MODULE_CONST.map((mod) => (
            <Radio key={mod} value={mod}>
              {mod}
            </Radio>
          ))}
        </Radio.Group>  
      </Modal>
    </>
  );
};

export default Exam;
