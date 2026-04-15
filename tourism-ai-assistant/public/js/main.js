// public/js/main.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 完全加载并解析');

    const getAdviceBtn = document.getElementById('get-advice-btn');
    const questionInput = document.getElementById('financial-question');
    const adviceContent = document.getElementById('financial-advice-content');
    const adviceContainer = document.getElementById('financial-advice');
    const loadingSpinner = document.getElementById('loading-spinner');

    if (getAdviceBtn) {
        getAdviceBtn.addEventListener('click', loadFinancialData);
    } else {
        console.error('错误：无法找到ID为 "get-advice-btn" 的按钮。');
    }

    async function loadFinancialData() {
        const userQuestion = questionInput.value.trim();

        // 前端验证：确保用户输入了问题
        if (!userQuestion) {
            adviceContent.textContent = '请输入您的问题，例如："去日本旅游一周，预算5000元如何规划？"';
            adviceContainer.style.display = 'block';
            return;
        }

        // 进入加载状态
        adviceContent.textContent = ''; // 清空旧内容
        adviceContainer.style.display = 'block'; // 显示建议区域
        loadingSpinner.style.display = 'block'; // 显示加载动画
        getAdviceBtn.disabled = true; // 禁用按钮，防止重复点击

        try {
            // 1. 调用我们的后端 API
            const response = await fetch('/api/financial-advice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // 将用户的问题打包成 JSON 字符串发送
                body: JSON.stringify({ question: userQuestion })
            });

            // 2. 检查响应状态
            if (!response.ok) {
                // 如果服务器返回错误（如 400, 500）
                const errorData = await response.json();
                throw new Error(errorData.error || `服务器错误: ${response.status}`);
            }

            // 3. 解析从后端收到的 JSON 数据
            const data = await response.json();

            // 4. 将 AI 的建议显示在页面上
            adviceContent.textContent = data.advice;

        } catch (error) {
            // 5. 捕获并显示任何发生的错误（网络问题、服务器问题等）
            console.error('获取金融建议时出错:', error);
            adviceContent.textContent = `抱歉，获取建议时遇到问题：${error.message}`;
        } finally {
            // 6. 无论成功还是失败，都结束加载状态
            loadingSpinner.style.display = 'none'; // 隐藏加载动画
            getAdviceBtn.disabled = false; // 重新启用按钮
        }
    }
});


