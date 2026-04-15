// 主路由文件 - 统一管理页面切换逻辑
class PageRouter {
    constructor() {
        this.currentPage = window.location.pathname;
        this.init();
    }

    init() {
        // 监听浏览器前进后退事件
        window.addEventListener('popstate', (e) => {
            this.handleRouteChange();
        });

        // 监听所有链接点击事件
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="/"]');
            if (link) {
                e.preventDefault();
                this.navigate(link.getAttribute('href'));
            }
        });

        // 初始化当前页面
        this.handleRouteChange();
    }

    navigate(path) {
        if (path === this.currentPage) return;

        // 更新URL
        window.history.pushState({}, '', path);
        this.currentPage = path;
        
        // 加载页面内容
        this.loadPage(path);
    }

    async loadPage(path) {
        try {
            // 显示加载状态
            this.showLoading();

            // 获取页面内容
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const html = await response.text();
            
            // 更新页面内容
            this.updatePageContent(html);
            
            // 更新菜单状态
            this.updateMenuState(path);
            
            // 隐藏加载状态
            this.hideLoading();

        } catch (error) {
            console.error('页面加载失败:', error);
            this.showError('页面加载失败，请稍后重试');
        }
    }

    updatePageContent(html) {
        const pageContent = document.getElementById('page-content');
        if (pageContent) {
            pageContent.innerHTML = html;
        }
    }

    updateMenuState(path) {
        // 移除所有菜单项的active类
        document.querySelectorAll('.menu-link').forEach(link => {
            link.classList.remove('active');
        });

        // 为当前页面的菜单项添加active类
        const currentLink = document.querySelector(`.menu-link[href="${path}"]`);
        if (currentLink) {
            currentLink.classList.add('active');
        }
    }

    handleRouteChange() {
        this.currentPage = window.location.pathname;
        this.loadPage(this.currentPage);
    }

    showLoading() {
        const pageContent = document.getElementById('page-content');
        if (pageContent) {
            pageContent.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 400px;">
                    <div class="loading-spinner" style="width: 50px; height: 50px; border: 4px solid rgba(255, 255, 255, 0.3); border-top: 4px solid #00d4ff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
            `;
        }
    }

    hideLoading() {
        // 加载状态会在页面内容更新时自动隐藏
    }

    showError(message) {
        const pageContent = document.getElementById('page-content');
        if (pageContent) {
            pageContent.innerHTML = `
                <div style="text-align: center; padding: 50px; color: rgba(255, 255, 255, 0.8);">
                    <div style="font-size: 48px; margin-bottom: 20px;">😞</div>
                    <div style="font-size: 18px; margin-bottom: 20px;">${message}</div>
                    <button onclick="location.reload()" style="background: linear-gradient(135deg, #00d4ff, #ff6b6b); border: none; color: white; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;">
                        重新加载
                    </button>
                </div>
            `;
        }
    }
}

// 页面切换辅助函数
function switchToPage(page) {
    router.navigate(page);
}

// 初始化路由
const router = new PageRouter();

// 导出到全局作用域
window.PageRouter = PageRouter;
window.switchToPage = switchToPage;





