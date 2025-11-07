'use client';
import React, { useEffect, useState } from "react";
import api from "../../../utils/axios";
import toast from "react-hot-toast";

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [tests, setTests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "" });

  // ✅ Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const type = "student";
        const response = await api.get(`user/list/${type}`);
        // Fix nested data structure
        const data = response?.data?.data?.data || [];
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, []);

  // ✅ Open modal to create new student
  const handleCreateStudent = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: "", email: "" });
  };

  // ✅ Handle form input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Create student API
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const response = await api.post("/user/create", {
        name: formData.name,
        email: formData.email,
        role: "student",
      });
      setStudents([...students, response.data]);
      handleCloseModal();
      toast.success("Student created successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create student");
    }
  };

  // ✅ Open Assign Test modal
  const handleAssignTest = async (student) => {
    try {
      setSelectedStudent(student);
      setShowAssignModal(true);
      setSelectedTestId(null);

      const res = await api.get("course-test");
      setTests(res.data.data || []);
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast.error("Failed to load tests");
    }
  };

  // ✅ Assign test API call
  const handleAssignSubmit = async () => {
    if (!selectedTestId) {
      toast.error("Please select a test!");
      return;
    }

    try {
      const res = await api.post("/user/assign-test", {
        userId: selectedStudent._id,
        testId: selectedTestId,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Test assigned successfully!");
        setShowAssignModal(false);
        setSelectedTestId(null);
      } else {
        toast(res.data?.message || "Unable to assign test. Please try again.");
      }
    } catch (error) {
      console.error("Error assigning test:", error);
      const message =
        error.response?.data?.message ||
        "Failed to assign test! Please try again later.";
      toast.error(message);
    }
  };

  // ✅ View student details modal
  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Student List</h2>
        <button
          onClick={handleCreateStudent}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Create New Student
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-3 text-left">Student ID</th>
              <th className="py-2 px-3 text-left">Name</th>
              <th className="py-2 px-3 text-left">Email</th>
              <th className="py-2 px-3 text-left">Assigned Tests</th>
              <th className="py-2 px-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(students) && students.length > 0 ? (
              students.map((student, index) => (
                <tr key={student._id || index} className="border-t">
                  <td className="py-2 px-3">
                    {student?.studentDetails?.enrollmentNo || "—"}
                  </td>
                  <td className="py-2 px-3">{student.name}</td>
                  <td className="py-2 px-3">{student.email}</td>
                  <td className="py-2 px-3">
                    {student.assignments?.length || 0}
                  </td>
                  <td className="py-2 px-3 space-x-3">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => handleViewDetails(student)}
                    >
                      View
                    </button>
                    <button
                      className="text-green-600 hover:underline"
                      onClick={() => handleAssignTest(student)}
                    >
                      Assign Test
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Create Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-800/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg p-6 relative">
            <h3 className="text-lg font-semibold mb-4">Create New Student</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200"
                  placeholder="Enter student name"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200"
                  placeholder="Enter email"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Assign Test Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-800/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-lg p-6 relative">
            <h3 className="text-lg font-semibold mb-4">
              Assign Test to {selectedStudent?.name}
            </h3>
            {tests.length === 0 ? (
              <p className="text-gray-500">No tests available.</p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {tests.map((test) => (
                  <label
                    key={test._id}
                    className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="selectedTest"
                      value={test._id}
                      checked={selectedTestId === test._id}
                      onChange={() => setSelectedTestId(test._id)}
                    />
                    <div>
                      <p className="font-medium">{test.testName}</p>
                      <p className="text-sm text-gray-500">
                        {test.language} • {Math.floor(test.duration / 60)} mins
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ View Student Details Modal */}
      {showViewModal && selectedStudent && (
        <div className="fixed inset-0 bg-gray-800/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-lg p-6 relative">
            <h3 className="text-lg font-semibold mb-4">
              Assigned Tests – {selectedStudent.name}
            </h3>
            {selectedStudent.assignments?.length > 0 ? (
              <table className="min-w-full border rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-3 text-left">Test Name</th>
                    <th className="py-2 px-3 text-left">Status</th>
                    <th className="py-2 px-3 text-left">Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudent.assignments.map((test, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-2 px-3">{test.testName || "—"}</td>
                      <td
                        className={`py-2 px-3 font-medium ${
                          test.status === "active"
                            ? "text-green-600"
                            : test.status === "expired"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {test.status || "N/A"}
                      </td>
                      <td className="py-2 px-3">
                        {test.expiryDate
                          ? new Date(test.expiryDate).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No tests assigned yet.</p>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
