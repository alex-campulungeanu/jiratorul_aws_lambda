
<h1 align="center">
<br>
  "jiratorul backend"
</h1>

<p align="center">AWS Lambda</p>

<hr />
<br />


## 📚 Project Definition

Create report based on JIRA data.


## 🛠️ Features

Technologies used:

- ⚛️ **AWS lambda**
- ⚛️ **Serverless framework**
- ⚛️ **AWS Lambda github actions deployment**
- ⚛️ **Prisma ORM**
- ⚛️ **Typescript**
- 🌐 **Docker** - Containerization sistem


## 🚀 Instalation
With docker, inside root folder: 
```sh
docker-compose up -d
```

## 💻 Development
- make sure "serverless-plugin-typescript": "1.1.7", is at version 1.1.7
- update .env file based on .env.example


## 💻 Deployment
Deployment is done using github actions(see .github/workflows)
Steps:
  1. add 2 secrets to github actions:
    - AWS_KEY
    - AWS_SECRET
    - other secrets related to app (check aws_deploy.yml for secrets)
  2. update .github/workflows/aws_deploy.yml name: Create env file step if new environment variables was added