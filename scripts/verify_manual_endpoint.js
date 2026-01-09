import mongoose from "mongoose";
import dotenv from "dotenv";
import { calculateMonthlyPayouts } from "../controllers/payout.controller.js";
import Educator from "../models/educator.js";
import Course from "../models/course.js";
import PaymentIntent from "../models/paymentIntent.js";
import Payout from "../models/payout.js";

dotenv.config();

// Mock Express Request and Response
const mockRequest = (body) => ({
  body,
});

const mockResponse = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

const verifyManualEndpoint = async () => {
  try {
    console.log("Starting Manual Payout Endpoint Verification...");

    // 1. Connect to MongoDB
    const mongoUri = process.env.MONGODB_URL || process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error("MONGODB_URL or MONGODB_URI is missing in .env");
    }
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // 2. Setup Test Data (Similar to previous script)
    const mockEducator = await Educator.create({
        firstName: "Manual",
        lastName: "Test",
        email: `manual_test_${Date.now()}@example.com`,
        username: `manual_test_${Date.now()}`,
        password: "password123",
        specialization: ["IIT-JEE"],
        class: ["class-10th"],
        subject: ["mathematics"],
        mobileNumber: `99${Date.now().toString().slice(-8)}`,
    });

    const mockCourse = await Course.create({
        title: "Manual Payout Test Course",
        slug: `manual-payout-test-${Date.now()}`,
        description: "Testing manual payout endpoint",
        educatorID: mockEducator._id,
        fees: 2000,
        courseType: "one-to-all",
        specialization: ["IIT-JEE"],
        class: ["class-10th"],
        subject: ["mathematics"],
        courseDuration: "1 Month",
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        validDate: new Date(Date.now() + 86400000 * 30),
    });

    // Create a payment for "last month" effectively, or current month to test
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const payment = await PaymentIntent.create({
        studentId: new mongoose.Types.ObjectId(),
        productId: mockCourse._id,
        productType: "course",
        amount: 200000, // ₹2000
        currency: "INR",
        status: "succeeded",
        razorpayOrderId: `order_man_${Date.now()}`,
        razorpayPaymentId: `pay_man_${Date.now()}`,
        createdAt: new Date(),
    });

    // 3. Call the Controller
    console.log(`Calling calculateMonthlyPayouts for ${currentMonth}/${currentYear}...`);
    const req = mockRequest({ month: currentMonth, year: currentYear });
    const res = mockResponse();

    await calculateMonthlyPayouts(req, res);

    if (res.statusCode === 200 && res.body.success) {
        console.log("✅ Controller responded with Success 200");
        console.log("Response Data:", JSON.stringify(res.body.data, null, 2));

        // Verify Payout Exists
        const payout = await Payout.findOne({ educatorId: mockEducator._id });
        if (payout && payout.amount === 160000) { // 80% of 2000
             console.log("✅ Payout record verified: ₹1600 (160000 paise)");
        } else {
             console.error("❌ Payout verification failed!", payout);
        }
    } else {
        console.error("❌ Controller failed:", res.statusCode, res.body);
    }

    // 4. Cleanup
    await PaymentIntent.findByIdAndDelete(payment._id);
    await Course.findByIdAndDelete(mockCourse._id);
    await Educator.findByIdAndDelete(mockEducator._id);
    await Payout.deleteMany({ educatorId: mockEducator._id });

    console.log("✅ Cleanup complete");
    process.exit(0);

  } catch (error) {
    console.error("❌ Verification Failed:", error);
    process.exit(1);
  }
};

verifyManualEndpoint();
