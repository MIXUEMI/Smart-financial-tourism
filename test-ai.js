// 测试AI API
const fetch = require('node-fetch');

async function testAI() {
    try {
        console.log('测试AI API...');
        
        const response = await fetch('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Hello' })
        });
        
        const data = await response.json();
        console.log('API响应:', JSON.stringify(data, null, 2));
        
        if (data.success && data.response) {
            console.log('✅ AI响应正常:', data.response);
        } else {
            console.log('❌ AI响应异常:', data);
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

testAI();

