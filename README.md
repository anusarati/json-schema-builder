# JSON Schema Builder

A visual tool to create and manage JSON Schemas, including support for OpenAI Function definitions.

## How to Run Locally

This project uses [Vite](https://vitejs.dev/) as a build tool to handle modern JavaScript modules and Tailwind CSS compilation. You must use the Node.js package manager (`npm`) to run the application.

1.  **Install Dependencies:**
    First, you need to install all the required packages listed in `package.json`. Open your terminal in the project's root directory and run:
    ```bash
    npm install
    ```

2.  **Start the Development Server:**
    Once the installation is complete, you can start the local development server. This server features hot-reloading, so changes you make to the source code will be reflected in the browser instantly.
    ```bash
    npm run dev
    ```

3.  **Open the Application:**
    The command will output a local URL in your terminal. Open this URL in your web browser, which is typically:
    [http://localhost:5173](http://localhost:5173)

## Building for Production

When you are ready to deploy the application (e.g., to GitHub Pages), you can create an optimized, static build.

1.  **Run the Build Command:**
    ```bash
    npm run build
    ```

2.  **Deploy the `dist` Directory:**
    This command will create a `dist` folder in your project root. This folder contains the minified and optimized HTML, CSS, and JavaScript files. You can deploy the contents of this `dist` folder to any static web hosting service like GitHub Pages, Vercel, or Netlify.
