// 用户数据管理系统
class UserDataManager {
    constructor() {
        this.userData = this.loadUserData();
        this.listeners = [];
    }

    // 加载用户数据
    loadUserData() {
        const defaultData = {
            username: '张三',
            level: 'VIP会员',
            avatar: '👤',
            totalOrders: 156,
            totalSpent: 12580,
            points: 2350,
            coupons: 8,
            preferences: {
                favoriteCities: ['北京', '上海', '杭州'],
                favoriteHotels: [],
                favoriteAttractions: [],
                favoriteProducts: [],
                travelStyle: '商务',
                budget: '中档',
                interests: ['文化', '美食', '购物']
            },
            recentActivity: [
                { icon: '🏨', title: '预订了北京饭店', time: '2小时前', type: 'hotel' },
                { icon: '💰', title: '购买了理财产品', time: '1天前', type: 'finance' },
                { icon: '🎫', title: '使用了优惠券', time: '2天前', type: 'coupon' },
                { icon: '🏛️', title: '收藏了故宫博物院', time: '3天前', type: 'attraction' },
                { icon: '💳', title: '绑定了银行卡', time: '1周前', type: 'bank' }
            ],
            orders: {
                all: [],
                pending: [],
                completed: [],
                cancelled: []
            },
            favorites: {
                hotels: [],
                attractions: [],
                products: []
            },
            coupons: [],
            aiChatHistory: [],
            marketPreferences: {
                riskTolerance: 'medium',
                investmentGoals: ['旅游基金', '养老规划'],
                favoriteSectors: ['旅游', '金融', '酒店']
            }
        };

        const savedData = localStorage.getItem('userData');
        if (savedData) {
            try {
                return { ...defaultData, ...JSON.parse(savedData) };
            } catch (e) {
                console.error('解析用户数据失败:', e);
                return defaultData;
            }
        }
        return defaultData;
    }

    // 保存用户数据
    saveUserData() {
        localStorage.setItem('userData', JSON.stringify(this.userData));
        this.notifyListeners();
    }

    // 更新用户数据
    updateUserData(updates) {
        this.userData = { ...this.userData, ...updates };
        this.saveUserData();
    }

    // 更新用户偏好
    updatePreferences(preferences) {
        this.userData.preferences = { ...this.userData.preferences, ...preferences };
        this.saveUserData();
    }

    // 添加收藏
    addFavorite(type, item) {
        if (!this.userData.favorites[type]) {
            this.userData.favorites[type] = [];
        }
        
        // 检查是否已收藏
        const exists = this.userData.favorites[type].some(fav => fav.id === item.id);
        if (!exists) {
            this.userData.favorites[type].push({
                ...item,
                addedAt: new Date().toISOString()
            });
            this.addActivity(`${type === 'hotels' ? '🏨' : type === 'attractions' ? '🏛️' : '💰'} 收藏了${item.name || item.title}`, 'favorite');
            this.saveUserData();
            return true;
        }
        return false;
    }

    // 移除收藏
    removeFavorite(type, itemId) {
        if (this.userData.favorites[type]) {
            const index = this.userData.favorites[type].findIndex(fav => fav.id === itemId);
            if (index > -1) {
                this.userData.favorites[type].splice(index, 1);
                this.saveUserData();
                return true;
            }
        }
        return false;
    }

    // 添加活动记录
    addActivity(title, type = 'general') {
        const activity = {
            icon: this.getActivityIcon(type),
            title: title,
            time: '刚刚',
            type: type,
            timestamp: new Date().toISOString()
        };
        
        this.userData.recentActivity.unshift(activity);
        
        // 只保留最近20条活动
        if (this.userData.recentActivity.length > 20) {
            this.userData.recentActivity = this.userData.recentActivity.slice(0, 20);
        }
        
        this.saveUserData();
    }

    // 获取活动图标
    getActivityIcon(type) {
        const icons = {
            hotel: '🏨',
            attraction: '🏛️',
            finance: '💰',
            coupon: '🎫',
            bank: '💳',
            favorite: '❤️',
            order: '📦',
            chat: '💬',
            general: '📊'
        };
        return icons[type] || '📊';
    }

    // 添加订单
    addOrder(order) {
        this.userData.orders.all.unshift(order);
        this.userData.orders[order.status].unshift(order);
        this.userData.totalOrders++;
        this.userData.totalSpent += order.amount || 0;
        this.addActivity(`📦 下单了${order.title}`, 'order');
        this.saveUserData();
    }

    // 添加优惠券
    addCoupon(coupon) {
        this.userData.coupons.push(coupon);
        this.userData.coupons++;
        this.addActivity(`🎫 获得了${coupon.title}优惠券`, 'coupon');
        this.saveUserData();
    }

    // 使用优惠券
    useCoupon(couponId) {
        const index = this.userData.coupons.findIndex(coupon => coupon.id === couponId);
        if (index > -1) {
            this.userData.coupons.splice(index, 1);
            this.userData.coupons--;
            this.addActivity(`🎫 使用了优惠券`, 'coupon');
            this.saveUserData();
            return true;
        }
        return false;
    }

