'use client';
import React, { useState } from "react";
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
import MODULE_CONST from "../../../constants/MODULE_CONST"; // ✅ adjust path if needed

const { Option } = Select;

const Exam = () => {
  const router = useRouter();

  // ✅ Temporary test list
  const [tests, setTests] = useState([
    { key: "1", name: "English Test", price: 100, language: "English" },
    { key: "2", name: "German Test", price: 200, language: "German" },
  ]);

  // ✅ Modal states
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);

  const [form] = Form.useForm();

  // ✅ Track selected module
  const [selectedModule, setSelectedModule] = useState(null);

  // ✅ Table columns
  const columns = [
    {
      title: "Test Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Test Price",
      dataIndex: "price",
      key: "price",
      render: (p) => `₹${p}`,
    },
    {
      title: "Language",
      dataIndex: "language",
      key: "language",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleAddModule(record.key)}>
            Add Module
          </Button>
          <Button danger type="link" onClick={() => handleDelete(record.key)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // ✅ Add new test
  const handleAddTest = () => {
    form
      .validateFields()
      .then((values) => {
        const newTest = {
          key: Date.now().toString(),
          name: values.name,
          price: values.price,
          language: values.language,
        };
        setTests((prev) => [...prev, newTest]);
        message.success("New test added!");
        form.resetFields();
        setIsTestModalOpen(false);
      })
      .catch(() => {});
  };

  // ✅ Delete test
  const handleDelete = (key) => {
    setTests((prev) => prev.filter((t) => t.key !== key));
    message.success("Test deleted successfully!");
  };

  // ✅ Handle Add Module button click
  const handleAddModule = (key) => {
    const test = tests.find((t) => t.key === key);
    message.info(`Add module for: ${test.name}`);
    setIsModuleModalOpen(true);
  };

  // ✅ Handle Next → route to /module/[moduleName]
  const handleModuleNext = () => {
    if (!selectedModule) {
      message.warning("Please select a module type!");
      return;
    }
    setIsModuleModalOpen(false);
    router.push(`/admin/exam-test/module/${selectedModule.toLowerCase()}`);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Exam Test List</h1>
        <Button type="primary" onClick={() => setIsTestModalOpen(true)}>
          Add New Test
        </Button>
      </div>

      <Table dataSource={tests} columns={columns} rowKey="key" pagination={false} />

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
            label="Test Price"
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
