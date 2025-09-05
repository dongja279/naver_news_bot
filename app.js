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

        // 네이버 API 응답이 성공하면 응답 데이터를 로그로 남깁니다.
        console.log("Naver API response received:", response.data);

        const newsItems = response.data.items;

        if (!newsItems || newsItems.length === 0) {
            // 뉴스 아이템이 없을 경우, 사용자에게 안내 메시지를 보냅니다.
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
        // API 호출 실패 시, 에러 상세 정보와 함께 카카오톡 포맷에 맞는 JSON을 반환합니다.
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

        // 에러 응답을 직접 로그로 남겨서 어떤 JSON이 반환되었는지 확인합니다.
        console.error("Error response sent to Kakao:", JSON.stringify(errorOutput, null, 2));

        res.json(errorOutput);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
