// 金融产品数据
module.exports = [
    {
        id: 1,
        name: "稳健型理财",
        type: "理财",
        riskLevel: "低",
        expectedReturn: "3.5%",
        minAmount: 10000,
        term: "6个月",
        description: "适合保守型投资者，风险低，收益稳定",
        features: ["保本保息", "流动性好", "风险极低"],
        bank: "智金银行"
    },
    {
        id: 2,
        name: "平衡型理财",
        type: "理财",
        riskLevel: "中",
        expectedReturn: "5.2%",
        minAmount: 50000,
        term: "12个月",
        description: "平衡风险与收益，适合稳健型投资者",
        features: ["风险可控", "收益较高", "期限灵活"],
        bank: "智金银行"
    },
    {
        id: 3,
        name: "成长型理财",
        type: "理财",
        riskLevel: "高",
        expectedReturn: "7.8%",
        minAmount: 100000,
        term: "24个月",
        description: "追求高收益，适合积极型投资者",
        features: ["收益较高", "长期投资", "风险较高"],
        bank: "智金银行"
    },
    {
        id: 4,
        name: "货币基金",
        type: "基金",
        riskLevel: "低",
        expectedReturn: "2.5%",
        minAmount: 1000,
        term: "随时赎回",
        description: "流动性极佳，适合短期资金管理",
        features: ["随时赎回", "风险极低", "收益稳定"],
        bank: "智金银行"
    },
    {
        id: 5,
        name: "债券基金",
        type: "基金",
        riskLevel: "中低",
        expectedReturn: "4.2%",
        minAmount: 10000,
        term: "12个月",
        description: "投资债券市场，风险相对较低",
        features: ["风险较低", "收益稳定", "期限适中"],
        bank: "智金银行"
    },
    {
        id: 6,
        name: "股票基金",
        type: "基金",
        riskLevel: "高",
        expectedReturn: "8.7%",
        minAmount: 50000,
        term: "36个月",
        description: "投资股票市场，追求长期资本增值",
        features: ["收益较高", "长期投资", "风险较高"],
        bank: "智金银行"
    },
    {
        id: 7,
        name: "个人消费贷款",
        type: "贷款",
        riskLevel: "中",
        interestRate: "4.5%",
        maxAmount: 500000,
        term: "60个月",
        description: "用于个人消费的信用贷款",
        features: ["利率优惠", "审批快速", "用途灵活"],
        bank: "智金银行"
    },
    {
        id: 8,
        name: "住房按揭贷款",
        type: "贷款",
        riskLevel: "低",
        interestRate: "3.8%",
        maxAmount: 2000000,
        term: "360个月",
        description: "用于购买住房的按揭贷款",
        features: ["利率优惠", "期限长", "还款灵活"],
        bank: "智金银行"
    }
];

