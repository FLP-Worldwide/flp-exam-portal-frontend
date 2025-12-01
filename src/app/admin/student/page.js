"use client";
import React, { useEffect, useState } from "react";
import api from "../../../utils/axios";
import toast from "react-hot-toast";
import LoaderComp from "../../../components/shared/LoaderComp";

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [tests, setTests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const type = "student";
      const response = await api.get(`user/list/${type}`);
      const data = response?.data?.data?.data || [];
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      toast.error("Please fill all fields");
      return;
    }

    try {
      await api.post("/user/create", {
        name: formData.name,
        email: formData.email,
        role: "student",
      });

      toast.success("Student created successfully!");
      handleCloseModal();
      await fetchStudents();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create student");
    }
  };

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
        await fetchStudents();
      } else {
        toast(res.data?.message || "Unable to assign test. Please try again.");
      }
    } catch (error) {
      console.error("Error assigning test:", error);
      const message =
        error?.response?.data?.message ||
        "Failed to assign test! Please try again later.";
      toast.error(message);
    }
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Students
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage student profiles and assign German tests.
            </p>
          </div>
          <button
            onClick={handleCreateStudent}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Create New Student
          </button>
        </div>

        {/* Table card */}
        <div className="rounded-2xl bg-white shadow-xs border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              Student List
            </h3>
            <span className="text-xs text-slate-500">
              {Array.isArray(students) ? students.length : 0} total
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <LoaderComp />
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Enrollment No.
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Assigned Tests
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(students) && students.length > 0 ? (
                    students.map((student, index) => (
                      <tr
                        key={student._id || index}
                        className="border-b last:border-b-0 border-slate-100 hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {student?.studentDetails?.enrollmentNo || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {student.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {student.email}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {student.assignments?.length || 0}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50"
                            onClick={() => handleViewDetails(student)}
                          >
                            View
                          </button>
                          <button
                            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleAssignTest(student)}
                          >
                            Assign Test
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-sm text-slate-500"
                      >
                        No students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-100 p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Create New Student
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/80 focus:border-blue-600"
                  placeholder="Enter student name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/80 focus:border-blue-600"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Test Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-100 p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Assign Test to {selectedStudent?.name}
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {tests.length === 0 ? (
              <p className="text-sm text-slate-500">
                No tests available to assign.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {tests.map((test) => (
                  <label
                    key={test._id}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="selectedTest"
                      value={test._id}
                      checked={selectedTestId === test._id}
                      onChange={() => setSelectedTestId(test._id)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div>
                      <p className="font-medium text-slate-900">
                        {test.testName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {test.language} • {Math.floor(test.duration / 60)} mins
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowAssignModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Student Details Modal */}
      {showViewModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-slate-100 p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Assigned Tests – {selectedStudent.name}
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {selectedStudent.assignments?.length > 0 ? (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Test Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Expiry Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudent.assignments.map((test, index) => (
                      <tr
                        key={index}
                        className="border-b last:border-b-0 border-slate-100"
                      >
                        <td className="px-4 py-3 text-sm text-slate-800">
                          {test.testName || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] ${
                              test.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : test.status === "expired"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-slate-50 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {test.status || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {test.expiryDate
                            ? new Date(test.expiryDate).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No tests assigned yet.
              </p>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowViewModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
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
