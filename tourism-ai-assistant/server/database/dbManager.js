// 智游金旅 - 数据库初始化脚本
// 创建时间: 2025-01-26
// 版本: v1.0

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.dbPath = path.join(__dirname, 'tourism_ai.db');
        this.db = null;
    }

    // 初始化数据库
    async init() {
        return new Promise((resolve, reject) => {
            // 确保数据库目录存在
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('数据库连接失败:', err.message);
                    reject(err);
                } else {
                    console.log('✅ 数据库连接成功:', this.dbPath);
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    // 创建表结构
    async createTables() {
        const schemaPath = path.join(__dirname, 'schema.sql');
        
        if (!fs.existsSync(schemaPath)) {
            throw new Error('schema.sql 文件不存在');
        }

        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        return new Promise((resolve, reject) => {
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('创建表失败:', err.message);
                    reject(err);
                } else {
                    console.log('✅ 数据库表创建成功');
                    resolve();
                }
            });
        });
    }

    // 执行查询
    async query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('查询失败:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 执行单条查询
    async queryOne(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('查询失败:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // 执行插入/更新/删除
    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('执行失败:', err.message);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // 开始事务
    async beginTransaction() {
        return this.run('BEGIN TRANSACTION');
    }

    // 提交事务
    async commit() {
        return this.run('COMMIT');
    }

    // 回滚事务
    async rollback() {
        return this.run('ROLLBACK');
    }

    // 关闭数据库连接
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('关闭数据库失败:', err.message);
                } else {
                    console.log('✅ 数据库连接已关闭');
                }
            });
        }
    }

    // 获取数据库统计信息
    async getStats() {
        try {
            const stats = {};
            
            // 用户数量
            const userCount = await this.queryOne('SELECT COUNT(*) as count FROM users');
            stats.users = userCount.count;
            
            // 事件数量
            const eventCount = await this.queryOne('SELECT COUNT(*) as count FROM events');
            stats.events = eventCount.count;
            
            // 画像数量
            const segmentCount = await this.queryOne('SELECT COUNT(*) as count FROM user_segment');
            stats.segments = segmentCount.count;
            
            // 特征数量
            const featureCount = await this.queryOne('SELECT COUNT(*) as count FROM user_features');
            stats.features = featureCount.count;
            
            return stats;
        } catch (error) {
            console.error('获取统计信息失败:', error);
            return null;
        }
    }

    // 清理测试数据
    async cleanupTestData() {
        try {
            await this.beginTransaction();
            
            // 删除测试用户的事件
            await this.run('DELETE FROM events WHERE user_id IN (SELECT id FROM users WHERE username = "testuser")');
            
            // 删除测试用户的特征和画像
            await this.run('DELETE FROM user_features WHERE user_id IN (SELECT id FROM users WHERE username = "testuser")');
            await this.run('DELETE FROM user_segment WHERE user_id IN (SELECT id FROM users WHERE username = "testuser")');
            
            // 删除测试用户
            await this.run('DELETE FROM users WHERE username = "testuser"');
            
            await this.commit();
            console.log('✅ 测试数据清理完成');
        } catch (error) {
            await this.rollback();
            console.error('清理测试数据失败:', error);
        }
    }
}

// 创建全局数据库实例
const dbManager = new DatabaseManager();

// 导出数据库管理器
module.exports = dbManager;

// 如果直接运行此文件，则初始化数据库
if (require.main === module) {
    dbManager.init()
        .then(() => {
            console.log('🎉 数据库初始化完成');
            return dbManager.getStats();
        })
        .then((stats) => {
            if (stats) {
                console.log('📊 数据库统计信息:');
                console.log(`   用户数量: ${stats.users}`);
                console.log(`   事件数量: ${stats.events}`);
                console.log(`   画像数量: ${stats.segments}`);
                console.log(`   特征数量: ${stats.features}`);
            }
            dbManager.close();
        })
        .catch((error) => {
            console.error('❌ 数据库初始化失败:', error);
            process.exit(1);
        });
}








