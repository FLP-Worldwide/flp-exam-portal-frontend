'use client';
import React, { useEffect, useState } from "react";
import api from "../../../utils/axios";

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });

  // Fetch students from API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const type = 'student';
        const response = await api.get(`user/list/${type}`);
        setStudents(response.data.data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, []);

  const handleCreateStudent = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: "", email: "" });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Please fill all fields");
      return;
    }

    try {
      const response = await api.post("user/create", {
        name: formData.name,
        email: formData.email,
        role: "student",
      });
      setStudents([...students, response.data]);
      handleCloseModal();
    } catch (error) {
      console.error(error);
      alert("Failed to create student");
    }
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
              <th className="py-2 px-3 text-left">Status</th>
              <th className="py-2 px-3 text-left">Test Purchased</th>
              <th className="py-2 px-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student._id || index} className="border-t">
                <td className="py-2 px-3">{student?.studentDetails?.enrollmentNo}</td>
                <td className="py-2 px-3">{student.name}</td>
                <td className="py-2 px-3">{student.email}</td>
                <td className="py-2 px-3">{student.status || "Active"}</td>
                <td className="py-2 px-3">{student.testPurchased || "—"}</td>
                <td className="py-2 px-3">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => alert(`Viewing details for ${student.name}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-800/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg p-6 relative">
            <h3 className="text-lg font-semibold mb-4">Create New Student</h3>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Full Name</label>
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
    </div>
  );
};

export default StudentList;