    // 添加AI聊天记录
    addChatMessage(message, isUser = true) {
        if (!this.userData.aiChatHistory) {
            this.userData.aiChatHistory = [];
        }
        
        this.userData.aiChatHistory.push({
            message: message,
            isUser: isUser,
            timestamp: new Date().toISOString()
        });
        
        // 只保留最近100条聊天记录
        if (this.userData.aiChatHistory.length > 100) {
            this.userData.aiChatHistory = this.userData.aiChatHistory.slice(-100);
        }
        
        this.saveUserData();
    }

    // 更新市场偏好
    updateMarketPreferences(preferences) {
        this.userData.marketPreferences = { ...this.userData.marketPreferences, ...preferences };
        this.saveUserData();
    }

    // 获取个性化推荐
    getPersonalizedRecommendations(type) {
        const preferences = this.userData.preferences;
        const marketPrefs = this.userData.marketPreferences;
        
        switch(type) {
            case 'hotels':
                return this.getHotelRecommendations(preferences);
            case 'attractions':
                return this.getAttractionRecommendations(preferences);
            case 'products':
                return this.getProductRecommendations(preferences, marketPrefs);
            case 'market':
                return this.getMarketRecommendations(marketPrefs);
            default:
                return [];
        }
    }

    // 获取酒店推荐
    getHotelRecommendations(preferences) {
        // 基于用户偏好推荐酒店
        const recommendations = [];
        
        if (preferences.favoriteCities.includes('北京')) {
            recommendations.push({
                name: '北京饭店',
                city: '北京',
                price: 580,
                rating: 4.8,
                reason: '根据您的北京偏好推荐'
            });
        }
        
        if (preferences.travelStyle === '商务') {
            recommendations.push({
                name: '上海浦东香格里拉大酒店',
                city: '上海',
                price: 1200,
                rating: 4.9,
                reason: '商务出行首选'
            });
        }
        
        return recommendations;
    }

    // 获取景点推荐
    getAttractionRecommendations(preferences) {
        const recommendations = [];
        
        if (preferences.interests.includes('文化')) {
            recommendations.push({
                name: '故宫博物院',
                city: '北京',
                price: 60,
                rating: 4.9,
                reason: '文化爱好者必游'
            });
        }
        
        if (preferences.interests.includes('美食')) {
            recommendations.push({
                name: '城隍庙',
                city: '上海',
                price: 30,
                rating: 4.6,
                reason: '美食文化体验'
            });
        }
        
        return recommendations;
    }

    // 获取产品推荐
    getProductRecommendations(preferences, marketPrefs) {
        const recommendations = [];
        
        if (marketPrefs.investmentGoals.includes('旅游基金')) {
            recommendations.push({
                name: '旅游主题基金',
                type: '基金',
                return: '6.8%',
                risk: '中等',
                reason: '符合您的旅游基金投资目标'
            });
        }
        
        if (preferences.budget === '中档') {
            recommendations.push({
                name: '稳健型理财产品',
                type: '理财',
                return: '4.5%',
                risk: '低',
                reason: '适合中档预算的稳健投资'
            });
        }
        
        return recommendations;
    }

    // 获取市场推荐
    getMarketRecommendations(marketPrefs) {
        const recommendations = [];
        
        if (marketPrefs.favoriteSectors.includes('旅游')) {
            recommendations.push({
                sector: '旅游',
                performance: '+8.2%',
                reason: '您关注的旅游板块表现强劲'
            });
        }
        
        if (marketPrefs.riskTolerance === 'medium') {
            recommendations.push({
                sector: '金融',
                performance: '+5.6%',
                reason: '符合您的中等风险偏好'
            });
        }
        
        return recommendations;
    }

    // 添加监听器
    addListener(callback) {
        this.listeners.push(callback);
    }

    // 移除监听器
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    // 通知监听器
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.userData);
            } catch (e) {
                console.error('监听器执行失败:', e);
            }
        });
    }

    // 获取用户数据
    getUserData() {
        return this.userData;
    }

    // 重置用户数据
    resetUserData() {
        localStorage.removeItem('userData');
        this.userData = this.loadUserData();
        this.saveUserData();
    }
}

// 创建全局用户数据管理器实例
window.userDataManager = new UserDataManager();

// 通用登录状态检查函数
window.checkLoginStatus = function() {
    const rememberLogin = localStorage.getItem('rememberLogin');
    const savedUsername = localStorage.getItem('username');
    const userType = localStorage.getItem('userType');
    
    if (rememberLogin !== 'true' || !savedUsername) {
        // 未登录，跳转到登录页面
        window.location.href = '/';
        return false;
    }
    
    // 检查用户类型，如果是管理员则跳转到管理员界面
    if (userType === 'admin') {
        window.location.href = '/admin';
        return false;
    }
    
    return true;
};

// 通用用户信息更新函数
window.updateUserInfo = function() {
    if (typeof userDataManager !== 'undefined') {
        const userData = userDataManager.getUserData();
        
        // 更新侧边栏用户信息
        const userInfoElement = document.querySelector('.user-info');
        if (userInfoElement) {
            userInfoElement.innerHTML = `
                <div class="user-avatar">${userData.avatar}</div>
                <div class="user-details">
                    <div class="user-name">${userData.username}</div>
                    <div class="user-level">${userData.level}</div>
                </div>
            `;
        }
        
        // 更新欢迎信息
        const welcomeElement = document.querySelector('.welcome-message');
        if (welcomeElement) {
            welcomeElement.textContent = `欢迎回来，${userData.username}！`;
        }
    }
};

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserDataManager;
}
