import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import api from "../config/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  function validateForm() {
    const newErrors = {
      name: "",
      email: "",
      password: "",
    };

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    return !newErrors.name && !newErrors.email && !newErrors.password;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigate("/login", {
        replace: true,
        state: { message: "Registration successful. Please login." },
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage(
          error.response?.data?.message ||
            "Registration failed. Please try again."
        );
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#171717] px-4 py-12 text-[#FAFAF9]">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-[#383838] bg-[#222222] p-6 shadow-xl sm:p-8">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            Create Account
          </h1>

          <p className="mt-2 text-sm text-[#A8A29E]">
            Register to start analyzing your resumes
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* Name */}
          <div className="mb-5">
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-[#E7E5E4]"
            >
              Full Name
            </label>

            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              autoComplete="name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: "" }));
                setMessage("");
              }}
              className={`w-full rounded-lg border bg-[#171717] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#78716C] focus:border-amber-500 ${
                errors.name ? "border-red-500" : "border-[#454545]"
              }`}
            />

            {errors.name && (
              <p id="name-error" className="mt-2 text-xs text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="mb-5">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-[#E7E5E4]"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: "" }));
                setMessage("");
              }}
              className={`w-full rounded-lg border bg-[#171717] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#78716C] focus:border-amber-500 ${
                errors.email ? "border-red-500" : "border-[#454545]"
              }`}
            />

            {errors.email && (
              <p id="email-error" className="mt-2 text-xs text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-5">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-[#E7E5E4]"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "password-error" : undefined
              }
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: "" }));
                setMessage("");
              }}
              className={`w-full rounded-lg border bg-[#171717] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#78716C] focus:border-amber-500 ${
                errors.password ? "border-red-500" : "border-[#454545]"
              }`}
            />

            {errors.password && (
              <p id="password-error" className="mt-2 text-xs text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          {/* Server error */}
          {message && (
            <p
              role="alert"
              className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
            >
              {message}
            </p>
          )}

          {/* Register button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#D97706] px-4 py-3 font-semibold text-white transition hover:bg-[#F59E0B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-[#A8A29E]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-amber-400 transition hover:text-amber-300"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
