<p align="center">
  <img width="200" src="https://raw.githubusercontent.com/Nico-Src/mangadb_angular/refs/heads/main/public/favicon.ico">
</p>

# MangaDB

> [!IMPORTANT]  
> This is a rewrite in Angular. I originally nearly completed this project in Vue.js but was unhappy with the code's overall quality. The project is still a work in progress, so you may come across bad practices for now (e.g., permission system). These will be addressed as development continues.

MangaDB is an Angular-based application designed to provide a structured and interactive database for manga series. It allows users to explore manga metadata, including series details, volumes, and contributors such as authors, artists, and publishers. The app features authentication, multilingual support, and a clean UI powered by Taiga UI.

![LOC Badge](https://tokei.rs/b1/github/Nico-Src/mangadb_angular)
![License Badge](https://img.shields.io/github/license/Nico-Src/mangadb_angular)

## Localization

[![Crowdin](https://badges.crowdin.net/mangadb/localized.svg)](https://crowdin.com)

Help localize the web app by translating the texts into your language.

## Features

- **Authentication System**
  - Login, Register, and Logout functionality.
  - Session validation via cookies.
- **User Interface**
  - Sidebar for navigation.
  - Topbar with authentication options.
  - Alerts and notifications using Taiga UI.
- **Language Support**
  - Multilingual support using `ngx-translate`.
- **State Management**
  - Authentication state is managed with a service.
 
## Database

Currently, my private database contains an extensive collection of manga metadata, including approximately **60,000 volumes**, **2,000 series**, and more. Sometimes in the future i want to release this as a website to the public. Right now, I don't have the funds or the patience to handle hosting and legal matters.

![Volume Badge](https://img.shields.io/badge/Volumes-59215-45a349)
![Series Badge](https://img.shields.io/badge/Series-1941-red)
![Contributor Badge](https://img.shields.io/badge/Contributors-2006-bda73c)
![Publisher Badge](https://img.shields.io/badge/Publishers-244-blue)
 
## Preview (3:55min)

[![Youtube Preview](https://img.youtube.com/vi/tdFozQr2bqM/0.jpg)](https://www.youtube.com/watch?v=tdFozQr2bqM)

(Click on it to watch the preview)
 
## Screenshots

<details>
  <summary>Homepage</summary>
  
  [![image.png](https://i.postimg.cc/c4zGtPQp/image.png)](https://postimg.cc/HVbhfZvz)
</details>

<details>
  <summary>Search</summary>
  
  [![image.png](https://i.postimg.cc/hPW5Fg1P/image.png)](https://postimg.cc/bdgTb75K)
</details>

<details>
  <summary>Login</summary>
  
  [![image.png](https://i.postimg.cc/g25h5c3g/image.png)](https://postimg.cc/5XBjQV7z)
</details>

## Installation

1. **Clone the repository**

   ```sh
   git clone https://github.com/Nico-Src/mangadb_angular.git
   cd mangadb_angular
   ```

2. **Install dependencies**

   ```sh
   npm install
   ```

3. **Run the development server**

   ```sh
   ng serve
   ```

   The app will be available at `http://localhost:4200/`.

## Project Structure

```
├── src
│ ├── app
│ │ ├── manga-cover
│ │ ├── manga-series-column
│ │ ├── manga-series-grid
│ │ ├── manga-series-list
│ │ ├── manga-volume
│ │ ├── pages
│ │ │ ├── admin
│ │ │ ├── browse-series
│ │ │ ├── collection
│ │ │ ├── home
│ │ │ ├── login
│ │ │ ├── register
│ │ │ ├── series-detail
│ │ │ ├── settings
│ │ ├── sidebar
│ │ ├── tag-dialog
│ │ ├── topbar
│ │ ├── app.component.html
│ │ ├── app.component.less
│ │ ├── app.component.spec.ts
│ │ ├── app.component.ts
│ │ ├── app.config.ts
│ │ ├── app.routes.ts
│ ├── guards
│ ├── libs
│ ├── models
│ ├── pipes
│ ├── services
...
```

## Running Tests

The application includes unit tests written with Jasmine and Karma.

```sh
ng test
```

## Technologies Used

- **Angular** - Frontend framework
- **Taiga UI** - UI components
- **Ngx-translate** - Multi-language support
- **RxJS** - Reactive programming
- **Jasmine/Karma** - Testing framework

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to the branch (`git push origin feature-name`)
5. Open a Pull Request

## License

This project is licensed under the Apache-2.0 License.

