import mongoose from "mongoose";
import dotenv from "dotenv";
import Educator from "../models/educator.js";
import Course from "../models/course.js";
import PaymentIntent from "../models/paymentIntent.js";
import Payout from "../models/payout.js";
import { calculatePayoutsForMonth } from "../services/payout.service.js";

dotenv.config();

const verifyPayoutLogic = async () => {
  try {
    console.log("Starting Payout Logic Verification...");

    // 1. Connect to MongoDB
    const mongoUri = process.env.MONGODB_URL || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URL or MONGODB_URI is missing in .env");
    }
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // 2. Create Temporary Educator
    const mockEducator = await Educator.create({
      firstName: "Test",
      lastName: "Educator",
      email: `test_educator_${Date.now()}@example.com`,
      username: `test_edu_${Date.now()}`,
      password: "password123",
      specialization: ["Math"], // This is not validated strictly against enums in Educator create? Wait, validation.js says VALID_SPECIALIZATIONS = ["IIT-JEE", "NEET", "CBSE"].
      // Educator model might use different validation or none in script since we use Mongoose model directly.
      // But validation.js says VALID_SPECIALIZATIONS = ["IIT-JEE", "NEET", "CBSE"]
      // Let's use valid ones everywhere to be safe.
      specialization: ["IIT-JEE"],
      class: ["class-10th"],
      subject: ["mathematics"],
      mobileNumber: `98${Date.now().toString().slice(-8)}`,
    });
    console.log(`✅ Created Mock Educator: ${mockEducator._id}`);

    // 3. Create Mock Course
    const mockCourse = await Course.create({
      title: "Test Payout Course",
      slug: "test-payout-course", // Required field
      description: "Testing payout logic",
      educatorID: mockEducator._id,
      fees: 1000, // ₹1000 Fee
      courseType: "one-to-all", // Changed from 'recorded' to valid enum
      specialization: ["IIT-JEE"],
      class: ["class-10th"],
      subject: ["mathematics"],
      courseDuration: "3 Months", // Added required field
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000), // Tomorrow
      validDate: new Date(Date.now() + 86400000 * 30),
    });
    console.log(`✅ Created Mock Course: ${mockCourse._id}`);

    // 4. Simulate Payment Intent
    // Payout logic looks for successful payments in a specific month
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentYear = today.getFullYear();
    
    // Create a payment that happened "today"
    const payment = await PaymentIntent.create({
      studentId: new mongoose.Types.ObjectId(), // Fake student ID
      productId: mockCourse._id,
      productType: "course",
      amount: 100000, // ₹1000 in paise
      currency: "INR",
      status: "succeeded", // Important: must be succeeded
      razorpayOrderId: `order_${Date.now()}`,
      razorpayPaymentId: `pay_${Date.now()}`,
      createdAt: new Date(), // Created now, so it falls in current month
    });
    console.log(`✅ Created Successful Payment: ₹1000`);

    // 5. Run Payout Calculation for Current Month
    console.log(`Processing payouts for Month: ${currentMonth}, Year: ${currentYear}...`);
    await calculatePayoutsForMonth(currentMonth, currentYear);

    // 6. Verify Payout Record
    const payout = await Payout.findOne({
      educatorId: mockEducator._id,
      month: currentMonth,
      year: currentYear,
    });

    if (!payout) {
      throw new Error("❌ Payout record was NOT created!");
    }

    console.log("\n--- Verification Results ---");
    console.log(`Gross Amount (Expected: 100000): ${payout.grossAmount}`);
    console.log(`Commission (Expected ~20%): ${payout.commissionAmount}`);
    console.log(`Payable (Expected ~80%): ${payout.amount}`);

    const expectedCommission = 20000; // 20% of 100000
    const expectedPayable = 80000;    // 80%

    // Allow small rounding diffs if any, but logic is integer math in service
    if (payout.grossAmount === 100000 && 
        payout.commissionAmount === expectedCommission &&
        payout.amount === expectedPayable) {
       console.log("✅ SUCCESS: Payout calculation is correct!");
    } else {
       console.error("❌ FAILURE: Calculation mismatch!");
       console.log(`Expected Commission: ${expectedCommission}, Got: ${payout.commissionAmount}`);
    }

    // 7. Cleanup
    console.log("\nCleaning up test data...");
    await PaymentIntent.findByIdAndDelete(payment._id);
    await Course.findByIdAndDelete(mockCourse._id);
    await Educator.findByIdAndDelete(mockEducator._id);
    await Payout.findByIdAndDelete(payout._id); // Delete the payout we just created
    console.log("✅ Cleanup complete");

    process.exit(0);

  } catch (error) {
    console.error("\n❌ Verification Failed:", error);
    process.exit(1);
  }
};

verifyPayoutLogic();
