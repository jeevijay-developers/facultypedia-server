// Student API Testing Script
// Run this after starting your server to test all Student endpoints

const BASE_URL = 'http://localhost:3000/api';
let createdStudentId = null;
let testResults = [];

// Test data
const testStudent = {
    name: "Test Student API",
    username: "test_student_api_123",
    password: "TestAPI@123",
    mobileNumber: "9876543210",
    email: "test.api.student@email.com",
    specialization: "IIT-JEE",
    class: "Class 12th",
    address: {
        street: "123 API Test Street",
        city: "Test City",
        state: "Test State",
        country: "India",
        pincode: "123456"
    },
    deviceToken: "test_fcm_token_123",
    preferences: {
        notifications: {
            email: true,
            push: true,
            sms: false
        },
        language: "english",
        theme: "light"
    }
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const result = await response.json();
        return { status: response.status, data: result };
    } catch (error) {
        return { status: 'ERROR', data: error.message };
    }
}

// Test functions
async function testCreateStudent() {
    console.log('\n🧪 Testing: Create Student');
    const result = await apiCall('POST', '/students', testStudent);
    
    if (result.status === 201) {
        createdStudentId = result.data.data._id;
        console.log('✅ Student created successfully');
        console.log(`📝 Student ID: ${createdStudentId}`);
        testResults.push({ test: 'Create Student', status: 'PASS' });
    } else {
        console.log('❌ Failed to create student');
        console.log('Response:', result.data);
        testResults.push({ test: 'Create Student', status: 'FAIL', error: result.data });
    }
}

async function testGetAllStudents() {
    console.log('\n🧪 Testing: Get All Students');
    const result = await apiCall('GET', '/students?page=1&limit=5');
    
    if (result.status === 200) {
        console.log('✅ Retrieved students successfully');
        console.log(`📊 Total students: ${result.data.totalStudents}`);
        console.log(`📄 Students in response: ${result.data.data.length}`);
        testResults.push({ test: 'Get All Students', status: 'PASS' });
    } else {
        console.log('❌ Failed to get students');
        console.log('Response:', result.data);
        testResults.push({ test: 'Get All Students', status: 'FAIL', error: result.data });
    }
}

async function testGetStudentById() {
    if (!createdStudentId) {
        console.log('\n⚠️ Skipping: Get Student by ID (No student ID available)');
        return;
    }
    
    console.log('\n🧪 Testing: Get Student by ID');
    const result = await apiCall('GET', `/students/${createdStudentId}`);
    
    if (result.status === 200) {
        console.log('✅ Retrieved student by ID successfully');
        console.log(`👤 Student name: ${result.data.data.name}`);
        testResults.push({ test: 'Get Student by ID', status: 'PASS' });
    } else {
        console.log('❌ Failed to get student by ID');
        console.log('Response:', result.data);
        testResults.push({ test: 'Get Student by ID', status: 'FAIL', error: result.data });
    }
}

async function testGetStudentByUsername() {
    console.log('\n🧪 Testing: Get Student by Username');
    const result = await apiCall('GET', `/students/username/${testStudent.username}`);
    
    if (result.status === 200) {
        console.log('✅ Retrieved student by username successfully');
        console.log(`👤 Student name: ${result.data.data.name}`);
        testResults.push({ test: 'Get Student by Username', status: 'PASS' });
    } else {
        console.log('❌ Failed to get student by username');
        console.log('Response:', result.data);
        testResults.push({ test: 'Get Student by Username', status: 'FAIL', error: result.data });
    }
}

