// 智游金旅 - 用户画像前端逻辑
// 创建时间: 2025-01-26
// 版本: v1.0

class UserSegmentationManager {
    constructor() {
        this.isInitialized = false;
        this.segmentsChart = null;
        this.wordcloudCanvas = null;
        this.cache = {
            overview: null,
            userData: null,
            lastUpdate: null
        };
        this.cacheTimeout = 10 * 60 * 1000; // 10分钟缓存
    }

    // 初始化用户画像功能
    async init() {
        if (this.isInitialized) return;
        
        console.log('🎯 初始化用户画像功能...');
        
        try {
            // 检查功能是否启用
            if (!this.isFeatureEnabled()) {
                console.log('📊 用户画像功能未启用');
                return;
            }
            
            // 检查用户登录状态
            if (!this.isUserLoggedIn()) {
                console.log('👤 用户未登录，跳过画像功能');
                return;
            }
            
            console.log('✅ 功能启用检查和登录检查通过');
            
            // 显示画像卡片
            this.showSegmentationCard();
            
            // 绑定事件
            this.bindEvents();
            
            // 加载数据
            await this.loadSegmentationData();
            
            this.isInitialized = true;
            console.log('✅ 用户画像功能初始化完成');
            
        } catch (error) {
            console.error('❌ 用户画像功能初始化失败:', error);
            this.showError('初始化失败，请刷新页面重试');
        }
    }

    // 检查功能是否启用
    isFeatureEnabled() {
        // 默认启用用户画像功能
        return true;
    }

    // 检查用户登录状态
    isUserLoggedIn() {
        // 简化登录检查，只要有用户名就认为已登录
        const savedUsername = localStorage.getItem('username');
        return !!savedUsername;
    }

    // 显示画像卡片
    showSegmentationCard() {
        console.log('📊 尝试显示用户画像卡片...');
        const card = document.getElementById('user-segmentation-card');
        if (card) {
            card.style.display = 'block';
            console.log('✅ 用户画像卡片已显示');
        } else {
            console.log('❌ 未找到用户画像卡片元素');
        }
    }

