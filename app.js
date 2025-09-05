const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = 3000;

const naverClientId = process.env.NAVER_CLIENT_ID;
const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

app.use(express.json());

app.post('/kakaotalk', async (req, res) => {
    const userMessage = req.body.userRequest.utterance;

    try {
        const response = await axios.get('[https://openapi.naver.com/v1/search/news.json](https://openapi.naver.com/v1/search/news.json)', {
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
        res.json({
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
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
