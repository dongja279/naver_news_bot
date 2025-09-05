const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = 3000;

const naverClientId = process.env.NAVER_CLIENT_ID;
const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

// GET 요청을 처리하는 라우트 추가
app.get('/news', async (req, res) => {
    // URL 쿼리 파라미터에서 'query'를 가져옵니다.
    const userMessage = req.query.query || '국회'; // 'query' 파라미터가 없으면 '국회'를 기본값으로 사용합니다.

    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/news.json', {
            params: {
                query: userMessage,
                display: 5,
                sort: 'date'
            },
            headers: {
                'X-Naver-Client-Id': naverClientId,
                'X-Naver-Client-Secret': naverClientSecret,
            }
        });

        const newsItems = response.data.items;

        if (!newsItems || newsItems.length === 0) {
            return res.send(`<h2>"${userMessage}"에 대한 뉴스 검색 결과가 없습니다.</h2>`);
        }

        const newsHtml = newsItems.map(item => {
            const title = item.title.replace(/(<([^>]+)>)/gi, "");
            const description = item.description.replace(/(<([^>]+)>)/gi, "");
            return `
                <div style="border: 1px solid #ddd; margin-bottom: 20px; padding: 15px; border-radius: 8px;">
                    <h3><a href="${item.link}" target="_blank" style="color: #007bff; text-decoration: none;">${title}</a></h3>
                    <p style="color: #555;">${description}</p>
                </div>
            `;
        }).join('');

        res.send(`
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <title>Naver News Bot Test</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                </style>
            </head>
            <body>
                <h1>네이버 뉴스 검색 결과</h1>
                <h2>"${userMessage}" 관련 최신 뉴스</h2>
                ${newsHtml}
            </body>
            </html>
        `);
    } catch (error) {
        console.error("Error fetching data from Naver API:", error.response ? error.response.data : error.message);
        res.status(500).send("<h1>죄송합니다. 뉴스 정보를 가져오는 데 실패했습니다.</h1>");
    }
});

// 카카오톡 챗봇용 POST 라우트는 그대로 둡니다.
app.post('/kakaotalk', async (req, res) => {
    const userMessage = req.body.userRequest.utterance;

    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/news.json', {
            params: {
                query: userMessage,
                display: 5,
                sort: 'date'
            },
            headers: {
                'X-Naver-Client-Id': naverClientId,
                'X-Naver-Client-Secret': naverClientSecret,
            }
        });

        const newsItems = response.data.items;
        
        if (!newsItems || newsItems.length === 0) {
            const output = {
                version: "2.0",
                template: {
                    outputs: [
                        {
                            simpleText: {
                                text: `"${userMessage}"에 대한 뉴스 검색 결과가 없습니다.`
                            }
                        }
                    ]
                }
            };
            return res.json(output);
        }
        
        const newsCards = newsItems.map(item => ({
            title: item.title.replace(/(<([^>]+)>)/gi, ""),
            description: item.description.replace(/(<([^>]+)>)/gi, ""),
            link: item.link
        }));

        const output = {
            version: "2.0",
            template: {
                outputs: [
                    {
                        listCard: {
                            header: {
                                title: `"${userMessage}" 관련 최신 뉴스`
                            },
                            items: newsCards.map(news => ({
                                title: news.title,
                                description: news.description,
                                link: {
                                    web: news.link
                                }
                            }))
                        }
                    }
                ]
            }
        };

        res.json(output);

    } catch (error) {
        console.error("Error fetching data from Naver API:", error.response ? error.response.data : error.message);
        
        const errorOutput = {
            version: "2.0",
            template: {
                outputs: [
                    {
                        simpleText: {
                            text: "죄송합니다. 뉴스 정보를 가져오는 데 실패했습니다."
                        }
                    }
                ]
            }
        };

        res.json(errorOutput);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
