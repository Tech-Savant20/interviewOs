import { API_URL } from "../config.js";
import { useState, useEffect } from "react";
import "./ProfileSetup.css";
import {
  studentFields,
  interviewerFields,
  roleConfig,
} from "./Profiledata.js";
import { useNavigate } from "react-router-dom";

export default function ProfileSetup() {

  const navigate = useNavigate();

  const [role, setRole] = useState(null);
  const [form, setForm] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [skip, setSkip] = useState(false);
  const [skillsRaw, setSkillsRaw] = useState("");

  /* ─────────────────────────────
     Select Fields According To Role
  ───────────────────────────── */
  const fields =
    role === "student"
      ? studentFields
      : interviewerFields;

  const activeRole = roleConfig.find(
    (r) => r.key === role
  );

  /* ─────────────────────────────
     Navigate On Skip
  ───────────────────────────── */
  useEffect(() => {

    if (skip) {
      navigate("/");
    }

  }, [skip, navigate]);

  /* ─────────────────────────────
     Role Select
  ───────────────────────────── */
  const handleRoleSelect = (selectedRole) => {

    setAnimating(true);
    setForm({});
    setSkillsRaw("");

    setTimeout(() => {

      setRole(selectedRole);
      setAnimating(false);

    }, 300);
  };

  /* ─────────────────────────────
     Handle Input Change
  ───────────────────────────── */
  const handleChange = (id, value) => {

    if (id === "skills") {

      // Store raw string while typing — do NOT split yet
      setSkillsRaw(value);
      setForm((prev) => ({
        ...prev,
        [id]: value,
      }));

    } else {

      setForm((prev) => ({
        ...prev,
        [id]: value,
      }));

    }
  };

  /* ─────────────────────────────
     Submit Form
  ───────────────────────────── */
  const handleSubmit = async () => {

    // Convert skills string → array only at submit time
    const processedForm = { ...form };

    if (typeof processedForm.skills === "string") {

      processedForm.skills = processedForm.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");
    }

    const allFilled = fields.every((field) => {

      if (field.id === "skills") {
        return processedForm[field.id]?.length > 0;
      }

      return processedForm[field.id]?.trim();
    });

    if (!allFilled) {
      return alert("Please fill in all fields.");
    }

    console.log("Submitted Form:", processedForm);

    try {

      let url = "";

      if (role === "student") {

        url =
          `${API_URL}/api/student-profile-setup`;

      } else {

        url =
          `${API_URL}/api/interviewer-profile-setup`;
      }

      const response = await fetch(url, {

        method: "POST",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(processedForm),
      });

      const res = await response.json();

      console.log("Backend Response:", res);

      if (res.success) {

        setSubmitted(true);

      } else {

        alert(res.message);
      }

    } catch (err) {

      console.log("Profile Setup Error:", err);

      alert("Something went wrong");
    }
  };

  /* ─────────────────────────────
     Reset
  ───────────────────────────── */
  const handleReset = () => {

    setRole(null);
    setForm({});
    setSkillsRaw("");
    setSubmitted(false);
  };

  /* ─────────────────────────────
     Success Screen
  ───────────────────────────── */
  if (submitted) {

    return (

      <div className="ps-success-page">

        <div className="ps-success-card">

          <div className="ps-success-icon">
            🎉
          </div>

          <h2 className="ps-success-title">
            Profile Submitted!
          </h2>

          <p className="ps-success-sub">
            Your <span>{role}</span> profile
            has been saved successfully.
          </p>

          <button
            className="ps-start-over-btn"
            onClick={handleReset}
          >
            ← Start Over
          </button>

        </div>

      </div>
    );
  }

  /* ─────────────────────────────
     Main UI
  ───────────────────────────── */
  return (

    <div className="ps-page">

      {/* Background */}
      <div className="ps-blob ps-blob--1" />
      <div className="ps-blob ps-blob--2" />

      <div className="ps-container">

        {/* Header */}
        <div className="ps-header">

          <span className="ps-badge">
            Profile Setup
          </span>

          <h1 className="ps-title">

            Who are{" "}

            <span className="ps-title-accent">
              you?
            </span>

          </h1>

          <p className="ps-subtitle">
            Choose your role to get started
          </p>

        </div>

        {/* Role Cards */}
        <div className="ps-role-row">

          {roleConfig.map(
            ({ key, emoji, label, desc }) => (

              <div
                key={key}
                className={`ps-role-card ${
                  role === key
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handleRoleSelect(key)
                }
              >

                <div className="ps-role-emoji">
                  <span>{emoji}</span>
                </div>

                <div className="ps-role-label">
                  {label}
                </div>

                <div className="ps-role-desc">
                  {desc}
                </div>

                {role === key && (
                  <div className="ps-selected-badge">
                    ✓ Selected
                  </div>
                )}

              </div>
            )
          )}

        </div>

        {/* Skip */}
        <div className="ps-skip-wrap">

          <span className="ps-skip-line" />

          <button
            className="ps-skip-btn"
            onClick={() => setSkip(true)}
          >
            Skip for now
          </button>

          <span className="ps-skip-line" />

        </div>

        {/* Form */}
        {role && (

          <div
            className={`ps-form-card ${
              animating
                ? "animating"
                : "visible"
            }`}
          >

            {/* Form Header */}
            <div className="ps-form-header">

              <span className="ps-form-title">
                {activeRole?.formTitle}
              </span>

              <span className="ps-form-sub">
                Fill in your information below
              </span>

            </div>

            {/* Input Grid */}
            <div className="ps-grid">

              {fields.map((field, i) => (

                <div
                  key={field.id}
                  className="ps-field-wrap field-in"
                  style={{
                    animationDelay: `${i * 40}ms`,
                  }}
                >

                  <label className="ps-label">

                    <span className="ps-label-icon">
                      {field.icon}
                    </span>

                    {field.label}

                  </label>

                  <input
                    type={field.type}
                    className="ps-input"
                    placeholder={
                      field.id === "skills"
                        ? "React, Python, Java"
                        : field.placeholder
                    }
                    value={
                      field.id === "skills"
                        ? skillsRaw
                        : form[field.id] || ""
                    }
                    onChange={(e) =>
                      handleChange(
                        field.id,
                        e.target.value
                      )
                    }
                  />

                </div>
              ))}

            </div>

            {/* Submit Button */}
            <button
              className="ps-submit-btn"
              onClick={handleSubmit}
            >
              {activeRole?.submitLabel}
            </button>

          </div>
        )}

      </div>

    </div>
  );
}
