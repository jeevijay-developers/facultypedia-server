import https from 'https';
import http from 'http';
import { URL } from 'url';

// Simple HTTP client for testing
class APITester {
    constructor(baseUrl = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
        this.createdStudentId = null;
        this.testResults = [];
    }

    // Make HTTP request
    makeRequest(method, endpoint, data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, this.baseUrl);
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const client = url.protocol === 'https:' ? https : http;
            const req = client.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(body);
                        resolve({
                            status: res.statusCode,
                            data: jsonData
                        });
                    } catch (error) {
                        resolve({
                            status: res.statusCode,
                            data: body
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    // Test data
    getTestStudent() {
        return {
            name: "API Test Student",
            username: "api_test_student_123",
            password: "APITest@123",
            mobileNumber: "9876543210",
            email: "api.test.student@email.com",
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
    }

    async testCreateStudent() {
        console.log('\n🧪 Testing: Create Student');
        try {
            const result = await this.makeRequest('POST', '/api/students', this.getTestStudent());
            
            if (result.status === 201) {
                this.createdStudentId = result.data.data._id;
                console.log('✅ Student created successfully');
                console.log(`📝 Student ID: ${this.createdStudentId}`);
                this.testResults.push({ test: 'Create Student', status: 'PASS' });
            } else {
                console.log('❌ Failed to create student');
                console.log('Response:', result.data);
                this.testResults.push({ test: 'Create Student', status: 'FAIL', error: result.data });
            }
        } catch (error) {
            console.log('❌ Error creating student:', error.message);
            this.testResults.push({ test: 'Create Student', status: 'ERROR', error: error.message });
        }
    }

    async testGetAllStudents() {
        console.log('\n🧪 Testing: Get All Students');
        try {
            const result = await this.makeRequest('GET', '/api/students?page=1&limit=5');
            
            if (result.status === 200) {
                console.log('✅ Retrieved students successfully');
                console.log(`📊 Total students: ${result.data.totalStudents || 'N/A'}`);
                console.log(`📄 Students in response: ${result.data.data ? result.data.data.length : 'N/A'}`);
                this.testResults.push({ test: 'Get All Students', status: 'PASS' });
            } else {
                console.log('❌ Failed to get students');
                console.log('Response:', result.data);
                this.testResults.push({ test: 'Get All Students', status: 'FAIL', error: result.data });
            }
        } catch (error) {
            console.log('❌ Error getting students:', error.message);
            this.testResults.push({ test: 'Get All Students', status: 'ERROR', error: error.message });
        }
    }

    async testGetStudentById() {
        if (!this.createdStudentId) {
            console.log('\n⚠️ Skipping: Get Student by ID (No student ID available)');
            return;
        }
        
        console.log('\n🧪 Testing: Get Student by ID');
        try {
            const result = await this.makeRequest('GET', `/api/students/${this.createdStudentId}`);
            
            if (result.status === 200) {
                console.log('✅ Retrieved student by ID successfully');
                console.log(`👤 Student name: ${result.data.data.name}`);
                this.testResults.push({ test: 'Get Student by ID', status: 'PASS' });
            } else {
                console.log('❌ Failed to get student by ID');
                console.log('Response:', result.data);
                this.testResults.push({ test: 'Get Student by ID', status: 'FAIL', error: result.data });
            }
        } catch (error) {
            console.log('❌ Error getting student by ID:', error.message);
            this.testResults.push({ test: 'Get Student by ID', status: 'ERROR', error: error.message });
        }
    }

    async testUpdateStudent() {
        if (!this.createdStudentId) {
            console.log('\n⚠️ Skipping: Update Student (No student ID available)');
            return;
        }
        
        console.log('\n🧪 Testing: Update Student');
        try {
            const updateData = {
                name: "Updated API Test Student",
                specialization: "NEET",
                preferences: {
                    theme: "dark"
                }
            };
            
            const result = await this.makeRequest('PUT', `/api/students/${this.createdStudentId}`, updateData);
            
            if (result.status === 200) {
                console.log('✅ Student updated successfully');
                console.log(`👤 Updated name: ${result.data.data.name}`);
                this.testResults.push({ test: 'Update Student', status: 'PASS' });
            } else {
                console.log('❌ Failed to update student');
                console.log('Response:', result.data);
                this.testResults.push({ test: 'Update Student', status: 'FAIL', error: result.data });
            }
        } catch (error) {
            console.log('❌ Error updating student:', error.message);
            this.testResults.push({ test: 'Update Student', status: 'ERROR', error: error.message });
        }
    }

    async testValidationErrors() {
        console.log('\n🧪 Testing: Validation Errors');
        try {
            const invalidStudent = {
                name: "A", // Too short
                username: "invalid username", // Invalid format
                password: "123", // Too weak
                mobileNumber: "123", // Invalid format
                email: "invalid-email", // Invalid format
                specialization: "INVALID", // Invalid value
                class: "Invalid Class" // Invalid value
            };
            
            const result = await this.makeRequest('POST', '/api/students', invalidStudent);
            
            if (result.status === 400) {
                console.log('✅ Validation errors caught successfully');
                console.log('📋 Validation errors present');
                this.testResults.push({ test: 'Validation Errors', status: 'PASS' });
            } else {
                console.log('❌ Validation should have failed');
                console.log('Response:', result.data);
                this.testResults.push({ test: 'Validation Errors', status: 'FAIL', error: 'Validation not working' });
            }
        } catch (error) {
            console.log('❌ Error testing validation:', error.message);
            this.testResults.push({ test: 'Validation Errors', status: 'ERROR', error: error.message });
        }
    }

    async testDeleteStudent() {
        if (!this.createdStudentId) {
            console.log('\n⚠️ Skipping: Delete Student (No student ID available)');
            return;
        }
        
        console.log('\n🧪 Testing: Delete Student');
        try {
            const result = await this.makeRequest('DELETE', `/api/students/${this.createdStudentId}`);
            
            if (result.status === 200) {
                console.log('✅ Student deleted successfully');
                this.testResults.push({ test: 'Delete Student', status: 'PASS' });
            } else {
                console.log('❌ Failed to delete student');
                console.log('Response:', result.data);
                this.testResults.push({ test: 'Delete Student', status: 'FAIL', error: result.data });
            }
        } catch (error) {
            console.log('❌ Error deleting student:', error.message);
            this.testResults.push({ test: 'Delete Student', status: 'ERROR', error: error.message });
        }
    }

    async runAllTests() {
        console.log('🚀 Starting Student API Tests...\n');
        console.log('================================');
        
        await this.testCreateStudent();
        await this.testGetAllStudents();
        await this.testGetStudentById();
        await this.testUpdateStudent();
        await this.testValidationErrors();
        await this.testDeleteStudent();
        
        this.printSummary();
    }

    printSummary() {
        console.log('\n================================');
        console.log('📊 TEST SUMMARY');
        console.log('================================');
        
        const passCount = this.testResults.filter(t => t.status === 'PASS').length;
        const failCount = this.testResults.filter(t => t.status === 'FAIL').length;
        const errorCount = this.testResults.filter(t => t.status === 'ERROR').length;
        
        this.testResults.forEach(test => {
            const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '🔴';
            console.log(`${icon} ${test.test}: ${test.status}`);
        });
        
        console.log(`\n📈 Results: ${passCount} Passed, ${failCount} Failed, ${errorCount} Errors`);
        
        if (failCount === 0 && errorCount === 0) {
            console.log('\n🎉 All tests completed successfully!');
        } else {
            console.log('\n⚠️ Some tests failed or had errors. Check the details above.');
        }
    }
}

// Always run tests when this file is executed
console.log('Student API Node.js Test Runner');
console.log('===============================');
console.log('Make sure your server is running on http://localhost:5000\n');

const tester = new APITester();
tester.runAllTests().catch(console.error);

export default APITester;