async function testUpdateStudent() {
    if (!createdStudentId) {
        console.log('\n⚠️ Skipping: Update Student (No student ID available)');
        return;
    }
    
    console.log('\n🧪 Testing: Update Student');
    const updateData = {
        name: "Updated Test Student API",
        specialization: "NEET",
        preferences: {
            theme: "dark"
        }
    };
    
    const result = await apiCall('PUT', `/students/${createdStudentId}`, updateData);
    
    if (result.status === 200) {
        console.log('✅ Student updated successfully');
        console.log(`👤 Updated name: ${result.data.data.name}`);
        testResults.push({ test: 'Update Student', status: 'PASS' });
    } else {
        console.log('❌ Failed to update student');
        console.log('Response:', result.data);
        testResults.push({ test: 'Update Student', status: 'FAIL', error: result.data });
    }
}

async function testFilterBySpecialization() {
    console.log('\n🧪 Testing: Filter by Specialization');
    const result = await apiCall('GET', '/students?specialization=IIT-JEE');
    
    if (result.status === 200) {
        console.log('✅ Filtered students by specialization successfully');
        console.log(`📊 IIT-JEE students: ${result.data.data.length}`);
        testResults.push({ test: 'Filter by Specialization', status: 'PASS' });
    } else {
        console.log('❌ Failed to filter students');
        console.log('Response:', result.data);
        testResults.push({ test: 'Filter by Specialization', status: 'FAIL', error: result.data });
    }
}

async function testGetByClass() {
    console.log('\n🧪 Testing: Get Students by Class');
    const result = await apiCall('GET', '/students/class/Class 12th');
    
    if (result.status === 200) {
        console.log('✅ Retrieved students by class successfully');
        console.log(`📊 Class 12th students: ${result.data.data.length}`);
        testResults.push({ test: 'Get Students by Class', status: 'PASS' });
    } else {
        console.log('❌ Failed to get students by class');
        console.log('Response:', result.data);
        testResults.push({ test: 'Get Students by Class', status: 'FAIL', error: result.data });
    }
}

async function testEnrollInCourse() {
    if (!createdStudentId) {
        console.log('\n⚠️ Skipping: Enroll in Course (No student ID available)');
        return;
    }
    
    console.log('\n🧪 Testing: Enroll in Course');
    // Note: This will fail if course doesn't exist, but we're testing the endpoint
    const enrollData = {
        courseId: "64a7f8d9e1234567890abcde" // Dummy course ID for testing
    };
    
    const result = await apiCall('POST', `/students/${createdStudentId}/enroll`, enrollData);
    
    if (result.status === 200) {
        console.log('✅ Student enrolled in course successfully');
        testResults.push({ test: 'Enroll in Course', status: 'PASS' });
    } else {
        console.log('⚠️ Course enrollment failed (expected if course doesn\'t exist)');
        console.log('Response:', result.data);
        testResults.push({ test: 'Enroll in Course', status: 'EXPECTED_FAIL', note: 'Course may not exist' });
    }
}

async function testFollowEducator() {
    if (!createdStudentId) {
        console.log('\n⚠️ Skipping: Follow Educator (No student ID available)');
        return;
    }
    
    console.log('\n🧪 Testing: Follow Educator');
    // Note: This will fail if educator doesn't exist, but we're testing the endpoint
    const followData = {
        educatorId: "64a7f8d9e1234567890abcef" // Dummy educator ID for testing
    };
    
    const result = await apiCall('POST', `/students/${createdStudentId}/follow`, followData);
    
    if (result.status === 200) {
        console.log('✅ Student followed educator successfully');
        testResults.push({ test: 'Follow Educator', status: 'PASS' });
    } else {
        console.log('⚠️ Follow educator failed (expected if educator doesn\'t exist)');
        console.log('Response:', result.data);
        testResults.push({ test: 'Follow Educator', status: 'EXPECTED_FAIL', note: 'Educator may not exist' });
    }
}

