const fs = require('fs');
const PDFParse = require('pdf-parse');
const OpenAI = require('openai');
const OPENAI_API_KEY = 'put your key here';
const openai = new OpenAI({apiKey: OPENAI_API_KEY});

async function readTextFile(filePath) {
    return fs.promises.readFile(filePath, 'utf8');
  }
  
  async function readPDF(filePath) {
    console.log('Reading PDF:', filePath)
    const data = fs.readFileSync(filePath);
    return PDFParse(data).then(res => res.text);
  }
  
  async function getEmbedding(text) {
    const response = await openai.embeddings.create(
        {
            model: 'text-embedding-ada-002',
            input: text
        }
    )
    return response.data[0].embedding;
  }
  
  function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0.0, normA = 0.0, normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] ** 2;
      normB += vecB[i] ** 2;
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  async function main() {
    try {
      const jobDescriptionText = await readTextFile('job_description.txt');
      const jobEmbedding = await getEmbedding(jobDescriptionText);
  
      const numResumes = 10;
      const similarityScores = [];
  
      for (let i = 1; i <= numResumes; i++) {
        const resumeText = await readPDF(`resume${i}.pdf`);
        const resumeEmbedding = await getEmbedding(resumeText);
        const similarity = cosineSimilarity(jobEmbedding, resumeEmbedding);
        similarityScores.push({ resume: `resume${i}.pdf`, score: similarity });
      }
  
      similarityScores.sort((a, b) => b.score - a.score);
      const topThreeResumes = similarityScores.slice(0, 3);
  
      console.log('Top 3 Matching Resumes:', topThreeResumes);
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }
  
  main();