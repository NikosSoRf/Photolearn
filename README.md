# Photolearn
проект реализации веб-приложения для обучения фотографии. Созданы основные взаимодействия между сервером и клиентом, проработана логика работы преподавателя и ученика с регистрацией, заданиями и записью на курс.
Основной стек технологий: Node.js + Express.js + Sequelize + MySQL

Основные зависимости

dependencies{	
	
    "bcryptjs": "^3.0.3",	
    "cors": "^2.8.5",	
    "dotenv": "^17.2.3",	
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^2.0.2",
    "mysql2": "^3.15.3",
    "node-fetch": "^3.3.2",
    "sequelize": "^6.37.7"
  },
  devDependencies{
	
    "nodemon": "^3.1.11"
  },
  scripts {
	
    "start": "node server.js",
    "dev": "nodemon s1.js"
  }
  

<img width="493" height="618" alt="image" src="https://github.com/user-attachments/assets/9d9657a0-c7a6-4218-8572-2fc1fdd59395" />

Рисунок 1 - Диаграмма компонентов системы

<img width="925" height="623" alt="image" src="https://github.com/user-attachments/assets/cc8d9f88-42d2-4ee6-807f-4c24d36d7924" />

Рисунок 2 - ER-модель базы данных проекта.

Содержит в себе таблицы для пользователей, курсов, модулей, уроков, записей на курсы и выполненных заданий.

Внешний вид страниц
1. Вход в аккаунт/регистрация
<img width="741" height="383" alt="image" src="https://github.com/user-attachments/assets/fb0f20dd-6a53-417c-b168-10654e02a2a4" />
<img width="741" height="383" alt="image" src="https://github.com/user-attachments/assets/97f5548c-b08d-4d8f-a454-d1fa7d5e8f1a" />


2. ЛК студента
<img width="741" height="422" alt="image" src="https://github.com/user-attachments/assets/719f450b-615e-4f23-9d3c-e7ef17c10e0a" />
<img width="741" height="422" alt="image" src="https://github.com/user-attachments/assets/ca8a9375-77fa-49ea-bb86-b8a2751f3698" />

3. ЛК преподавателя
<img width="741" height="422" alt="image" src="https://github.com/user-attachments/assets/68cfa6e0-27e5-4775-91cd-905982e9d3f8" />
<img width="741" height="422" alt="image" src="https://github.com/user-attachments/assets/b5e3b901-ea1a-462f-9e45-5a0d77afb94c" />


4. Сам курс
<img width="741" height="422" alt="image" src="https://github.com/user-attachments/assets/24e1d629-993c-4bd5-85ad-c398f27aabf3" />
<img width="733" height="244" alt="image" src="https://github.com/user-attachments/assets/bece5b94-214c-4d9a-9681-5bab617f5a66" />
<img width="733" height="244" alt="image" src="https://github.com/user-attachments/assets/497b3185-55b5-48dc-99d0-b699a91c5679" />

5. Создание и редактирование курса ( функционал преподавателя)
<img width="771" height="422" alt="image" src="https://github.com/user-attachments/assets/5c54dfa5-eeaf-4727-aba9-3a5bb03607d1" />
<img width="764" height="187" alt="image" src="https://github.com/user-attachments/assets/f2ef0d61-6283-49d8-bb7e-adf6dc918b02" />

Рисунок 3 - Создание курса

<img width="770" height="374" alt="image" src="https://github.com/user-attachments/assets/cf3cf451-37f8-49f7-8174-57a5201048d2" />
<img width="772" height="353" alt="image" src="https://github.com/user-attachments/assets/72d5b128-1e17-4493-aa30-8d72427567ad" />

Рисунок 4 - Редактирование созданного курса, наполнение его информацией о модулях и уроках



