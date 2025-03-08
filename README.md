# MangaDB

MangaDB is an Angular-based application designed to provide a structured and interactive database for manga series. It allows users to explore manga metadata, including series details, volumes, and contributors such as authors, artists, and publishers. The app features authentication, multilingual support, and a clean UI powered by Taiga UI.

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
│   ├── app
│   │   ├── components
│   │   │   ├── sidebar
│   │   │   ├── topbar
│   │   │   ├── login
│   │   │   ├── register
│   │   ├── services
│   │   │   ├── auth.service.ts
│   │   ├── app.component.ts
│   │   ├── app.routes.ts
│   │   ├── app.config.ts
│   ├── assets
│   ├── styles
│   ├── index.html
```

## Configuration

Edit `app.config.ts` to modify:

- API Base URL (`API_BASE`)
- Default settings (`DEFAULT_SETTINGS`)
- Available languages (`LANGS`)

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

