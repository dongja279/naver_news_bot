const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const naverClientId = process.env.NAVER_CLIENT_ID;
const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

const categories = [
    { name: '종합', query: "오늘의 주요 뉴스" },
    { name: '정치', query: "정치 뉴스" },
    { name: '경제', query: "경제 뉴스" },
    { name: '사회', query: "사회 뉴스" },
    { name: '생활', query: "생활 문화 뉴스" },
    { name: '세계', query: "세계 뉴스" },
    { name: 'IT', query: "IT 과학 뉴스" },
    { name: '주식', query: "주식" },
    { name: '스포츠', query: "스포츠 뉴스" }
];

app.get('/', async (req, res) => {
    res.redirect('/category/종합');
});

app.get('/category/:name', async (req, res) => {
    const categoryName = req.params.name;
    const sortOption = req.query.sort || 'date'; // Default to 'date' (latest)
    const category = categories.find(c => c.name === categoryName);

    if (!category) {
        return res.status(404).send("<h1>카테고리를 찾을 수 없습니다.</h1>");
    }

    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/news.json', {
            params: {
                query: category.query,
                display: 10,
                sort: sortOption
            },
            headers: {
                'X-Naver-Client-Id': naverClientId,
                'X-Naver-Client-Secret': naverClientSecret,
            }
        });

        const newsItems = response.data.items;

        if (!newsItems || newsItems.length === 0) {
            return res.send(`<h2>${category.name} 카테고리에 대한 뉴스 검색 결과가 없습니다.</h2>`);
        }

        const newsHtml = newsItems.map(item => {
            const title = item.title.replace(/(<([^>]+)>)/gi, "");
            const description = item.description.replace(/(<([^>]+)>)/gi, "");
            return `
                <a href="${item.link}" target="_blank" class="news-item">
                    <h3>${title}</h3>
                    <p>${description}</p>
                </a>
            `;
        }).join('');

        const tabHtml = categories.map(cat => `
            <a href="/category/${cat.name}?sort=${sortOption}" class="${cat.name === categoryName ? 'tab-active' : ''}">${cat.name}</a>
        `).join('');

        const sortOptionsHtml = `
            <select id="sort-select" class="sort-select" onchange="location = '/category/${categoryName}?sort=' + this.value;">
                <option value="date" ${sortOption === 'date' ? 'selected' : ''}>최신순</option>
                <option value="sim" ${sortOption === 'sim' ? 'selected' : ''}>관련성순</option>
            </select>
        `;

        res.send(`
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Naver News Headlines - ${category.name}</title>
                <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&family=Noto+Sans+KR:wght@300;400;700&display=swap" rel="stylesheet">
                <style>
                    body {
                        font-family: 'Noto Sans KR', 'Roboto', sans-serif;
                        padding: 20px;
                        line-height: 1.6;
                        color: #121212;
                        background-color: #f8f9fa;
                        margin: 0;
                    }
                    .container {
                        max-width: 960px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        padding: 30px;
                        border-radius: 12px;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
                    }
                    h1 {
                        text-align: center;
                        color: #212529;
                        font-weight: 700;
                        margin-bottom: 30px;
                        font-size: 2.5rem;
                    }
                    h1 small {
                        display: block;
                        font-size: 0.5em;
                        color: #999;
                        font-weight: 400;
                        margin-top: 5px;
                    }
                    .controls-container {
                        display: flex;
                        justify-content: flex-end;
                        align-items: center;
                        margin-bottom: 20px;
                    }
                    .tab-wrapper {
                        position: relative;
                        margin-bottom: 30px;
                    }
                    .tab-container {
                        display: flex;
                        flex-wrap: nowrap;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                        justify-content: flex-start;
                        border-bottom: 1px solid #e9ecef;
                        padding-bottom: 0px;
                        scroll-behavior: smooth;
                        mask-image: linear-gradient(to right, transparent, black 10px, black 90%, transparent);
                    }
                    .tab-container::-webkit-scrollbar {
                        display: none;
                    }
                    .tab-container a {
                        text-decoration: none;
                        color: #495057;
                        padding: 12px 20px;
                        font-weight: 500;
                        transition: all 0.3s ease;
                        font-size: 1rem;
                        border-bottom: 3px solid transparent;
                        flex-shrink: 0;
                        white-space: nowrap;
                    }
                    .tab-container a:hover {
                        color: #007bff;
                        border-bottom: 3px solid #007bff;
                    }
                    .tab-container a.tab-active {
                        color: #007bff;
                        border-bottom: 3px solid #007bff;
                    }
                    .news-item {
                        display: block;
                        background-color: #ffffff;
                        border: 1px solid #e9ecef;
                        margin-bottom: 15px;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.03);
                        transition: all 0.2s ease-in-out;
                        text-decoration: none;
                    }
                    .news-item:hover {
                        transform: translateY(-3px);
                        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.06);
                    }
                    .news-item h3 {
                        margin-top: 0;
                        font-size: 1.2rem;
                        font-weight: 700;
                        color: #212529;
                        line-height: 1.4;
                    }
                    .news-item p {
                        color: #6c757d;
                        font-size: 0.9rem;
                        margin-bottom: 0;
                    }
                    .sort-select {
                        padding: 8px 12px;
                        border-radius: 6px;
                        border: 1px solid #ced4da;
                        font-size: 0.9rem;
                        cursor: pointer;
                        background-color: #ffffff;
                        color: #495057;
                        transition: border-color 0.2s ease;
                    }
                    .sort-select:focus {
                        outline: none;
                        border-color: #007bff;
                        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
                    }
                    @media (max-width: 768px) {
                        body {
                            padding: 10px;
                        }
                        .container {
                            padding: 20px 15px;
                        }
                        h1 {
                            font-size: 2rem;
                        }
                        .news-item {
                            padding: 15px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>
                        실시간 뉴스
                        <small>by Dongja</small>
                    </h1>
                    <div class="controls-container">
                        ${sortOptionsHtml}
                    </div>
                    <div class="tab-wrapper">
                        <div class="tab-container">
                            ${tabHtml}
                        </div>
                    </div>
                    <div id="news-list">
                        ${newsHtml}
                    </div>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error("Error fetching data from Naver API:", error.response ? error.response.data : error.message);
        res.status(500).send("<h1>죄송합니다. 뉴스 정보를 가져오는 데 실패했습니다.</h1>");
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
