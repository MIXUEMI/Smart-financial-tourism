/**
 * 智游金旅 - 关怀模式与语音交互脚本
 * 提供统一的关怀模式功能和语音交互能力
 */

// 关怀模式状态管理
const CareMode = {
    isEnabled: false,
    isListening: false,
    recognition: null,
    currentLanguage: 'zh-CN',
    
    // 初始化关怀模式
    init() {
        this.setupVoiceRecognition();
        this.setupCareModeToggle();
        this.loadCareModeState();
        console.log('关怀模式初始化完成');
    },
    
    // 设置语音识别
    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = this.currentLanguage;
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceButton('listening');
                console.log('语音识别开始');
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.handleVoiceInput(transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('语音识别错误:', event.error);
                this.isListening = false;
                this.updateVoiceButton('error');
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceButton('idle');
            };
        } else {
            console.warn('浏览器不支持语音识别功能');
        }
    },
    
    // 设置关怀模式切换
    setupCareModeToggle() {
        // 创建便携工具切换按钮
        const toggleButton = document.createElement('button');
        toggleButton.id = 'careModeToggle';
        toggleButton.className = 'btn btn-secondary';
        toggleButton.innerHTML = '🛠️ 便携工具';
        toggleButton.style.position = 'fixed';
        toggleButton.style.bottom = '20px';
        toggleButton.style.right = '20px';
        toggleButton.style.zIndex = '1000';
        toggleButton.style.borderRadius = '50px';
        toggleButton.style.padding = '12px 20px';
        toggleButton.style.fontSize = '14px';
        toggleButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        toggleButton.title = '点击开启语音交互功能';
        
        toggleButton.addEventListener('click', () => {
            this.toggleCareMode();
        });
        
        // 添加鼠标悬停事件显示语音命令帮助
        toggleButton.addEventListener('mouseenter', () => {
            this.showVoiceCommandsTooltip(toggleButton);
        });
        
        toggleButton.addEventListener('mouseleave', () => {
            this.hideVoiceCommandsTooltip();
        });
        
        document.body.appendChild(toggleButton);
        
        // 创建语音输入按钮
        if (this.recognition) {
            const voiceButton = document.createElement('button');
            voiceButton.id = 'voiceInputButton';
            voiceButton.className = 'btn btn-success';
            voiceButton.innerHTML = '🎤 语音输入';
            voiceButton.style.position = 'fixed';
            voiceButton.style.bottom = '80px';
            voiceButton.style.right = '20px';
            voiceButton.style.zIndex = '1000';
            voiceButton.style.borderRadius = '50px';
            voiceButton.style.padding = '12px 20px';
            voiceButton.style.fontSize = '14px';
            voiceButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
            voiceButton.style.display = 'none';
            
            voiceButton.addEventListener('click', () => {
                this.toggleVoiceInput();
            });
            
            document.body.appendChild(voiceButton);
        }
    },
    
    // 切换关怀模式
    toggleCareMode() {
        this.isEnabled = !this.isEnabled;
        this.updateCareModeUI();
        this.saveCareModeState();
        
        if (this.isEnabled) {
            this.showCareMessage('便携工具已开启，语音交互功能已激活');
            this.showVoiceButton();
        } else {
            this.showCareMessage('便携工具已关闭');
            this.hideVoiceButton();
        }
    },
    
    // 更新关怀模式UI
    updateCareModeUI() {
        const toggleButton = document.getElementById('careModeToggle');
        if (toggleButton) {
            if (this.isEnabled) {
                toggleButton.innerHTML = '🛠️ 便携工具 ✓';
                toggleButton.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
            } else {
                toggleButton.innerHTML = '🛠️ 便携工具';
                toggleButton.style.background = 'rgba(255, 255, 255, 0.2)';
            }
        }
    },
    
    // 显示/隐藏语音按钮
    showVoiceButton() {
        const voiceButton = document.getElementById('voiceInputButton');
        if (voiceButton) {
            voiceButton.style.display = 'block';
        }
    },
    
    hideVoiceButton() {
        const voiceButton = document.getElementById('voiceInputButton');
        if (voiceButton) {
            voiceButton.style.display = 'none';
        }
    },
    
    // 切换语音输入
    toggleVoiceInput() {
        if (!this.recognition) {
            this.showCareMessage('抱歉，您的浏览器不支持语音识别功能');
            return;
        }
        
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    },
    
    // 更新语音按钮状态
    updateVoiceButton(state) {
        const voiceButton = document.getElementById('voiceInputButton');
        if (!voiceButton) return;
        
        switch (state) {
            case 'listening':
                voiceButton.innerHTML = '🎤 正在听取...';
                voiceButton.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
                break;
            case 'error':
                voiceButton.innerHTML = '🎤 识别失败';
                voiceButton.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
                setTimeout(() => {
                    voiceButton.innerHTML = '🎤 语音输入';
                    voiceButton.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                }, 2000);
                break;
            case 'idle':
            default:
                voiceButton.innerHTML = '🎤 语音输入';
                voiceButton.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                break;
        }
    },
    
    // 处理语音输入
    handleVoiceInput(transcript) {
        console.log('语音输入:', transcript);
        this.showCareMessage(`我听到您说：${transcript}`);
        
        // 根据语音输入执行相应操作
        this.processVoiceCommand(transcript);
    },
    
    // 处理语音命令
    processVoiceCommand(command) {
        const lowerCommand = command.toLowerCase();
        
        // 导航命令
        if (lowerCommand.includes('首页') || lowerCommand.includes('主页')) {
            this.navigateTo('/main');
        } else if (lowerCommand.includes('理财') || lowerCommand.includes('投资')) {
            this.navigateTo('/financial');
        } else if (lowerCommand.includes('旅游') || lowerCommand.includes('旅行')) {
            this.navigateTo('/tourism');
        } else if (lowerCommand.includes('ai') || lowerCommand.includes('助手')) {
            this.navigateTo('/ai');
        } else if (lowerCommand.includes('优惠') || lowerCommand.includes('促销')) {
            this.navigateTo('/promotion');
        }
        // 功能命令
        else if (lowerCommand.includes('帮助') || lowerCommand.includes('帮助')) {
            this.showHelp();
        } else if (lowerCommand.includes('关闭') && lowerCommand.includes('工具')) {
            this.toggleCareMode();
        }
        // 默认处理
        else {
            this.showCareMessage('我理解您说的，但暂时无法执行此操作。您可以尝试说"帮助"来了解可用命令。');
        }
    },
    
    // 导航到指定页面
    navigateTo(path) {
        this.showCareMessage(`正在为您跳转到${path}页面...`);
        setTimeout(() => {
            window.location.href = path;
        }, 1000);
    },
    
    // 显示帮助信息
    showHelp() {
        const helpMessage = `
            <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 15px; margin: 20px 0;">
                <h4 style="color: #4CAF50; margin-bottom: 15px;">🎤 语音命令帮助</h4>
                <p><strong>导航命令：</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>说"首页"或"主页" → 跳转到主页面</li>
                    <li>说"理财"或"投资" → 跳转到理财页面</li>
                    <li>说"旅游"或"旅行" → 跳转到旅游页面</li>
                    <li>说"AI"或"助手" → 跳转到AI助手页面</li>
                    <li>说"优惠"或"促销" → 跳转到优惠页面</li>
                </ul>
                <p><strong>功能命令：</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>说"帮助" → 显示语音命令帮助</li>
                    <li>说"关闭工具" → 关闭便携工具</li>
                </ul>
            </div>
        `;
        this.showCareMessage(helpMessage);
    },
    
    // 显示关怀消息
    showCareMessage(message) {
        // 创建消息容器
        let messageContainer = document.getElementById('careMessageContainer');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'careMessageContainer';
            messageContainer.style.position = 'fixed';
            messageContainer.style.top = '20px';
            messageContainer.style.right = '20px';
            messageContainer.style.zIndex = '1001';
            messageContainer.style.maxWidth = '400px';
            document.body.appendChild(messageContainer);
        }
        
        // 创建消息元素
        const messageElement = document.createElement('div');
        messageElement.style.background = 'rgba(255, 255, 255, 0.1)';
        messageElement.style.backdropFilter = 'blur(20px)';
        messageElement.style.borderRadius = '15px';
        messageElement.style.padding = '15px 20px';
        messageElement.style.marginBottom = '10px';
        messageElement.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        messageElement.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
        messageElement.style.color = 'white';
        messageElement.style.fontSize = '14px';
        messageElement.style.lineHeight = '1.4';
        messageElement.style.animation = 'fadeIn 0.3s ease-in';
        
        if (typeof message === 'string' && message.includes('<')) {
            messageElement.innerHTML = message;
        } else {
            messageElement.textContent = message;
        }
        
        messageContainer.appendChild(messageElement);
        
        // 自动移除消息
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        messageElement.parentNode.removeChild(messageElement);
                    }
                }, 300);
            }
        }, 5000);
    },
    
    // 保存关怀模式状态
    saveCareModeState() {
        localStorage.setItem('careModeEnabled', this.isEnabled);
    },
    
    // 加载关怀模式状态
    loadCareModeState() {
        const saved = localStorage.getItem('careModeEnabled');
        if (saved !== null) {
            this.isEnabled = saved === 'true';
            this.updateCareModeUI();
            if (this.isEnabled) {
                this.showVoiceButton();
            }
        }
    },
    
    // 显示语音命令提示
    showVoiceCommandsTooltip(button) {
        // 移除已存在的提示
        this.hideVoiceCommandsTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.id = 'voiceCommandsTooltip';
        tooltip.style.position = 'fixed';
        tooltip.style.bottom = '80px';
        tooltip.style.right = '20px';
        tooltip.style.zIndex = '1001';
        tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '20px';
        tooltip.style.borderRadius = '15px';
        tooltip.style.maxWidth = '350px';
        tooltip.style.fontSize = '14px';
        tooltip.style.lineHeight = '1.6';
        tooltip.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
        tooltip.style.backdropFilter = 'blur(10px)';
        tooltip.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        tooltip.style.animation = 'fadeIn 0.3s ease-in';
        
        tooltip.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <h4 style="margin: 0; color: #4CAF50; font-size: 16px;">🎤 语音命令帮助</h4>
            </div>
            <div style="margin-bottom: 15px;">
                <p style="margin: 5px 0; font-weight: bold; color: #FFD700;">导航命令：</p>
                <ul style="margin: 5px 0; padding-left: 20px; font-size: 13px;">
                    <li>说"首页"或"主页" → 跳转到主页面</li>
                    <li>说"理财"或"投资" → 跳转到理财页面</li>
                    <li>说"旅游"或"旅行" → 跳转到旅游页面</li>
                    <li>说"AI"或"助手" → 跳转到AI助手页面</li>
                    <li>说"优惠"或"促销" → 跳转到优惠页面</li>
                </ul>
            </div>
            <div>
                <p style="margin: 5px 0; font-weight: bold; color: #FFD700;">功能命令：</p>
                <ul style="margin: 5px 0; padding-left: 20px; font-size: 13px;">
                    <li>说"帮助" → 显示语音命令帮助</li>
                    <li>说"关闭工具" → 关闭便携工具</li>
                </ul>
            </div>
            <div style="text-align: center; margin-top: 15px; font-size: 12px; color: #ccc;">
                点击按钮开启语音交互功能
            </div>
        `;
        
        document.body.appendChild(tooltip);
    },
    
    // 隐藏语音命令提示
    hideVoiceCommandsTooltip() {
        const tooltip = document.getElementById('voiceCommandsTooltip');
        if (tooltip) {
            tooltip.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 300);
        }
    }
};

// 添加淡出动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// 页面加载完成后初始化关怀模式
document.addEventListener('DOMContentLoaded', () => {
    CareMode.init();
});

// 导出到全局作用域
window.CareMode = CareMode;
