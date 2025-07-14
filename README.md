# PhotoSense AI

PhotoSense AI is a modern web application designed to help you intelligently manage and search your photo library. Users can upload individual photos or entire folders, and the application leverages AI to process the images, making them easily searchable through a clean and intuitive interface.

Built with a powerful tech stack including React, Vite, TypeScript, and Tailwind CSS, this project serves as a robust starting point for developing advanced, AI-powered image management solutions.

## Features

-   **File and Folder Uploads:** Easily upload your images.
-   **AI-Powered Search:** Find photos based on their content.
-   **Dynamic Photo Grid:** A responsive and beautiful gallery for your images.
-   **Modern UI:** Built with Shadcn UI for a sleek and accessible user experience.
-   **Client-Side Database:** Utilizes Dexie.js for efficient client-side storage and indexing.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Make sure you have the following software installed on your machine:

-   [Node.js](https://nodejs.org/) (v18 or newer recommended)
-   [npm](https://www.npmjs.com/get-npm) / [yarn](https://classic.yarnpkg.com/en/docs/install)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/VardhmanSurana/Photosense-AI.git
    cd photo-sense-ai
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    # or
    yarn install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project. You may need to add API keys or other configuration variables here for the AI services or other parts of the application.
    ```sh
    touch .env
    ```
    Example of variables you might need:
    ```env
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    OPENROUTER_API_KEY=YOUR_API_KEY_HERE
    MISTRAL_API_KEY=YOUR_API_KEY_HERE

    ```

### Running the Development Server

To start the application in development mode, run the following command. This will start a local server, typically at `http://localhost:5173`.

```sh
npm run dev
```

The app will automatically reload if you change any of the source files.

### Building for Production

To create a production-ready build of the application, run:

```sh
npm run build
```