    // 绑定事件
    bindEvents() {
        // 刷新按钮
        const refreshBtn = document.getElementById('refresh-segmentation');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // 隐私设置按钮
        const privacyBtn = document.getElementById('privacy-settings');
        if (privacyBtn) {
            privacyBtn.addEventListener('click', () => this.showPrivacyModal());
        }

        // 重试按钮
        const retryBtn = document.getElementById('retry-segmentation');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.loadSegmentationData());
        }

        // 开启画像按钮
        const enableBtn = document.getElementById('enable-segmentation');
        if (enableBtn) {
            enableBtn.addEventListener('click', () => this.enableSegmentation());
        }

        // 隐私模态框事件
        this.bindPrivacyModalEvents();
    }

    // 绑定隐私模态框事件
    bindPrivacyModalEvents() {
        const modal = document.getElementById('privacy-modal');
        const closeBtn = document.getElementById('close-privacy-modal');
        const cancelBtn = document.getElementById('cancel-privacy-settings');
        const saveBtn = document.getElementById('save-privacy-settings');
        const toggle = document.getElementById('segmentation-toggle');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hidePrivacyModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hidePrivacyModal());
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.savePrivacySettings());
        }

        // 点击模态框外部关闭
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hidePrivacyModal();
                }
            });
        }
    }

    // 加载画像数据
    async loadSegmentationData() {
        try {
            console.log('📊 开始加载用户画像数据...');
            this.showLoading();
            
            // 检查缓存
            if (this.isCacheValid()) {
                console.log('📊 使用缓存数据');
                this.renderSegmentationData(this.cache.overview, this.cache.userData);
                return;
            }

            // 并行加载数据
            const [overviewData, userData] = await Promise.all([
                this.fetchSegmentsOverview(),
                this.fetchUserSegmentation()
            ]);

            // 如果API调用失败，显示模拟数据
            if (!overviewData || !userData) {
                console.log('📊 API数据加载失败，显示模拟数据');
                this.showMockData();
                return;
            }

            // 更新缓存
            this.cache = {
                overview: overviewData,
                userData: userData,
                lastUpdate: Date.now()
            };

            this.renderSegmentationData(overviewData, userData);
            
        } catch (error) {
            console.error('❌ 加载画像数据失败:', error);
            console.log('📊 显示模拟数据作为备选方案');
            this.showMockData();
        }
    }

    // 显示模拟数据
    showMockData() {
        console.log('📊 显示模拟用户画像数据');
        
        const content = document.getElementById('segmentation-content');
        const loading = document.getElementById('segmentation-loading');
        
        if (loading) loading.style.display = 'none';
        if (content) {
            content.style.display = 'block';
            content.innerHTML = `
                <div class="mock-data-container" style="padding: 20px; background: white; border-radius: 8px; margin: 10px 0;">
                    <div class="mock-user-profile" style="margin-bottom: 20px;">
                        <div class="user-badge" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 15px;">
                            <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">理财型游客</div>
                            <div style="font-size: 14px; opacity: 0.9;">置信度: 85%</div>
                        </div>
                        <div class="user-stats">
                            <div class="stat-item" style="margin-bottom: 15px;">
                                <span class="stat-label" style="display: block; margin-bottom: 5px; font-weight: bold;">消费水平</span>
                                <div class="percentile-bar" style="background: #f0f0f0; height: 20px; border-radius: 10px; position: relative; overflow: hidden;">
                                    <div class="percentile-fill" style="background: linear-gradient(90deg, #4CAF50, #8BC34A); height: 100%; width: 75%; border-radius: 10px;"></div>
                                    <span class="percentile-text" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: bold;">75%</span>
                                </div>
                            </div>
                            <div class="stat-item" style="margin-bottom: 15px;">
                                <span class="stat-label" style="display: block; margin-bottom: 5px; font-weight: bold;">活跃度</span>
                                <div class="percentile-bar" style="background: #f0f0f0; height: 20px; border-radius: 10px; position: relative; overflow: hidden;">
                                    <div class="percentile-fill" style="background: linear-gradient(90deg, #2196F3, #03A9F4); height: 100%; width: 60%; border-radius: 10px;"></div>
                                    <span class="percentile-text" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: bold;">60%</span>
                                </div>
                            </div>
                            <div class="stat-item" style="margin-bottom: 15px;">
                                <span class="stat-label" style="display: block; margin-bottom: 5px; font-weight: bold;">风险偏好</span>
                                <div class="percentile-bar" style="background: #f0f0f0; height: 20px; border-radius: 10px; position: relative; overflow: hidden;">
                                    <div class="percentile-fill" style="background: linear-gradient(90deg, #FF9800, #FFC107); height: 100%; width: 40%; border-radius: 10px;"></div>
                                    <span class="percentile-text" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: bold;">40%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mock-explanation" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin-bottom: 10px; color: #333;">画像解释</h4>
                        <p style="margin-bottom: 10px; color: #666;">您属于"理财型游客"类型，具有以下特征：</p>
                        <ul style="margin-left: 20px; color: #666;">
                            <li>注重理财规划，偏好稳健投资</li>
                            <li>旅游消费理性，注重性价比</li>
                            <li>喜欢提前规划，关注优惠活动</li>
                            <li>对金融产品有一定了解</li>
                        </ul>
                    </div>
                    <div class="mock-chart" style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <h4 style="margin-bottom: 15px; color: #333;">用户类型分布</h4>
                        <div class="chart-placeholder">
                            <div class="chart-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                                <span class="chart-label" style="color: #333;">理财型游客</span>
                                <span class="chart-percent" style="color: #667eea; font-weight: bold;">35%</span>
                            </div>
                            <div class="chart-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                                <span class="chart-label" style="color: #333;">轻旅行打工人</span>
                                <span class="chart-percent" style="color: #2196F3; font-weight: bold;">25%</span>
                            </div>
                            <div class="chart-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                                <span class="chart-label" style="color: #333;">家庭度假型</span>
                                <span class="chart-percent" style="color: #4CAF50; font-weight: bold;">20%</span>
                            </div>
                            <div class="chart-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                                <span class="chart-label" style="color: #333;">康养型用户</span>
                                <span class="chart-percent" style="color: #FF9800; font-weight: bold;">15%</span>
                            </div>
                            <div class="chart-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                                <span class="chart-label" style="color: #333;">探索型年轻人</span>
                                <span class="chart-percent" style="color: #9C27B0; font-weight: bold;">5%</span>
                            </div>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 15px; color: #999; font-size: 12px;">
                        * 此为演示数据，实际数据基于您的行为分析
                    </div>
                </div>
            `;
        }
    }

    // 获取类型占比数据
    async fetchSegmentsOverview() {
        const response = await fetch('/api/analytics/segments-overview', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    // 获取用户画像数据
    async fetchUserSegmentation() {
        const response = await fetch('/api/analytics/user-segmentation/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 204) {
            // 用户关闭了画像功能
            this.showDisabled();
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    // 渲染画像数据
    renderSegmentationData(overviewData, userData) {
        try {
            this.hideLoading();
            
            if (!overviewData || !userData) {
                this.showDisabled();
                return;
            }

            // 渲染类型占比图表
            this.renderSegmentsChart(overviewData.segments);
            
            // 渲染词云
            this.renderWordcloud(overviewData.wordcloud);
            
            // 渲染用户分位
            this.renderUserPercentiles(userData);
            
            // 显示主要内容
            this.showContent();
            
        } catch (error) {
            console.error('❌ 渲染画像数据失败:', error);
            this.showError('数据渲染失败');
        }
    }

    // 渲染类型占比图表
    renderSegmentsChart(segments) {
        const canvas = document.getElementById('segments-chart');
        if (!canvas || !segments || segments.length === 0) return;

        const ctx = canvas.getContext('2d');
        
        // 销毁现有图表
        if (this.segmentsChart) {
            this.segmentsChart.destroy();
        }

        // 准备数据
        const labels = segments.map(s => s.label);
        const data = segments.map(s => Math.round(s.share * 100));
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];

        this.segmentsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 0,
                    cutout: '60%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                return `${label}: ${value}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    // 渲染词云
    renderWordcloud(wordcloudData) {
        const canvas = document.getElementById('wordcloud-canvas');
        if (!canvas || !wordcloudData || wordcloudData.length === 0) return;

        // 清空画布
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 设置画布大小
        canvas.width = 250;
        canvas.height = 200;

        // 准备词云数据
        const words = wordcloudData.map(item => ({
            text: item.text,
            weight: item.weight
        }));

        // 使用简单的文字渲染（因为wordcloud2.js需要额外引入）
        this.renderSimpleWordcloud(ctx, words);
    }

    // 简单词云渲染
    renderSimpleWordcloud(ctx, words) {
        const maxWeight = Math.max(...words.map(w => w.weight));
        const minWeight = Math.min(...words.map(w => w.weight));
        
        words.forEach((word, index) => {
            const fontSize = 12 + (word.weight - minWeight) / (maxWeight - minWeight) * 16;
            const x = (index % 3) * 80 + 20;
            const y = Math.floor(index / 3) * 40 + 30;
            
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + (word.weight - minWeight) / (maxWeight - minWeight) * 0.4})`;
            ctx.fillText(word.text, x, y);
        });
    }

    // 渲染用户分位
    renderUserPercentiles(userData) {
        const { user_label, percentiles, explanation } = userData;

        // 更新用户标签
        const labelElement = document.getElementById('user-label');
        if (labelElement) {
            labelElement.textContent = user_label;
        }

        // 更新解释
        const explanationElement = document.getElementById('user-explanation');
        if (explanationElement && explanation) {
            explanationElement.innerHTML = explanation.map(exp => 
                `<span class="explanation-tag">${exp}</span>`
            ).join(' ');
        }

        // 更新分位条
        this.updatePercentileBar('spend', percentiles.spend_level);
        this.updatePercentileBar('activity', percentiles.activity);
        this.updatePercentileBar('risk', percentiles.risk_tolerance);
    }

    // 更新分位条
    updatePercentileBar(type, value) {
        const bar = document.getElementById(`${type}-bar`);
        const valueElement = document.getElementById(`${type}-value`);
        
        if (bar && valueElement) {
            // 动画更新宽度
            setTimeout(() => {
                bar.style.width = `${value}%`;
                valueElement.textContent = `P${value}`;
            }, 100);
        }
    }

    // 显示加载状态
    showLoading() {
        this.hideAllStates();
        const loading = document.getElementById('segmentation-loading');
        if (loading) {
            loading.style.display = 'block';
        }
    }

    // 显示主要内容
    showContent() {
        this.hideAllStates();
        const content = document.getElementById('segmentation-content');
        if (content) {
            content.style.display = 'block';
        }
    }

    // 显示错误状态
    showError(message) {
        this.hideAllStates();
        const error = document.getElementById('segmentation-error');
        const errorMessage = document.querySelector('.error-message');
        
        if (error) {
            error.style.display = 'block';
        }
        
        if (errorMessage) {
            errorMessage.textContent = message;
        }
    }

    // 显示隐私关闭状态
    showDisabled() {
        this.hideAllStates();
        const disabled = document.getElementById('segmentation-disabled');
        if (disabled) {
            disabled.style.display = 'block';
        }
    }

    // 隐藏所有状态
    hideAllStates() {
        const states = ['segmentation-loading', 'segmentation-content', 'segmentation-error', 'segmentation-disabled'];
        states.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    // 刷新数据
    async refreshData() {
        this.cache = { overview: null, userData: null, lastUpdate: null };
        await this.loadSegmentationData();
    }

    // 显示隐私设置模态框
    showPrivacyModal() {
        const modal = document.getElementById('privacy-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // 隐藏隐私设置模态框
    hidePrivacyModal() {
        const modal = document.getElementById('privacy-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // 保存隐私设置
    async savePrivacySettings() {
        try {
            const toggle = document.getElementById('segmentation-toggle');
            const consent = toggle.checked;

            const response = await fetch('/api/analytics/user-segmentation/consent', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ consent })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.hidePrivacyModal();
            
            if (consent) {
                await this.loadSegmentationData();
            } else {
                this.showDisabled();
            }

        } catch (error) {
            console.error('❌ 保存隐私设置失败:', error);
            alert('保存设置失败，请重试');
        }
    }

    // 启用画像功能
    async enableSegmentation() {
        const toggle = document.getElementById('segmentation-toggle');
        if (toggle) {
            toggle.checked = true;
            await this.savePrivacySettings();
        }
    }

    // 销毁实例
    destroy() {
        if (this.segmentsChart) {
            this.segmentsChart.destroy();
            this.segmentsChart = null;
        }
        
        this.isInitialized = false;
        console.log('🗑️ 用户画像功能已销毁');
    }
}

// 创建全局用户画像管理器实例
window.userSegmentationManager = new UserSegmentationManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保其他组件已加载
    setTimeout(() => {
        window.userSegmentationManager.init();
    }, 1000);
});

// 导出用户画像管理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserSegmentationManager;
}

