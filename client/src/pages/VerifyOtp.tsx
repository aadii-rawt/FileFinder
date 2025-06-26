import { useState, useRef, useEffect } from "react";
import axios from "../utils/axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthContext from "../context/userContext";
import Loader from "../components/Loader";

const VerifyOtp = () => {
  const location = useLocation();
  const { email, username, password } = location.state || {};
  const { setUser } = useAuthContext();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const [isSubmiting, setIsSubmiting] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (element, index) => {
    const newOtp = [...otp];
    newOtp[index] = element.value.replace(/[^0-9]/g, "");
    setOtp(newOtp);

    // Auto focus next input
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // If current input is empty and backspace is pressed, move to previous input
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    const numbers = pastedData
      .replace(/[^0-9]/g, "")
      .split("")
      .slice(0, 6);

    if (numbers.length > 0) {
      const newOtp = [...otp];
      numbers.forEach((num, index) => {
        if (index < 6) {
          newOtp[index] = num;
        }
      });
      setOtp(newOtp);

      // Focus the next empty input or the last input
      const nextEmptyIndex = numbers.length < 6 ? numbers.length : 5;
      if (inputRefs.current[nextEmptyIndex]) {
        inputRefs.current[nextEmptyIndex].focus();
      }
    }
  };

  const verifyOtp = async () => {
    const otpCode = otp.join("");
    setError("");
    setIsSubmiting(true);
    try {
      await axios.post(`/api/auth/verify/otp`, {
        email,
        otp: otpCode,
      });

      const res = await registerUser();
      if (res.success) {
        navigate("/onboarding");
        return;
      }
    } catch (err) {
      console.error(
        "OTP verification error:",
        err.response?.data || err.message
      );
      setError(err.response?.data?.error || "Invalid OTP");
      setIsSubmiting(false);
      return {
        success: false,
        error: err.response?.data?.error || "Invalid OTP",
      };
    }
    {
      setIsSubmiting(false);
    }
  };

  const registerUser = async () => {
    try {
      if (!email || !username || !password) {
        setError("Something went wrong");
        setIsSubmiting(false);
        return;
      }

      const res = await axios.post(`/api/auth/register`, {
        name: username,
        email,
        password,
      });

      const userData = res.data.user;
      setUser(userData);

      return { success: true };
    } catch (err) {
      setError(
        err.response?.data?.message || "Signup failed. Please try again."
      );
    } finally {
      setIsSubmiting(false);
    }
  };

  useEffect(() => {
    if (!email) {
      navigate("/signup");
      return;
    }
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      <div className="w-full max-w-md sm:max-w-lg px-4">
        <h2 className="text-3xl font-medium mb-4 text-center text-black font-liter">
          Please check your email
        </h2>
        <p className="text-center text-gray-700 mb-6">
          we've send a code to <span className="text-primary">{email}</span>
        </p>

        <div className="flex justify-between mt-20" onPaste={handlePaste}>
          {otp.map((data, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength="1"
              value={otp[index]}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-12 text-xl bg-transparent text-center rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
        </div>
        <p className="text-red-500 mb-10 mt-2">{error}</p>

        <button
          onClick={verifyOtp}
          className="w-full bg-primary text-white font-medium p-2 sm:p-3 rounded-xl my-4 sm:my-5 text-sm sm:text-base"
        >
          {isSubmiting ? <Loader /> : "Verify OTP "}
        </button>

        <div className="flex justify-end">
          <Link to="/login" className="text-primary hover:text-primary/80">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