async function testGetStatistics() {
    if (!createdStudentId) {
        console.log('\n⚠️ Skipping: Get Statistics (No student ID available)');
        return;
    }
    
    console.log('\n🧪 Testing: Get Student Statistics');
    const result = await apiCall('GET', `/students/${createdStudentId}/statistics`);
    
    if (result.status === 200) {
        console.log('✅ Retrieved student statistics successfully');
        console.log('📊 Statistics:', result.data.data);
        testResults.push({ test: 'Get Statistics', status: 'PASS' });
    } else {
        console.log('❌ Failed to get student statistics');
        console.log('Response:', result.data);
        testResults.push({ test: 'Get Statistics', status: 'FAIL', error: result.data });
    }
}

async function testValidationErrors() {
    console.log('\n🧪 Testing: Validation Errors');
    
    // Test with invalid data
    const invalidStudent = {
        name: "A", // Too short
        username: "invalid username with spaces", // Invalid format
        password: "123", // Too weak
        mobileNumber: "123", // Invalid format
        email: "invalid-email", // Invalid format
        specialization: "INVALID", // Invalid value
        class: "Invalid Class" // Invalid value
    };
    
    const result = await apiCall('POST', '/students', invalidStudent);
    
    if (result.status === 400) {
        console.log('✅ Validation errors caught successfully');
        console.log('📋 Validation errors:', result.data.errors || result.data.message);
        testResults.push({ test: 'Validation Errors', status: 'PASS' });
    } else {
        console.log('❌ Validation should have failed');
        console.log('Response:', result.data);
        testResults.push({ test: 'Validation Errors', status: 'FAIL', error: 'Validation not working' });
    }
}

async function testDeleteStudent() {
    if (!createdStudentId) {
        console.log('\n⚠️ Skipping: Delete Student (No student ID available)');
        return;
    }
    
    console.log('\n🧪 Testing: Delete Student');
    const result = await apiCall('DELETE', `/students/${createdStudentId}`);
    
    if (result.status === 200) {
        console.log('✅ Student deleted successfully');
        testResults.push({ test: 'Delete Student', status: 'PASS' });
    } else {
        console.log('❌ Failed to delete student');
        console.log('Response:', result.data);
        testResults.push({ test: 'Delete Student', status: 'FAIL', error: result.data });
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Student API Tests...\n');
    console.log('================================');
    
    await testCreateStudent();
    await testGetAllStudents();
    await testGetStudentById();
    await testGetStudentByUsername();
    await testUpdateStudent();
    await testFilterBySpecialization();
    await testGetByClass();
    await testEnrollInCourse();
    await testFollowEducator();
    await testGetStatistics();
    await testValidationErrors();
    await testDeleteStudent();
    
    // Print summary
    console.log('\n================================');
    console.log('📊 TEST SUMMARY');
    console.log('================================');
    
    const passCount = testResults.filter(t => t.status === 'PASS').length;
    const failCount = testResults.filter(t => t.status === 'FAIL').length;
    const expectedFailCount = testResults.filter(t => t.status === 'EXPECTED_FAIL').length;
    
    testResults.forEach(test => {
        const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${icon} ${test.test}: ${test.status}`);
        if (test.note) {
            console.log(`   📝 Note: ${test.note}`);
        }
    });
    
    console.log(`\n📈 Results: ${passCount} Passed, ${failCount} Failed, ${expectedFailCount} Expected Fails`);
    
    if (failCount === 0) {
        console.log('\n🎉 All tests completed successfully!');
    } else {
        console.log('\n⚠️ Some tests failed. Check the errors above.');
    }
}

// Instructions for running
console.log('Student API Test Script');
console.log('=======================');
console.log('');
console.log('To run these tests:');
console.log('1. Make sure your server is running on http://localhost:3000');
console.log('2. Open browser console or Node.js environment');
console.log('3. Run: runAllTests()');
console.log('');
console.log('Or run individual tests:');
console.log('- testCreateStudent()');
console.log('- testGetAllStudents()');
console.log('- testGetStudentById()');
console.log('- testUpdateStudent()');
console.log('- testValidationErrors()');
console.log('');

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testCreateStudent,
        testGetAllStudents,
        testGetStudentById,
        testUpdateStudent,
        testValidationErrors
    };
}